// client/src/store/agentStore.js
import { create } from "zustand";

const MAX_ACTIVITY_ITEMS = 200;

// ============================================
// Initial Agent State Shape
// ============================================
const createInitialAgentState = () => ({
  status: "idle", // 'idle' | 'running' | 'complete' | 'error'
  startedAt: null,
  duration: null,
  error: null,
  message: "",
  result: null,
  currentAction: "",
});

const initialState = {
  // ============================================
  // Agent States - Support concurrent execution
  // ============================================
  agents: {
    coordinator: createInitialAgentState(),
    architecture: createInitialAgentState(),
    security: createInitialAgentState(),
    docs: createInitialAgentState(),
    fix: createInitialAgentState(),
    custom: createInitialAgentState(),
  },

  // ============================================
  // Pipeline Phase Tracking
  // ============================================
  currentPhase: "idle", // 'idle' | 'coordinator' | 'analysis' | 'fix' | 'complete' | 'error'
  pipelineStartedAt: null,
  pipelineDuration: null,
  pipelineMessage: "",
  isAnalyzing: false,
  error: null,

  // ============================================
  // Session & Analysis
  // ============================================
  sessionId: null,
  analysisId: null,
  isSaving: false,

  // ============================================
  // Repository Info
  // ============================================
  repoInfo: null,

  // ============================================
  // Results
  // ============================================
  plan: null,
  securitySummary: null,
  writerResult: null,
  architectureResult: null,
  compilationResult: null,
  fixResult: null,
  customResult: null,

  // ============================================
  // Activity Feed
  // ============================================
  activityLog: [],

  // ============================================
  // Timing
  // ============================================
  startTime: null,
  endTime: null,

  // ============================================
  // Current Repo URL
  // ============================================
  currentRepoUrl: '',

  // Token Usage Tracking
  tokenUsage: {
    prompt: 0,
    completion: 0,
    total: 0,
    byAgent: {
      coordinator: 0,
      architecture: 0,
      security: 0,
      docs: 0,
      fix: 0,
      custom: 0,
    },
  },
};

const useAgentStore = create((set, get) => ({
  ...initialState,

  // ============================================
  // Agent Status Actions
  // ============================================

  /**
   * Set status for a specific agent
   * Supports concurrent agent state updates
   *
   * @param {string} agentName - Name of the agent
   * @param {string} status - New status
   * @param {Object} extra - Additional data { duration, error, startedAt, message, currentAction }
   */
  setAgentStatus: (agentName, status, extra = {}) => {
    set((state) => {
      // Ensure we have a valid agent
      if (!state.agents[agentName]) {
        console.warn(`[AgentStore] Unknown agent: ${agentName}`);
        return state;
      }

      return {
        agents: {
          ...state.agents,
          [agentName]: {
            ...state.agents[agentName],
            status,
            ...extra,
            // Ensure currentAction is set for running status
            currentAction:
              extra.currentAction ||
              extra.message ||
              (status === "running"
                ? "Processing..."
                : status === "complete"
                  ? "Complete"
                  : state.agents[agentName].currentAction),
          },
        },
      };
    });
  },

  /**
   * Add token usage from an LLM call
   * @param {string} agentName - Which agent used the tokens
   * @param {number} promptTokens - Input tokens
   * @param {number} completionTokens - Output tokens
   */
  addTokenUsage: (agentName, promptTokens, completionTokens) => {
    set((state) => {
      const p = promptTokens || 0;
      const c = completionTokens || 0;
      const agentKey = state.tokenUsage.byAgent.hasOwnProperty(agentName)
        ? agentName
        : "custom"; // fallback to custom for unknown agents

      return {
        tokenUsage: {
          prompt: state.tokenUsage.prompt + p,
          completion: state.tokenUsage.completion + c,
          total: state.tokenUsage.total + p + c,
          byAgent: {
            ...state.tokenUsage.byAgent,
            [agentKey]: (state.tokenUsage.byAgent[agentKey] || 0) + p + c,
          },
        },
      };
    });
  },

  /**
   * Reset all token usage counters
   */
  resetTokenUsage: () => {
    set({
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
        byAgent: {
          coordinator: 0,
          architecture: 0,
          security: 0,
          docs: 0,
          fix: 0,
          custom: 0,
        },
      },
    });
  },

  /**
   * Set the current pipeline phase
   * @param {string} phase
   * @param {string} message
   */
  setPhase: (phase, message = "") => {
    set({
      currentPhase: phase,
      pipelineMessage: message,
      isAnalyzing: ["coordinator", "analysis", "fix"].includes(phase),
    });
  },

  /**
   * Reset all agents to idle state
   */
  resetAgents: () => {
    set({
      agents: {
        coordinator: createInitialAgentState(),
        architecture: createInitialAgentState(),
        security: createInitialAgentState(),
        docs: createInitialAgentState(),
        fix: createInitialAgentState(),
        custom: createInitialAgentState(),
      },
    });
  },

  /**
   * Reset entire pipeline to initial state
   */
  resetPipeline: () => {
    set({
      ...initialState,
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
        byAgent: {
          coordinator: 0,
          architecture: 0,
          security: 0,
          docs: 0,
          fix: 0,
          custom: 0,
        },
      },
      activityLog: [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          type: "system",
          agent: "system",
          message: "Ready for new analysis",
        },
      ],
    });
  },

  // Alias for backward compatibility
  reset: () => get().resetPipeline(),

  // ============================================
  // Computed Selectors (call these as functions)
  // ============================================

  /**
   * Get array of currently running agent names
   * @returns {Array<string>}
   */
  getRunningAgents: () => {
    const agents = get().agents;
    return Object.entries(agents)
      .filter(([_, state]) => state.status === "running")
      .map(([name]) => name);
  },

  /**
   * Check if any agent is currently running
   * @returns {boolean}
   */
  isAnyAgentRunning: () => {
    const agents = get().agents;
    return Object.values(agents).some((a) => a.status === "running");
  },

  /**
   * Get array of completed agent names
   * @returns {Array<string>}
   */
  getCompletedAgents: () => {
    const agents = get().agents;
    return Object.entries(agents)
      .filter(([_, state]) => state.status === "complete")
      .map(([name]) => name);
  },

  /**
   * Get array of failed agent names
   * @returns {Array<string>}
   */
  getFailedAgents: () => {
    const agents = get().agents;
    return Object.entries(agents)
      .filter(([_, state]) => state.status === "error")
      .map(([name]) => name);
  },

  // ============================================
  // Activity Feed
  // ============================================

  addActivity: (activity) => {
    set((state) => {
      const newLog = [
        ...state.activityLog,
        {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          ...activity,
        },
      ].slice(-MAX_ACTIVITY_ITEMS);
      return { activityLog: newLog };
    });
  },

  // ============================================
  // Other Actions (preserved from existing store)
  // ============================================

  setError: (error) => set({ error }),

  setRepoUrl: (url) =>
    set((state) => ({
      repoInfo: { ...(state.repoInfo || {}), url, repoUrl: url },
      currentRepoUrl: url,
    })),

  setCurrentRepoUrl: (url) => set({ currentRepoUrl: url }),

  startAnalysis: () => {
    get().resetPipeline();
    set({
      isAnalyzing: true,
      currentPhase: "coordinator",
      pipelineMessage: "Connecting to server...",
      pipelineStartedAt: Date.now(),
      startTime: Date.now(),
    });
  },

  setAnalysisId: (analysisId) => set({ analysisId }),
  setRepoInfo: (repoInfo) => set({ repoInfo }),
  setSessionId: (sessionId) => set({ sessionId }),
  setPlan: (plan) => set({ plan }),

  // Legacy updateAgent method for compatibility
  updateAgent: (agentName, updates) => {
    get().setAgentStatus(
      agentName,
      updates.status || get().agents[agentName]?.status,
      updates,
    );
  },

  // ============================================
  // Save Analysis to Backend
  // ============================================

  saveAnalysisToBackend: async () => {
    const state = get();

    if (state.isSaving || !state.compilationResult) {
      return;
    }

    const getToken = window.__agentlens_getToken;
    if (!getToken) {
      console.warn("No getToken function available, skipping save");
      return;
    }

    set({ isSaving: true });

    try {
      const token = await getToken();

      const repoUrl = state.repoInfo?.url || state.repoInfo?.repoUrl || "";
      const repoName =
        state.repoInfo?.name ||
        state.repoInfo?.repoName ||
        repoUrl.split("/").slice(-2).join("/");

      const results = {
        plan: state.plan,
        bugs: state.securitySummary,
        documentation: state.writerResult,
        refactors: state.architectureResult,
        summary: state.compilationResult,
        fix: state.fixResult,
        custom: state.customResult,
      };

      const fileCount = state.repoInfo?.files?.length || 0;
      const bugCount =
        state.securitySummary?.totalIssues ||
        state.securitySummary?.issues?.length ||
        state.compilationResult?.bugs?.length ||
        0;

      const durationMs =
        state.startTime && state.endTime ? state.endTime - state.startTime : 0;

      const response = await fetch("/api/history/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repoUrl,
          repoName,
          results,
          fileCount,
          bugCount,
          durationMs,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        set({ analysisId: data.analysis?.id || data.id });
        console.log(
          "[AgentStore] Analysis saved successfully:",
          data.analysis?.id || data.id,
        );
      } else {
        console.error("[AgentStore] Failed to save analysis:", response.status);
      }
    } catch (error) {
      console.error("[AgentStore] Error saving analysis:", error);
    } finally {
      set({ isSaving: false });
    }
  },

  // ============================================
  // SSE Event Handler (Updated for Parallel Support)
  // ============================================

  handleSSEEvent: (eventName, data) => {
    const { addActivity, setAgentStatus, setPhase, saveAnalysisToBackend } =
      get();

    switch (eventName) {
      // ── Pipeline Start ──
      case "pipeline_start":
        set({
          startTime: Date.now(),
          pipelineStartedAt: Date.now(),
          isAnalyzing: true,
          error: null,
        });
        setPhase("coordinator", data.message || "Starting analysis...");
        addActivity({
          type: "system",
          agent: "system",
          message: data.message || `Accessing ${data.owner}/${data.repo}...`,
        });
        break;

      // ── Repository Ready ──
      case "repo_ready":
        set({ repoInfo: data.summary });
        addActivity({
          type: "info",
          agent: "system",
          message: `Repository loaded: ${data.summary?.repo || "unknown"} (${data.filesCount || 0} files)`,
        });
        break;

      // ── Session Created ──
      case "session_created":
        set({ sessionId: data.sessionId });
        break;

      // ── Connected (SSE handshake) ──
      case "connected":
        break;

      // ── Agent Status Update (Concurrent Support) ──
      case "agent_update":
      case "agent_status": {
        const agentName = data.agent || data.agentName;

        if (agentName) {
          // Map 'docs' to 'writer' for display if needed
          const displayName = agentName === "docs" ? "writer" : agentName;
          const storeAgentName = agentName; // Keep original for store

          // Determine status
          let status = data.status;
          if (
            status === "acting" ||
            status === "thinking" ||
            status === "analyzing"
          ) {
            status = "running";
          }

          // Update agent state
          setAgentStatus(storeAgentName, status, {
            startedAt: data.startedAt,
            duration: data.duration,
            error: data.error,
            message: data.message || data.currentAction,
            currentAction: data.currentAction || data.message,
          });

          // Update phase if needed
          if (status === "running") {
            const runningAgents = get().getRunningAgents();
            if (runningAgents.length > 1) {
              setPhase(
                "analysis",
                `Running ${runningAgents.length} agents in parallel...`,
              );
            }
          }

          // Add activity
          addActivity({
            type: status === "error" ? "error" : "agent_status",
            agent: displayName,
            message:
              data.error ||
              data.currentAction ||
              data.message ||
              `${displayName}: ${status}`,
          });
        }
        break;
      }

      // ── Phase Complete (New Event for Parallel) ──
      case "phase_complete": {
        const { phase, agentsCompleted, agentsFailed, duration } = data;

        // Update phase
        if (phase === "analysis") {
          setPhase("fix", "Analysis phase complete, starting fix agent...");
        } else if (phase === "fix") {
          setPhase("complete", "All agents complete!");
        } else if (phase === "coordinator") {
          setPhase(
            "analysis",
            "Coordinator complete, starting parallel analysis...",
          );
        }

        // Log activity
        const successCount = agentsCompleted?.length || 0;
        const failCount = agentsFailed?.length || 0;
        const durationSec = duration ? `${(duration / 1000).toFixed(1)}s` : "";

        addActivity({
          type: "phase",
          agent: "system",
          message: `Phase "${phase}" complete: ${successCount} succeeded, ${failCount} failed ${durationSec}`,
        });

        // Mark completed agents
        if (agentsCompleted) {
          agentsCompleted.forEach((agent) => {
            setAgentStatus(agent, "complete", { duration });
          });
        }

        // Mark failed agents
        if (agentsFailed) {
          agentsFailed.forEach((agent) => {
            setAgentStatus(agent, "error", { error: "Agent failed" });
          });
        }
        break;
      }

      // ── Agent Finding ──
      case "agent_finding": {
        const updates = {};
        let activityMessage = "";
        let findingAgent = "";

        if (data.type === "bug") {
          const currentBugs = get().securitySummary?.bugs || [];
          updates.securitySummary = {
            ...get().securitySummary,
            bugs: [...currentBugs, data.data],
            totalIssues: currentBugs.length + 1,
          };
          findingAgent = "security";
          activityMessage = `Found bug: ${data.data?.title || data.data?.message || "Security issue"}`;
        } else if (data.type === "refactor") {
          const currentRefactors = get().architectureResult?.refactors || [];
          updates.architectureResult = {
            ...get().architectureResult,
            refactors: [...currentRefactors, data.data],
          };
          findingAgent = "architecture";
          activityMessage = `Found: ${data.data?.title || data.data?.suggestion || "Refactor suggestion"}`;
        } else if (data.type === "documentation") {
          updates.writerResult = data.data;
          findingAgent = "docs";
          activityMessage = "Documentation generated";
          setAgentStatus("docs", "complete", { result: data.data });
        }

        set(updates);
        addActivity({
          type: "result",
          agent: findingAgent || "system",
          message: activityMessage,
        });
        break;
      }

      // ── Agent Communication ──
      case "agent_communication":
        addActivity({
          type: "info",
          agent: data.fromAgent || "system",
          message: `→ ${data.toAgent}: ${(data.content || "").substring(0, 120)}`,
        });
        break;

      // ── Coordinator Plan ──
      case "coordinator_plan":
        set({ plan: data.plan || data });
        setAgentStatus("coordinator", "complete", {
          result: data.plan || data,
        });
        addActivity({
          type: "plan",
          agent: "coordinator",
          message: data.plan?.planSummary || "Created analysis execution plan",
        });
        break;

      // ── Session Status ──
      case "session_status":
        if (data.status === "complete") {
          set({ endTime: Date.now() });
          setPhase("complete", "Analysis complete!");
          addActivity({
            type: "system",
            agent: "system",
            message: "Analysis completed",
          });
        } else if (data.status === "error") {
          set({
            error: data.error || "An error occurred",
            isAnalyzing: false,
            endTime: Date.now(),
          });
          setPhase("error", data.error || "An error occurred");
          addActivity({
            type: "error",
            agent: "system",
            message: data.error || "An error occurred",
          });
        }
        break;

      // ── Analysis Complete (Snapshot) ──
      case "analysis_complete": {
        const snapshot = data;
        const updates = {};

        if (snapshot.bugs) {
          updates.securitySummary = {
            ...(get().securitySummary || {}),
            bugs: snapshot.bugs,
            totalIssues: snapshot.bugs.length,
          };
          setAgentStatus("security", "complete");
        }

        if (snapshot.documentation) {
          updates.writerResult = snapshot.documentation;
          setAgentStatus("docs", "complete");
        }

        if (snapshot.refactors || snapshot.architectureResult) {
          updates.architectureResult = {
            ...(snapshot.architectureResult || {}),
            refactors: snapshot.refactors || [],
            patternAnalysis: snapshot.patternAnalysis || null,
          };
          setAgentStatus("architecture", "complete");
        }

        if (snapshot.plan) updates.plan = snapshot.plan;
        if (snapshot.compilationResult)
          updates.compilationResult = snapshot.compilationResult;

        set(updates);
        break;
      }

      // ── Pipeline Complete ──
      case "pipeline_complete": {
        set({
          endTime: Date.now(),
          pipelineDuration: data.duration,
        });
        setPhase("complete", "Pipeline complete!");
        set({ isAnalyzing: false });

        addActivity({
          type: "system",
          agent: "system",
          message: `✅ Pipeline complete! ${data.agentsCompleted?.length || 0} agents succeeded, ${data.agentsFailed?.length || 0} failed`,
        });

        // Auto-save
        setTimeout(() => saveAnalysisToBackend(), 100);
        break;
      }

      // ── Final Results ──
      case "final_results": {
        const results = data;
        const finalUpdates = { endTime: Date.now() };

        if (results.security) {
          finalUpdates.securitySummary = {
            ...(results.security.summary || {}),
            bugs: results.security.bugs || [],
            totalIssues: results.security.bugs?.length || 0,
          };
          setAgentStatus("security", "complete");
        }

        if (results.documentation || results.writer) {
          finalUpdates.writerResult = results.documentation || results.writer;
          setAgentStatus("docs", "complete");
        }

        if (results.architecture) {
          finalUpdates.architectureResult = {
            ...(results.architecture.result || {}),
            refactors: results.architecture.refactors || [],
            patternAnalysis: results.architecture.patterns || null,
          };
          setAgentStatus("architecture", "complete");
        }

        if (results.fix) {
          finalUpdates.fixResult = results.fix;
          setAgentStatus("fix", "complete");
        }

        if (results.custom) {
          finalUpdates.customResult = results.custom;
          setAgentStatus("custom", "complete");
        }

        if (results.compilation) {
          finalUpdates.compilationResult = results.compilation;
        }

        set(finalUpdates);
        setPhase("complete", "Analysis complete!");
        set({ isAnalyzing: false });

        addActivity({
          type: "system",
          agent: "system",
          message: "✅ Analysis complete — results are ready!",
        });

        setTimeout(() => saveAnalysisToBackend(), 100);
        break;
      }

      // ── Errors ──
      case "session_error":
      case "error":
        set({
          error: data.message || data.error || "An error occurred",
          isAnalyzing: false,
          endTime: Date.now(),
        });
        setPhase("error", data.message || data.error);
        addActivity({
          type: "error",
          agent: "system",
          message: data.message || data.error,
        });
        break;

      // ── Fix Events ──
      case "fix_start":
        setAgentStatus("fix", "running", {
          message: `Fixing bug ${data.current}/${data.total}`,
          currentAction: `Fixing ${data.file}:${data.line}`,
        });
        break;

      case "fix_complete":
        addActivity({
          type: "result",
          agent: "fix",
          message: `Fixed bug in ${data.file}`,
        });
        break;

      case "fix_failed":
        addActivity({
          type: "error",
          agent: "fix",
          message: `Failed to fix ${data.file}: ${data.error}`,
        });
        break;

      // ── Token Usage Event ──
      case "token_usage": {
        const { agent, promptTokens, completionTokens } = data;
        get().addTokenUsage(agent, promptTokens, completionTokens);
        break;
      }

      default:
        console.log("[AgentStore] Unhandled event:", eventName, data);
        break;
    }
  },
}));

export default useAgentStore;
