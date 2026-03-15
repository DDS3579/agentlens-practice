
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAgentStore from "../../store/agentStore.js";

export default function ActivityFeed({ activities = [] }) {
  const [clearedCount, setClearedCount] = useState(0);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const visibleFeed = activities.slice(clearedCount);

  const getAgentEmoji = (agentName) => {
    const emojis = {
      coordinator: "🧠",
      security: "🛡️",
      writer: "📝",
      architecture: "🏗️",
      all: "📢",
    };
    return emojis[agentName] || "🤖";
  };

  const getAgentDisplayName = (agentName) => {
    const names = {
      coordinator: "Coordinator",
      security: "Security",
      writer: "Writer",
      architecture: "Architecture",
      all: "All Agents",
    };
    return names[agentName] || agentName;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleClear = () => {
    setClearedCount(activities.length);
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activities.length]);

  const renderItem = (item) => {
    const { id, timestamp, type, agentName, agent, message, isHighlighted } = item;
    const resolvedAgent = agentName || agent || "system";

    if (type === "communication" || isHighlighted) {
      const parts = message.match(/→ (\w+): (.+)/);
      const toAgent = parts ? parts[1] : "";
      const content = parts ? parts[2] : message;

      return (
        <motion.div
          key={id}
          initial={{ opacity: 0, x: -16, height: 0 }}
          animate={{
            opacity: 1,
            x: 0,
            height: 'auto',
            borderColor: ['rgba(139,92,246,0.8)', 'rgba(139,92,246,0.2)'],
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div
            className="bg-[#1e1b4b] border-l-[3px] border-l-[#6366f1] rounded-md p-3 my-2 relative"
          >
            <div className="absolute top-2 right-2">
              <span className="text-[10px] bg-[#312e81] text-indigo-300 px-2 py-0.5 rounded-full">
                💬 Agent Message
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-indigo-400 font-medium flex items-center gap-1">
                {getAgentEmoji(resolvedAgent)}
                <span>{getAgentDisplayName(resolvedAgent)}</span>
              </span>
              <span className="text-indigo-300">→</span>
              <span className="text-indigo-400 font-medium flex items-center gap-1">
                {getAgentEmoji(toAgent.toLowerCase())}
                <span>{getAgentDisplayName(toAgent.toLowerCase())}</span>
              </span>
            </div>
            <p className="text-gray-100 text-sm pr-20">{content}</p>
            <span className="text-[10px] text-gray-500 mt-2 block">
              {formatTimestamp(timestamp)}
            </span>
          </div>
        </motion.div>
      );
    }

    if (type === "finding" || type === "result") {
      const isBug = message.toLowerCase().includes("bug") || message.toLowerCase().includes("issue");
      return (
        <motion.div
          key={id}
          initial={{ opacity: 0, x: -16, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div
            className={`${isBug ? "bg-[#0f2419] border-l-[#16a34a]" : "bg-[#0f1a2e] border-l-[#2563eb]"} 
                        border-l-[3px] rounded-md px-3 py-2 my-1`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatTimestamp(timestamp)}
              </span>
              <span>{getAgentEmoji(resolvedAgent)}</span>
              <span
                className={`text-sm ${isBug ? "text-green-300" : "text-blue-300"}`}
              >
                Found: {message}
              </span>
            </div>
          </div>
        </motion.div>
      );
    }

    if (type === "plan") {
      return (
        <motion.div
          key={id}
          initial={{ opacity: 0, x: -16, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div
            className="bg-[#1e1040] border-l-[3px] border-l-[#9333ea] rounded-md px-3 py-2 my-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">
                {formatTimestamp(timestamp)}
              </span>
              <span>{getAgentEmoji("coordinator")}</span>
              <span className="text-purple-300 font-medium">Plan Created</span>
            </div>
            <p className="text-sm text-gray-200 ml-6">{message}</p>
          </div>
        </motion.div>
      );
    }

    if (type === "agent_status" || type === "agent_start" || type === "progress" || type === "agent_complete" || type === "stream") {
      return (
        <motion.div
          key={id}
          initial={{ opacity: 0, x: -16, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div
            className="flex items-center gap-2 py-1 px-2 text-[#64748b]"
          >
            <span className="text-xs">{formatTimestamp(timestamp)}</span>
            <span>{getAgentEmoji(resolvedAgent)}</span>
            <span className="text-sm">{message}</span>
          </div>
        </motion.div>
      );
    }

    if (type === "system" || type === "info") {
      return (
        <motion.div
          key={id}
          initial={{ opacity: 0, x: -16, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div
            className="flex items-center gap-2 py-1 px-2 text-slate-500"
          >
            <span className="text-xs">{formatTimestamp(timestamp)}</span>
            <span>⚙</span>
            <span className="text-sm">{message}</span>
          </div>
        </motion.div>
      );
    }

    if (type === "error") {
      return (
        <motion.div
          key={id}
          initial={{ opacity: 0, x: -16, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div
            className="bg-red-900/30 border-l-[3px] border-l-red-500 rounded-md px-3 py-2 my-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatTimestamp(timestamp)}
              </span>
              <span>❌</span>
              <span className="text-sm text-red-300">{message}</span>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={id}
        initial={{ opacity: 0, x: -16, height: 0 }}
        animate={{ opacity: 1, x: 0, height: 'auto' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2 py-1 px-2 text-gray-500">
          <span className="text-xs">{formatTimestamp(timestamp)}</span>
          <span className="text-sm">{message}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">📡 Live Activity</h3>
          <span className="text-xs bg-[#2d3748] text-gray-300 px-2 py-0.5 rounded-full">
            {visibleFeed.length} events
          </span>
        </div>
        {visibleFeed.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-[#2d3748]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Feed List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin"
      >
        {visibleFeed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <span className="text-3xl mb-3">🔌</span>
            <p className="text-gray-400 font-medium">
              Waiting for analysis to start...
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Events will appear here in real-time
            </p>
          </motion.div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {visibleFeed.map(renderItem)}
            </AnimatePresence>
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
