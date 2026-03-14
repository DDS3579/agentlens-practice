import { useState } from 'react';
import useAgentStore from '../../store/agentStore.js';
import useAgentStream from '../../hooks/useAgentStream.js';

export default function GithubInput({ onAnalysisStart }) {
  const { isAnalyzing, pipelinePhase, pipelineMessage, setRepoUrl } = useAgentStore();
  const { startAnalysis, cancelAnalysis } = useAgentStream();

  const [url, setUrl] = useState('');
  const [selectedPathsText, setSelectedPathsText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urlError, setUrlError] = useState('');

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setRepoUrl(newUrl);
    setUrlError('');
  };

  const validateUrl = (urlToValidate) => {
    if (!urlToValidate.trim()) {
      return 'Please enter a GitHub repository URL';
    }
    if (!urlToValidate.includes('github.com')) {
      return 'Please enter a valid GitHub URL';
    }
    return '';
  };

  const handleAnalyzeClick = () => {
    if (isAnalyzing) {
      cancelAnalysis();
      return;
    }

    const error = validateUrl(url);
    if (error) {
      setUrlError(error);
      return;
    }

    const selectedPaths = selectedPathsText
      .split('\n')
      .map((path) => path.trim())
      .filter((path) => path.length > 0);

    if (onAnalysisStart) {
      onAnalysisStart(() => startAnalysis(url, selectedPaths));
    } else {
      startAnalysis(url, selectedPaths);
    }
  };

  const handleExampleClick = (exampleUrl) => {
    setUrl(exampleUrl);
    setRepoUrl(exampleUrl);
    setUrlError('');
  };

  const getProgressWidth = () => {
    switch (pipelinePhase) {
      case 'fetching':
        return '15%';
      case 'planning':
        return '35%';
      case 'analyzing':
        return '70%';
      case 'complete':
        return '100%';
      case 'error':
        return '100%';
      default:
        return '0%';
    }
  };

  const getProgressColor = () => {
    switch (pipelinePhase) {
      case 'error':
        return 'bg-red-500';
      case 'complete':
        return 'bg-green-500';
      default:
        return 'bg-indigo-500';
    }
  };

  const showStatus = isAnalyzing || pipelinePhase !== 'idle';
  const showExamples = !isAnalyzing && pipelinePhase === 'idle' && !url.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Analyze Repository</h2>
        <p className="text-sm text-gray-400">
          Enter a GitHub repository URL to begin multi-agent analysis
        </p>
      </div>

      {/* URL Input */}
      <div>
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://github.com/owner/repository"
          className="w-full bg-[#0f1117] border border-[#2d3748] text-white rounded-lg px-4 py-3 
                     focus:outline-none focus:border-[#6366f1] transition-colors
                     placeholder-gray-500"
          disabled={isAnalyzing}
        />
        {urlError && (
          <p className="mt-2 text-sm text-red-400">{urlError}</p>
        )}
      </div>

      {/* Advanced Section */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-2"
          disabled={isAnalyzing}
        >
          <span>⚙</span>
          <span>Advanced: Select specific files (optional)</span>
          <span className="text-xs">{showAdvanced ? '▼' : '▶'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-2">
            <textarea
              value={selectedPathsText}
              onChange={(e) => setSelectedPathsText(e.target.value)}
              placeholder="lib/app.js&#10;src/index.js&#10;(one path per line, leave empty for all files)"
              className="w-full bg-[#0f1117] border border-[#2d3748] text-white rounded-lg px-4 py-3 
                         focus:outline-none focus:border-[#6366f1] transition-colors
                         placeholder-gray-500 resize-none h-24 font-mono text-sm"
              disabled={isAnalyzing}
            />
            <p className="text-xs text-gray-500">
              Leave empty to analyze all files (recommended for first run)
            </p>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyzeClick}
        disabled={pipelinePhase === 'fetching'}
        className={`w-full py-3.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
          ${isAnalyzing
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-[#6366f1] hover:bg-[#5558e3] text-white'}
          ${pipelinePhase === 'fetching' ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        {pipelinePhase === 'fetching' && (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isAnalyzing ? '⏹ Cancel Analysis' : '🚀 Analyze Repository'}
      </button>

      {/* Status Bar */}
      {showStatus && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{pipelineMessage || `Phase: ${pipelinePhase}`}</span>
            <span className="text-gray-500 capitalize">{pipelinePhase}</span>
          </div>
          <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-500 ease-out`}
              style={{ width: getProgressWidth() }}
            />
          </div>
        </div>
      )}

      {/* Example Repos */}
      {showExamples && (
        <div className="pt-2">
          <p className="text-sm text-gray-500 mb-3">Try with an example:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'expressjs/express', url: 'https://github.com/expressjs/express' },
              { label: 'axios/axios', url: 'https://github.com/axios/axios' },
              { label: 'fastify/fastify', url: 'https://github.com/fastify/fastify' },
            ].map((example) => (
              <button
                key={example.label}
                onClick={() => handleExampleClick(example.url)}
                className="px-3 py-1.5 bg-[#1a1d2e] border border-[#2d3748] rounded-md text-sm text-gray-300
                           hover:border-[#6366f1] hover:text-white transition-colors"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
