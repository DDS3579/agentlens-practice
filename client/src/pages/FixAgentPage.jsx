import useAgentStore from "../store/agentStore.js";
import useFixStore from "../store/fixStore.js";
import useAuth from "../hooks/useAuth.js";
import { useFixStream } from "../hooks/useFixStream.js";
import FixAgent from "../components/fix/FixAgent.jsx";
import FixQueuePanel from "../components/agents/FixQueuePanel.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ShieldAlert, Bug, ScanSearch } from "lucide-react";

export default function FixAgentPage() {
  const { userProfile } = useAuth();
  const isPro = userProfile?.plan === "pro";

  const agents = useAgentStore((s) => s.agents);
  const pipelinePhase = useAgentStore((s) => s.currentPhase);
  const analysisId = useAgentStore((s) => s.analysisId);
  const isAnalyzing = useAgentStore((s) => s.isAnalyzing);
  const securityAgentComplete = agents?.security?.status === "complete";

  const fixStore = useFixStore();
  const { startSingleFix, startAllFixes, cancelFix } = useFixStream();

  const hasResults = pipelinePhase === "complete";

  // Empty state
  if (!securityAgentComplete) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-8">
        <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              {isAnalyzing ? (
                <div className="w-14 h-14 animate-spin rounded-full border-4 border-violet-500 border-t-transparent flex items-center justify-center">
                   <img src="/logo.png" alt="AgentLens Logo" className="w-8 h-8 object-contain" />
                </div>
              ) : (
                <img src="/logo.png" alt="AgentLens Logo" className="w-16 h-16 object-contain bg-transparent" />
              )}
            </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground mb-3">
            {isAnalyzing ? "Scanning for Bugs…" : "Fix Agent"}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {isAnalyzing
              ? "The security agent is scanning your code. Bugs will appear here when detected."
              : "Run a security analysis from the Dashboard first. Detected bugs can be auto-fixed here."
            }
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Bug, label: "Detect", c: "text-red-500" },
              { icon: Zap, label: "Auto-Fix", c: "text-amber-500" },
              { icon: ScanSearch, label: "Review", c: "text-emerald-500" },
            ].map(({ icon: Icon, label, c }) => (
              <Badge key={label} variant="outline" className="text-muted-foreground border-border/50 bg-background/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide">
                <Icon className={`w-3 h-3 mr-1.5 ${c}`} /> {label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col p-4 md:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <Zap className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">Fix Agent</h1>
            <p className="text-muted-foreground text-xs font-medium">
              AI-powered bug detection and auto-fixing
            </p>
          </div>
        </div>
        {isPro && (
          <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none gap-1 px-2.5 py-0.5 text-xs font-bold shadow-sm">
            <Zap className="w-3 h-3" fill="currentColor" /> Pro
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Fix Agent — main area */}
        <div className="xl:col-span-2">
          <FixAgent
            onUpgradeClick={() => {}}
            onFixSingle={(bug) => {
              const fileContent = fixStore.openFiles[bug.file]?.current || "";
              startSingleFix(bug, fileContent, analysisId);
            }}
            onFixAll={(bugs) => {
              const fileContents = Object.fromEntries(
                Object.entries(fixStore.openFiles).map(([k, v]) => [k, v.current])
              );
              startAllFixes(bugs, fileContents, analysisId);
            }}
            onCancel={cancelFix}
          />
        </div>

        {/* Fix Queue sidebar */}
        <div className="xl:col-span-1">
          <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-sm">
            <CardContent className="p-4">
              <FixQueuePanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
