import { useState, useRef, useEffect } from 'react';
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
  const isConnected = useAgentStore((state) => state.isConnected);

  const agentNames = ['coordinator', 'security', 'writer', 'architecture'];
  const resultsRef = useRef(null);
  const [showResults, setShowResults] = useState(false);

  const wordCount = documentationMeta?.wordCount || (documentation ? documentation.split(/\s+/).filter(Boolean).length : 0);
  const hasResults = pipelinePhase === 'complete' || bugs.length > 0 || refactors.length > 0;

  // Scroll to results when analysis completes
  useEffect(() => {
    if (pipelinePhase === 'complete') {
      setShowResults(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [pipelinePhase]);

  useEffect(() => {
    if (hasResults) setShowResults(true);
  }, [hasResults]);

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      {/* Header */}
      <header className="border-b border-[#2d3748] bg-[#0a0b0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AgentLens</h1>
              <p className="text-xs text-gray-400">Multi-Agent Code Analysis</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            AI-Powered Code Analysis
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Three specialist AI agents work together to analyze your repository:
            Security vulnerabilities, documentation generation, and architecture improvements.
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-xl p-6 hover:border-red-500/50 transition-colors">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Security Specialist</h3>
            <p className="text-gray-400 text-sm">
              Finds vulnerabilities, SQL injection, XSS, and security anti-patterns
            </p>
          </div>
          <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-xl p-6 hover:border-green-500/50 transition-colors">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="text-lg font-semibold text-white mb-2">Technical Writer</h3>
            <p className="text-gray-400 text-sm">
              Generates comprehensive documentation with known issues section
            </p>
          </div>
          <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <div className="text-3xl mb-3">🏗️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Architecture Reviewer</h3>
            <p className="text-gray-400 text-sm">
              Suggests structural improvements that prevent security issues
            </p>
          </div>
        </div>

        {/* SECTION 1 — Input & Graph */}
        <div className="flex gap-6 mb-8">
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
        <div className="mb-8">
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
        <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Live Agent Communication</h2>
          <ActivityFeed />
        </div>

        {/* SECTION 4 — Results */}
        <div 
          ref={resultsRef}
          className={`transition-all duration-500 ${
            showResults && hasResults 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8 pointer-events-none'
          }`}
        >
          {hasResults && (
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

        {/* Empty State */}
        {pipelinePhase === 'idle' && !hasResults && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Ready to Analyze
            </h3>
            <p className="text-gray-400">
              Enter a GitHub repository URL above to start the multi-agent analysis
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2d3748] mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>AgentLens — Built for the AI Multi-Agent Hackathon</p>
          <p className="mt-1">Powered by Claude AI and Multi-Agent Orchestration</p>
        </div>
      </footer>
    </div>
  );
}