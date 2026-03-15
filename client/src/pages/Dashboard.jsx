// client/src/pages/Dashboard.jsx
// ============================================
// ADD THESE IMPORTS AT THE TOP
// ============================================
import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth.js";
import useQuota from "../hooks/useQuota.js"; // <-- ADD THIS IMPORT
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
import AdInterstitial from "../components/billing/AdInterstitial.jsx"; // <-- ADD THIS IMPORT
import MonacoEditor from "../components/editor/MonacoEditor.jsx";
import FileTabBar from "../components/editor/FileTabBar.jsx";
import DiffViewer from "../components/editor/DiffViewer.jsx";
import FixAgent from "../components/fix/FixAgent.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // <-- ADD TOOLTIP IMPORTS
import {
  Zap,
  Clock,
  FileCode,
  Bug,
  Activity,
  Shield,
  FileText,
  GitBranch,
  Cpu,
  Lock, // <-- ADD THIS ICON
} from "lucide-react";

function Dashboard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState({
    name: "",
    description: "",
  });

  const {
    userProfile,
    usageStats,
    isLoadingProfile,
    getToken,
  } = useAuth();

  // ============================================
  // ADD QUOTA HOOK HERE - Replace old isPro/canRunAnalysis usage
  // ============================================
  const {
    canRun,
    analysesUsed,
    analysesRemaining,
    freeLimit,
    isPro,
    showAdModal,
    setShowAdModal,
    onAnalysisComplete,
    onAdWatched,
    closeAdModal,
    openAdModal,
    togglePro, // For testing - can remove in production
  } = useQuota();

  const agentStore = useAgentStore();
  const {
    agents,
    isAnalyzing,
    pipelinePhase,
    compilationResult,
    securitySummary,
    writerResult,
    architectureResult,
    repoInfo,
    activityLog,
    resetPipeline,
  } = agentStore;

  const fixStore = useFixStore();
  const {
    openFiles,
    activeFilePath,
    unsavedFiles,
    showDiff,
    diffData,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    saveFile,
    resetFile,
    hideDiffView,
  } = fixStore;

  const { startSingleFix, startAllFixes, cancelFix } = useFixStream();

  // Set token getter for agentStore to use
  useEffect(() => {
    window.__agentlens_getToken = getToken;
  }, [getToken]);

  // ============================================
  // TRACK PIPELINE COMPLETION TO UPDATE QUOTA
  // ============================================
  const previousPhaseRef = useEffect;
  useEffect(() => {
    // When pipeline transitions to "complete", increment quota
    if (pipelinePhase === "complete") {
      onAnalysisComplete();
    }
  }, [pipelinePhase, onAnalysisComplete]);

  const hasResults = pipelinePhase === "complete";
  const securityAgentComplete = agents?.security?.status === "complete";

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ============================================
  // MODIFY ANALYSIS ATTEMPT HANDLER
  // ============================================
  const handleAnalysisAttempt = (callback) => {
    // Check quota before allowing analysis
    if (!canRun) {
      openAdModal();
      return false;
    }
    if (callback) callback();
    return true;
  };

  const handleNewAnalysis = () => {
    // Check quota before allowing new analysis
    if (!canRun) {
      openAdModal();
      return;
    }
    resetPipeline();
    useFixStore.getState().resetFixStore();
  };

  const handleFixAgentUpgrade = () => {
    setUpgradeFeature({
      name: "Auto-Fix Agent",
      description:
        "Let AI automatically fix all detected bugs in your code. Watch as fixes are applied in real-time with full diff previews.",
    });
    setShowUpgradeModal(true);
  };

  const handleEditorUpgrade = () => {
    setUpgradeFeature({
      name: "Code Editor",
      description:
        "Edit your code directly in the browser with full syntax highlighting and save your changes.",
    });
    setShowUpgradeModal(true);
  };

  // ... rest of existing handlers remain unchanged ...

  // File tab handlers
  const openFileTabs = Object.keys(openFiles).map((path) => ({
    path,
    hasChanges: unsavedFiles.has(path),
    isActive: path === activeFilePath,
  }));

  const handleTabClick = (path) => {
    setActiveFile(path);
  };

  const handleTabClose = (path) => {
    closeFile(path);
  };

  const handleTabSave = (path) => {
    saveFile(path);
  };

  const handleEditorChange = (newContent) => {
    if (activeFilePath) {
      updateFileContent(activeFilePath, newContent);
    }
  };

  const handleEditorSave = (content) => {
    if (activeFilePath) {
      saveFile(activeFilePath);
    }
  };

  const handleDiffAccept = () => {
    if (diffData && diffData.bugId) {
      if (diffData.filename && openFiles[diffData.filename]) {
        updateFileContent(diffData.filename, diffData.modified);
      }
      hideDiffView();
    }
  };

  const handleDiffReject = () => {
    hideDiffView();
  };

  const activeFile = activeFilePath ? openFiles[activeFilePath] : null;

  const stats = {
    filesAnalyzed: repoInfo?.files?.length || repoInfo?.totalFiles || repoInfo?.analyzedFiles || 0,
    bugsFound:
      securitySummary?.totalIssues || securitySummary?.bugs?.length || compilationResult?.bugs?.length || 0,
    duration: compilationResult?.duration || (compilationResult?.timing?.total
      ? `${Math.round(compilationResult.timing.total / 1000)}s`
      : '0s'),
    healthScore:
      compilationResult?.codeHealthScore || architectureResult?.architectureScore || 0,
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-950 pt-20 pb-8">
        {/* Welcome Header */}
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back, {userProfile?.name?.split(" ")[0] || "Developer"} 👋
              </h1>
              <p className="text-gray-400 mt-1">
                {currentDate} · Ready to analyze some code?
              </p>
              {usageStats && (
                <div className="flex items-center gap-6 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Bug className="w-4 h-4 text-red-400" />
                    {usageStats.totalBugs} bugs found total
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    {usageStats.totalAnalyses} analyses run
                  </span>
                </div>
              )}
              {/* ============================================
                  ADD: Debug toggle for testing (remove in production)
                  ============================================ */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={togglePro}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-400 underline"
                >
                  [Debug: Toggle Pro ({isPro ? 'ON' : 'OFF'})]
                </button>
              )}
            </div>
            <div className="flex-shrink-0 w-full md:w-auto md:max-w-xs">
              {/* ============================================
                  MODIFY: Use quota hook values for UsageIndicator
                  ============================================ */}
              <UsageIndicator
                used={analysesUsed}
                limit={freeLimit}
                plan={isPro ? "pro" : "free"}
              />
            </div>
          </div>
        </div>

        {/* Stats Bar - Shows after analysis */}
        {hasResults && (
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            {/* ... existing stats bar code unchanged ... */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Files Analyzed</p>
                  <p className="text-white font-semibold text-lg">
                    {stats.filesAnalyzed}
                  </p>
                </div>
              </div>
              <div className="bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Bug className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Bugs Found</p>
                  <p className="text-white font-semibold text-lg">
                    {stats.bugsFound}
                  </p>
                </div>
              </div>
              <div className="bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Duration</p>
                  <p className="text-white font-semibold text-lg">
                    {stats.duration}
                  </p>
                </div>
              </div>
              <div className="bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Health Score</p>
                  <p className="text-white font-semibold text-lg">
                    {stats.healthScore}/100
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Three Column Layout */}
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
              {/* GitHub Input */}
              <Card className="bg-gray-900 border-white/10">
                <CardContent className="p-4">
                  {/* ============================================
                      MODIFY: Pass canRun and quota info to GithubInput
                      ============================================ */}
                  <GithubInput 
                    onAnalysisStart={handleAnalysisAttempt}
                    disabled={!canRun && !isPro}
                  />
                  
                  {/* ============================================
                      ADD: Quota indicator below input for free users
                      ============================================ */}
                  {!isPro && (
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {analysesUsed} / {freeLimit} analyses used
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
                          <TooltipContent side="bottom" className="bg-gray-800 border-gray-700">
                            <p>Watch an ad or upgrade to Pro</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ============================================
                  MODIFY: New Analysis Button with quota check
                  ============================================ */}
              {hasResults && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        onClick={handleNewAnalysis}
                        disabled={!canRun && !isPro}
                        className={`w-full ${
                          canRun || isPro
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-gray-700 cursor-not-allowed opacity-60"
                        }`}
                      >
                        {!canRun && !isPro ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Limit Reached
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            New Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!canRun && !isPro && (
                    <TooltipContent side="bottom" className="bg-gray-800 border-gray-700">
                      <p>You've reached your free limit — watch an ad or upgrade</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}

              {/* Agent Cards Grid - unchanged */}
              <div className="grid grid-cols-2 gap-3">
                <AgentCard
                  name="Coordinator"
                  icon={Cpu}
                  status={agents?.coordinator?.status || "idle"}
                  color="purple"
                />
                <AgentCard
                  name="Security"
                  icon={Shield}
                  status={agents?.security?.status || "idle"}
                  color="red"
                />
                <AgentCard
                  name="Writer"
                  icon={FileText}
                  status={agents?.writer?.status || "idle"}
                  color="blue"
                />
                <AgentCard
                  name="Architecture"
                  icon={GitBranch}
                  status={agents?.architecture?.status || "idle"}
                  color="green"
                />
              </div>

              {/* Pro Badge for Pro Users */}
              {isPro && (
                <Card className="bg-gradient-to-br from-purple-900/50 to-gray-900 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Pro Plan Active</p>
                        <p className="text-purple-300 text-sm">
                          Unlimited analyses
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center Panel - unchanged except for the analysis flow */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Agent Flow Graph or Empty State */}
              {isAnalyzing || hasResults ? (
                <Card className="bg-gray-900 border-white/10 overflow-hidden">
                  <CardContent className="p-0">
                    <AgentFlowGraph />
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-900 border-white/10 border-dashed relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 animate-pulse" />
                  <CardContent className="py-20 relative">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                        <GitBranch className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">
                        Ready to analyze
                      </h3>
                      <p className="text-gray-400 max-w-md mx-auto mb-6">
                        Paste a GitHub repository URL in the input above to start
                        analyzing with 4 specialized AI agents.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-gray-400 border-gray-700"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Security Scan
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-gray-400 border-gray-700"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Documentation
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-gray-400 border-gray-700"
                        >
                          <Bug className="w-3 h-3 mr-1" />
                          Bug Detection
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-gray-400 border-gray-700"
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          Architecture Review
                        </Badge>
                      </div>
                      
                      {/* ============================================
                          ADD: Show remaining analyses for free users
                          ============================================ */}
                      {!isPro && (
                        <p className="text-gray-500 text-sm mt-6">
                          {analysesRemaining > 0 ? (
                            <>You have <span className="text-purple-400 font-medium">{analysesRemaining}</span> free {analysesRemaining === 1 ? 'analysis' : 'analyses'} remaining</>
                          ) : (
                            <button
                              onClick={openAdModal}
                              className="text-amber-400 hover:text-amber-300 transition-colors underline"
                            >
                              Watch an ad or upgrade to continue
                            </button>
                          )}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File Editor Section - unchanged */}
              {openFileTabs.length > 0 && (
                <Card className="bg-gray-900 border-white/10 overflow-hidden">
                  <CardContent className="p-0">
                    <FileTabBar
                      tabs={openFileTabs}
                      onTabClick={handleTabClick}
                      onTabClose={handleTabClose}
                      onTabSave={handleTabSave}
                    />
                    {showDiff && diffData ? (
                      <DiffViewer
                        original={diffData.original}
                        modified={diffData.modified}
                        filename={diffData.filename}
                        language={diffData.language}
                        onAccept={handleDiffAccept}
                        onReject={handleDiffReject}
                        height="500px"
                      />
                    ) : activeFile ? (
                      <MonacoEditor
                        file={{
                          path: activeFilePath,
                          content: activeFile.current,
                          language: activeFile.language,
                        }}
                        isPro={isPro}
                        onChange={handleEditorChange}
                        onSave={handleEditorSave}
                        onUpgradeClick={handleEditorUpgrade}
                        initialContent={activeFile.original}
                        height="500px"
                        showToolbar={true}
                      />
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {/* Results Tabs - unchanged */}
              {hasResults && (
                <div data-results>
                  <ResultsTabs />
                </div>
              )}

              {/* Fix Agent - unchanged */}
              {securityAgentComplete && (
                <FixAgent
                  onUpgradeClick={() => {
                    setUpgradeFeature({
                      name: 'Auto-Fix Agent',
                      description: 'Let AI automatically fix all detected bugs in your code. Watch as fixes are applied in real-time with full diff previews.'
                    });
                    setShowUpgradeModal(true);
                  }}
                  onFixSingle={(bug) => {
                    const fileContent = fixStore.openFiles[bug.file]?.current || '';
                    startSingleFix(bug, fileContent, agentStore.analysisId);
                  }}
                  onFixAll={(bugs) => {
                    const fileContents = Object.fromEntries(
                      Object.entries(fixStore.openFiles).map(([k, v]) => [k, v.current])
                    );
                    startAllFixes(bugs, fileContents, agentStore.analysisId);
                  }}
                  onCancel={cancelFix}
                />
              )}
            </div>

            {/* Right Panel - unchanged */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <Card className="bg-gray-900 border-white/10 h-full lg:max-h-[calc(100vh-12rem)] overflow-hidden">
                <CardContent className="p-0 h-full">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      Activity Feed
                    </h3>
                  </div>
                  <div className="overflow-y-auto h-[calc(100%-3.5rem)]">
                    <ActivityFeed activities={activityLog} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Upgrade Modal - unchanged */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName={upgradeFeature.name}
          description={upgradeFeature.description}
        />

        {/* ============================================
            ADD: Ad Interstitial Modal
            ============================================ */}
        <AdInterstitial
          isOpen={showAdModal}
          onClose={closeAdModal}
          onAdComplete={onAdWatched}
        />
      </div>
    </TooltipProvider>
  );
}

export default Dashboard;