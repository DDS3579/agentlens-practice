import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth.js";
import useAgentStore from "../store/agentStore.js";
import useFixStore from "../store/fixStore.js";
import GithubInput from "../components/github/GithubInput.jsx";
import AgentCard from "../components/agents/AgentCard.jsx";
import AgentFlowGraph from "../components/agents/AgentFlowGraph.jsx";
import ActivityFeed from "../components/agents/ActivityFeed.jsx";
import ResultsTabs from "../components/results/ResultsTabs.jsx";
import UsageIndicator from "../components/billing/UsageIndicator.jsx";
import UpgradeModal from "../components/billing/UpgradeModal.jsx";
import MonacoEditor from "../components/editor/MonacoEditor.jsx";
import FileTabBar from "../components/editor/FileTabBar.jsx";
import DiffViewer from "../components/editor/DiffViewer.jsx";
import FixAgent from "../components/fix/FixAgent.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

function Dashboard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState({
    name: "",
    description: "",
  });

  const {
    userProfile,
    isPro,
    canRunAnalysis,
    analysesRemaining,
    isLoadingProfile,
    getToken,
  } = useAuth();

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
  } = useAgentStore();

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
  } = useFixStore();

  // Set token getter for agentStore to use
  useEffect(() => {
    window.__agentlens_getToken = getToken;
  }, [getToken]);

  const analysesUsed = userProfile?.analyses_this_month || 0;
  const hasResults = pipelinePhase === "complete";
  const securityAgentComplete = agents?.security?.status === "complete";

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleAnalysisAttempt = (callback) => {
    if (callback) callback();
    return true;
  };

  const handleNewAnalysis = () => {
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
      // Apply the modified content
      if (diffData.filename && openFiles[diffData.filename]) {
        updateFileContent(diffData.filename, diffData.modified);
      }
      hideDiffView();
    }
  };

  const handleDiffReject = () => {
    hideDiffView();
  };

  // Get active file data
  const activeFile = activeFilePath ? openFiles[activeFilePath] : null;

  // Calculate stats from results
  const stats = {
    filesAnalyzed: repoInfo?.files?.length || 0,
    bugsFound:
      securitySummary?.totalIssues || compilationResult?.bugs?.length || 0,
    duration: compilationResult?.duration || "0s",
    healthScore:
      compilationResult?.healthScore || architectureResult?.score || 0,
  };

  return (
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
          </div>
          <div className="flex-shrink-0 w-full md:w-auto md:max-w-xs">
            <UsageIndicator
              used={analysesUsed}
              limit={5}
              plan={userProfile?.plan || "free"}
            />
          </div>
        </div>
      </div>

      {/* Stats Bar - Shows after analysis */}
      {hasResults && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
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
                <GithubInput onAnalysisStart={handleAnalysisAttempt} />
              </CardContent>
            </Card>

            {/* New Analysis Button */}
            {hasResults && (
              <Button
                onClick={handleNewAnalysis}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            )}

            {/* Agent Cards Grid */}
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

          {/* Center Panel */}
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Editor Section */}
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

            {/* Results Tabs */}
            {hasResults && (
              <div data-results>
                <ResultsTabs />
              </div>
            )}

            {/* Fix Agent - Shows after security agent completes */}
            {securityAgentComplete && (
              <FixAgent onUpgradeClick={handleFixAgentUpgrade} />
            )}
          </div>

          {/* Right Panel */}
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeature.name}
        description={upgradeFeature.description}
      />
    </div>
  );
}

export default Dashboard;
