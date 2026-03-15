
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAgentStore from '../../store/agentStore.js';

const SecurityTab = () => {
  const { securitySummary, compilationResult } = useAgentStore();
  const bugs = securitySummary?.bugs || [];
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedBugs, setExpandedBugs] = useState(new Set());

  // Count bugs by severity
  const severityCounts = {
    critical: bugs.filter(b => b.severity === 'critical').length,
    high: bugs.filter(b => b.severity === 'high').length,
    medium: bugs.filter(b => b.severity === 'medium').length,
    low: bugs.filter(b => b.severity === 'low').length,
  };

  // Filter bugs based on active filter
  const filteredBugs = activeFilter === 'all'
    ? bugs
    : bugs.filter(b => b.severity === activeFilter);

  // Get security score
  const securityScore = compilationResult?.scoreBreakdown?.security
    || securitySummary?.overallSecurityScore
    || null;

  // Get score circle color
  const getScoreColor = (score) => {
    if (score === null) return 'border-gray-500';
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    if (score >= 40) return 'border-orange-500';
    return 'border-red-500';
  };

  // Get severity border color
  const getSeverityBorderColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#2563eb';
      default: return '#2d3748';
    }
  };

  // Humanize bug type string
  const humanizeType = (type) => {
    if (!type) return 'Unknown';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Toggle bug expansion
  const toggleBugExpanded = (bugId) => {
    setExpandedBugs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bugId)) {
        newSet.delete(bugId);
      } else {
        newSet.add(bugId);
      }
      return newSet;
    });
  };

  // Get top priority actions
  const topPriorityActions = compilationResult?.topPriorityActions?.slice(0, 2) || [];

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Stat boxes */}
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg px-4 py-3 min-w-[100px]">
            <div className="text-2xl font-bold text-white">{bugs.length}</div>
            <div className="text-sm text-gray-400">Total Issues</div>
          </div>
          <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg px-4 py-3 min-w-[100px]">
            <div className="text-2xl font-bold text-red-500">{severityCounts.critical}</div>
            <div className="text-sm text-gray-400">Critical</div>
          </div>
          <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg px-4 py-3 min-w-[100px]">
            <div className="text-2xl font-bold text-orange-500">{severityCounts.high}</div>
            <div className="text-sm text-gray-400">High</div>
          </div>
          <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg px-4 py-3 min-w-[100px]">
            <div className="text-2xl font-bold text-yellow-500">{severityCounts.medium + severityCounts.low}</div>
            <div className="text-sm text-gray-400">Medium + Low</div>
          </div>
        </div>

        {/* Code Health Score Circle */}
        <div className="flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full border-4 ${getScoreColor(securityScore)} flex flex-col items-center justify-center bg-[#1a1d2e]`}>
            <span className="text-2xl font-bold text-white">
              {securityScore !== null ? securityScore : '?'}
            </span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
          <span className="text-sm text-gray-400 mt-1">Security Score</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1a1d2e] text-gray-300 hover:bg-[#252a3e] border border-[#2d3748]'
            }`}
        >
          All ({bugs.length})
        </button>
        <button
          onClick={() => setActiveFilter('critical')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'critical'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1a1d2e] text-gray-300 hover:bg-[#252a3e] border border-[#2d3748]'
            }`}
        >
          Critical ({severityCounts.critical})
        </button>
        <button
          onClick={() => setActiveFilter('high')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'high'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1a1d2e] text-gray-300 hover:bg-[#252a3e] border border-[#2d3748]'
            }`}
        >
          High ({severityCounts.high})
        </button>
        <button
          onClick={() => setActiveFilter('medium')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'medium'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1a1d2e] text-gray-300 hover:bg-[#252a3e] border border-[#2d3748]'
            }`}
        >
          Medium ({severityCounts.medium})
        </button>
        <button
          onClick={() => setActiveFilter('low')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'low'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1a1d2e] text-gray-300 hover:bg-[#252a3e] border border-[#2d3748]'
            }`}
        >
          Low ({severityCounts.low})
        </button>
      </div>

      {/* Top Priority Actions */}
      {topPriorityActions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>⚡</span> Top Priority Actions
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {topPriorityActions.map((action, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-4"
              >
                <div className="text-white font-medium">{action.title || action}</div>
                {action.description && (
                  <div className="text-gray-400 text-sm mt-1">{action.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bug List or Empty State */}
      {bugs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No security issues found</h3>
          <p className="text-gray-400 max-w-md">
            The Security Specialist Agent analyzed all files and found no vulnerabilities.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredBugs.map((bug, index) => {
              const bugId = bug.id || `bug-${index}`;
              const isExpanded = expandedBugs.has(bugId);

              return (
                <motion.div
                  key={bugId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    backgroundColor: ['rgba(139,92,246,0.2)', 'rgba(0,0,0,0)']
                  }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  layout
                >
                  <div
                    className="bg-[#1a1d2e] border border-[#2d3748] rounded-lg overflow-hidden hover:border-[#3d4758] transition-colors"
                    style={{ borderLeftWidth: '4px', borderLeftColor: getSeverityBorderColor(bug.severity) }}
                  >
                    <div className="p-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`severity-${bug.severity} px-2 py-0.5 rounded text-xs font-medium uppercase`}>
                            {bug.severity}
                          </span>
                          <span className="bg-[#252a3e] text-gray-300 px-2 py-0.5 rounded text-xs font-medium">
                            {humanizeType(bug.type)}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {bug.file && (
                            <span className="font-mono text-sm text-gray-400">
                              {bug.file}
                              {bug.line && <span className="text-gray-500">:{bug.line}</span>}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-white font-semibold mb-2">{bug.title}</h4>

                      {/* Description */}
                      <p className={`text-gray-400 text-sm ${!isExpanded ? 'line-clamp-2' : ''}`}>
                        {bug.description}
                      </p>

                      {/* Expand/Collapse button */}
                      <button
                        onClick={() => toggleBugExpanded(bugId)}
                        className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                      >
                        {isExpanded ? 'Hide Fix' : 'Show Fix'}
                      </button>

                      {/* Expanded section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="mt-4 space-y-4">
                              {/* Vulnerable Code */}
                              {bug.code && (
                                <div>
                                  <h5 className="text-sm font-medium text-gray-300 mb-2">Vulnerable Code</h5>
                                  <pre className="bg-[#0f1117] rounded-lg p-4 overflow-x-auto">
                                    <code className="font-mono text-sm text-red-400">{bug.code}</code>
                                  </pre>
                                </div>
                              )}

                              {/* Suggested Fix */}
                              {bug.suggestedFix && (
                                <div>
                                  <h5 className="text-sm font-medium text-gray-300 mb-2">Suggested Fix</h5>
                                  <p className="text-gray-400 text-sm">{bug.suggestedFix}</p>
                                </div>
                              )}

                              {/* Fixed Code */}
                              {bug.fixedCode && (
                                <div>
                                  <h5 className="text-sm font-medium text-gray-300 mb-2">Fixed Code</h5>
                                  <pre className="bg-[#0f1117] rounded-lg p-4 overflow-x-auto">
                                    <code className="font-mono text-sm text-green-400">{bug.fixedCode}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SecurityTab;
