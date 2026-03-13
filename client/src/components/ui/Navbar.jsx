import { useState } from 'react';
import useAgentStore from '../../store/agentStore.js';
import { calculateOverallScore, scoreToGrade } from '../../lib/utils.js';

const Navbar = () => {
  const {
    isAnalyzing,
    pipelinePhase,
    pipelineMessage,
    agents,
    compilationResult,
    securitySummary,
    architectureResult
  } = useAgentStore();

  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const steps = [
    { id: 'fetching', label: 'Fetch', index: 0 },
    { id: 'planning', label: 'Plan', index: 1 },
    { id: 'analyzing', label: 'Analyze', index: 2 },
    { id: 'compiling', label: 'Compile', index: 3 },
    { id: 'complete', label: 'Complete', index: 4 }
  ];

  const getStepIndex = (phase) => {
    const stepMap = {
      'idle': -1,
      'fetching': 0,
      'planning': 1,
      'analyzing': 2,
      'compiling': 3,
      'complete': 4,
      'error': -2
    };
    return stepMap[phase] ?? -1;
  };

  const currentStepIndex = getStepIndex(pipelinePhase);
  const showPipeline = isAnalyzing || pipelinePhase !== 'idle';

  const getActiveAgentName = () => {
    const activeAgent = Object.entries(agents).find(([_, agent]) => agent.status === 'running');
    if (activeAgent) {
      const nameMap = {
        'security': 'Security Agent',
        'writer': 'Writer Agent',
        'architecture': 'Architecture Agent'
      };
      return nameMap[activeAgent[0]] || activeAgent[0];
    }
    return null;
  };

  const overallScore = calculateOverallScore(compilationResult, securitySummary, architectureResult);
  const gradeInfo = scoreToGrade(overallScore);

  const scrollToResults = () => {
    const resultsElement = document.querySelector('[data-results]');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[100] h-[60px] bg-[#0d0f1a]/90 backdrop-blur-[10px] border-b border-[#1e2235] px-6 flex items-center justify-between">
        {/* Left Side - Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">AgentLens</h1>
            <p className="text-xs text-gray-500 leading-tight">Multi-Agent Code Analysis</p>
          </div>
        </div>

        {/* Center - Pipeline Steps */}
        {showPipeline && (
          <div className="hidden md:flex items-center gap-1">
            {steps.map((step, index) => {
              const isCompleted = currentStepIndex > step.index || (pipelinePhase === 'complete' && step.index <= 4);
              const isActive = currentStepIndex === step.index;
              const isError = pipelinePhase === 'error' && currentStepIndex === -2;
              const isPending = currentStepIndex < step.index && !isCompleted;

              return (
                <div key={step.id} className="flex items-center">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive && !isError
                          ? 'bg-indigo-500 text-white ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#0d0f1a]'
                          : isActive && isError
                          ? 'bg-red-500 text-white'
                          : 'bg-transparent border-2 border-gray-600 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.index + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-1 ${
                        isCompleted
                          ? 'text-green-400'
                          : isActive
                          ? 'text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {/* Active Agent Indicator */}
                    {isActive && step.id === 'analyzing' && getActiveAgentName() && (
                      <span className="text-[9px] text-indigo-400 mt-0.5">
                        {getActiveAgentName()}
                      </span>
                    )}
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`w-6 h-0.5 mx-1 mt-[-16px] ${
                        currentStepIndex > step.index || (pipelinePhase === 'complete')
                          ? 'bg-green-500'
                          : 'bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Idle State - How it works */}
          {pipelinePhase === 'idle' && (
            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1a1d2e]"
            >
              How it works
            </button>
          )}

          {/* Analyzing State */}
          {isAnalyzing && pipelinePhase !== 'complete' && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
              <span className="animate-pulse">⚡</span>
              <span className="text-yellow-400 text-sm font-medium">Analyzing...</span>
            </div>
          )}

          {/* Complete State - Score Badge */}
          {pipelinePhase === 'complete' && (
            <button
              onClick={scrollToResults}
              className="flex items-center gap-2 bg-[#1a1d2e] border border-[#2d3748] hover:border-[#3d4758] px-3 py-1.5 rounded-lg transition-colors group"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: `${gradeInfo.color}20`, color: gradeInfo.color }}
              >
                {gradeInfo.grade}
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">{gradeInfo.label}</div>
                <div className="text-sm text-white font-medium">{overallScore}/100</div>
              </div>
              <svg
                className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {/* GitHub Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#1a1d2e]"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </nav>

      {/* How it Works Modal */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="bg-[#12141f] border border-[#2d3748] rounded-xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">How AgentLens Works</h3>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-white font-medium">Fetch Repository</h4>
                  <p className="text-gray-400 text-sm">Clone and extract code files from your GitHub repository</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-white font-medium">Plan Analysis</h4>
                  <p className="text-gray-400 text-sm">Coordinator agent creates an analysis strategy</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-white font-medium">Multi-Agent Analysis</h4>
                  <p className="text-gray-400 text-sm">
                    🛡️ Security Specialist finds vulnerabilities<br />
                    📝 Technical Writer generates documentation<br />
                    🏗️ Architecture Reviewer suggests improvements
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-white font-medium">Compile Results</h4>
                  <p className="text-gray-400 text-sm">Coordinator synthesizes findings into a unified report</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  5
                </div>
                <div>
                  <h4 className="text-white font-medium">Complete</h4>
                  <p className="text-gray-400 text-sm">View comprehensive results with actionable insights</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;