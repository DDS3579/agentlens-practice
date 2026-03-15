// client/src/components/agents/AgentFlowGraph.jsx
import { useMemo } from 'react';
import useAgentStore from '../../store/agentStore.js';
import { 
  Brain, 
  Shield, 
  FileText, 
  GitBranch, 
  Wrench, 
  Sparkles,
  FileOutput,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

// ============================================
// Status Colors and Styling
// ============================================
const getStatusStyles = (status) => {
  switch (status) {
    case 'idle':
      return {
        bg: 'bg-gray-800',
        border: 'border-gray-700',
        text: 'text-gray-400',
        ring: '',
      };
    case 'running':
      return {
        bg: 'bg-blue-900/30',
        border: 'border-blue-500',
        text: 'text-blue-400',
        ring: 'ring-2 ring-blue-500/50 animate-pulse',
      };
    case 'complete':
      return {
        bg: 'bg-green-900/30',
        border: 'border-green-500',
        text: 'text-green-400',
        ring: '',
      };
    case 'error':
      return {
        bg: 'bg-red-900/30',
        border: 'border-red-500',
        text: 'text-red-400',
        ring: '',
      };
    default:
      return {
        bg: 'bg-gray-800',
        border: 'border-gray-700',
        text: 'text-gray-400',
        ring: '',
      };
  }
};

// ============================================
// Agent Card Component
// ============================================
function AgentCard({ name, icon: Icon, status, message, duration }) {
  const styles = getStatusStyles(status);

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-300
        ${styles.bg} ${styles.border} ${styles.ring}
      `}
    >
      {/* Status indicator dot */}
      {status === 'running' && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${styles.bg}`}>
          <Icon className={`w-5 h-5 ${styles.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm">{name}</h4>
          <p className={`text-xs ${styles.text} truncate`}>
            {status === 'running' && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
            {status === 'complete' && <CheckCircle className="w-3 h-3 inline mr-1" />}
            {status === 'error' && <XCircle className="w-3 h-3 inline mr-1" />}
            {message || status}
          </p>
        </div>
      </div>

      {duration && status === 'complete' && (
        <p className="text-[10px] text-gray-500 mt-1">
          Completed in {(duration / 1000).toFixed(1)}s
        </p>
      )}
    </div>
  );
}

// ============================================
// SVG Connector Between Phases
// ============================================
function PhaseConnector() {
  return (
    <div className="flex justify-center py-2">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 4 L12 20"
          stroke="var(--color-border-secondary, #374151)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 2"
        />
        <path
          d="M8 16 L12 20 L16 16"
          stroke="var(--color-border-secondary, #374151)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// ============================================
// Phase Label Component
// ============================================
function PhaseLabel({ label, isActive, isComplete }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <div 
        className={`
          h-px flex-1 max-w-[60px]
          ${isComplete ? 'bg-green-500/50' : isActive ? 'bg-blue-500/50' : 'bg-gray-700'}
        `} 
      />
      <span 
        className={`
          text-xs font-medium px-2 py-0.5 rounded
          ${isComplete ? 'text-green-400 bg-green-500/10' : 
            isActive ? 'text-blue-400 bg-blue-500/10' : 
            'text-gray-500 bg-gray-800'}
        `}
      >
        {label}
      </span>
      <div 
        className={`
          h-px flex-1 max-w-[60px]
          ${isComplete ? 'bg-green-500/50' : isActive ? 'bg-blue-500/50' : 'bg-gray-700'}
        `} 
      />
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export default function AgentFlowGraph() {
  const agents = useAgentStore((state) => state.agents);
  const currentPhase = useAgentStore((state) => state.currentPhase);
  const compilationResult = useAgentStore((state) => state.compilationResult);

  // Determine phase states
  const phaseStates = useMemo(() => ({
    coordinator: {
      isActive: currentPhase === 'coordinator',
      isComplete: agents.coordinator?.status === 'complete',
    },
    analysis: {
      isActive: currentPhase === 'analysis' || 
        ['architecture', 'security', 'docs'].some(a => agents[a]?.status === 'running'),
      isComplete: ['architecture', 'security', 'docs'].every(a => 
        agents[a]?.status === 'complete' || agents[a]?.status === 'error'
      ) && currentPhase !== 'coordinator',
    },
    fix: {
      isActive: currentPhase === 'fix' || 
        ['fix', 'custom'].some(a => agents[a]?.status === 'running'),
      isComplete: agents.fix?.status === 'complete' || agents.fix?.status === 'error',
    },
    report: {
      isActive: currentPhase === 'complete',
      isComplete: !!compilationResult,
    },
  }), [agents, currentPhase, compilationResult]);

  // Check if custom agent should be shown
  const showCustomAgent = agents.custom?.status !== 'idle';

  return (
    <div className="w-full p-6 bg-[#0f1117] rounded-lg">
      {/* ============================================
          PHASE 1: Coordinator (Single Node, Full Width)
          ============================================ */}
      <PhaseLabel 
        label="Phase 1: Planning" 
        isActive={phaseStates.coordinator.isActive}
        isComplete={phaseStates.coordinator.isComplete}
      />
      <div className="max-w-md mx-auto">
        <AgentCard
          name="Coordinator"
          icon={Brain}
          status={agents.coordinator?.status || 'idle'}
          message={agents.coordinator?.currentAction || agents.coordinator?.message}
          duration={agents.coordinator?.duration}
        />
      </div>

      <PhaseConnector />

      {/* ============================================
          PHASE 2: Parallel Analysis (3 Nodes Side by Side)
          ============================================ */}
      <PhaseLabel 
        label="Phase 2: Analysis — parallel" 
        isActive={phaseStates.analysis.isActive}
        isComplete={phaseStates.analysis.isComplete}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <AgentCard
          name="Architecture"
          icon={GitBranch}
          status={agents.architecture?.status || 'idle'}
          message={agents.architecture?.currentAction || agents.architecture?.message}
          duration={agents.architecture?.duration}
        />
        <AgentCard
          name="Security"
          icon={Shield}
          status={agents.security?.status || 'idle'}
          message={agents.security?.currentAction || agents.security?.message}
          duration={agents.security?.duration}
        />
        <AgentCard
          name="Documentation"
          icon={FileText}
          status={agents.docs?.status || 'idle'}
          message={agents.docs?.currentAction || agents.docs?.message}
          duration={agents.docs?.duration}
        />
      </div>

      <PhaseConnector />

      {/* ============================================
          PHASE 3: Fix + Custom (Parallel)
          ============================================ */}
      <PhaseLabel 
        label={showCustomAgent ? "Phase 3: Fix & Custom — parallel" : "Phase 3: Fix"} 
        isActive={phaseStates.fix.isActive}
        isComplete={phaseStates.fix.isComplete}
      />
      <div className={`grid gap-3 ${showCustomAgent ? 'grid-cols-1 md:grid-cols-2' : 'max-w-md mx-auto'}`}>
        <AgentCard
          name="Fix Agent"
          icon={Wrench}
          status={agents.fix?.status || 'idle'}
          message={agents.fix?.currentAction || agents.fix?.message}
          duration={agents.fix?.duration}
        />
        {showCustomAgent && (
          <AgentCard
            name="Custom Agent"
            icon={Sparkles}
            status={agents.custom?.status || 'idle'}
            message={agents.custom?.currentAction || agents.custom?.message}
            duration={agents.custom?.duration}
          />
        )}
      </div>

      <PhaseConnector />

      {/* ============================================
          PHASE 4: Final Report
          ============================================ */}
      <PhaseLabel 
        label="Final Report" 
        isActive={phaseStates.report.isActive}
        isComplete={phaseStates.report.isComplete}
      />
      <div className="max-w-md mx-auto">
        <div
          className={`
            p-4 rounded-lg border-2 text-center transition-all duration-300
            ${phaseStates.report.isComplete 
              ? 'bg-green-900/30 border-green-500' 
              : phaseStates.report.isActive 
                ? 'bg-blue-900/30 border-blue-500 animate-pulse'
                : 'bg-gray-800 border-gray-700'}
          `}
        >
          <FileOutput 
            className={`w-8 h-8 mx-auto mb-2 ${
              phaseStates.report.isComplete ? 'text-green-400' : 
              phaseStates.report.isActive ? 'text-blue-400' : 
              'text-gray-500'
            }`} 
          />
          <h4 className="text-white font-medium">Final Report</h4>
          {compilationResult?.codeHealthScore !== undefined && (
            <p className="text-sm text-green-400 mt-1">
              Health Score: {compilationResult.codeHealthScore}/100
            </p>
          )}
          {!phaseStates.report.isComplete && !phaseStates.report.isActive && (
            <p className="text-xs text-gray-500 mt-1">Waiting for analysis...</p>
          )}
        </div>
      </div>

      {/* ============================================
          Legend
          ============================================ */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-500">Idle</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-gray-500">Running</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-500">Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-500">Error</span>
        </div>
      </div>
    </div>
  );
}