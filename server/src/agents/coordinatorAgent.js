import { callLLM } from '../llm/llmService.js';
import {
  COORDINATOR_SYSTEM_PROMPT,
  buildPlanningPrompt,
  COMPILATION_SYSTEM_PROMPT,
  buildCompilationPrompt
} from '../prompts/coordinatorPrompt.js';

/**
 * Phase 1: Planning Phase
 * Analyzes repository structure and creates execution plan for specialist agents
 */
export async function runPlanningPhase(memory) {
  try {
    // Step 1: Set coordinator status to thinking
    memory.setAgentStatus('coordinator', 'thinking', 'Analyzing repository structure...');
    console.log('🧠 Coordinator starting planning phase...');

    // Step 2: Set session status to planning
    memory.setStatus('planning');

    // Step 3: Get repoSummary and files from memory
    const repoSummary = memory.get('repoSummary');
    const files = memory.get('files');
    console.log(`📂 Analyzing ${files?.length || 0} files for planning...`);

    // Step 4: Build file metadata list (no content — just for planning)
    const fileMeta = files.map(f => ({
      path: f.path,
      language: f.language,
      size: f.size
    }));

    // Step 5: Set coordinator status to acting
    memory.setAgentStatus('coordinator', 'acting', 'Creating execution plan...');

    // Step 6: Build the planning prompt
    const userMessage = buildPlanningPrompt(repoSummary, fileMeta);

    // Step 7: Call the LLM
    const messages = [
      { role: 'system', content: COORDINATOR_SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ];

    let response;
    try {
      response = await callLLM(messages, {
        agentRole: 'coordinator',
        jsonMode: true,
        temperature: 0.2
      });
      console.log('🤖 LLM response received for planning');
    } catch (llmError) {
      console.error('❌ LLM call failed during planning:', llmError.message);
      // Create default plan on LLM failure
      const defaultPlan = createDefaultPlan(repoSummary, files);
      memory.setPlan(defaultPlan);
      memory.setAgentStatus('coordinator', 'complete', 'Plan ready (fallback)');
      console.log('📋 Coordinator plan created (fallback):', defaultPlan.planSummary);
      return defaultPlan;
    }

    // Step 8: Parse the plan from response.content
    let plan;
    try {
      if (typeof response.content === 'object' && response.content !== null) {
        plan = response.content;
      } else if (typeof response.content === 'string') {
        plan = JSON.parse(response.content);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse plan, using default:', parseError.message);
      plan = createDefaultPlan(repoSummary, files);
    }

    // Step 9: Store plan in shared memory
    memory.setPlan(plan);

    // Step 10: Set coordinator status to complete
    memory.setAgentStatus('coordinator', 'complete', 'Plan ready');

    // Step 11: Log to console
    console.log('📋 Coordinator plan created:', plan.planSummary);

    // Step 12: Return the plan object
    return plan;

  } catch (error) {
    console.error('❌ Coordinator planning phase failed:', error.message);
    memory.setAgentStatus('coordinator', 'error', error.message);
    throw error;
  }
}

/**
 * Phase 2: Compilation Phase
 * Compiles results from all specialist agents into unified report
 */
export async function runCompilationPhase(memory) {
  try {
    // Step 1: Set coordinator status to thinking
    memory.setAgentStatus('coordinator', 'thinking', 'Reading specialist reports...');
    console.log('📊 Coordinator starting compilation phase...');

    // Step 2: Get snapshot of full memory store
    const store = memory.get();

    // Step 3: Add inter-agent message
    memory.addMessage(
      'coordinator',
      'all',
      'All specialists complete. Compiling unified report...',
      'compilation'
    );

    // Step 4: Set coordinator status to acting
    memory.setAgentStatus('coordinator', 'acting', 'Generating executive summary...');

    // Step 5: Build compilation prompt
    const userMessage = buildCompilationPrompt(store);

    // Step 6: Call LLM with COMPILATION_SYSTEM_PROMPT
    const messages = [
      { role: 'system', content: COMPILATION_SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ];

    let response;
    try {
      response = await callLLM(messages, {
        agentRole: 'coordinator',
        jsonMode: true,
        temperature: 0.2
      });
      console.log('🤖 LLM response received for compilation');
    } catch (llmError) {
      console.error('❌ LLM call failed during compilation:', llmError.message);
      // Create default compilation result on LLM failure
      const defaultResult = createDefaultCompilationResult();
      memory.set('compilationResult', defaultResult);
      memory.setAgentStatus('coordinator', 'complete', 'Report compiled (fallback)');
      memory.setStatus('complete');
      console.log('✅ Coordinator compilation complete (fallback). Health score:', defaultResult.codeHealthScore);
      return defaultResult;
    }

    // Step 7: Parse the compilation result
    let compilationResult;
    try {
      if (typeof response.content === 'object' && response.content !== null) {
        compilationResult = response.content;
      } else if (typeof response.content === 'string') {
        compilationResult = JSON.parse(response.content);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse compilation result, using default:', parseError.message);
      compilationResult = createDefaultCompilationResult();
    }

    // Step 8: Store compilation result in memory
    memory.set('compilationResult', compilationResult);

    // Step 9: Set coordinator status to complete
    memory.setAgentStatus('coordinator', 'complete', 'Report compiled');

    // Step 10: Set session status to complete
    memory.setStatus('complete');

    // Step 11: Log
    console.log('✅ Coordinator compilation complete. Health score:', compilationResult.codeHealthScore);

    // Step 12: Return compilationResult
    return compilationResult;

  } catch (error) {
    console.error('❌ Coordinator compilation phase failed:', error.message);
    memory.setAgentStatus('coordinator', 'error', error.message);
    memory.setError(error);
    throw error;
  }
}

/**
 * Validates that a plan object has all required fields
 */
export function validatePlan(plan) {
  const requiredFields = ['executionOrder', 'agentFocusAreas', 'planSummary'];
  const missing = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, missing: requiredFields };
  }

  for (const field of requiredFields) {
    if (!(field in plan) || plan[field] === undefined || plan[field] === null) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Creates a default plan when LLM fails or response parsing fails
 */
function createDefaultPlan(repoSummary, files) {
  return {
    projectType: repoSummary?.projectType || 'Unknown',
    executionOrder: ['security', 'writer', 'architecture'],
    agentFocusAreas: {
      security: 'Analyze all files for security vulnerabilities',
      writer: 'Generate comprehensive documentation',
      architecture: 'Review code structure and suggest improvements'
    },
    priorityFiles: (files || []).slice(0, 3).map(f => f.path),
    riskLevel: 'medium',
    estimatedIssues: 'Unknown',
    planSummary: 'Standard analysis of ' + (repoSummary?.projectType || 'repository')
  };
}

/**
 * Creates a default compilation result when LLM fails or response parsing fails
 */
function createDefaultCompilationResult() {
  return {
    executiveSummary: 'Analysis complete. Review individual agent reports for details.',
    codeHealthScore: 50,
    scoreBreakdown: {
      security: 50,
      documentation: 50,
      architecture: 50
    },
    topPriorityActions: [],
    crossCuttingConcerns: [],
    strengths: [],
    finalVerdict: 'Analysis complete.'
  };
}
