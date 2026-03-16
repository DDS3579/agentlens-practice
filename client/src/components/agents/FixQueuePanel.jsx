// client/src/components/agents/FixQueuePanel.jsx
import { useMemo } from "react";
import {
  Trash2,
  RefreshCw,
  Plus,
  Minus,
  Wand2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import useFixStore from "../../store/fixStore";

// Edit type config
const EDIT_TYPE_CONFIG = {
  replace: {
    icon: RefreshCw,
    color: "text-amber-400",
    label: "Replace",
  },
  insert: {
    icon: Plus,
    color: "text-emerald-400",
    label: "Insert",
  },
  delete: {
    icon: Minus,
    color: "text-red-400",
    label: "Delete",
  },
};

// Agent badge component
function AgentBadge({ agent }) {
  const isCustom = agent === "custom";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
        isCustom
          ? "bg-purple-500/15 text-purple-400"
          : "bg-blue-500/15 text-blue-400"
      }`}
    >
      {isCustom ? "Custom" : "Fix"}
    </span>
  );
}

// Get basename from path
function basename(filePath) {
  if (!filePath) return "unknown";
  return filePath.split("/").at(-1) || filePath;
}

// Truncate string
function truncate(str, maxLen) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

// Single edit row
function EditRow({ edit, agent }) {
  const fileName = truncate(basename(edit.file || edit.filePath), 20);
  const editType = edit.type || edit.editType || "replace";
  const config = EDIT_TYPE_CONFIG[editType] || EDIT_TYPE_CONFIG.replace;
  const EditIcon = config.icon;

  const startLine = edit.startLine || edit.line || "?";
  const endLine = edit.endLine || edit.lineEnd || startLine;
  const lineRange =
    startLine === endLine ? `L${startLine}` : `L${startLine}-${endLine}`;

  const explanation =
    edit.explanation || edit.reason || edit.description || "No details";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-sidebar-accent/30 transition-colors cursor-default group">
            <AgentBadge agent={agent} />
            <span className="text-[11px] text-sidebar-foreground/80 flex-1 truncate font-mono">
              {fileName}
            </span>
            <span className="text-[10px] font-mono text-sidebar-foreground/40">
              {lineRange}
            </span>
            <EditIcon className={`h-3 w-3 shrink-0 ${config.color}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[240px]">
          <p className="text-xs font-medium mb-1">
            {config.label}: {edit.file || edit.filePath}
          </p>
          <p className="text-[11px] text-muted-foreground">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function FixQueuePanel() {
  const customAgentEdits = useFixStore((s) => s.customAgentEdits) || [];
  const fixAgentEdits = useFixStore((s) => s.fixAgentEdits) || [];
  const clearCustomEdits = useFixStore((s) => s.clearCustomEdits);
  const clearFixEdits = useFixStore((s) => s.clearFixEdits);

  // Combine all edits with agent source tag
  const allEdits = useMemo(() => {
    const fixEdits = fixAgentEdits.map((e) => ({ ...e, _agent: "fix" }));
    const customEdits = customAgentEdits.map((e) => ({
      ...e,
      _agent: "custom",
    }));
    return [...fixEdits, ...customEdits];
  }, [fixAgentEdits, customAgentEdits]);

  // Unique file count
  const uniqueFiles = useMemo(() => {
    const files = new Set(
      allEdits.map((e) => e.file || e.filePath || "unknown")
    );
    return files.size;
  }, [allEdits]);

  const handleClear = () => {
    if (clearCustomEdits) clearCustomEdits();
    if (clearFixEdits) clearFixEdits();
  };

  return (
    <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-xs font-semibold text-sidebar-foreground flex-1">
          Fix Queue
        </span>
        {allEdits.length > 0 && (
          <>
            <span className="inline-flex items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold min-w-[18px] h-[18px] px-1">
              {allEdits.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 text-sidebar-foreground/40 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* Edit list or empty state */}
      {allEdits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
          <Wand2 className="h-8 w-8 text-sidebar-foreground/20 mb-2" />
          <span className="text-[11px] text-sidebar-foreground/40">
            No fixes applied yet
          </span>
        </div>
      ) : (
        <>
          <div
            className="overflow-y-auto space-y-0.5 px-1"
            style={{ maxHeight: "200px" }}
          >
            {allEdits.map((edit, idx) => (
              <EditRow key={idx} edit={edit} agent={edit._agent} />
            ))}
          </div>

          {/* Summary footer */}
          <div className="px-3 py-1.5 border-t border-sidebar-border/30">
            <span className="text-[10px] text-sidebar-foreground/40">
              {allEdits.length} edit{allEdits.length !== 1 ? "s" : ""} across{" "}
              {uniqueFiles} file{uniqueFiles !== 1 ? "s" : ""}
            </span>
          </div>
        </>
      )}
    </div>
  );
}