import { useState } from 'react';
import useAgentStore from '../../store/agentStore.js';

const ArchitectureTab = () => {
  const { refactors, bugs, architectureResult, compilationResult } = useAgentStore();
  const [impactFilter, setImpactFilter] = useState('all');
  const [sortBy, setSortBy] = useState('impact');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedRefactors, setExpandedRefactors] = useState(new Set());
  const [showPatternAnalysis, setShowPatternAnalysis] = useState(false);

  // Get score circle color
  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'border-gray-500';
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    if (score >= 40) return 'border-orange-500';
    return 'border-red-500';
  };

  // Get impact badge color
  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get category badge color
  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'security': return 'bg-red-500/20 text-red-400';
      case 'maintainability': return 'bg-purple-500/20 text-purple-400';
      case 'performance': return 'bg-green-500/20 text-green-400';
      case 'error-handling': return 'bg-orange-500/20 text-orange-400';
      case 'patterns': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Get unique categories
  const categories = [...new Set(refactors.map(r => r.category).filter(Boolean))];

  // Filter and sort refactors
  const filteredRefactors = refactors
    .filter(r => impactFilter === 'all' || r.impact?.toLowerCase() === impactFilter)
    .filter(r => categoryFilter === 'all' || r.category?.toLowerCase() === categoryFilter.toLowerCase())
    .sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          const impactOrder = { high: 0, medium: 1, low: 2 };
          return (impactOrder[a.impact?.toLowerCase()] || 3) - (impactOrder[b.impact?.toLowerCase()] || 3);
        case 'effort':
          const getHours = (effort) => {
            if (!effort) return 999;
            const match = effort.match(/(\d+)/);
            return match ? parseInt(match[1]) : 999;
          };
          return getHours(a.effort) - getHours(b.effort);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });

  // Toggle refactor expansion
  const toggleRefactorExpanded = (refactorId) => {
    setExpandedRefactors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(refactorId)) {
        newSet.delete(refactorId);
      } else {
        newSet.add(refactorId);
      }
      return newSet;
    });
  };

  // Find bug by ID
  const findBugById = (bugId) => bugs.find(b => b.id === bugId);

  // Count quick wins
  const quickWinsCount = architectureResult?.quickWins?.length || 
    refactors.filter(r => {
      if (!r.effort) return false;
      const match = r.effort.match(/(\d+)/);
      if (!match) return false;
      const hours = parseInt(match[1]);
      return r.effort.includes('hour') && hours < 1 || r.effort.includes('min');
    }).length;

  const architectureScore = architectureResult?.architectureScore;

  if (refactors.length === 0 && !compilationResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🏗️</div>
        <h3 className="text-xl font-semibold text-white mb-2">Architecture review not yet complete</h3>
        <p className="text-gray-400">Run an analysis to get architecture suggestions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary Section */}
      {compilationResult && (
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Code Health Score */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-24 h-24 rounded-full border-4 ${getScoreColor(compilationResult.codeHealthScore)} flex flex-col items-center justify-center bg-[#1a1d2e]`}>
                <span className="text-3xl font-bold text-white">
                  {compilationResult.codeHealthScore ?? '?'}
                </span>
                <span className="text-xs text-gray-400">/100</span>
              </div>
              <span className="text-sm text-gray-400 mt-2">Overall Code Health</span>
            </div>

            {/* Summary Content */}
            <div className="flex-1">
              {compilationResult.executiveSummary && (
                <p className="text-gray-300 mb-4">{compilationResult.executiveSummary}</p>
              )}
              {compilationResult.finalVerdict && (
                <p className="text-lg text-white italic font-medium mb-4">
                  "{compilationResult.finalVerdict}"
                </p>
              )}
              
              {/* Cross-cutting Concerns */}
              {compilationResult.crossCuttingConcerns && compilationResult.crossCuttingConcerns.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>🔗</span> Cross-cutting concerns identified across all agents:
                  </h4>
                  <ul className="space-y-1">
                    {compilationResult.crossCuttingConcerns.map((concern, index) => (
                      <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Architecture Score */}
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full border-4 ${getScoreColor(architectureScore)} flex flex-col items-center justify-center bg-[#1a1d2e]`}>
              <span className="text-2xl font-bold text-white">
                {architectureScore ?? '?'}
              </span>
              <span className="text-xs text-gray-400">/100</span>
            </div>
            <span className="text-sm text-gray-400 mt-1">Architecture Score</span>
          </div>

          {/* Stat boxes */}
          <div className="flex gap-3 flex-wrap flex-1">
            <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg px-4 py-3 min-w-[120px]">
              <div className="text-2xl font-bold text-white">{refactors.length}</div>
              <div className="text-sm text-gray-400">Total Suggestions</div>
            </div>
            <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg px-4 py-3 min-w-[120px]">
              <div className="text-2xl font-bold text-green-400">{quickWinsCount}</div>
              <div className="text-sm text-gray-400">Quick Wins</div>
            </div>
          </div>
        </div>

        {/* Overall Assessment */}
        {architectureResult?.overallAssessment && (
          <p className="text-gray-400 italic">{architectureResult.overallAssessment}</p>
        )}

        {/* Biggest Risk Callout */}
        {architectureResult?.biggestRisk && (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <p className="text-orange-300 flex items-start gap-2">
              <span>⚠️</span>
              <span><strong>Biggest Risk:</strong> {architectureResult.biggestRisk}</span>
            </p>
          </div>
        )}
      </div>

      {/* Filter/Sort Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Impact Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Impact:</span>
            <div className="flex gap-1">
              {['all', 'high', 'medium', 'low'].map((impact) => (
                <button
                  key={impact}
                  onClick={() => setImpactFilter(impact)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    impactFilter === impact
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#1a1d2e] text-gray-300 hover:bg-[#252a3e] border border-[#2d3748]'
                  }`}
                >
                  {impact.charAt(0).toUpperCase() + impact.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#1a1d2e] border border-[#2d3748] text-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="impact">Impact</option>
              <option value="effort">Effort</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1a1d2e] text-gray-400 hover:bg-[#252a3e] border border-[#2d3748]'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter.toLowerCase() === category.toLowerCase()
                    ? 'bg-indigo-600 text-white'
                    : `${getCategoryColor(category)} hover:opacity-80`
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredRefactors.map((refactor, index) => {
          const refactorId = refactor.id || `refactor-${index}`;
          const isExpanded = expandedRefactors.has(refactorId);
          const preventedBugs = (refactor.preventsBugIds || [])
            .map(findBugById)
            .filter(Boolean);

          return (
            <div
              key={refactorId}
              className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg overflow-hidden hover:border-[#3d4758] transition-colors"
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase border ${getImpactColor(refactor.impact)}`}>
                      {refactor.impact || 'Unknown'}
                    </span>
                    {refactor.category && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(refactor.category)}`}>
                        {refactor.category}
                      </span>
                    )}
                  </div>
                  {refactor.effort && (
                    <span className="bg-[#252a3e] text-gray-400 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                      <span>⏱</span> {refactor.effort}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-white font-semibold mb-2">{refactor.title}</h4>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-3">{refactor.description}</p>

                {/* Affected Files */}
                {refactor.affectedFiles && refactor.affectedFiles.length > 0 && (
                  <div className="text-xs text-gray-500 mb-3 font-mono">
                    <span className="mr-1">📁</span>
                    Affects: {refactor.affectedFiles.join(', ')}
                  </div>
                )}

                {/* Prevents Bugs Section - KEY FEATURE */}
                {preventedBugs.length > 0 && (
                  <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 mb-3">
                    <h5 className="text-sm font-medium text-indigo-300 mb-2 flex items-center gap-2">
                      <span>🛡️</span> Prevents these bugs:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {preventedBugs.map((bug, bugIndex) => (
                        <div
                          key={bug.id || bugIndex}
                          className="bg-indigo-600/20 border border-indigo-500/40 rounded px-2 py-1 flex items-center gap-2"
                        >
                          <span className={`severity-${bug.severity} text-xs px-1.5 py-0.5 rounded uppercase font-medium`}>
                            {bug.severity}
                          </span>
                          <span className="text-indigo-200 text-sm">{bug.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Code Changes Button */}
                {(refactor.beforeCode || refactor.afterCode) && (
                  <button
                    onClick={() => toggleRefactorExpanded(refactorId)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                  >
                    {isExpanded ? 'Hide Code Changes' : 'View Code Changes'}
                  </button>
                )}

                {/* Expanded Code Section */}
                {isExpanded && (
                  <div className="mt-4 space-y-4">
                    {/* Before Code */}
                    {refactor.beforeCode && (
                      <div>
                        <h5 className="text-sm font-medium text-red-400 mb-2">Before</h5>
                        <pre className="bg-[#0f1117] rounded-lg p-4 overflow-x-auto border-l-2 border-red-500">
                          <code className="font-mono text-sm text-red-300">{refactor.beforeCode}</code>
                        </pre>
                      </div>
                    )}

                    {/* Arrow */}
                    {refactor.beforeCode && refactor.afterCode && (
                      <div className="flex justify-center text-gray-500">
                        <span className="text-lg">↓ Refactored to:</span>
                      </div>
                    )}

                    {/* After Code */}
                    {refactor.afterCode && (
                      <div>
                        <h5 className="text-sm font-medium text-green-400 mb-2">After</h5>
                        <pre className="bg-[#0f1117] rounded-lg p-4 overflow-x-auto border-l-2 border-green-500">
                          <code className="font-mono text-sm text-green-300">{refactor.afterCode}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pattern Analysis Section */}
      {architectureResult?.patternAnalysis && (
        <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg overflow-hidden">
          <button
            onClick={() => setShowPatternAnalysis(!showPatternAnalysis)}
            className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-[#252a3e] transition-colors"
          >
            <span className="font-medium flex items-center gap-2">
              <span>🔍</span> Design Pattern Analysis
            </span>
            <span className="text-gray-400">{showPatternAnalysis ? '▲' : '▼'}</span>
          </button>

          {showPatternAnalysis && (
            <div className="px-4 pb-4 grid md:grid-cols-3 gap-4">
              {/* Patterns Present */}
              <div>
                <h5 className="text-sm font-medium text-green-400 mb-2">Patterns Present</h5>
                <div className="flex flex-wrap gap-2">
                  {(architectureResult.patternAnalysis.present || []).map((pattern, index) => (
                    <span
                      key={index}
                      className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs"
                    >
                      {pattern}
                    </span>
                  ))}
                  {(!architectureResult.patternAnalysis.present || architectureResult.patternAnalysis.present.length === 0) && (
                    <span className="text-gray-500 text-sm">None identified</span>
                  )}
                </div>
              </div>

              {/* Patterns Missing */}
              <div>
                <h5 className="text-sm font-medium text-yellow-400 mb-2">Patterns Missing</h5>
                <div className="flex flex-wrap gap-2">
                  {(architectureResult.patternAnalysis.missing || []).map((pattern, index) => (
                    <span
                      key={index}
                      className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs"
                    >
                      {pattern}
                    </span>
                  ))}
                  {(!architectureResult.patternAnalysis.missing || architectureResult.patternAnalysis.missing.length === 0) && (
                    <span className="text-gray-500 text-sm">None identified</span>
                  )}
                </div>
              </div>

              {/* Anti-patterns Found */}
              <div>
                <h5 className="text-sm font-medium text-red-400 mb-2">Anti-patterns Found</h5>
                <div className="flex flex-wrap gap-2">
                  {(architectureResult.patternAnalysis.antiPatterns || []).map((pattern, index) => (
                    <span
                      key={index}
                      className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs"
                    >
                      {pattern}
                    </span>
                  ))}
                  {(!architectureResult.patternAnalysis.antiPatterns || architectureResult.patternAnalysis.antiPatterns.length === 0) && (
                    <span className="text-gray-500 text-sm">None identified</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchitectureTab;
