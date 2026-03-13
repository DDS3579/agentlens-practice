import useAgentStore from './store/agentStore.js';
import useAgentStream from './hooks/useAgentStream.js';

function App() {
  const { 
    pipelinePhase, 
    isAnalyzing, 
    bugs, 
    refactors 
  } = useAgentStore();
  
  const { startAnalysis, cancelAnalysis } = useAgentStream();

  const getStatusPillClasses = () => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold';
    switch (pipelinePhase) {
      case 'idle':
        return `${baseClasses} bg-gray-600 text-gray-200`;
      case 'fetching':
        return `${baseClasses} bg-blue-600 text-blue-100`;
      case 'planning':
        return `${baseClasses} bg-purple-600 text-purple-100`;
      case 'analyzing':
        return `${baseClasses} bg-yellow-600 text-yellow-100`;
      case 'complete':
        return `${baseClasses} bg-green-600 text-green-100`;
      case 'error':
        return `${baseClasses} bg-red-600 text-red-100`;
      default:
        return `${baseClasses} bg-gray-600 text-gray-200`;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e2e8f0] flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#2d3748]">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">🔍 AgentLens</span>
          <span className="text-sm text-gray-400">Multi-Agent Code Analysis</span>
        </div>
        <div className={getStatusPillClasses()}>
          {pipelinePhase.charAt(0).toUpperCase() + pipelinePhase.slice(1)}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col gap-6">
        {/* Two Column Layout */}
        <div className="flex gap-6 flex-1">
          {/* Left Column - 55% */}
          <div className="w-[55%] bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-6 min-h-[400px] flex items-center justify-center">
            <p className="text-gray-400 text-lg">GitHub Input + Code Viewer — Step 11</p>
          </div>

          {/* Right Column - 45% */}
          <div className="w-[45%] bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-6 min-h-[400px] flex items-center justify-center">
            <p className="text-gray-400 text-lg">Agent Dashboard — Step 11</p>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-6 h-[200px] flex items-center justify-center">
          <p className="text-gray-400 text-lg">Results Dashboard — Step 11</p>
        </div>
      </main>

      {/* Dev Panel */}
      <div className="fixed bottom-4 right-4 bg-[#1a1d2e] border border-[#2d3748] rounded-lg p-4 z-[9999] font-mono text-xs">
        <div className="text-gray-400 mb-2 font-semibold">Dev Panel</div>
        <div className="space-y-1">
          <div>
            <span className="text-gray-500">isAnalyzing:</span>{' '}
            <span className={isAnalyzing ? 'text-green-400' : 'text-red-400'}>
              {isAnalyzing.toString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">pipelinePhase:</span>{' '}
            <span className="text-blue-400">{pipelinePhase}</span>
          </div>
          <div>
            <span className="text-gray-500">bugs:</span>{' '}
            <span className="text-yellow-400">{bugs.length}</span>
          </div>
          <div>
            <span className="text-gray-500">refactors:</span>{' '}
            <span className="text-purple-400">{refactors.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;