// client/src/components/agents/AgentStatusPanel.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useAgentStore from "../../store/agentStore";

// Friendly display names for agents
const AGENT_NAMES = {
  coordinator: "Coordinator",
  architecture: "Architecture",
  security: "Security",
  docs: "Documentation",
  fix: "Fix Agent",
  custom: "Custom Agent",
};

// Status dot component with pulsing animation for running state
function StatusDot({ status }) {
  const baseClasses = "inline-block h-2.5 w-2.5 rounded-full shrink-0";

  switch (status) {
    case "running":
      return (
        <span
          className={`${baseClasses} bg-amber-400`}
          style={{
            animation: "agentPulse 1.2s ease-in-out infinite",
          }}
        />
      );
    case "complete":
      return <span className={`${baseClasses} bg-emerald-500`} />;
    case "error":
      return <span className={`${baseClasses} bg-red-500`} />;
    case "idle":
    default:
      return <span className={`${baseClasses} bg-gray-400/50`} />;
  }
}

// Single agent row
function AgentRow({ name, agentState }) {
  const { status, duration, error } = agentState;

  const rightContent = () => {
    switch (status) {
      case "running":
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />;
      case "complete":
        return (
          <span className="text-[11px] font-mono text-emerald-400">
            {duration != null
              ? `${(duration / 1000).toFixed(1)}s`
              : "done"}
          </span>
        );
      case "error":
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-3.5 w-3.5 text-red-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                <p className="text-xs">{error || "Agent failed"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        );
    }
  };

  return (
    <div className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-muted/30 transition-colors">
      <StatusDot status={status} />
      <span className="text-xs text-sidebar-foreground/80 flex-1 truncate">
        {AGENT_NAMES[name] || name}
      </span>
      <div className="flex items-center">{rightContent()}</div>
    </div>
  );
}

// Summary pill
function StatusPill({ count, label, colorClass }) {
  if (count === 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${colorClass}`}
    >
      {count} {label}
    </span>
  );
}

export default function AgentStatusPanel() {
  const agents = useAgentStore((s) => s.agents);
  const currentPhase = useAgentStore((s) => s.currentPhase);
  const pipelineStartedAt = useAgentStore((s) => s.pipelineStartedAt);
  const pipelineDuration = useAgentStore((s) => s.pipelineDuration);

  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Ref to track auto-collapse timer
  const collapseTimerRef = useRef(null);
  // Ref to track previous phase for transitions
  const prevPhaseRef = useRef(currentPhase);

  // Derive agent counts
  const counts = useMemo(() => {
    const entries = Object.values(agents);
    return {
      complete: entries.filter((a) => a.status === "complete").length,
      running: entries.filter((a) => a.status === "running").length,
      error: entries.filter((a) => a.status === "error").length,
      idle: entries.filter((a) => a.status === "idle").length,
    };
  }, [agents]);

  // Auto-expand when any agent starts running
  useEffect(() => {
    if (counts.running > 0) {
      setIsExpanded(true);
      // Clear any pending collapse timer
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    }
  }, [counts.running]);

  // Auto-collapse 5s after pipeline completes
  useEffect(() => {
    if (currentPhase === "complete" && prevPhaseRef.current !== "complete") {
      // Pipeline just completed — stay expanded for 5s, then collapse
      collapseTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
        collapseTimerRef.current = null;
      }, 5000);
    }
    prevPhaseRef.current = currentPhase;

    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, [currentPhase]);

  // Live elapsed timer
  useEffect(() => {
    if (!pipelineStartedAt) {
      setElapsed(0);
      return;
    }

    if (currentPhase === "complete" || currentPhase === "error") {
      // Use final duration if available, otherwise calculate
      const finalDuration =
        pipelineDuration || Date.now() - pipelineStartedAt;
      setElapsed(finalDuration);
      return;
    }

    // Counting up while pipeline is active
    const interval = setInterval(() => {
      setElapsed(Date.now() - pipelineStartedAt);
    }, 1000);

    return () => clearInterval(interval);
  }, [pipelineStartedAt, currentPhase, pipelineDuration]);

  const elapsedSeconds = (elapsed / 1000).toFixed(1);
  const isActive =
    currentPhase !== "idle" &&
    currentPhase !== "complete" &&
    currentPhase !== "error";

  return (
    <>
      {/* Inject keyframes for pulsing dot */}
      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center w-full gap-2 px-3 py-2 text-left hover:bg-sidebar-accent/30 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/50 shrink-0" />
          )}
          <span className="text-xs font-semibold text-sidebar-foreground flex-1">
            Agent Pipeline
          </span>
          {/* Live elapsed time */}
          {pipelineStartedAt && (
            <span
              className={`text-[10px] font-mono ${
                isActive ? "text-amber-400" : "text-sidebar-foreground/50"
              }`}
            >
              {elapsedSeconds}s
            </span>
          )}
        </button>

        {/* Expanded agent rows */}
        {isExpanded && (
          <div className="px-1 pb-1 space-y-0.5">
            {Object.entries(agents).map(([name, agentState]) => (
              <AgentRow key={name} name={name} agentState={agentState} />
            ))}
          </div>
        )}

        {/* Summary pills — always visible */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-t border-sidebar-border/30">
          <StatusPill
            count={counts.complete}
            label="complete"
            colorClass="bg-emerald-500/15 text-emerald-400"
          />
          <StatusPill
            count={counts.running}
            label="running"
            colorClass="bg-amber-500/15 text-amber-400"
          />
          <StatusPill
            count={counts.error}
            label="failed"
            colorClass="bg-red-500/15 text-red-400"
          />

          {/* "Done in Xs" badge when pipeline complete */}
          {currentPhase === "complete" && pipelineStartedAt && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Done in {elapsedSeconds}s
            </span>
          )}
        </div>
      </div>
    </>
  );
}