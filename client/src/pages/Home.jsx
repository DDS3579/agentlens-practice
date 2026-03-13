import GithubInput from '../components/github/GithubInput.jsx';
import AgentCard from '../components/agents/AgentCard.jsx';
import AgentFlowGraph from '../components/agents/AgentFlowGraph.jsx';
import ActivityFeed from '../components/agents/ActivityFeed.jsx';
import useAgentStore from '../store/agentStore.js';

export default function Home() {
  const agents = useAgentStore((state) => state.agents);
  const bugs = useAgentStore((state) => state.bugs);
  const refactors = useAgentStore((state) => state.refactors);
  const pipelinePhase = useAgentStore((state) => state.pipelinePhase);
  const compilationResult = useAgentStore((state) => state.compilationResult);
  const documentationMeta = useAgentStore((state) => state.documentationMeta);
  const documentation = useAgentStore((state) => state.documentation);

  const agentNames = ['coordinator', 'security', 'writer', 'architecture'];

  const wordCount = documentationMeta?.wordCount || (documentation ? documentation.split(/\s+/).filter(Boolean).length : 0);

  return (
    <div className="space-y-6">
      {/* SECTION 1 — Top row */}
      <div className="flex gap-6">
        {/* Left column - GitHub Input */}
        <div className="flex-1 min-w-0 bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-6">
          <GithubInput />
        </div>

        {/* Right column - Agent Flow Graph */}
        <div className="flex-1 min-w-0 bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">🤖 Agent Network</h2>
              <p className="text-sm text-gray-400">Real-time collaboration</p>
            </div>
          </div>
          <AgentFlowGraph />
        </div>
      </div>

      {/* SECTION 2 — Agent Status Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Agent Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {agentNames.map((agentName) => (
            <AgentCard
              key={agentName}
              agentName={agentName}
              agent={agents[agentName]}
            />
          ))}
        </div>
      </div>

      {/* SECTION 3 — Activity Feed */}
      <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Live Agent Communication</h2>
        <ActivityFeed />
      </div>

      {/* SECTION 4 — Results placeholder */}
      {pipelinePhase === 'complete' && (
        <div className="bg-[#0a2f1f] border border-[#166534] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-400 mb-4">
            ✅ Analysis Complete — Results Dashboard coming in Step 12
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0f1117] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{bugs.length}</div>
              <div className="text-sm text-gray-400">Bugs Found</div>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{refactors.length}</div>
              <div className="text-sm text-gray-400">Refactoring Suggestions</div>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{wordCount}</div>
              <div className="text-sm text-gray-400">Documentation Words</div>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {compilationResult?.codeHealthScore ?? '—'}
              </div>
              <div className="text-sm text-gray-400">Health Score /100</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}