// server/src/agents/customAgent.js

import { callLLM } from '../llm/llmService.js';
import { 
  sendDiffEvent, 
  sendAgentStatusEvent,
  sendSSEEvent 
} from '../streaming/sseEmitter.js';
import { getSession } from '../memory/sharedMemory.js';
import { 
  CUSTOM_AGENT_SYSTEM_PROMPT, 
  buildCustomAgentPrompt 
} from '../prompts/customAgentPrompts.js';

/**
 * Delay helper for creating "agent is typing" feel
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Strip markdown fences from LLM response
 * LLMs often wrap JSON in ```json ... ``` even when told not to
 * @param {string} text 
 * @returns {string}
 */
function stripMarkdownFences(text) {
  if (!text) return '';
  return text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
}

/**
 * Select the appropriate premium model based on provider
 * @param {Object} llmConfig - User's LLM configuration
 * @returns {{ provider: string, model: string }}
 */
function selectPremiumModel(llmConfig) {
  const provider = llmConfig?.provider || 'openai';
  
  switch (provider) {
    case 'anthropic':
      return {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514'
      };
    case 'openai':
      return {
        provider: 'openai',
        model: 'gpt-4o'
      };
    default:
      // Fallback to whatever they have configured
      return {
        provider: llmConfig?.provider || 'openai',
        model: llmConfig?.model || 'gpt-4o'
      };
  }
}

/**
 * Parse the JSON response from the LLM
 * @param {string} response - Raw LLM response
 * @returns {{ success: boolean, edits?: Array, error?: string }}
 */
function parseEditsResponse(response) {
  try {
    // Strip any markdown fences
    const cleaned = stripMarkdownFences(response);
    
    // Try to find JSON array in the response
    let jsonStr = cleaned;
    
    // If the response doesn't start with [, try to find the array
    if (!cleaned.trim().startsWith('[')) {
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }
    
    const edits = JSON.parse(jsonStr);
    
    // Validate it's an array
    if (!Array.isArray(edits)) {
      return {
        success: false,
        error: 'Response is not a JSON array'
      };
    }
    
    // Validate each edit has required fields
    const validatedEdits = edits.map((edit, index) => {
      if (!edit.file) {
        throw new Error(`Edit ${index} missing 'file' field`);
      }
      if (typeof edit.lineStart !== 'number') {
        throw new Error(`Edit ${index} missing or invalid 'lineStart'`);
      }
      if (typeof edit.lineEnd !== 'number' && edit.editType !== 'insert') {
        // lineEnd is optional for insert
        edit.lineEnd = edit.lineStart;
      }
      if (!edit.editType) {
        edit.editType = 'replace'; // Default to replace
      }
      if (!['replace', 'insert', 'delete'].includes(edit.editType)) {
        throw new Error(`Edit ${index} has invalid editType: ${edit.editType}`);
      }
      
      return {
        file: edit.file,
        lineStart: edit.lineStart,
        lineEnd: edit.lineEnd || edit.lineStart,
        newContent: edit.newContent || '',
        editType: edit.editType,
        explanation: edit.explanation || 'Applying custom instruction'
      };
    });
    
    return {
      success: true,
      edits: validatedEdits
    };
    
  } catch (error) {
    console.error('[CustomAgent] JSON parse error:', error.message);
    return {
      success: false,
      error: `Failed to parse response: ${error.message}`
    };
  }
}

/**
 * Run the Custom Instruction Agent
 * 
 * This agent takes a user-defined instruction and applies it across the codebase.
 * It uses a premium model (Claude Sonnet or GPT-4) for best results.
 * 
 * @param {Object} repoData - Repository data { files, repoSummary }
 * @param {Object} plan - Coordinator's execution plan
 * @param {Object} archResult - Architecture agent results
 * @param {Object} secResult - Security agent results
 * @param {string} customPrompt - User's custom instruction (max 500 chars)
 * @param {Object} llmConfig - User's LLM configuration
 * @param {Object} res - Express response object for SSE streaming
 * @param {string} sessionId - Session ID for memory storage
 * @returns {Promise<{ success: boolean, edits: Array, filesModified: Array, error?: string }>}
 */
export async function runCustomAgent(
  repoData,
  plan,
  archResult,
  secResult,
  customPrompt,
  llmConfig,
  res,
  sessionId
) {
  const startTime = Date.now();
  
  console.log(`[CustomAgent] Starting with prompt: "${customPrompt?.substring(0, 50)}..."`);
  
  // Validate inputs
  if (!customPrompt || customPrompt.trim().length === 0) {
    console.log('[CustomAgent] No custom prompt provided, skipping');
    return {
      success: true,
      edits: [],
      filesModified: [],
      skipped: true
    };
  }
  
  // Enforce character limit
  const safePrompt = customPrompt.slice(0, 500);
  
  try {
    // ============================================
    // Step 1: Send SSE - Agent Starting
    // ============================================
    if (res) {
      sendAgentStatusEvent(res, {
        agent: 'custom',
        status: 'running',
        message: 'Analyzing codebase and preparing edits...',
        startedAt: startTime
      });
    }
    
    // ============================================
    // Step 2: Build the prompt
    // ============================================
    console.log('[CustomAgent] Building prompt...');
    const prompt = buildCustomAgentPrompt(
      repoData,
      plan,
      archResult,
      secResult,
      safePrompt,
      null // No file content override
    );
    
    // ============================================
    // Step 3: Select premium model and call LLM
    // ============================================
    const { provider, model } = selectPremiumModel(llmConfig);
    console.log(`[CustomAgent] Using ${provider}/${model}`);
    
    if (res) {
      sendSSEEvent(res, 'custom_progress', {
        message: `Using ${model} to analyze your instruction...`,
        phase: 'llm_call'
      });
    }
    
    const llmResponse = await callLLM(
      prompt,
      CUSTOM_AGENT_SYSTEM_PROMPT,
      {
        provider,
        model,
        temperature: 0.2, // Lower temperature for more precise edits
        maxTokens: 8000
      }
    );
    
    const responseContent = llmResponse.content || llmResponse;
    console.log(`[CustomAgent] Received response (${responseContent.length} chars)`);
    
    // ============================================
    // Step 4: Parse the JSON response
    // ============================================
    const parseResult = parseEditsResponse(responseContent);
    
    if (!parseResult.success) {
      console.error('[CustomAgent] Failed to parse edits:', parseResult.error);
      
      if (res) {
        sendAgentStatusEvent(res, {
          agent: 'custom',
          status: 'error',
          error: parseResult.error,
          duration: Date.now() - startTime
        });
      }
      
      return {
        success: false,
        edits: [],
        filesModified: [],
        error: parseResult.error
      };
    }
    
    const edits = parseResult.edits;
    console.log(`[CustomAgent] Parsed ${edits.length} edits`);
    
    if (edits.length === 0) {
      console.log('[CustomAgent] No edits needed for this instruction');
      
      if (res) {
        sendAgentStatusEvent(res, {
          agent: 'custom',
          status: 'complete',
          message: 'No changes needed for this instruction',
          duration: Date.now() - startTime
        });
      }
      
      return {
        success: true,
        edits: [],
        filesModified: [],
        message: 'No changes needed'
      };
    }
    
    // ============================================
    // Step 5: Stream each edit as a diff event
    // ============================================
    const filesModified = new Set();
    const memory = sessionId ? getSession(sessionId) : null;
    
    if (res) {
      sendSSEEvent(res, 'custom_progress', {
        message: `Applying ${edits.length} edits...`,
        phase: 'applying',
        totalEdits: edits.length
      });
    }
    
    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i];
      
      console.log(`[CustomAgent] Streaming edit ${i + 1}/${edits.length}: ${edit.file}:${edit.lineStart}`);
      
      // Send diff event to Monaco editor
      if (res) {
        sendDiffEvent(res, {
          file: edit.file,
          lineStart: edit.lineStart,
          lineEnd: edit.lineEnd,
          newContent: edit.newContent,
          editType: edit.editType,
          agentName: 'CustomAgent',
          message: edit.explanation
        });
      }
      
      // Track modified files
      filesModified.add(edit.file);
      
      // Store edit in shared memory
      if (memory) {
        const existingEdits = memory.get('custom_edits') || [];
        memory.set('custom_edits', [...existingEdits, {
          ...edit,
          appliedAt: Date.now(),
          index: i
        }]);
      }
      
      // 150ms delay between edits for "agent is typing" feel
      if (i < edits.length - 1) {
        await delay(150);
      }
    }
    
    // ============================================
    // Step 6: Send SSE - Agent Complete
    // ============================================
    const duration = Date.now() - startTime;
    const filesArray = Array.from(filesModified);
    
    console.log(`[CustomAgent] Complete: ${edits.length} edits across ${filesArray.length} files in ${duration}ms`);
    
    if (res) {
      sendAgentStatusEvent(res, {
        agent: 'custom',
        status: 'complete',
        duration,
        result: {
          editsCount: edits.length,
          filesModified: filesArray
        }
      });
      
      // Also send a dedicated completion event
      sendSSEEvent(res, 'custom_complete', {
        editsCount: edits.length,
        filesModified: filesArray,
        duration,
        instruction: safePrompt.substring(0, 100)
      });
    }
    
    // ============================================
    // Step 7: Return results
    // ============================================
    return {
      success: true,
      edits,
      filesModified: filesArray,
      duration,
      instruction: safePrompt
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CustomAgent] Error:', error.message);
    
    if (res) {
      sendAgentStatusEvent(res, {
        agent: 'custom',
        status: 'error',
        error: error.message,
        duration
      });
    }
    
    return {
      success: false,
      edits: [],
      filesModified: [],
      error: error.message,
      duration
    };
  }
}

// Export both named and default
export default runCustomAgent;