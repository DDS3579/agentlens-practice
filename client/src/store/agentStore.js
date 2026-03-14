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
  handleSSEEvent: (eventName, data) => {
    const { addActivity, updateAgent, setPipelinePhase, saveAnalysisToBackend } = get()

    switch (eventName) {
      case 'session_start':
        set({
          sessionId: data.sessionId,
          startTime: Date.now(),
          isAnalyzing: true,
          error: null
        })
        setPipelinePhase('fetching', 'Starting analysis...')
        addActivity({
          type: 'system',
          agent: 'system',
          message: `Analysis session started: ${data.sessionId}`
        })
        break

      case 'session_status':
        if (data.status === 'completed') {
          set({ endTime: Date.now() })
          setPipelinePhase('complete', 'Analysis complete!')
          addActivity({
            type: 'system',
            agent: 'system',
            message: 'Analysis completed successfully'
          })
          // Auto-save to backend
          setTimeout(() => saveAnalysisToBackend(), 100)
        } else if (data.status === 'error') {
          set({ 
            error: data.error || 'An error occurred',
            isAnalyzing: false,
            endTime: Date.now()
          })
          setPipelinePhase('error', data.error || 'An error occurred')
        }
        break

      case 'session_complete':
        set({ endTime: Date.now() })
        setPipelinePhase('complete', 'Analysis complete!')
        addActivity({
          type: 'system',
          agent: 'system',
          message: 'All agents completed analysis'
        })
        // Auto-save to backend
        setTimeout(() => saveAnalysisToBackend(), 100)
        break

      case 'repo_info':
        set({ repoInfo: data })
        setPipelinePhase('fetching', `Fetched ${data.files?.length || 0} files`)
        addActivity({
          type: 'info',
          agent: 'system',
          message: `Repository loaded: ${data.name || data.repoName} (${data.files?.length || 0} files)`
        })
        break

      case 'plan':
      case 'coordinator_plan':
        set({ plan: data })
        setPipelinePhase('planning', 'Execution plan created')
        updateAgent('coordinator', { status: 'complete', result: data })
        addActivity({
          type: 'plan',
          agent: 'coordinator',
          message: 'Created analysis execution plan'
        })
        break

      case 'agent_start':
        updateAgent(data.agent, { status: 'running', message: data.message || 'Starting...' })
        if (data.agent !== 'coordinator') {
          setPipelinePhase('analyzing', `${data.agent} agent running...`)
        }
        addActivity({
          type: 'agent_start',
          agent: data.agent,
          message: `${data.agent} agent started`
        })
        break

      case 'agent_progress':
        updateAgent(data.agent, { message: data.message })
        addActivity({
          type: 'progress',
          agent: data.agent,
          message: data.message
        })
        break

      case 'agent_complete':
        updateAgent(data.agent, { status: 'complete', result: data.result })
        addActivity({
          type: 'agent_complete',
          agent: data.agent,
          message: `${data.agent} agent completed`
        })
        break

      case 'agent_error':
        updateAgent(data.agent, { status: 'error', message: data.error })
        addActivity({
          type: 'error',
          agent: data.agent,
          message: `Error: ${data.error}`
        })
        break

      case 'security_result':
      case 'security_summary':
        set({ securitySummary: data })
        updateAgent('security', { status: 'complete', result: data })
        addActivity({
          type: 'result',
          agent: 'security',
          message: `Found ${data.totalIssues || data.issues?.length || 0} security issues`
        })
        break

      case 'writer_result':
      case 'documentation':
        set({ writerResult: data })
        updateAgent('writer', { status: 'complete', result: data })
        addActivity({
          type: 'result',
          agent: 'writer',
          message: 'Documentation generated'
        })
        break

      case 'architecture_result':
      case 'architecture_review':
        set({ architectureResult: data })
        updateAgent('architecture', { status: 'complete', result: data })
        addActivity({
          type: 'result',
          agent: 'architecture',
          message: `Architecture score: ${data.score || 'N/A'}/100`
        })
        break

      case 'compilation_result':
      case 'final_report':
        set({ compilationResult: data })
        setPipelinePhase('compiling', 'Compiling final report...')
        addActivity({
          type: 'result',
          agent: 'coordinator',
          message: 'Final report compiled'
        })
        break

      case 'chunk':
      case 'stream_chunk':
        // Handle streaming text chunks
        addActivity({
          type: 'stream',
          agent: data.agent || 'system',
          message: data.content || data.text
        })
        break

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

      default:
        // Log unhandled events for debugging
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