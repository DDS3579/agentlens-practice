import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgentCard({ agentName, agent, name, icon: IconComponent, status: propStatus, color }) {
  // Support both prop shapes:
  // Old: { agentName, agent: { status, currentAction, findings } }
  // New: { name, icon, status, color }
  const resolvedName = agentName || name?.toLowerCase() || 'unknown';
  const resolvedStatus = agent?.status || propStatus || 'idle';
  const currentAction = agent?.currentAction || null;
  const findings = agent?.findings || 0;

  const [showCompleteFlash, setShowCompleteFlash] = useState(false);

  // Watch for status change to 'complete' for green flash effect
  useEffect(() => {
    if (resolvedStatus === 'complete') {
      setShowCompleteFlash(true);
      const timer = setTimeout(() => {
        setShowCompleteFlash(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resolvedStatus]);

  const status = resolvedStatus;

  const agentConfig = {
    coordinator: { emoji: "🧠", displayName: "Coordinator" },
    security: { emoji: "🛡️", displayName: "Security Specialist" },
    writer: { emoji: "📝", displayName: "Technical Writer" },
    architecture: { emoji: "🏗️", displayName: "Architecture Review" },
  };

  const { emoji, displayName } = agentConfig[resolvedName] || {
    emoji: "🤖",
    displayName: name || resolvedName,
  };

  const getStatusBadge = () => {
    switch (status) {
      case "idle":
        return {
          text: "Idle",
          classes: "bg-gray-600 text-gray-200",
        };
      case "thinking":
        return {
          text: "Thinking...",
          classes: "bg-yellow-600 text-yellow-100 animate-pulse",
        };
      case "acting":
        return {
          text: "Acting",
          classes: "bg-blue-600 text-blue-100 animate-pulse",
        };
      case "complete":
        return {
          text: "Complete ✓",
          classes: "bg-green-600 text-green-100",
        };
      case "error":
        return {
          text: "Error",
          classes: "bg-red-600 text-red-100",
        };
      default:
        return {
          text: status,
          classes: "bg-gray-600 text-gray-200",
        };
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case "idle":
        return "border-[#2d3748]";
      case "thinking":
        return "border-[#854d0e]";
      case "acting":
        return "border-[#1e40af]";
      case "complete":
        return "border-[#166534]";
      case "error":
        return "border-[#991b1b]";
      default:
        return "border-[#2d3748]";
    }
  };

  const getProgressBarColor = () => {
    if (status === "thinking") return "bg-yellow-500";
    if (status === "acting") return "bg-blue-500";
    return "bg-indigo-500";
  };

  const getStatsText = () => {
    if (status !== "acting" && status !== "complete") return null;

    switch (agentName) {
      case "security":
        return `${findings} bug${findings !== 1 ? "s" : ""} found`;
      case "architecture":
        return `${findings} suggestion${findings !== 1 ? "s" : ""}`;
      case "writer":
        return status === "complete" ? "Docs generated" : "Generating...";
      case "coordinator":
        return status === "complete" ? "Plan ready" : "Planning...";
      default:
        return null;
    }
  };

  const isRunning = status === 'thinking' || status === 'acting';

  const getBoxShadow = () => {
    if (showCompleteFlash) {
      return '0 0 25px rgba(34, 197, 94, 0.6)';
    }
    if (isRunning) {
      return '0 0 20px rgba(139, 92, 246, 0.4)';
    }
    return '0 0 0px rgba(139, 92, 246, 0)';
  };

  const statusBadge = getStatusBadge();
  const statsText = getStatsText();
  const showProgressBar = status === "thinking" || status === "acting";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: getBoxShadow()
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -2 }}
      className={`bg-[#1a1d2e] border ${getBorderColor()} rounded-[10px] p-4 transition-colors duration-300 overflow-hidden`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-semibold text-white">{displayName}</span>
          {isRunning && (
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 rounded-full bg-purple-500 inline-block"
            />
          )}
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.classes}`}
        >
          {statusBadge.text}
        </span>
      </div>

      {/* Current Action */}
      <AnimatePresence mode="wait">
        {currentAction && (
          <motion.p
            key={currentAction}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-[#94a3b8] truncate mb-2"
            title={currentAction}
          >
            {currentAction}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <AnimatePresence>
        {statsText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-gray-400 mb-2"
          >
            {statsText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <AnimatePresence>
        {showProgressBar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <div className="h-1 bg-[#0f1117] rounded-full overflow-hidden">
              <motion.div
                className={`h-full w-1/3 ${getProgressBarColor()} rounded-full`}
                animate={{
                  x: ['-100%', '300%']
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'easeInOut'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}