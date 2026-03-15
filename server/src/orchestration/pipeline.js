import { v4 as uuidv4 } from 'uuid';
import { createSession, destroySession, getSession } from '../memory/sharedMemory.js';
import { runPlanningPhase, runCompilationPhase } from '../agents/coordinatorAgent.js';
import { runSecurityAnalysis } from '../agents/securityAgent.js';
import { runTechnicalWriter } from '../agents/technicalWriterAgent.js';
import { runArchitectureReview } from '../agents/architectureAgent.js';

/**
 * Main analysis pipeline
 * Runs all agents in sequence and returns final results
 */
export async function runAnalysisPipeline(files, repoSummary, onSession, userLLMConfig = null) {
  // STEP 1 — Create session
  const sessionId = uuidv4();
  const memory = createSession(sessionId);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 AgentLens Pipeline Starting`);
  console.log(`   Session: ${sessionId}`);
  console.log(`   Repo: ${repoSummary.owner}/${repoSummary.repo}`);
  console.log(`   Files: ${files.length}`);
  console.log(`${'='.repeat(60)}\n`);

  // STEP 2 — Store initial data in memory
  memory.set('files', files);
  memory.set('repoSummary', repoSummary);
  memory.set('userLLMConfig', userLLMConfig);
  memory.setStatus('analyzing');

  // STEP 3 — Call onSession callback
  onSession(sessionId, memory);

  // Add a small delay so SSE connection establishes
  await new Promise(resolve => setTimeout(resolve, 200));

  // STEP 4 — Run agents in sequence
  try {
    // Phase 1: Coordinator Plans
    console.log('\n--- PHASE 1: Coordinator Planning ---');
    await runPlanningPhase(memory);

    // Phase 2: Security Analysis
    console.log('\n--- PHASE 2: Security Analysis ---');
    await runSecurityAnalysis(memory);

    // Phase 3: Technical Writer (Modified)
    console.log('\n--- PHASE 3: Technical Writing ---');
    
    // Build file tree data structure for the technical writer
    // NOTE: repoSummary should contain the tree from repoParser
    // If tree is stored separately, check: memory.get('repoTree') or repoSummary.tree
    const fileTreeData = {
      name: repoSummary?.repo || repoSummary?.name || 'project',
      tree: repoSummary?.tree || repoSummary?.fileTree || [],
      totalFiles: repoSummary?.totalFiles || files.length,
      totalSize: repoSummary?.totalSize || files.reduce((sum, f) => sum + (f.size || 0), 0),
      languages: repoSummary?.languages || detectLanguages(files),
    };
    
    // Store file tree in memory for SSE emission
    memory.set('fileTree', fileTreeData);
    
    // Pass file tree to technical writer agent
    await runTechnicalWriter(memory, fileTreeData);
    // ============================================

    // Phase 4: Architecture Review
    console.log('\n--- PHASE 4: Architecture Review ---');
    await runArchitectureReview(memory);

    // Phase 5: Coordinator Compiles Final Report
    console.log('\n--- PHASE 5: Final Compilation ---');
    await runCompilationPhase(memory);

  } catch (pipelineError) {
    console.error('\n❌ Pipeline error:', pipelineError.message);
    memory.setError(pipelineError);
    // Don't rethrow — we'll return whatever we have
  }

  // STEP 5 — Build and return final results
  const store = memory.get();

  const results = {
    sessionId,
    repoSummary,
    fileTree: store.fileTree || null,
    plan: store.plan,
    security: {
      bugs: store.bugs || [],
      summary: store.securitySummary || null
    },
    documentation: store.documentation || '',
    documentationMeta: store.documentationMeta || {},
    architecture: {
      refactors: store.refactors || [],
      result: store.architectureResult || null,
      patterns: store.patternAnalysis || null
    },
    compilation: store.compilationResult || null,
    agentMessages: store.messages || [],
    timing: {
      startTime: store.startTime,
      endTime: store.endTime || Date.now(),
      durationMs: store.endTime
        ? store.endTime - store.startTime
        : Date.now() - (store.startTime || Date.now())
    },
    status: store.status
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Pipeline Complete`);
  console.log(`   Bugs found: ${results.security.bugs.length}`);
  console.log(`   Refactors suggested: ${results.architecture.refactors.length}`);
  console.log(`   Duration: ${Math.round(results.timing.durationMs / 1000)}s`);
  console.log(`   Health score: ${results.compilation?.codeHealthScore || 'N/A'}/100`);
  console.log(`${'='.repeat(60)}\n`);

  // STEP 6 — Schedule session cleanup
  setTimeout(() => {
    destroySession(sessionId);
    console.log(`🧹 Session cleaned up: ${sessionId}`);
  }, 5 * 60 * 1000);

  return results;
}

/**
 * Detect programming languages from file extensions
 * @param {Array} files - Array of file objects
 * @returns {Array<string>} Detected languages
 */
function detectLanguages(files) {
  const extToLang = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.html': 'HTML',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
  };

  const languages = new Set();
  files.forEach(file => {
    const ext = '.' + (file.path?.split('.').pop() || '');
    if (extToLang[ext]) {
      languages.add(extToLang[ext]);
    }
  });

  return Array.from(languages);
}


/**
 * Get current pipeline status for a session
 */
export function getPipelineStatus(sessionId) {
  const memory = getSession(sessionId);

  if (!memory) {
    return { found: false };
  }

  return {
    found: true,
    sessionId,
    status: memory.get('status'),
    agentStatuses: memory.get('agentStatuses'),
    bugsFound: (memory.get('bugs') || []).length,
    refactorsFound: (memory.get('refactors') || []).length,
    hasDocumentation: !!memory.get('documentation')
  };
}
