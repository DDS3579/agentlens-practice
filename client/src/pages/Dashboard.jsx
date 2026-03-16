// client/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth.js";
import useQuota from "../hooks/useQuota.js";
import useAgentStore from "../store/agentStore.js";
import useFixStore from "../store/fixStore.js";
import { useFixStream } from "../hooks/useFixStream.js";
import GithubInput from "../components/github/GithubInput.jsx";
import AgentCard from "../components/agents/AgentCard.jsx";
import AgentFlowGraph from "../components/agents/AgentFlowGraph.jsx";
import ActivityFeed from "../components/agents/ActivityFeed.jsx";
import ResultsTabs from "../components/results/ResultsTabs.jsx";
import UsageIndicator from "../components/billing/UsageIndicator.jsx";
import UpgradeModal from "../components/billing/UpgradeModal.jsx";
import AdInterstitial from "../components/billing/AdInterstitial.jsx";
import MonacoEditor from "../components/editor/MonacoEditor.jsx";
import FileTabBar from "../components/editor/FileTabBar.jsx";
import DiffViewer from "../components/editor/DiffViewer.jsx";
import FixAgent from "../components/fix/FixAgent.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Zap, Clock, FileCode, Bug, Activity,
  Shield, FileText, GitBranch, Cpu, Lock,
} from "lucide-react";

function Dashboard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState({ name: "", description: "" });

  const { userProfile, usageStats, isLoadingProfile, getToken } = useAuth();
  const {
    canRun, analysesUsed, analysesRemaining, freeLimit,
    isPro, showAdModal, setShowAdModal, onAnalysisComplete,
    onAdWatched, closeAdModal, openAdModal, togglePro,
  } = useQuota();

  const agentStore = useAgentStore();
  const {
    agents, isAnalyzing, currentPhase: pipelinePhase,
    compilationResult, securitySummary, writerResult,
    architectureResult, repoInfo, activityLog, resetPipeline,
  } = agentStore;

  const fixStore = useFixStore();
  const {
    openFiles, activeFilePath, unsavedFiles, showDiff, diffData,
    openFile, closeFile, setActiveFile, updateFileContent,
    saveFile, resetFile, hideDiffView,
  } = fixStore;

  const { startSingleFix, startAllFixes, cancelFix } = useFixStream();

  useEffect(() => { window.__agentlens_getToken = getToken; }, [getToken]);

  useEffect(() => {
    if (pipelinePhase === "complete") onAnalysisComplete();
  }, [pipelinePhase, onAnalysisComplete]);

  const hasResults = pipelinePhase === "complete";
  const securityAgentComplete = agents?.security?.status === "complete";

  const handleAnalysisAttempt = (callback) => {
    if (!canRun) { openAdModal(); return false; }
    if (callback) callback();
    return true;
  };

  const handleNewAnalysis = () => {
    if (!canRun) { openAdModal(); return; }
    resetPipeline();
    useFixStore.getState().resetFixStore();
  };

  const handleFixAgentUpgrade = () => {
    setUpgradeFeature({ name: "Auto-Fix Agent", description: "Let AI automatically fix all detected bugs in your code." });
    setShowUpgradeModal(true);
  };

  const handleEditorUpgrade = () => {
    setUpgradeFeature({ name: "Code Editor", description: "Edit your code directly in the browser with full syntax highlighting." });
    setShowUpgradeModal(true);
  };

  const openFileTabs = Object.keys(openFiles).map((path) => ({
    path, hasChanges: unsavedFiles.has(path), isActive: path === activeFilePath,
  }));

  const handleTabClick = (path) => setActiveFile(path);
  const handleTabClose = (path) => closeFile(path);
  const handleTabSave = (path) => saveFile(path);
  const handleEditorChange = (newContent) => { if (activeFilePath) updateFileContent(activeFilePath, newContent); };
  const handleEditorSave = () => { if (activeFilePath) saveFile(activeFilePath); };

  const handleDiffAccept = () => {
    if (diffData?.bugId) {
      if (diffData.filename && openFiles[diffData.filename]) updateFileContent(diffData.filename, diffData.modified);
      hideDiffView();
    }
  };
  const handleDiffReject = () => hideDiffView();

  const activeFile = activeFilePath ? openFiles[activeFilePath] : null;

  const stats = {
    filesAnalyzed: repoInfo?.files?.length || repoInfo?.totalFiles || repoInfo?.analyzedFiles || 0,
    bugsFound: securitySummary?.totalIssues || securitySummary?.bugs?.length || compilationResult?.bugs?.length || 0,
    duration: compilationResult?.duration || (compilationResult?.timing?.total ? `${Math.round(compilationResult.timing.total / 1000)}s` : "0s"),
    healthScore: compilationResult?.codeHealthScore || architectureResult?.architectureScore || 0,
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6 lg:p-8 space-y-6">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground tracking-tight">
            Welcome back, {userProfile?.name?.split(" ")[0] || "Developer"} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Ready to analyze some code?
          </p>
          {usageStats && (
            <div className="flex items-center gap-5 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-red-400" />
                {usageStats.totalBugs} bugs found
              </span>
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                {usageStats.totalAnalyses} analyses
              </span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 w-full md:w-auto md:max-w-xs">
          <UsageIndicator
            used={analysesUsed}
            limit={freeLimit}
            plan={isPro ? "pro" : "free"}
          />
        </div>
      </div>

      {/* ── Stats Bar ── */}
      {hasResults && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Files Analyzed", value: stats.filesAnalyzed, icon: FileCode, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Bugs Found", value: stats.bugsFound, icon: Bug, color: "text-red-400", bg: "bg-red-500/10" },
            { label: "Duration", value: stats.duration, icon: Clock, color: "text-violet-400", bg: "bg-violet-500/10" },
            { label: "Health Score", value: `${stats.healthScore}/100`, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                  <p className="text-foreground font-semibold text-lg leading-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
          {/* GitHub Input */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <GithubInput
                onAnalysisStart={handleAnalysisAttempt}
                disabled={!canRun && !isPro}
              />
              {!isPro && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {analysesUsed} / {freeLimit} used
                  </span>
                  {!canRun && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={openAdModal}
                          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Unlock more</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Watch an ad or upgrade to Pro</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* New Analysis Button */}
          {hasResults && (
            <Button
              onClick={handleNewAnalysis}
              disabled={!canRun && !isPro}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {!canRun && !isPro ? (
                <><Lock className="w-4 h-4 mr-2" /> Limit Reached</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> New Analysis</>
              )}
            </Button>
          )}

          {/* Agent Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <AgentCard name="Coordinator" icon={Cpu} status={agents?.coordinator?.status || "idle"} color="purple" />
            <AgentCard name="Security" icon={Shield} status={agents?.security?.status || "idle"} color="red" />
            <AgentCard name="Writer" icon={FileText} status={agents?.docs?.status || "idle"} color="blue" />
            <AgentCard name="Architecture" icon={GitBranch} status={agents?.architecture?.status || "idle"} color="green" />
          </div>

          {/* Pro Badge */}
          {isPro && (
            <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-background">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <Zap className="w-4.5 h-4.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">Pro Plan Active</p>
                  <p className="text-violet-400/80 text-xs">Unlimited analyses</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center Panel */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Agent Flow Graph or Empty State */}
          {isAnalyzing || hasResults ? (
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <AgentFlowGraph />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.04] via-transparent to-violet-500/[0.04]" />
              <CardContent className="py-16 lg:py-20 relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-5">
                    <GitBranch className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold font-display text-foreground mb-2">
                    Ready to analyze
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-5 text-sm">
                    Paste a GitHub repository URL to start analyzing with 4 specialized AI agents.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { icon: Shield, label: "Security Scan" },
                      { icon: FileText, label: "Documentation" },
                      { icon: Bug, label: "Bug Detection" },
                      { icon: Activity, label: "Architecture" },
                    ].map(({ icon: Icon, label }) => (
                      <Badge key={label} variant="outline" className="text-muted-foreground border-border/50 bg-muted/30">
                        <Icon className="w-3 h-3 mr-1" />
                        {label}
                      </Badge>
                    ))}
                  </div>
                  {!isPro && (
                    <p className="text-muted-foreground text-xs mt-5">
                      {analysesRemaining > 0 ? (
                        <>You have <span className="text-violet-400 font-medium">{analysesRemaining}</span> free {analysesRemaining === 1 ? "analysis" : "analyses"} remaining</>
                      ) : (
                        <button onClick={openAdModal} className="text-amber-400 hover:text-amber-300 transition-colors underline">
                          Watch an ad or upgrade to continue
                        </button>
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Editor */}
          {openFileTabs.length > 0 && (
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <FileTabBar tabs={openFileTabs} onTabClick={handleTabClick} onTabClose={handleTabClose} onTabSave={handleTabSave} />
                {showDiff && diffData ? (
                  <DiffViewer original={diffData.original} modified={diffData.modified} filename={diffData.filename} language={diffData.language} onAccept={handleDiffAccept} onReject={handleDiffReject} height="500px" />
                ) : activeFile ? (
                  <MonacoEditor file={{ path: activeFilePath, content: activeFile.current, language: activeFile.language }} isPro={isPro} onChange={handleEditorChange} onSave={handleEditorSave} onUpgradeClick={handleEditorUpgrade} initialContent={activeFile.original} height="500px" showToolbar={true} />
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Results Tabs */}
          {hasResults && (
            <div data-results>
              <ResultsTabs />
            </div>
          )}

          {/* Fix Agent */}
          {securityAgentComplete && (
            <FixAgent
              onUpgradeClick={() => {
                setUpgradeFeature({ name: "Auto-Fix Agent", description: "Let AI automatically fix all detected bugs in your code." });
                setShowUpgradeModal(true);
              }}
              onFixSingle={(bug) => {
                const fileContent = fixStore.openFiles[bug.file]?.current || "";
                startSingleFix(bug, fileContent, agentStore.analysisId);
              }}
              onFixAll={(bugs) => {
                const fileContents = Object.fromEntries(Object.entries(fixStore.openFiles).map(([k, v]) => [k, v.current]));
                startAllFixes(bugs, fileContents, agentStore.analysisId);
              }}
              onCancel={cancelFix}
            />
          )}
        </div>

        {/* Right Panel — Activity Feed */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
          <Card className="border-border/50 h-full lg:max-h-[calc(100vh-8rem)] overflow-hidden">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Activity className="w-4 h-4 text-violet-400" />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <Separator className="opacity-50" />
            <CardContent className="p-0 overflow-y-auto h-[calc(100%-3.5rem)]">
              <ActivityFeed activities={activityLog} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName={upgradeFeature.name} description={upgradeFeature.description} />
      <AdInterstitial isOpen={showAdModal} onClose={closeAdModal} onAdComplete={onAdWatched} />
    </div>
  );
}

export default Dashboard;