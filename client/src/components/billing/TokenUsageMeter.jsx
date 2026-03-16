// client/src/components/billing/TokenUsageMeter.jsx
import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Info,
  RotateCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import useAgentStore from "../../store/agentStore";

// Agent colors for bar chart
const AGENT_COLORS = {
  coordinator: "bg-purple-500",
  architecture: "bg-blue-500",
  security: "bg-red-500",
  docs: "bg-emerald-500",
  fix: "bg-amber-500",
  custom: "bg-pink-500",
};

const AGENT_LABELS = {
  coordinator: "Coordinator",
  architecture: "Architecture",
  security: "Security",
  docs: "Documentation",
  fix: "Fix Agent",
  custom: "Custom Agent",
};

function formatNumber(num) {
  return num.toLocaleString("en-US");
}

function formatCost(cost) {
  if (cost === 0) return "$0.00";
  if (cost < 0.0001) return "<$0.0001";
  // Show at least 4 decimal places, up to 6
  if (cost < 0.01) return `~$${cost.toFixed(6)}`;
  return `~$${cost.toFixed(4)}`;
}

export default function TokenUsageMeter() {
  const tokenUsage = useAgentStore((s) => s.tokenUsage);
  const resetTokenUsage = useAgentStore((s) => s.resetTokenUsage);

  const [showBreakdown, setShowBreakdown] = useState(false);

  // If tokenUsage doesn't exist yet (store hasn't been updated), use defaults
  const usage = tokenUsage || {
    prompt: 0,
    completion: 0,
    total: 0,
    byAgent: {
      coordinator: 0,
      architecture: 0,
      security: 0,
      docs: 0,
      fix: 0,
      custom: 0,
    },
  };

  // Calculate estimated cost (GPT-4o pricing)
  const estimatedCost = useMemo(() => {
    const promptCost = usage.prompt * 0.000003; // $3 per 1M input tokens
    const completionCost = usage.completion * 0.000015; // $15 per 1M output tokens
    return promptCost + completionCost;
  }, [usage.prompt, usage.completion]);

  // Calculate max agent usage for bar chart proportions
  const maxAgentUsage = useMemo(() => {
    const values = Object.values(usage.byAgent || {});
    return Math.max(...values, 1); // Avoid division by zero
  }, [usage.byAgent]);

  // Filter agents with usage > 0 for breakdown
  const activeAgents = useMemo(() => {
    return Object.entries(usage.byAgent || {})
      .filter(([, tokens]) => tokens > 0)
      .sort((a, b) => b[1] - a[1]); // Sort descending
  }, [usage.byAgent]);

  return (
    <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-xs font-semibold text-sidebar-foreground flex-1">
          Token Usage
        </span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-sidebar-foreground/40 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
              <p className="text-xs">
                Estimates based on model pricing. Actual billing may differ.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Main display */}
      <div className="px-3 pb-2">
        <div className="text-center py-2">
          <div className="text-2xl font-bold text-sidebar-foreground tracking-tight">
            {formatNumber(usage.total)}
          </div>
          <div className="text-[10px] text-sidebar-foreground/50 mt-0.5">
            tokens this session
          </div>
          <div className="text-xs font-mono text-violet-400 mt-1">
            {formatCost(estimatedCost)} estimated
          </div>
        </div>

        {/* Prompt / Completion split */}
        {usage.total > 0 && (
          <div className="flex items-center justify-center gap-3 text-[10px] text-sidebar-foreground/50 mt-1 mb-2">
            <span>
              <span className="text-blue-400">↑</span>{" "}
              {formatNumber(usage.prompt)} prompt
            </span>
            <span>
              <span className="text-emerald-400">↓</span>{" "}
              {formatNumber(usage.completion)} completion
            </span>
          </div>
        )}
      </div>

      {/* Per-agent breakdown toggle */}
      {activeAgents.length > 0 && (
        <>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center w-full gap-2 px-3 py-1.5 text-left hover:bg-sidebar-accent/30 transition-colors border-t border-sidebar-border/30"
          >
            {showBreakdown ? (
              <ChevronDown className="h-3 w-3 text-sidebar-foreground/40" />
            ) : (
              <ChevronRight className="h-3 w-3 text-sidebar-foreground/40" />
            )}
            <span className="text-[10px] font-medium text-sidebar-foreground/60">
              Per-agent breakdown
            </span>
          </button>

          {showBreakdown && (
            <div className="px-3 pb-2 space-y-1.5">
              {activeAgents.map(([agentName, tokens]) => {
                const widthPercent = (
                  (tokens / maxAgentUsage) *
                  100
                ).toFixed(1);
                return (
                  <div key={agentName} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-sidebar-foreground/70">
                        {AGENT_LABELS[agentName] || agentName}
                      </span>
                      <span className="font-mono text-sidebar-foreground/50">
                        {formatNumber(tokens)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-sidebar-accent/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          AGENT_COLORS[agentName] || "bg-gray-500"
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-sidebar-border/30">
        <span className="text-[9px] text-sidebar-foreground/30 leading-tight max-w-[140px]">
          Pricing shown for GPT-4o. Groq/Ollama usage is free.
        </span>
        {usage.total > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTokenUsage}
            className="h-6 px-2 text-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}