// client/src/pages/Dashboard.jsx — Overview page (clean, focused)
import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth.js";
import useQuota from "../hooks/useQuota.js";
import useAgentStore from "../store/agentStore.js";
import useFixStore from "../store/fixStore.js";
import GithubInput from "../components/github/GithubInput.jsx";
import AgentCard from "../components/agents/AgentCard.jsx";
import AgentFlowGraph from "../components/agents/AgentFlowGraph.jsx";
import ActivityFeed from "../components/agents/ActivityFeed.jsx";
import UsageIndicator from "../components/billing/UsageIndicator.jsx";
import UpgradeModal from "../components/billing/UpgradeModal.jsx";
import AdInterstitial from "../components/billing/AdInterstitial.jsx";
import AgentStatusPanel from "../components/agents/AgentStatusPanel.jsx";
import TokenUsageMeter from "../components/billing/TokenUsageMeter.jsx";
import GitHubPRButton from "../components/github/GitHubPRButton.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Zap, Clock, FileCode, Bug, Activity, Shield,
  FileText, GitBranch, Cpu, Lock, LayoutDashboard,
  Sparkles, Server, CheckCircle2, History, ScanSearch,
} from "lucide-react";

function Dashboard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState({ name: "", description: "" });

  const { userProfile, usageStats, getToken } = useAuth();
  const {
    canRun, analysesUsed, freeLimit, isPro,
    showAdModal, setShowAdModal, onAnalysisComplete,
    onAdWatched, closeAdModal, openAdModal,
  } = useQuota();

  const agentStore = useAgentStore();
  const {
    agents, isAnalyzing, currentPhase: pipelinePhase,
    compilationResult, securitySummary, architectureResult,
    repoInfo, activityLog, resetPipeline,
  } = agentStore;

  useEffect(() => { window.__agentlens_getToken = getToken; }, [getToken]);
  useEffect(() => { if (pipelinePhase === "complete") onAnalysisComplete(); }, [pipelinePhase, onAnalysisComplete]);

  const hasResults = pipelinePhase === "complete";

  const handleNewAnalysis = () => {
    if (!canRun) { openAdModal(); return; }
    resetPipeline();
    useFixStore.getState().resetFixStore();
  };

  const stats = {
    filesAnalyzed: repoInfo?.files?.length || repoInfo?.totalFiles || 0,
    bugsFound: securitySummary?.totalIssues || securitySummary?.bugs?.length || compilationResult?.bugs?.length || 0,
    duration: compilationResult?.duration || (compilationResult?.timing?.total ? `${Math.round(compilationResult.timing.total / 1000)}s` : "0s"),
    healthScore: compilationResult?.codeHealthScore || architectureResult?.architectureScore || 0,
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-[calc(100vh-3.5rem)] p-4 md:p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-[1400px] flex flex-col gap-6">

          {/* ────── HEADER ────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/30 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 hidden md:flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                    Welcome, {userProfile?.name?.split(" ")[0] || "Developer"}
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Analyze and secure your codebase
                  </p>
                </div>
              </div>
              {usageStats && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="secondary" className="bg-background border-border/50 text-muted-foreground gap-1.5 px-2.5 py-0.5 text-xs font-medium">
                    <Bug className="w-3 h-3 text-red-500" /> {usageStats.totalBugs} bugs
                  </Badge>
                  <Badge variant="secondary" className="bg-background border-border/50 text-muted-foreground gap-1.5 px-2.5 py-0.5 text-xs font-medium">
                    <History className="w-3 h-3 text-blue-500" /> {usageStats.totalAnalyses} analyses
                  </Badge>
                  {isPro && (
                    <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none gap-1 px-2.5 py-0.5 text-xs font-bold shadow-sm">
                      <Zap className="w-3 h-3" fill="currentColor" /> Pro
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 w-full md:w-auto min-w-[260px]">
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardContent className="p-3">
                  <UsageIndicator used={analysesUsed} limit={freeLimit} plan={isPro ? "pro" : "free"} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ────── PRO TOOLS STRIP ────── */}
          {isPro && hasResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
              <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-sm hover:border-violet-500/30 transition-all">
                <CardContent className="p-3"><AgentStatusPanel /></CardContent>
              </Card>
              <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-sm hover:border-violet-500/30 transition-all">
                <CardContent className="p-3"><TokenUsageMeter /></CardContent>
              </Card>
              <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-sm hover:border-violet-500/30 transition-all">
                <CardContent className="p-3 flex items-center justify-center"><GitHubPRButton /></CardContent>
              </Card>
            </div>
          )}

          {/* ────── STATS BAR ────── */}
          {hasResults && (
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
          )}

          {/* ────── MAIN CONTENT ────── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

            {/* Left — GitHub Input + Agent Cards */}
            <div className="xl:col-span-4 flex flex-col gap-5 xl:sticky xl:top-20">
              {/* GitHub Input */}
              <Card className="border-border/40 shadow-md bg-background/60 backdrop-blur-xl overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Server className="w-4 h-4 text-violet-500" /> Target Repository
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <GithubInput onAnalysisStart={(cb) => { if (!canRun) { openAdModal(); return false; } if (cb) cb(); return true; }} disabled={!canRun && !isPro} />
                  {!isPro && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/20">
                      <span className="text-muted-foreground font-medium">{analysesUsed} / {freeLimit} Scans</span>
                      {!canRun ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={openAdModal} className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md text-xs font-semibold transition-colors">
                              <Lock className="w-3 h-3" /> Unlock
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom"><p>Watch an ad to unlock more scans</p></TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-emerald-500 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> OK</span>
                      )}
                    </div>
                  )}
                  {hasResults && (
                    <Button onClick={handleNewAnalysis} disabled={!canRun && !isPro} className="w-full mt-1 font-semibold shadow-sm h-9 text-sm">
                      {!canRun && !isPro ? <><Lock className="w-4 h-4 mr-2" /> Limit Reached</> : <><Sparkles className="w-4 h-4 mr-2" /> New Analysis</>}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Pipeline Agents */}
              <Card className="border-border/40 shadow-md bg-background/60 backdrop-blur-xl">
                <CardHeader className="pb-2 border-b border-border/30 bg-muted/10 p-3">
                  <CardTitle className="text-[11px] font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                    <Cpu className="w-3.5 h-3.5 text-violet-500" /> Pipeline Agents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-2 gap-2">
                  <AgentCard name="Coordinator" icon={Cpu} status={agents?.coordinator?.status || "idle"} color="purple" />
                  <AgentCard name="Security" icon={Shield} status={agents?.security?.status || "idle"} color="red" />
                  <AgentCard name="Writer" icon={FileText} status={agents?.docs?.status || "idle"} color="blue" />
                  <AgentCard name="Architecture" icon={GitBranch} status={agents?.architecture?.status || "idle"} color="green" />
                </CardContent>
              </Card>
            </div>

            {/* Right — Flow Graph + Activity */}
            <div className="xl:col-span-8 flex flex-col gap-5 min-w-0">
              {/* Pipeline Flow Graph */}
              {isAnalyzing || hasResults ? (
                <Card className="border-border/40 shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-500 bg-background/60 backdrop-blur-xl">
                  <CardContent className="p-0">
                    <AgentFlowGraph />
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-dashed border-border/40 bg-background/30 backdrop-blur-lg group hover:border-violet-500/40 transition-all duration-500 min-h-[400px] flex items-center justify-center rounded-2xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 opacity-50 pointer-events-none" />
                  <div className="text-center p-8 relative z-10 w-full animate-in fade-in zoom-in duration-700">
                      <div className="w-full h-full flex items-center justify-center">
                        <img src="/logo.png" alt="AgentLens Logo" className="w-12 h-12 object-contain bg-transparent" />
                      </div>
                    <h3 className="text-2xl font-black tracking-tight text-foreground mb-3">Awaiting Target</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                      Enter a GitHub repository URL to initialize the multi-agent AI pipeline.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { icon: Shield, label: "AppSec", c: "text-red-500" },
                        { icon: FileText, label: "Docs", c: "text-blue-500" },
                        { icon: Bug, label: "Auto-Fix", c: "text-amber-500" },
                        { icon: Activity, label: "Topology", c: "text-emerald-500" },
                      ].map(({ icon: Icon, label, c }) => (
                        <Badge key={label} variant="outline" className="text-muted-foreground border-border/50 bg-background/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide">
                          <Icon className={`w-3 h-3 mr-1.5 ${c}`} /> {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Activity Feed */}
              <Card className="border-border/40 shadow-md bg-background/60 backdrop-blur-xl flex flex-col max-h-[450px] overflow-hidden">
                <CardHeader className="p-3 bg-muted/10 border-b border-border/30">
                  <CardTitle className="text-[11px] font-bold flex items-center justify-between text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-violet-500" /> Live Activity</span>
                    {activityLog?.length > 0 && <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">{activityLog.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-y-auto">
                  <CardContent className="p-0">
                    {(!activityLog || activityLog.length === 0) ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
                        <History className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-foreground font-medium">No activity yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Events will appear during scans</p>
                      </div>
                    ) : (
                      <ActivityFeed activities={activityLog} />
                    )}
                  </CardContent>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Modals */}
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName={upgradeFeature.name} description={upgradeFeature.description} />
        <AdInterstitial isOpen={showAdModal} onClose={closeAdModal} onAdComplete={onAdWatched} />
      </div>
    </TooltipProvider>
  );
}

export default Dashboard;