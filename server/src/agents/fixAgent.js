// server/src/agents/fixAgent.js
// 
// MODIFIED VERSION - Streams diff events to SSE before applying fixes
//

import { callLLM, callLLMWithUserConfig } from '../llm/llmService.js';
import { buildFixPrompt, buildMultiFixPrompt, validateFixResponse, FIX_AGENT_SYSTEM_PROMPT } from '../prompts/fixPrompt.js';
import { sendDiffEvent, sendEditCompleteEvent } from '../streaming/sseEmitter.js';

/**
 * Group bugs by file for efficient multi-fix
 * @param {Array} bugs - Array of bug objects
 * @returns {{ [filePath: string]: Array }} Object mapping file paths to arrays of bugs
 */
export function groupBugsByFile(bugs) {
  const grouped = {};
  
  for (const bug of bugs) {
    const filePath = bug.file;
    if (!grouped[filePath]) {
      grouped[filePath] = [];
    }
    grouped[filePath].push(bug);
  }
  
  return grouped;
}

/**
 * Sleep utility function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse the fix response to extract line-level changes
 * @param {string} originalContent - Original file content
 * @param {string} fixedContent - Fixed file content
 * @param {Object} bug - Bug being fixed
 * @returns {Array<{lineStart: number, lineEnd: number, newContent: string, editType: string}>}
 */
function parseFixChanges(originalContent, fixedContent, bug) {
  const originalLines = originalContent.split('\n');
  const fixedLines = fixedContent.split('\n');
  
  // For simplicity, we'll return the change around the bug's line
  // In a real implementation, you'd use a diff algorithm
  const lineStart = Math.max(1, bug.line - 2);
  const lineEnd = Math.min(originalLines.length, bug.line + 2);
  
  // Extract the relevant section from fixed content
  const fixedLineStart = lineStart - 1;
  const fixedLineEnd = Math.min(fixedLines.length, lineEnd + (fixedLines.length - originalLines.length));
  const newContent = fixedLines.slice(fixedLineStart, fixedLineEnd).join('\n');
  
  return [{
    lineStart,
    lineEnd,
    newContent,
    editType: 'replace',
  }];
}

/**
 * Stream content character by character with delay
 * @param {string} content - Content to stream
 * @param {string} bugId - Bug ID for the event
 * @param {Function} onProgress - Progress callback
 */
async function streamContent(content, bugId, onProgress) {
  const chunkSize = 3;
  const delayMs = 5;
  
  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.slice(i, i + chunkSize);
    await onProgress('fix_stream', { bugId, chunk });
    await sleep(delayMs);
  }
}

/**
 * Fix a single bug in a file
 * 
 * @param {Object} bug - Bug object with shape: { id, file, line, type, severity, description, vulnerableCode, suggestedFix }
 * @param {string} fileContent - Current content of the file to fix
 * @param {Function} onProgress - Async function for streaming events
 * @param {Object|null} userLLMConfig - Optional user LLM config object
 * @param {Object|null} sseRes - Optional SSE response object for streaming diffs to frontend
 * @returns {Promise<{ success: boolean, fixedContent?: string, bug: Object, error?: string }>}
 */
export async function fixSingleBug(bug, fileContent, onProgress, userLLMConfig = null, sseRes = null) {
  try {
    // Notify fix starting
    await onProgress('fix_start', {
      bugId: bug.id,
      file: bug.file,
      line: bug.line,
      current: 1,
      total: 1
    });

    // Build the prompt
    const prompt = buildFixPrompt(bug, fileContent);

    // LLM options for code fixing
    const options = {
      temperature: 0.1,
      maxTokens: 8000
    };

    // Call LLM
    let result;
    try {
      if (userLLMConfig) {
        result = await callLLMWithUserConfig(prompt, FIX_AGENT_SYSTEM_PROMPT, options, userLLMConfig);
      } else {
        result = await callLLM(prompt, FIX_AGENT_SYSTEM_PROMPT, options);
      }
    } catch (llmError) {
      await onProgress('fix_failed', {
        bugId: bug.id,
        file: bug.file,
        error: `LLM call failed: ${llmError.message}`
      });
      return {
        success: false,
        bug,
        error: `LLM call failed: ${llmError.message}`
      };
    }

    const fixedContent = result.content;

    // Validate the response
    const validation = validateFixResponse(fileContent, fixedContent, bug);
    if (!validation.valid) {
      await onProgress('fix_failed', {
        bugId: bug.id,
        file: bug.file,
        error: `Validation failed: ${validation.reason}`
      });
      return {
        success: false,
        bug,
        error: `Validation failed: ${validation.reason}`
      };
    }

    // ============================================
    // NEW: Stream diff event to frontend BEFORE applying
    // This allows the editor to show real-time updates
    // ============================================
    if (sseRes) {
      const changes = parseFixChanges(fileContent, fixedContent, bug);
      
      for (const change of changes) {
        // Send diff event for each change
        sendDiffEvent(sseRes, {
          file: bug.file,
          lineStart: change.lineStart,
          lineEnd: change.lineEnd,
          newContent: change.newContent,
          editType: change.editType,
          agentName: 'FixAgent',
          message: `Fixing ${bug.type}: ${bug.description?.substring(0, 50)}...`,
        });
        
        // Small delay between events for visual effect
        await sleep(100);
      }
    }
    // ============================================

    // Stream the fixed content (existing behavior)
    await streamContent(fixedContent, bug.id, onProgress);

    // Notify fix complete
    await onProgress('fix_complete', {
      bugId: bug.id,
      file: bug.file,
      fixedContent
    });

    return {
      success: true,
      fixedContent,
      bug
    };

  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error.message || 'Unknown error occurred';
    
    try {
      await onProgress('fix_failed', {
        bugId: bug.id,
        file: bug.file,
        error: errorMessage
      });
    } catch (progressError) {
      // Ignore errors in progress callback
    }

    return {
      success: false,
      bug,
      error: errorMessage
    };
  }
}

/**
 * Fix all bugs in a list sequentially
 * 
 * @param {Array} bugs - Array of bug objects
 * @param {Function} getFileContent - Async function(filePath) => string that fetches current file content
 * @param {Function} onProgress - Async function for streaming events
 * @param {Object|null} userLLMConfig - Optional user LLM config object
 * @param {Object|null} sseRes - Optional SSE response object for streaming diffs to frontend
 * @returns {Promise<Array<{ success: boolean, fixedContent?: string, bug: Object, error?: string }>>}
 */
export async function fixAllBugs(bugs, getFileContent, onProgress, userLLMConfig = null, sseRes = null) {
  const results = [];
  
  if (!bugs || bugs.length === 0) {
    return results;
  }

  // Group bugs by file
  const bugsByFile = groupBugsByFile(bugs);
  const files = Object.keys(bugsByFile);
  
  let overallIndex = 0;
  const totalBugs = bugs.length;

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const filePath = files[fileIndex];
    const fileBugs = bugsByFile[filePath];
    
    // Get file content once per file
    let fileContent;
    try {
      fileContent = await getFileContent(filePath);
    } catch (error) {
      // If we can't read the file, mark all bugs for this file as failed
      for (const bug of fileBugs) {
        const errorMessage = `Failed to read file: ${error.message}`;
        
        try {
          await onProgress('fix_failed', {
            bugId: bug.id,
            file: bug.file,
            error: errorMessage
          });
        } catch (progressError) {
          // Ignore errors in progress callback
        }

        results.push({
          success: false,
          bug,
          error: errorMessage
        });
        
        overallIndex++;
      }
      continue;
    }

    // ============================================
    // MODIFIED: Fix each bug and stream diffs
    // ============================================
    for (let bugIndex = 0; bugIndex < fileBugs.length; bugIndex++) {
      const bug = fileBugs[bugIndex];
      overallIndex++;

      // Create a wrapped onProgress that includes current/total
      const wrappedOnProgress = async (event, data) => {
        if (event === 'fix_start') {
          await onProgress(event, {
            ...data,
            current: overallIndex,
            total: totalBugs
          });
        } else {
          await onProgress(event, data);
        }
      };

      // Pass sseRes for streaming diffs
      const result = await fixSingleBug(bug, fileContent, wrappedOnProgress, userLLMConfig, sseRes);
      results.push(result);

      // If fix was successful, update fileContent for subsequent bugs in same file
      if (result.success && result.fixedContent) {
        fileContent = result.fixedContent;
      }
    }
    // ============================================

    // Delay between files (except after the last one)
    if (fileIndex < files.length - 1) {
      await sleep(500);
    }
  }

  // ============================================
  // NEW: Send edit complete event when all fixes are done
  // ============================================
  if (sseRes) {
    sendEditCompleteEvent(sseRes, {
      totalFixed: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
    });
  }
  // ============================================

  return results;
}

/**
 * Fix bugs with SSE streaming support
 * This is a convenience wrapper for routes that have SSE response
 * 
 * @param {Array} bugs - Array of bug objects
 * @param {Object} fileContents - Map of file path to content
 * @param {Object} sseRes - SSE response object
 * @param {Object|null} userLLMConfig - Optional user LLM config
 */
export async function fixBugsWithStreaming(bugs, fileContents, sseRes, userLLMConfig = null) {
  const getFileContent = async (filePath) => {
    if (fileContents[filePath] !== undefined) {
      return fileContents[filePath];
    }
    throw new Error(`File not found: ${filePath}`);
  };

  const onProgress = async (event, data) => {
    // Forward progress events to SSE
    if (sseRes && !sseRes.writableEnded) {
      const formattedEvent = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      sseRes.write(formattedEvent);
    }
  };

  return fixAllBugs(bugs, getFileContent, onProgress, userLLMConfig, sseRes);
}