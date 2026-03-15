// Code V1 Start


// import { create } from 'zustand';

// const initialAgents = {
//   coordinator: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
//   security: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
//   writer: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
//   architecture: { status: 'idle', currentAction: '', findings: 0, iterations: 0 }
// };

// const initialState = {
//   isAnalyzing: false,
//   sessionId: null,
//   repoUrl: '',
//   repoSummary: null,
//   selectedPaths: [],
//   pipelinePhase: 'idle',
//   pipelineMessage: '',
//   agents: { ...initialAgents },
//   plan: null,
//   bugs: [],
//   documentation: '',
//   documentationMeta: {},
//   refactors: [],
//   compilationResult: null,
//   securitySummary: null,
//   architectureResult: null,
//   activityFeed: [],
//   agentMessages: [],
//   finalResults: null,
//   error: null
// };

// const createActivityItem = (type, message, agentName = null, isHighlighted = false, data = null) => ({
//   id: Date.now() + Math.random(),
//   timestamp: Date.now(),
//   type,
//   agentName,
//   message,
//   isHighlighted,
//   data
// });

// const addToActivityFeed = (feed, item) => {
//   const newFeed = [...feed, item];
//   if (newFeed.length > 200) {
//     return newFeed.slice(-200);
//   }
//   return newFeed;
// };

// const useAgentStore = create((set, get) => ({
//   ...initialState,

//   setRepoUrl: (url) => set({ repoUrl: url }),

//   setSelectedPaths: (paths) => set({ selectedPaths: paths }),

//   startAnalysis: () => set({
//     isAnalyzing: true,
//     bugs: [],
//     documentation: '',
//     documentationMeta: {},
//     refactors: [],
//     compilationResult: null,
//     securitySummary: null,
//     architectureResult: null,
//     finalResults: null,
//     plan: null,
//     activityFeed: [],
//     agentMessages: [],
//     error: null,
//     pipelinePhase: 'fetching',
//     agents: {
//       coordinator: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
//       security: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
//       writer: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
//       architecture: { status: 'idle', currentAction: '', findings: 0, iterations: 0 }
//     }
//   }),

//   handleSSEEvent: (eventName, data) => {
//     const state = get();

//     switch (eventName) {
//       case 'pipeline_start': {
//         const activityItem = createActivityItem('system', data.message);
//         set({
//           pipelineMessage: data.message,
//           activityFeed: addToActivityFeed(state.activityFeed, activityItem)
//         });
//         break;
//       }

//       case 'repo_ready': {
//         const message = `Repository loaded: ${data.summary?.repo || 'unknown'} (${data.filesCount || 0} files)`;
//         const activityItem = createActivityItem('system', message);
//         set({
//           repoSummary: data.summary,
//           pipelinePhase: 'planning',
//           activityFeed: addToActivityFeed(state.activityFeed, activityItem)
//         });
//         break;
//       }

//       case 'session_created': {
//         set({ sessionId: data.sessionId });
//         break;
//       }

//       case 'agent_status': {
//         const { agentName, status, currentAction } = data;
//         const newAgents = { ...state.agents };
        
//         if (newAgents[agentName]) {
//           newAgents[agentName] = {
//             ...newAgents[agentName],
//             status,
//             currentAction: currentAction || ''
//           };
//         }

//         const updates = { agents: newAgents };
        
//         if (status === 'acting' || status === 'thinking') {
//           updates.pipelinePhase = 'analyzing';
//         }

//         const activityItem = createActivityItem(
//           'agent_status',
//           currentAction || status,
//           agentName
//         );
//         updates.activityFeed = addToActivityFeed(state.activityFeed, activityItem);

//         set(updates);
//         break;
//       }

//       case 'coordinator_plan': {
//         const activityItem = createActivityItem(
//           'plan',
//           data.plan?.planSummary || 'Plan created',
//           'coordinator'
//         );
//         set({
//           plan: data.plan,
//           pipelinePhase: 'planning',
//           activityFeed: addToActivityFeed(state.activityFeed, activityItem)
//         });
//         break;
//       }

//       case 'agent_finding': {
//         const updates = {};
//         let activityMessage = '';
//         let agentName = '';

//         if (data.type === 'bug') {
//           updates.bugs = [...state.bugs, data.data];
//           updates.agents = {
//             ...state.agents,
//             security: {
//               ...state.agents.security,
//               findings: state.agents.security.findings + 1
//             }
//           };
//           agentName = 'security';
//           activityMessage = `Found bug: ${data.data?.title || data.data?.message || 'Security issue'}`;
//         } else if (data.type === 'refactor') {
//           updates.refactors = [...state.refactors, data.data];
//           updates.agents = {
//             ...state.agents,
//             architecture: {
//               ...state.agents.architecture,
//               findings: state.agents.architecture.findings + 1
//             }
//           };
//           agentName = 'architecture';
//           activityMessage = `Found refactor: ${data.data?.title || data.data?.suggestion || 'Refactor suggestion'}`;
//         } else if (data.type === 'documentation') {
//           updates.documentation = data.data;
//           agentName = 'writer';
//           activityMessage = 'Documentation generated';
//         }

//         const activityItem = createActivityItem('finding', activityMessage, agentName);
//         updates.activityFeed = addToActivityFeed(state.activityFeed, activityItem);

//         set(updates);
//         break;
//       }

//       case 'agent_communication': {
//         const activityItem = createActivityItem(
//           'communication',
//           `→ ${data.toAgent}: ${(data.content || '').substring(0, 100)}`,
//           data.fromAgent,
//           true
//         );
//         set({
//           agentMessages: [...state.agentMessages, data],
//           activityFeed: addToActivityFeed(state.activityFeed, activityItem)
//         });
//         break;
//       }

//       case 'session_status': {
//         if (data.status === 'complete') {
//           set({ pipelinePhase: 'complete' });
//         } else if (data.status === 'error') {
//           set({ pipelinePhase: 'error' });
//         }
//         break;
//       }

//       case 'analysis_complete': {
//         const updates = {
//           pipelinePhase: 'complete',
//           isAnalyzing: false
//         };

//         if (data.compilationResult) {
//           updates.compilationResult = data.compilationResult;
//         }

//         const activityItem = createActivityItem('system', 'Analysis complete!');
//         updates.activityFeed = addToActivityFeed(state.activityFeed, activityItem);

//         set(updates);
//         break;
//       }

//       case 'final_results': {
//         const activityItem = createActivityItem('system', 'Final results received');
//         set({
//           finalResults: data,
//           bugs: data.security?.bugs || [],
//           documentation: data.documentation || '',
//           refactors: data.architecture?.refactors || [],
//           compilationResult: data.compilation,
//           securitySummary: data.security?.summary,
//           architectureResult: data.architecture?.result,
//           isAnalyzing: false,
//           pipelinePhase: 'complete',
//           activityFeed: addToActivityFeed(state.activityFeed, activityItem)
//         });
//         break;
//       }

//       case 'error':
//       case 'session_error': {
//         const activityItem = createActivityItem('error', data.error);
//         set({
//           error: data.error,
//           pipelinePhase: 'error',
//           isAnalyzing: false,
//           activityFeed: addToActivityFeed(state.activityFeed, activityItem)
//         });
//         break;
//       }

//       default:
//         break;
//     }
//   },

//   setError: (error) => set({
//     error,
//     pipelinePhase: 'error',
//     isAnalyzing: false
//   }),

//   reset: () => set({ ...initialState })
// }));

// export default useAgentStore;


// Code V1 end



// Code V2 Start
import { create } from 'zustand'

const MAX_ACTIVITY_ITEMS = 200

const initialState = {
  // Pipeline state
  pipelinePhase: 'idle', // 'idle' | 'fetching' | 'planning' | 'analyzing' | 'compiling' | 'complete' | 'error'
  pipelineMessage: '',
  isAnalyzing: false,
  error: null,

  // Session
  sessionId: null,
  analysisId: null,
  isSaving: false,

  // Repository info
  repoInfo: null,

  // Analysis plan from coordinator
  plan: null,

  // Agent states
  agents: {
    coordinator: { status: 'idle', message: '', result: null },
    security: { status: 'idle', message: '', result: null },
    writer: { status: 'idle', message: '', result: null },
    architecture: { status: 'idle', message: '', result: null }
  },

  // Results
  securitySummary: null,
  writerResult: null,
  architectureResult: null,
  compilationResult: null,

  // Activity feed
  activityLog: [],

  // Timing
  startTime: null,
  endTime: null
}

const useAgentStore = create((set, get) => ({
  ...initialState,

  // Actions
  setError: (error) => set({ error }),

  setRepoUrl: (url) => set((state) => ({ 
    repoInfo: { ...(state.repoInfo || {}), url, repoUrl: url } 
  })),

  startAnalysis: () => {
    get().resetPipeline()
    set({
      isAnalyzing: true,
      pipelinePhase: 'fetching',
      pipelineMessage: 'Connecting to server...'
    })
  },

  setAnalysisId: (analysisId) => set({ analysisId }),

  setPipelinePhase: (phase, message = '') => {
    set({
      pipelinePhase: phase,
      pipelineMessage: message,
      isAnalyzing: ['fetching', 'planning', 'analyzing', 'compiling'].includes(phase)
    })
  },

  setRepoInfo: (repoInfo) => set({ repoInfo }),

  setSessionId: (sessionId) => set({ sessionId }),

  setPlan: (plan) => set({ plan }),

  updateAgent: (agentName, updates) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agentName]: {
          ...state.agents[agentName],
          ...updates
        }
      }
    }))
  },

  addActivity: (activity) => {
    set((state) => {
      const newLog = [
        ...state.activityLog,
        {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          ...activity
        }
      ].slice(-MAX_ACTIVITY_ITEMS)
      return { activityLog: newLog }
    })
  },

  // Save analysis to backend
  saveAnalysisToBackend: async () => {
    const state = get()
    
    // Don't save if already saving or no results
    if (state.isSaving || !state.compilationResult) {
      return
    }

    // Get token from window (set by Dashboard)
    const getToken = window.__agentlens_getToken
    if (!getToken) {
      console.warn('No getToken function available, skipping save')
      return
    }

    set({ isSaving: true })

    try {
      const token = await getToken()
      
      const repoUrl = state.repoInfo?.url || state.repoInfo?.repoUrl || ''
      const repoName = state.repoInfo?.name || state.repoInfo?.repoName || repoUrl.split('/').slice(-2).join('/')
      
      const results = {
        plan: state.plan,
        bugs: state.securitySummary,
        documentation: state.writerResult,
        refactors: state.architectureResult,
        summary: state.compilationResult
      }

      const fileCount = state.repoInfo?.files?.length || 0
      const bugCount = state.securitySummary?.totalIssues || 
                       state.securitySummary?.issues?.length || 
                       state.compilationResult?.bugs?.length || 0
      
      const durationMs = state.startTime && state.endTime 
        ? state.endTime - state.startTime 
        : 0

      const response = await fetch('/api/history/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          repoUrl,
          repoName,
          results,
          fileCount,
          bugCount,
          durationMs
        })
      })

      if (response.ok) {
        const data = await response.json()
        set({ analysisId: data.analysis?.id || data.id })
        console.log('[AgentStore] Analysis saved successfully:', data.analysis?.id || data.id)
      } else {
        console.error('[AgentStore] Failed to save analysis:', response.status)
      }
    } catch (error) {
      console.error('[AgentStore] Error saving analysis:', error)
    } finally {
      set({ isSaving: false })
    }
  },

  // Handle SSE events from the pipeline
  // Maps EXACTLY to backend events from sseEmitter.js and analyzeRoute.js
  handleSSEEvent: (eventName, data) => {
    const { addActivity, updateAgent, setPipelinePhase, saveAnalysisToBackend } = get()

    switch (eventName) {
      // ── Backend: analyzeRoute sends "pipeline_start" at Step 3 ──
      case 'pipeline_start':
        set({
          startTime: Date.now(),
          isAnalyzing: true,
          error: null
        })
        setPipelinePhase('fetching', data.message || 'Starting analysis...')
        addActivity({
          type: 'system',
          agent: 'system',
          message: data.message || `Accessing ${data.owner}/${data.repo}...`
        })
        break

      // ── Backend: analyzeRoute sends "repo_ready" at Step 6 ──
      case 'repo_ready':
        set({ repoInfo: data.summary })
        setPipelinePhase('fetching', `Fetched ${data.filesCount || 0} files`)
        addActivity({
          type: 'info',
          agent: 'system',
          message: `Repository loaded: ${data.summary?.repo || 'unknown'} (${data.filesCount || 0} files)`
        })
        break

      // ── Backend: analyzeRoute sends "session_created" in onSession callback ──
      case 'session_created':
        set({ sessionId: data.sessionId })
        addActivity({
          type: 'system',
          agent: 'system',
          message: `Session created: ${data.sessionId}`
        })
        break

      // ── Backend: SSE emitter sends "connected" on initial connection ──
      case 'connected':
        // Initial connection handshake — just acknowledge
        break

      // ── Backend: memory.setAgentStatus → "agent_status" ──
      // data shape: { agentName, status, currentAction }
      case 'agent_status': {
        const agentName = data.agentName || data.agent
        if (agentName && get().agents[agentName]) {
          const isRunning = data.status === 'acting' || data.status === 'thinking' || data.status === 'analyzing'
          updateAgent(agentName, {
            status: isRunning ? 'running' : data.status,
            message: data.currentAction || data.status,
            currentAction: data.currentAction || ''
          })
          if (isRunning) {
            setPipelinePhase('analyzing', `${agentName} agent: ${data.currentAction || 'working...'}`)
          }
        }
        addActivity({
          type: 'agent_start',
          agent: agentName || 'system',
          message: data.currentAction || `${agentName}: ${data.status}`
        })
        break
      }

      // ── Backend: memory.addBug/addRefactor/setDocumentation → "agent_finding" ──
      // data shape: { type: 'bug'|'refactor'|'documentation', data: {...} }
      case 'agent_finding': {
        const updates = {}
        let activityMessage = ''
        let findingAgent = ''

        if (data.type === 'bug') {
          const currentBugs = get().securitySummary?.bugs || []
          updates.securitySummary = {
            ...get().securitySummary,
            bugs: [...currentBugs, data.data],
            totalIssues: currentBugs.length + 1
          }
          findingAgent = 'security'
          activityMessage = `Found bug: ${data.data?.title || data.data?.message || 'Security issue'}`
        } else if (data.type === 'refactor') {
          const currentRefactors = get().architectureResult?.refactors || []
          updates.architectureResult = {
            ...get().architectureResult,
            refactors: [...currentRefactors, data.data]
          }
          findingAgent = 'architecture'
          activityMessage = `Found: ${data.data?.title || data.data?.suggestion || 'Refactor suggestion'}`
        } else if (data.type === 'documentation') {
          updates.writerResult = data.data
          findingAgent = 'writer'
          activityMessage = 'Documentation generated'
          updateAgent('writer', { status: 'complete', result: data.data })
        }

        set(updates)
        addActivity({
          type: 'result',
          agent: findingAgent || 'system',
          message: activityMessage
        })
        break
      }

      // ── Backend: memory.addMessage → "agent_communication" ──
      // data shape: { fromAgent, toAgent, content, type }
      case 'agent_communication':
        addActivity({
          type: 'info',
          agent: data.fromAgent || 'system',
          message: `→ ${data.toAgent}: ${(data.content || '').substring(0, 120)}`
        })
        break

      // ── Backend: memory.setPlan → "coordinator_plan" ──
      // data shape: { plan: {...} }
      case 'coordinator_plan':
        set({ plan: data.plan || data })
        setPipelinePhase('planning', 'Execution plan created')
        updateAgent('coordinator', { status: 'complete', result: data.plan || data })
        addActivity({
          type: 'plan',
          agent: 'coordinator',
          message: data.plan?.planSummary || 'Created analysis execution plan'
        })
        break

      // ── Backend: memory.setStatus → "session_status" ──
      // data shape: { status: 'complete'|'error', sessionId }
      // NOTE: backend sends 'complete' (NOT 'completed')
      case 'session_status':
        if (data.status === 'complete') {
          set({ endTime: Date.now() })
          setPipelinePhase('compiling', 'Waiting for final results...')
          addActivity({
            type: 'system',
            agent: 'system',
            message: 'Analysis completed, compiling results...'
          })
        } else if (data.status === 'error') {
          set({
            error: data.error || 'An error occurred',
            isAnalyzing: false,
            endTime: Date.now()
          })
          setPipelinePhase('error', data.error || 'An error occurred')
          addActivity({
            type: 'error',
            agent: 'system',
            message: data.error || 'An error occurred'
          })
        } else if (data.status === 'analyzing') {
          setPipelinePhase('analyzing', 'Agents are analyzing...')
        }
        break

      // ── Backend: sseEmitter sends "analysis_complete" with memory.getSnapshot() ──
      // data shape: full snapshot { bugs, documentation, refactors, plan, agentStatuses, ... }
      case 'analysis_complete': {
        const snapshot = data;
        const updates = {};

        if (snapshot.bugs) {
          const bugs = snapshot.bugs || [];
          const summary = snapshot.securitySummary || {};
          updates.securitySummary = {
            ...summary,
            bugs,
            totalIssues: bugs.length || summary.totalIssues || 0
          };
          updateAgent('security', { status: 'complete' });
        }

        if (snapshot.documentation) {
          updates.writerResult = snapshot.documentation;
          updateAgent('writer', { status: 'complete' });
        }

        if (snapshot.refactors || snapshot.architectureResult) {
          const archResult = snapshot.architectureResult || {};
          const refactors = snapshot.refactors || [];
          const patterns = snapshot.patternAnalysis || null;
          updates.architectureResult = {
            ...archResult,
            refactors,
            patternAnalysis: patterns || archResult.patternAnalysis || null
          };
          updateAgent('architecture', { status: 'complete' });
        }

        if (snapshot.plan) {
          updates.plan = snapshot.plan;
        }

        if (snapshot.compilationResult) {
          updates.compilationResult = snapshot.compilationResult;
        }

        set(updates);
        addActivity({
          type: 'system',
          agent: 'system',
          message: 'Analysis snapshot received'
        });
        break;
      }

      // ── Backend: analyzeRoute sends "final_results" as last event before res.end() ──
      // data shape: the full compiled results object from runAnalysisPipeline
      case 'final_results': {
        const results = data
        const finalUpdates = { endTime: Date.now() }

        // Extract results from whatever shape the pipeline returns
        if (results.security) {
          // Merge summary AND bugs into securitySummary so the frontend can read both
          const summary = results.security.summary || {}
          const bugs = results.security.bugs || []
          finalUpdates.securitySummary = {
            ...summary,
            bugs,
            totalIssues: bugs.length || summary.totalIssues || 0
          }
          updateAgent('security', { status: 'complete', result: results.security })
        }
        if (results.documentation || results.writer) {
          finalUpdates.writerResult = results.documentation || results.writer
          updateAgent('writer', { status: 'complete', result: results.documentation || results.writer })
        }
        if (results.architecture) {
          // Merge result, refactors, and patterns into architectureResult
          const archResult = results.architecture.result || {}
          const refactors = results.architecture.refactors || []
          const patterns = results.architecture.patterns || null
          finalUpdates.architectureResult = {
            ...archResult,
            refactors,
            patternAnalysis: patterns || archResult.patternAnalysis || null
          }
          updateAgent('architecture', { status: 'complete', result: results.architecture })
        }
        if (results.compilation || results.summary) {
          finalUpdates.compilationResult = results.compilation || results.summary
        }

        // Also handle flat snapshot shape (from getSnapshot)
        if (results.bugs && !results.security) {
          finalUpdates.securitySummary = {
            ...(get().securitySummary || {}),
            bugs: results.bugs,
            totalIssues: results.bugs.length
          }
        }
        if (results.refactors && !results.architecture) {
          finalUpdates.architectureResult = {
            ...(get().architectureResult || {}),
            refactors: results.refactors
          }
        }

        set(finalUpdates)
        setPipelinePhase('complete', 'Analysis complete!')
        set({ isAnalyzing: false })

        addActivity({
          type: 'system',
          agent: 'system',
          message: '✅ Analysis complete — results are ready!'
        })

        // Auto-save
        setTimeout(() => saveAnalysisToBackend(), 100)
        break;
      }

      // ── Backend: sseEmitter sends "session_error" ──
      case 'session_error':
        set({
          error: data.error || 'An error occurred',
          isAnalyzing: false,
          endTime: Date.now()
        })
        setPipelinePhase('error', data.error || 'An error occurred')
        addActivity({
          type: 'error',
          agent: 'system',
          message: data.error || 'An error occurred'
        })
        break

      // ── Backend: analyzeRoute sends "error" on catch ──
      case 'error':
        set({
          error: data.message || data.error || 'An error occurred',
          isAnalyzing: false
        })
        setPipelinePhase('error', data.message || data.error)
        addActivity({
          type: 'error',
          agent: 'system',
          message: data.message || data.error
        })
        break

      // ── Backend: sseEmitter "memory_update" for key updates ──
      case 'memory_update':
        // Optional: handle specific key updates if needed
        break

      default:
        console.log('[AgentStore] Unhandled event:', eventName, data)
        break
    }
  },

  // Reset to initial state
  resetPipeline: () => {
    set({
      ...initialState,
      activityLog: [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'system',
        agent: 'system',
        message: 'Ready for new analysis'
      }]
    })
  },

  // Alias for backward compatibility
  reset: () => {
    get().resetPipeline()
  }
}))

export default useAgentStore


// Code V2 End