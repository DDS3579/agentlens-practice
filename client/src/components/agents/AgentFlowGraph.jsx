import { useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useAgentStore from '../../store/agentStore.js';

const getStatusColor = (status) => {
  switch (status) {
    case 'idle':
      return { bg: 'bg-gray-600', text: 'text-gray-200', border: '#2d3748' };
    case 'thinking':
      return { bg: 'bg-yellow-600', text: 'text-yellow-100', border: '#854d0e' };
    case 'acting':
    case 'running':
      return { bg: 'bg-blue-600', text: 'text-blue-100', border: '#1e40af' };
    case 'complete':
      return { bg: 'bg-green-600', text: 'text-green-100', border: '#166534' };
    case 'error':
      return { bg: 'bg-red-600', text: 'text-red-100', border: '#991b1b' };
    default:
      return { bg: 'bg-gray-600', text: 'text-gray-200', border: '#2d3748' };
  }
};

function AgentNode({ data }) {
  const { label, emoji, status, currentAction, findings, isReport, healthScore } = data;
  const statusColors = getStatusColor(status);

  if (isReport) {
    return (
      <div
        className="bg-[#1a1d2e] rounded-lg p-3 text-center"
        style={{
          border: `2px solid ${healthScore !== undefined ? '#166534' : '#2d3748'}`,
          minWidth: '120px'
        }}
      >
        <Handle type="target" position={Position.Top} className="!bg-[#6366f1]" />
        <div className="text-2xl mb-1">📊</div>
        <div className="text-white text-sm font-medium">Final Report</div>
        {healthScore !== undefined && (
          <div className="text-green-400 text-xs mt-1">Score: {healthScore}%</div>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-[#1a1d2e] rounded-lg p-3 text-center transition-all duration-300"
      style={{
        border: `2px solid ${statusColors.border}`,
        minWidth: '140px'
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#6366f1]" />

      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-white text-sm font-medium mb-2">{label}</div>

      <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors.bg} ${statusColors.text} ${status === 'thinking' || status === 'acting' || status === 'running' ? 'animate-pulse' : ''}`}>
        {status === 'thinking' ? 'Thinking...' : status === 'acting' || status === 'running' ? 'Running...' : status === 'complete' ? 'Complete ✓' : status === 'error' ? 'Error' : 'Idle'}
      </div>

      {currentAction && (
        <div className="text-[10px] text-gray-400 mt-2 truncate max-w-[130px]" title={currentAction}>
          {currentAction}
        </div>
      )}

      {findings > 0 && (
        <div className="text-[10px] text-indigo-400 mt-1">
          {findings} finding{findings !== 1 ? 's' : ''}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#6366f1]" />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

const staticPositions = {
  coordinator: { x: 250, y: 0 },
  security: { x: 0, y: 180 },
  writer: { x: 250, y: 180 },
  architecture: { x: 500, y: 180 },
  report: { x: 250, y: 360 }
};

const agentConfig = {
  coordinator: { emoji: '🧠', label: 'Coordinator' },
  security: { emoji: '🛡️', label: 'Security' },
  writer: { emoji: '📝', label: 'Writer' },
  architecture: { emoji: '🏗️', label: 'Architecture' }
};

export default function AgentFlowGraph() {
  const agents = useAgentStore((state) => state.agents);
  const compilationResult = useAgentStore((state) => state.compilationResult);

  const nodes = useMemo(() => {
    const agentNodes = Object.entries(agents).map(([agentName, agent]) => ({
      id: agentName,
      type: 'agentNode',
      position: staticPositions[agentName],
      data: {
        label: agentConfig[agentName]?.label || agentName,
        emoji: agentConfig[agentName]?.emoji || '🤖',
        status: agent.status,
        currentAction: agent.currentAction || agent.message || '',
        findings: agent.findings || 0
      }
    }));

    const reportNode = {
      id: 'report',
      type: 'agentNode',
      position: staticPositions.report,
      data: {
        isReport: true,
        healthScore: compilationResult?.codeHealthScore
      }
    };

    return [...agentNodes, reportNode];
  }, [agents, compilationResult]);

  const edges = useMemo(() => {
    const getEdgeStyle = (sourceAgentId) => {
      const agent = agents[sourceAgentId];
      const isActive = agent?.status === 'acting' || agent?.status === 'running' || agent?.status === 'complete';
      return {
        stroke: isActive ? '#6366f1' : '#4a5568',
        strokeWidth: isActive ? 2.5 : 1.5
      };
    };

    const isEdgeAnimated = (sourceAgentId) => {
      const agent = agents[sourceAgentId];
      return agent?.status === 'acting' || agent?.status === 'running' || agent?.status === 'complete';
    };

    return [
      {
        id: 'coordinator-security',
        source: 'coordinator',
        target: 'security',
        label: 'Phase 1',
        style: getEdgeStyle('coordinator'),
        animated: isEdgeAnimated('coordinator'),
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#0f1117' }
      },
      {
        id: 'coordinator-writer',
        source: 'coordinator',
        target: 'writer',
        label: 'Phase 2',
        style: getEdgeStyle('coordinator'),
        animated: isEdgeAnimated('coordinator'),
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#0f1117' }
      },
      {
        id: 'coordinator-architecture',
        source: 'coordinator',
        target: 'architecture',
        label: 'Phase 3',
        style: getEdgeStyle('coordinator'),
        animated: isEdgeAnimated('coordinator'),
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#0f1117' }
      },
      {
        id: 'security-report',
        source: 'security',
        target: 'report',
        style: getEdgeStyle('security'),
        animated: isEdgeAnimated('security')
      },
      {
        id: 'writer-report',
        source: 'writer',
        target: 'report',
        style: getEdgeStyle('writer'),
        animated: isEdgeAnimated('writer')
      },
      {
        id: 'architecture-report',
        source: 'architecture',
        target: 'report',
        style: getEdgeStyle('architecture'),
        animated: isEdgeAnimated('architecture')
      },
      {
        id: 'security-writer',
        source: 'security',
        target: 'writer',
        label: 'Bug Context',
        style: { stroke: '#16a34a', strokeWidth: 1.5, strokeDasharray: '5,5' },
        animated: agents.security?.status === 'complete',
        labelStyle: { fill: '#16a34a', fontSize: 9 },
        labelBgStyle: { fill: '#0f1117' }
      },
      {
        id: 'writer-architecture',
        source: 'writer',
        target: 'architecture',
        label: 'Doc Context',
        style: { stroke: '#2563eb', strokeWidth: 1.5, strokeDasharray: '5,5' },
        animated: agents.writer?.status === 'complete',
        labelStyle: { fill: '#2563eb', fontSize: 9 },
        labelBgStyle: { fill: '#0f1117' }
      }
    ];
  }, [agents]);

  return (
    <div className="w-full h-[360px] bg-[#0f1117] rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
      >
        <Background variant="dots" color="#2d3748" gap={20} size={1} />
        <Controls showInteractive={false} className="!bg-[#1a1d2e] !border-[#2d3748] !rounded-lg" />
      </ReactFlow>
    </div>
  );
}