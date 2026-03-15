// server/src/orchestration/pipeline.js
import { v4 as uuidv4 } from "uuid";
import {
  createSession,
  destroySession,
  getSession,
} from "../memory/sharedMemory.js";
import {
  runPlanningPhase,
  runCompilationPhase,
} from "../agents/coordinatorAgent.js";
import { runSecurityAnalysis } from "../agents/securityAgent.js";
import { runTechnicalWriter } from "../agents/technicalWriterAgent.js";
import { runArchitectureReview } from "../agents/architectureAgent.js";
import { fixAllBugs } from "../agents/fixAgent.js";
import { runCustomAgent } from "../agents/customAgent.js";
import {
  sendSSEEvent,
  sendAgentStatusEvent,
  sendPhaseEvent,
} from "../streaming/sseEmitter.js";

// ============================================
// In-memory pipeline status tracking
// ============================================
const pipelineStatusMap = new Map();

/**
 * Get current pipeline status for a session
 * @param {string} sessionId
 * @returns {Object|null}
 */
export function getPipelineStatus(sessionId) {
  return pipelineStatusMap.get(sessionId) || null;
}

/**
 * Update pipeline status
 * @param {string} sessionId
 * @param {Object} updates
 */
function updatePipelineStatus(sessionId, updates) {
  const current = pipelineStatusMap.get(sessionId) || {
    phase: "idle",
    agentsRunning: [],
    agentsComplete: [],
    agentsFailed: [],
    startedAt: null,
  };
  pipelineStatusMap.set(sessionId, { ...current, ...updates });
}

/**
 * Clean up pipeline status
 * @param {string} sessionId
 */
function cleanupPipelineStatus(sessionId) {
  pipelineStatusMap.delete(sessionId);
}

// ============================================
// Safe Agent Execution Wrapper
// ============================================

/**
 * Wraps an agent function call with SSE status updates and error handling
 *
 * @param {Function} agentFn - The agent function to call
 * @param {string} agentName - Name of the agent (for SSE events)
 * @param {Object} res - Express response object for SSE
 * @param {string} sessionId - Session ID for status tracking
 * @param {...any} args - Arguments to pass to the agent function
 * @returns {Promise<{success: boolean, result?: any, error?: string, duration: number}>}
 */
async function runAgentSafe(agentFn, agentName, res, sessionId, ...args) {
  const startedAt = Date.now();

  // Update pipeline status - agent starting
  const currentStatus = pipelineStatusMap.get(sessionId) || {
    agentsRunning: [],
    agentsComplete: [],
    agentsFailed: [],
  };
  updatePipelineStatus(sessionId, {
    agentsRunning: [...currentStatus.agentsRunning, agentName],
  });

  // Send SSE "running" status
  sendAgentStatusEvent(res, {
    agent: agentName,
    status: "running",
    startedAt,
  });

  console.log(`[Pipeline] 🚀 ${agentName} agent started`);

  try {
    // Execute the agent function
    const result = await agentFn(...args);

    const duration = Date.now() - startedAt;

    // Update pipeline status - agent complete
    const statusAfter = pipelineStatusMap.get(sessionId) || {
      agentsRunning: [],
      agentsComplete: [],
      agentsFailed: [],
    };
    updatePipelineStatus(sessionId, {
      agentsRunning: statusAfter.agentsRunning.filter((a) => a !== agentName),
      agentsComplete: [...statusAfter.agentsComplete, agentName],
    });

    // Send SSE "complete" status
    sendAgentStatusEvent(res, {
      agent: agentName,
      status: "complete",
      duration,
      result, // Will be truncated by sendAgentStatusEvent
    });

    console.log(`[Pipeline] ✅ ${agentName} agent completed in ${duration}ms`);

    return {
      success: true,
      result,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startedAt;
    const errorMessage = error.message || "Unknown error";

    // Update pipeline status - agent failed
    const statusAfter = pipelineStatusMap.get(sessionId) || {
      agentsRunning: [],
      agentsComplete: [],
      agentsFailed: [],
    };
    updatePipelineStatus(sessionId, {
      agentsRunning: statusAfter.agentsRunning.filter((a) => a !== agentName),
      agentsFailed: [...statusAfter.agentsFailed, agentName],
    });

    // Send SSE "error" status - NEVER swallow errors silently
    sendAgentStatusEvent(res, {
      agent: agentName,
      status: "error",
      duration,
      error: errorMessage,
    });

    console.error(
      `[Pipeline] ❌ ${agentName} agent failed after ${duration}ms:`,
      errorMessage,
    );

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Detect programming languages from file extensions
 * @param {Array} files - Array of file objects
 * @returns {Array<string>} Detected languages
 */
function detectLanguages(files) {
  const extToLang = {
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".py": "Python",
    ".java": "Java",
    ".go": "Go",
    ".rs": "Rust",
    ".rb": "Ruby",
    ".php": "PHP",
    ".css": "CSS",
    ".scss": "SCSS",
    ".html": "HTML",
    ".vue": "Vue",
    ".svelte": "Svelte",
  };

  const languages = new Set();
  files.forEach((file) => {
    const ext = "." + (file.path?.split(".").pop() || "");
    if (extToLang[ext]) {
      languages.add(extToLang[ext]);
    }
  });

  return Array.from(languages);
}

/**
 * Build file tree data structure for the technical writer
 * @param {Object} repoSummary
 * @param {Array} files
 * @returns {Object}
 */
function buildFileTreeData(repoSummary, files) {
  return {
    name: repoSummary?.repo || repoSummary?.name || "project",
    tree: repoSummary?.tree || repoSummary?.fileTree || [],
    totalFiles: repoSummary?.totalFiles || files.length,
    totalSize:
      repoSummary?.totalSize ||
      files.reduce((sum, f) => sum + (f.size || 0), 0),
    languages: repoSummary?.languages || detectLanguages(files),
  };
}

/**
 * Extract result from Promise.allSettled outcome
 * @param {Object} settled - { status: 'fulfilled'|'rejected', value|reason }
 * @returns {any|null}
 */
function extractSettledResult(settled) {
  if (settled.status === "fulfilled") {
    return settled.value?.success ? settled.value.result : null;
  }
  return null;
}

/**
 * Extract error from Promise.allSettled outcome
 * @param {Object} settled
 * @returns {string|null}
 */
function extractSettledError(settled) {
  if (settled.status === "rejected") {
    return settled.reason?.message || "Unknown error";
  }
  if (settled.status === "fulfilled" && !settled.value?.success) {
    return settled.value?.error || "Agent failed";
  }
  return null;
}

// ============================================
// Main Analysis Pipeline
// ============================================

/**
 * Main analysis pipeline with parallel agent execution
 *
 * PHASE 1 (sequential): Coordinator plans the work
 * PHASE 2 (parallel): Architecture, Security, TechnicalWriter run simultaneously
 * PHASE 3 (parallel): Fix agent + Custom agent (if prompt provided)
 * PHASE 4 (sequential): Final compilation and cleanup
 *
 * @param {Array} files - Array of file objects from repo
 * @param {Object} repoSummary - Repository metadata
 * @param {Function} onSession - Callback with (sessionId, memory)
 * @param {Object|null} userLLMConfig - User's LLM configuration
 * @param {Object|null} res - Express response for SSE (optional)
 * @param {string|null} customPrompt - Custom agent prompt (Pro only)
 * @returns {Promise<Object>} Analysis results
 */
export async function runAnalysisPipeline(
  files,
  repoSummary,
  onSession,
  userLLMConfig = null,
  res = null,
  customPrompt = null,
) {
  // ============================================
  // STEP 1 — Create session
  // ============================================
  const sessionId = uuidv4();
  const memory = createSession(sessionId);
  const pipelineStartTime = Date.now();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 AgentLens Pipeline Starting (Parallel Mode)`);
  console.log(`   Session: ${sessionId}`);
  console.log(`   Repo: ${repoSummary.owner}/${repoSummary.repo}`);
  console.log(`   Files: ${files.length}`);
  console.log(`   Custom Agent: ${customPrompt ? "Yes" : "No"}`);
  console.log(`${"=".repeat(60)}\n`);

  // Initialize pipeline status tracking
  updatePipelineStatus(sessionId, {
    phase: "starting",
    agentsRunning: [],
    agentsComplete: [],
    agentsFailed: [],
    startedAt: pipelineStartTime,
  });

  // ============================================
  // STEP 2 — Store initial data in memory
  // ============================================
  memory.set("files", files);
  memory.set("repoSummary", repoSummary);
  memory.set("userLLMConfig", userLLMConfig);
  memory.setStatus("analyzing");

  // Build file tree data for technical writer
  const fileTreeData = buildFileTreeData(repoSummary, files);
  memory.set("fileTree", fileTreeData);

  // ============================================
  // STEP 3 — Call onSession callback
  // ============================================
  onSession(sessionId, memory);

  // Add a small delay so SSE connection establishes
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Results collectors
  let coordinatorResult = null;
  let archResult = null;
  let secResult = null;
  let docResult = null;
  let fixResult = null;
  let customResult = null;

  // ============================================
  // PHASE 1: Coordinator Planning (Sequential)
  // ============================================
  try {
    console.log("\n--- PHASE 1: Coordinator Planning ---");
    updatePipelineStatus(sessionId, { phase: "coordinator" });

    if (res) {
      sendPhaseEvent(res, {
        phase: "coordinator",
        status: "started",
        message: "Coordinator is planning the analysis...",
      });
    }

    const coordinatorOutcome = await runAgentSafe(
      () => runPlanningPhase(memory),
      "coordinator",
      res,
      sessionId,
    );

    if (coordinatorOutcome.success) {
      coordinatorResult = coordinatorOutcome.result;
    } else {
      // Coordinator failure is critical but we'll try to continue
      console.warn(
        "[Pipeline] Coordinator failed, continuing with default plan",
      );
    }

    if (res) {
      sendPhaseEvent(res, {
        phase: "coordinator",
        status: "completed",
        agentsCompleted: coordinatorOutcome.success ? ["coordinator"] : [],
        agentsFailed: coordinatorOutcome.success ? [] : ["coordinator"],
        duration: coordinatorOutcome.duration,
      });
    }
  } catch (error) {
    console.error("[Pipeline] Critical error in Phase 1:", error.message);
    memory.setError(error);
  }

  // ============================================
  // PHASE 2: Parallel Analysis (Architecture, Security, TechnicalWriter)
  // ============================================
  console.log(
    "\n--- PHASE 2: Parallel Analysis (Architecture, Security, Docs) ---",
  );
  updatePipelineStatus(sessionId, { phase: "analysis" });

  if (res) {
    sendPhaseEvent(res, {
      phase: "analysis",
      status: "started",
      message:
        "Running Architecture, Security, and Documentation agents in parallel...",
    });
  }

  const phase2StartTime = Date.now();

  // Create parallel agent tasks
  const analysisPromises = [
    // Architecture Agent
    runAgentSafe(
      () => runArchitectureReview(memory),
      "architecture",
      res,
      sessionId,
    ),

    // Security Agent
    runAgentSafe(() => runSecurityAnalysis(memory), "security", res, sessionId),

    // Technical Writer Agent
    runAgentSafe(
      () => runTechnicalWriter(memory, fileTreeData),
      "docs",
      res,
      sessionId,
    ),
  ];

  // Execute all three in parallel - use allSettled so one failure doesn't kill others
  const phase2Results = await Promise.allSettled(analysisPromises);

  // Extract results safely
  const [archSettled, secSettled, docSettled] = phase2Results;

  // Process Architecture result
  if (archSettled.status === "fulfilled" && archSettled.value?.success) {
    archResult = archSettled.value.result;
    console.log("[Pipeline] Architecture agent succeeded");
  } else {
    const archError = extractSettledError(archSettled);
    console.error("[Pipeline] Architecture agent failed:", archError);
  }

  // Process Security result
  if (secSettled.status === "fulfilled" && secSettled.value?.success) {
    secResult = secSettled.value.result;
    console.log("[Pipeline] Security agent succeeded");
  } else {
    const secError = extractSettledError(secSettled);
    console.error("[Pipeline] Security agent failed:", secError);
  }

  // Process Documentation result
  if (docSettled.status === "fulfilled" && docSettled.value?.success) {
    docResult = docSettled.value.result;
    console.log("[Pipeline] Documentation agent succeeded");
  } else {
    const docError = extractSettledError(docSettled);
    console.error("[Pipeline] Documentation agent failed:", docError);
  }

  // Build phase 2 summary
  const phase2Completed = [];
  const phase2Failed = [];

  if (archSettled.status === "fulfilled" && archSettled.value?.success)
    phase2Completed.push("architecture");
  else phase2Failed.push("architecture");

  if (secSettled.status === "fulfilled" && secSettled.value?.success)
    phase2Completed.push("security");
  else phase2Failed.push("security");

  if (docSettled.status === "fulfilled" && docSettled.value?.success)
    phase2Completed.push("docs");
  else phase2Failed.push("docs");

  const phase2Duration = Date.now() - phase2StartTime;

  console.log(
    `[Pipeline] Phase 2 complete: ${phase2Completed.length}/3 agents succeeded in ${phase2Duration}ms`,
  );

  if (res) {
    sendPhaseEvent(res, {
      phase: "analysis",
      status: "completed",
      agentsCompleted: phase2Completed,
      agentsFailed: phase2Failed,
      duration: phase2Duration,
    });
  }

  // server/src/orchestration/pipeline.js
  // ============================================
  // PHASE 3 MODIFICATION ONLY
  // Replace the existing Phase 3 section with this:
  // ============================================

  // ============================================
  // PHASE 3: Fix Agent + Custom Agent (Parallel)
  // ============================================
  console.log("\n--- PHASE 3: Fix Agent + Custom Agent (Parallel) ---");
  updatePipelineStatus(sessionId, { phase: "fix" });

  if (res) {
    sendPhaseEvent(res, {
      phase: "fix",
      status: "started",
      message: customPrompt
        ? "Running Fix Agent and Custom Agent in parallel..."
        : "Running Fix Agent...",
    });
  }

  const phase3StartTime = Date.now();

  // ============================================
  // SAFELY EXTRACT RESULTS FROM PHASE 2
  // These are used by both fix and custom agents
  // ============================================

  // Extract architecture result (may be null if agent failed)
  const safeArchResult =
    archSettled.status === "fulfilled" && archSettled.value?.success
      ? archSettled.value.result
      : null;

  // Extract security result (may be null if agent failed)
  const safeSecResult =
    secSettled.status === "fulfilled" && secSettled.value?.success
      ? secSettled.value.result
      : null;

  // Get the plan from memory (set by coordinator)
  const coordinatorPlan = memory.get("plan");

  // Prepare results for fix agent (handle nulls gracefully)
  const analysisResultsForFix = {
    archResult: safeArchResult,
    secResult: safeSecResult,
    docResult: docResult || null,
  };

  // Get bugs from memory or security result
  const bugsToFix = memory.get("bugs") || safeSecResult?.bugs || [];

  // Get file contents map for fix agent
  const getFileContent = async (filePath) => {
    const file = files.find((f) => f.path === filePath);
    return file?.content || "";
  };

  // ============================================
  // CREATE PHASE 3 PARALLEL TASKS
  // ============================================
  const phase3Promises = [];

  // Fix Agent - always runs (even if no bugs, it will return early)
  phase3Promises.push(
    runAgentSafe(
      async () => {
        if (bugsToFix.length === 0) {
          return { fixed: [], message: "No bugs to fix" };
        }

        // Create progress callback for fix agent
        const onProgress = async (event, data) => {
          if (res) {
            sendSSEEvent(res, `fix_${event}`, data);
          }
        };

        return await fixAllBugs(
          bugsToFix,
          getFileContent,
          onProgress,
          userLLMConfig,
          res, // Pass SSE response for streaming diffs
        );
      },
      "fix",
      res,
      sessionId,
    ),
  );

  // ============================================
  // Custom Agent - only runs if customPrompt is provided (Pro feature)
  // Uses arrow function wrapper to pass all required arguments
  // ============================================
  if (customPrompt) {
    phase3Promises.push(
      runAgentSafe(
        // Arrow function wrapper to pass all arguments to runCustomAgent
        () =>
          runCustomAgent(
            { files, repoSummary }, // repoData
            coordinatorPlan, // plan from coordinator
            safeArchResult, // architecture results (may be null)
            safeSecResult, // security results (may be null)
            customPrompt, // user's custom instruction
            userLLMConfig, // LLM configuration
            res, // SSE response for streaming
            sessionId, // session ID for memory
          ),
        "custom",
        res,
        sessionId,
      ),
    );
  } else {
    // No custom prompt - push a resolved promise indicating skip
    phase3Promises.push(
      Promise.resolve({
        success: true,
        result: null,
        skipped: true,
        duration: 0,
      }),
    );
  }

  // Execute phase 3 in parallel
  const phase3Results = await Promise.allSettled(phase3Promises);

  // Extract fix result
  const fixSettled = phase3Results[0];
  if (fixSettled.status === "fulfilled" && fixSettled.value?.success) {
    fixResult = fixSettled.value.result;
    console.log("[Pipeline] Fix agent succeeded");
  } else {
    const fixError = extractSettledError(fixSettled);
    console.error("[Pipeline] Fix agent failed:", fixError);
  }

  // Extract custom result (if applicable)
  const customSettled = phase3Results[1];
  if (customPrompt) {
    if (customSettled.status === "fulfilled" && customSettled.value?.success) {
      customResult = customSettled.value.result;
      console.log(
        `[Pipeline] Custom agent succeeded: ${customResult?.edits?.length || 0} edits`,
      );
    } else if (
      customSettled.status === "fulfilled" &&
      customSettled.value?.skipped
    ) {
      console.log("[Pipeline] Custom agent skipped (no prompt)");
    } else {
      const customError = extractSettledError(customSettled);
      console.error("[Pipeline] Custom agent failed:", customError);
    }
  }

  // Build phase 3 summary
  const phase3Completed = [];
  const phase3Failed = [];

  if (fixSettled.status === "fulfilled" && fixSettled.value?.success) {
    phase3Completed.push("fix");
  } else {
    phase3Failed.push("fix");
  }

  if (customPrompt) {
    if (
      customSettled.status === "fulfilled" &&
      customSettled.value?.success &&
      !customSettled.value?.skipped
    ) {
      phase3Completed.push("custom");
    } else if (
      customSettled.status === "rejected" ||
      (customSettled.status === "fulfilled" &&
        !customSettled.value?.success &&
        !customSettled.value?.skipped)
    ) {
      phase3Failed.push("custom");
    }
  }

  const phase3Duration = Date.now() - phase3StartTime;

  console.log(
    `[Pipeline] Phase 3 complete: ${phase3Completed.length}/${customPrompt ? 2 : 1} agents succeeded in ${phase3Duration}ms`,
  );

  if (res) {
    sendPhaseEvent(res, {
      phase: "fix",
      status: "completed",
      agentsCompleted: phase3Completed,
      agentsFailed: phase3Failed,
      duration: phase3Duration,
    });
  }

  // ============================================
  // END OF PHASE 3 MODIFICATION
  // Continue with Phase 4 as before...
  // ============================================

  // ============================================
  // PHASE 4: Final Compilation (Sequential)
  // ============================================
  console.log("\n--- PHASE 4: Final Compilation ---");
  updatePipelineStatus(sessionId, { phase: "compilation" });

  try {
    if (res) {
      sendAgentStatusEvent(res, {
        agent: "coordinator",
        status: "running",
        startedAt: Date.now(),
        message: "Compiling final report...",
      });
    }

    await runCompilationPhase(memory);

    if (res) {
      sendAgentStatusEvent(res, {
        agent: "coordinator",
        status: "complete",
        message: "Report compiled",
      });
    }
  } catch (compilationError) {
    console.error("[Pipeline] Compilation error:", compilationError.message);
    memory.setError(compilationError);
  }

  // ============================================
  // STEP 5 — Build and return final results
  // ============================================
  const store = memory.get();
  const pipelineEndTime = Date.now();
  const totalDuration = pipelineEndTime - pipelineStartTime;

  updatePipelineStatus(sessionId, { phase: "complete" });

  const results = {
    sessionId,
    repoSummary,
    fileTree: store.fileTree || fileTreeData,
    plan: store.plan,
    security: {
      bugs: store.bugs || [],
      summary: store.securitySummary || secResult || null,
    },
    documentation: store.documentation || docResult || "",
    documentationMeta: store.documentationMeta || {},
    architecture: {
      refactors: store.refactors || [],
      result: store.architectureResult || archResult || null,
      patterns: store.patternAnalysis || null,
    },
    fix: fixResult || null,
    custom: customResult || null,
    compilation: store.compilationResult || null,
    agentMessages: store.messages || [],
    timing: {
      startTime: pipelineStartTime,
      endTime: pipelineEndTime,
      durationMs: totalDuration,
      phases: {
        coordinator: phase2StartTime - pipelineStartTime,
        analysis: phase2Duration,
        fix: phase3Duration,
      },
    },
    status: store.status,
    agentsSummary: {
      completed: [...phase2Completed, ...phase3Completed, "coordinator"],
      failed: [...phase2Failed, ...phase3Failed],
    },
  };

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Pipeline Complete (Parallel Mode)`);
  console.log(`   Total Duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(
    `   Agents Completed: ${results.agentsSummary.completed.join(", ")}`,
  );
  console.log(
    `   Agents Failed: ${results.agentsSummary.failed.length > 0 ? results.agentsSummary.failed.join(", ") : "None"}`,
  );
  console.log(`   Bugs found: ${results.security.bugs.length}`);
  console.log(
    `   Refactors suggested: ${results.architecture.refactors.length}`,
  );
  console.log(
    `   Health score: ${results.compilation?.codeHealthScore || "N/A"}/100`,
  );
  console.log(`${"=".repeat(60)}\n`);

  // Send final pipeline_complete event
  if (res) {
    sendSSEEvent(res, "pipeline_complete", {
      sessionId,
      duration: totalDuration,
      agentsCompleted: results.agentsSummary.completed,
      agentsFailed: results.agentsSummary.failed,
      summary: {
        bugsFound: results.security.bugs.length,
        refactorsFound: results.architecture.refactors.length,
        healthScore: results.compilation?.codeHealthScore,
      },
    });
  }

  // ============================================
  // STEP 6 — Schedule session cleanup
  // ============================================
  setTimeout(
    () => {
      destroySession(sessionId);
      cleanupPipelineStatus(sessionId);
      console.log(`🧹 Session cleaned up: ${sessionId}`);
    },
    5 * 60 * 1000,
  );

  return results;
}

// Legacy export for backward compatibility
export { getPipelineStatus };
