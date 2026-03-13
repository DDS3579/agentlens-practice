import { create } from 'zustand';

const initialAgents = {
  coordinator: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
  security: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
  writer: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
  architecture: { status: 'idle', currentAction: '', findings: 0, iterations: 0 }
};

const initialState = {
  isAnalyzing: false,
  sessionId: null,
  repoUrl: '',
  repoSummary: null,
  selectedPaths: [],
  pipelinePhase: 'idle',
  pipelineMessage: '',
  agents: { ...initialAgents },
  plan: null,
  bugs: [],
  documentation: '',
  documentationMeta: {},
  refactors: [],
  compilationResult: null,
  securitySummary: null,
  architectureResult: null,
  activityFeed: [],
  agentMessages: [],
  finalResults: null,
  error: null
};

const createActivityItem = (type, message, agentName = null, isHighlighted = false, data = null) => ({
  id: Date.now() + Math.random(),
  timestamp: Date.now(),
  type,
  agentName,
  message,
  isHighlighted,
  data
});

const addToActivityFeed = (feed, item) => {
  const newFeed = [...feed, item];
  if (newFeed.length > 200) {
    return newFeed.slice(-200);
  }
  return newFeed;
};

const useAgentStore = create((set, get) => ({
  ...initialState,

  setRepoUrl: (url) => set({ repoUrl: url }),

  setSelectedPaths: (paths) => set({ selectedPaths: paths }),

  startAnalysis: () => set({
    isAnalyzing: true,
    bugs: [],
    documentation: '',
    documentationMeta: {},
    refactors: [],
    compilationResult: null,
    securitySummary: null,
    architectureResult: null,
    finalResults: null,
    plan: null,
    activityFeed: [],
    agentMessages: [],
    error: null,
    pipelinePhase: 'fetching',
    agents: {
      coordinator: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
      security: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
      writer: { status: 'idle', currentAction: '', findings: 0, iterations: 0 },
      architecture: { status: 'idle', currentAction: '', findings: 0, iterations: 0 }
    }
  }),

  handleSSEEvent: (eventName, data) => {
    const state = get();

    switch (eventName) {
      case 'pipeline_start': {
        const activityItem = createActivityItem('system', data.message);
        set({
          pipelineMessage: data.message,
          activityFeed: addToActivityFeed(state.activityFeed, activityItem)
        });
        break;
      }

      case 'repo_ready': {
        const message = `Repository loaded: ${data.summary?.repo || 'unknown'} (${data.filesCount || 0} files)`;
        const activityItem = createActivityItem('system', message);
        set({
          repoSummary: data.summary,
          pipelinePhase: 'planning',
          activityFeed: addToActivityFeed(state.activityFeed, activityItem)
        });
        break;
      }

      case 'session_created': {
        set({ sessionId: data.sessionId });
        break;
      }

      case 'agent_status': {
        const { agentName, status, currentAction } = data;
        const newAgents = { ...state.agents };
        
        if (newAgents[agentName]) {
          newAgents[agentName] = {
            ...newAgents[agentName],
            status,
            currentAction: currentAction || ''
          };
        }

        const updates = { agents: newAgents };
        
        if (status === 'acting' || status === 'thinking') {
          updates.pipelinePhase = 'analyzing';
        }

        const activityItem = createActivityItem(
          'agent_status',
          currentAction || status,
          agentName
        );
        updates.activityFeed = addToActivityFeed(state.activityFeed, activityItem);

        set(updates);
        break;
      }

      case 'coordinator_plan': {
        const activityItem = createActivityItem(
          'plan',
          data.plan?.planSummary || 'Plan created',
          'coordinator'
        );
        set({
          plan: data.plan,
          pipelinePhase: 'planning',
          activityFeed: addToActivityFeed(state.activityFeed, activityItem)
        });
        break;
      }

      case 'agent_finding': {
        const updates = {};
        let activityMessage = '';
        let agentName = '';

        if (data.type === 'bug') {
          updates.bugs = [...state.bugs, data.data];
          updates.agents = {
            ...state.agents,
            security: {
              ...state.agents.security,
              findings: state.agents.security.findings + 1
            }
          };
          agentName = 'security';
          activityMessage = `Found bug: ${data.data?.title || data.data?.message || 'Security issue'}`;
        } else if (data.type === 'refactor') {
          updates.refactors = [...state.refactors, data.data];
          updates.agents = {
            ...state.agents,
            architecture: {
              ...state.agents.architecture,
              findings: state.agents.architecture.findings + 1
            }
          };
          agentName = 'architecture';
          activityMessage = `Found refactor: ${data.data?.title || data.data?.suggestion || 'Refactor suggestion'}`;
        } else if (data.type === 'documentation') {
          updates.documentation = data.data;
          agentName = 'writer';
          activityMessage = 'Documentation generated';
        }

        const activityItem = createActivityItem('finding', activityMessage, agentName);
        updates.activityFeed = addToActivityFeed(state.activityFeed, activityItem);

        set(updates);
        break;
      }

      case 'agent_communication': {
        const activityItem = createActivityItem(
          'communication',
          `→ ${data.toAgent}: ${(data.content || '').substring(0, 100)}`,
          data.fromAgent,
          true
        );
        set({
          agentMessages: [...state.agentMessages, data],
          activityFeed: addToActivityFeed(state.activityFeed, activityItem)
        });
        break;
      }

      case 'session_status': {
        if (data.status === 'complete') {
          set({ pipelinePhase: 'complete' });
        } else if (data.status === 'error') {
          set({ pipelinePhase: 'error' });
        }
        break;
      }

      case 'analysis_complete': {
        const updates = {
          pipelinePhase: 'complete',
          isAnalyzing: false
        };

        if (data.compilationResult) {
          updates.compilationResult = data.compilationResult;
        }

        const activityItem = createActivityItem('system', 'Analysis complete!');
        updates.activityFeed = addToActivityFeed(state.activityFeed, activityItem);

        set(updates);
        break;
      }

      case 'final_results': {
        const activityItem = createActivityItem('system', 'Final results received');
        set({
          finalResults: data,
          bugs: data.security?.bugs || [],
          documentation: data.documentation || '',
          refactors: data.architecture?.refactors || [],
          compilationResult: data.compilation,
          securitySummary: data.security?.summary,
          architectureResult: data.architecture?.result,
          isAnalyzing: false,
          pipelinePhase: 'complete',
          activityFeed: addToActivityFeed(state.activityFeed, activityItem)
        });
        break;
      }

      case 'error':
      case 'session_error': {
        const activityItem = createActivityItem('error', data.error);
        set({
          error: data.error,
          pipelinePhase: 'error',
          isAnalyzing: false,
          activityFeed: addToActivityFeed(state.activityFeed, activityItem)
        });
        break;
      }

      default:
        break;
    }
  },

  setError: (error) => set({
    error,
    pipelinePhase: 'error',
    isAnalyzing: false
  }),

  reset: () => set({ ...initialState })
}));

export default useAgentStore;
