import Home from './pages/Home.jsx';
import Navbar from './components/ui/Navbar.jsx';
import useDemoMode from './hooks/useDemoMode.jsx';
import useAgentStore from './store/agentStore.js';

function App() {
  const { DemoModeIndicator } = useDemoMode();
  const pipelinePhase = useAgentStore((state) => state.pipelinePhase);
  const error = useAgentStore((state) => state.error);
  const setError = useAgentStore((state) => state.setError);

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e2e8f0] flex flex-col">
      {/* Top Progress Bar */}
      {pipelinePhase === 'fetching' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-[#1a1d2e]">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-progress"
            style={{
              animation: 'progress 2s ease-in-out infinite'
            }}
          />
        </div>
      )}
      
      {pipelinePhase === 'complete' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
          <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>
      )}

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 pt-16 px-6 py-6">
        <div className="max-w-screen-2xl mx-auto">
          <Home />
        </div>
      </main>

      {/* Error Banner */}
      {error && (
        <div className="fixed bottom-0 left-0 right-0 z-[200] bg-red-600 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-700 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Demo Mode Indicator */}
      <DemoModeIndicator />

      {/* Progress bar animation styles */}
      <style>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 60%;
          }
          100% {
            width: 60%;
          }
        }
      `}</style>
    </div>
  );
}

export default App;