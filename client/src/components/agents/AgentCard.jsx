export default function AgentCard({ agentName, agent }) {
  // Safety check - render nothing or placeholder if agent is undefined
  if (!agent) {
    return (
      <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-[10px] p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-semibold text-gray-400">
            {agentName || "Unknown Agent"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Waiting for agent data...</p>
      </div>
    );
  }
  const { status, currentAction, findings } = agent;

  const agentConfig = {
    coordinator: { emoji: "🧠", displayName: "Coordinator" },
    security: { emoji: "🛡️", displayName: "Security Specialist" },
    writer: { emoji: "📝", displayName: "Technical Writer" },
    architecture: { emoji: "🏗️", displayName: "Architecture Review" },
  };

  const { emoji, displayName } = agentConfig[agentName] || {
    emoji: "🤖",
    displayName: agentName,
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

  const statusBadge = getStatusBadge();
  const statsText = getStatsText();
  const showProgressBar = status === "thinking" || status === "acting";

  return (
    <div
      className={`bg-[#1a1d2e] border ${getBorderColor()} rounded-[10px] p-4 transition-all duration-300 overflow-hidden`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-semibold text-white">{displayName}</span>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.classes}`}
        >
          {statusBadge.text}
        </span>
      </div>

      {/* Current Action */}
      {currentAction && (
        <p
          className="text-sm text-[#94a3b8] truncate mb-2 animate-[fadeIn_0.3s_ease-in-out]"
          title={currentAction}
        >
          {currentAction}
        </p>
      )}

      {/* Stats Row */}
      {statsText && (
        <div className="text-xs text-gray-400 mb-2">{statsText}</div>
      )}

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="h-1 bg-[#0f1117] rounded-full overflow-hidden mt-3">
          <div
            className={`h-full w-1/3 ${getProgressBarColor()} rounded-full animate-[slideIndeterminate_1.5s_ease-in-out_infinite]`}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIndeterminate {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(200%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
