import Home from './pages/Home.jsx';
import useAgentStore from './store/agentStore.js';

function App() {
  const pipelinePhase = useAgentStore((state) => state.pipelinePhase);

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
        <div className="flex items-center gap-3">
          <span className={getStatusPillClasses()}>
            {pipelinePhase.charAt(0).toUpperCase() + pipelinePhase.slice(1)}
          </span>
          {pipelinePhase === 'complete' && (
            <span className="text-green-400 text-sm font-medium">✅ Complete</span>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-[1400px] mx-auto">
          <Home />
        </div>
      </main>
    </div>
  );
}

export default App;