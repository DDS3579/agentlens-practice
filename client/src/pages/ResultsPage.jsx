import useAgentStore from "../store/agentStore.js";
import useAuth from "../hooks/useAuth.js";
import ResultsTabs from "../components/results/ResultsTabs.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Shield, FileText, GitBranch, Bug, FileCode, Clock, Activity, ScanSearch
} from "lucide-react";

export default function ResultsPage() {
  const { userProfile } = useAuth();
  const pipelinePhase = useAgentStore((s) => s.currentPhase);
  const repoInfo = useAgentStore((s) => s.repoInfo);
  const securitySummary = useAgentStore((s) => s.securitySummary);
  const compilationResult = useAgentStore((s) => s.compilationResult);
  const architectureResult = useAgentStore((s) => s.architectureResult);
  const isAnalyzing = useAgentStore((s) => s.isAnalyzing);

  const hasResults = pipelinePhase === "complete";

  const stats = {
    filesAnalyzed: repoInfo?.files?.length || repoInfo?.totalFiles || 0,
    bugsFound: securitySummary?.totalIssues || securitySummary?.bugs?.length || compilationResult?.bugs?.length || 0,
    duration: compilationResult?.duration || (compilationResult?.timing?.total ? `${Math.round(compilationResult.timing.total / 1000)}s` : "—"),
    healthScore: compilationResult?.codeHealthScore || architectureResult?.architectureScore || 0,
  };

  // Empty / waiting state
  if (!hasResults) {
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
            {isAnalyzing ? "Analysis Running…" : "No Results Yet"}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {isAnalyzing
              ? "Your multi-agent pipeline is processing. Results will appear here automatically."
              : "Run an analysis from the Dashboard to see security findings, documentation, and architecture insights."
            }
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Security" },
              { label: "Docs" },
              { label: "Architecture" },
            ].map(({ label }) => (
              <Badge key={label} variant="outline" className="text-muted-foreground border-border/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide">
                <img src="/logo.png" alt="AgentLens Logo" className="w-3 h-3 mr-1.5 object-contain" /> {label}
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
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="AgentLens Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">Analysis Results</h1>
            <p className="text-muted-foreground text-xs font-medium">
              {repoInfo?.repoName || "Repository"} — completed analysis
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {[
          { label: "Files Analyzed", value: stats.filesAnalyzed, icon: FileCode, c: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Bugs Found", value: stats.bugsFound, icon: Bug, c: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
          { label: "Scan Duration", value: stats.duration, icon: Clock, c: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
          { label: "Health Score", value: `${stats.healthScore}/100`, icon: Activity, c: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        ].map((s, i) => (
          <Card key={i} className={`border ${s.border} bg-background/50 hover:bg-background/80 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.bg} border ${s.border}`}>
                <s.icon className={`w-4 h-4 ${s.c}`} />
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-foreground font-black text-xl tracking-tight">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results Tabs — full width */}
      <Card className="border-border/40 shadow-md overflow-hidden bg-background/60 backdrop-blur-xl flex-1">
        <CardContent className="p-0">
          <ResultsTabs />
        </CardContent>
      </Card>
    </div>
  );
}
