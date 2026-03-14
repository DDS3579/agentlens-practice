import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useAgentStore from "../store/agentStore.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Bug,
  FileText,
  Shield,
  Cpu,
  History,
  Zap,
  ArrowRight,
  Play,
} from "lucide-react";
import UsageIndicator from "../components/billing/UsageIndicator.jsx";
import UpgradeModal from "../components/billing/UpgradeModal.jsx";



function Dashboard() {
  const {
    userProfile,
    isPro,
    canRunAnalysis,
    analysesRemaining,
    isLoadingProfile,
  } = useAuth();

  const { isAnalyzing, pipelinePhase, repoInfo } = useAgentStore();

  const analysesUsed = userProfile?.analyses_this_month || 0;

  const [showModal, setShowModal] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back
            {userProfile?.name ? `, ${userProfile.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-400 mt-1">
            Analyze your GitHub repositories with AI-powered agents
          </p>
        </div>

        <UpgradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          featureName="Auto-Fix Agent"
          description="Automatically fix all detected bugs with one click."
        />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Analysis Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Repo Input Card */}
            <Card className="bg-gray-900 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-purple-400" />
                  Analyze Repository
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Placeholder - RepoInput removed */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-dashed border-gray-700 text-center">
                  <p className="text-gray-400 text-sm">
                    Repository input temporarily disabled
                  </p>
                </div>

                {!canRunAnalysis && !isPro && (
                  <div className="mt-4 bg-red-950/50 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                    You've reached your monthly limit.
                    <Link
                      to="/billing"
                      className="text-purple-400 hover:text-purple-300 ml-1"
                    >
                      Upgrade to Pro
                    </Link>{" "}
                    for unlimited analyses.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Empty State - When no analysis yet */}
            {!isAnalyzing && (
              <Card className="bg-gray-900 border-white/10 border-dashed">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                      <Cpu className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Ready to analyze
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Enter a GitHub repository URL above to get started. Our AI
                      agents will analyze your code for bugs, security issues,
                      and documentation.
                    </p>

                    {/* Agent Cards */}
                    <div className="grid sm:grid-cols-3 gap-4 mt-8">
                      <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                        <Shield className="w-6 h-6 text-red-400 mb-2" />
                        <h4 className="text-white font-medium text-sm">
                          Security Agent
                        </h4>
                        <p className="text-gray-500 text-xs mt-1">
                          Finds vulnerabilities & risks
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                        <FileText className="w-6 h-6 text-blue-400 mb-2" />
                        <h4 className="text-white font-medium text-sm">
                          Writer Agent
                        </h4>
                        <p className="text-gray-500 text-xs mt-1">
                          Generates documentation
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                        <Cpu className="w-6 h-6 text-green-400 mb-2" />
                        <h4 className="text-white font-medium text-sm">
                          Architecture Agent
                        </h4>
                        <p className="text-gray-500 text-xs mt-1">
                          Reviews code structure
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Usage Indicator (Free users only) */}
            {!isPro && (
              <UsageIndicator
                used={analysesUsed}
                limit={5}
                plan={userProfile?.plan || "free"}
              />
            )}

            {/* Pro Badge (Pro users) */}
            {isPro && (
              <Card className="bg-gradient-to-br from-purple-900/50 to-purple-950 border-purple-500/30">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Pro Plan</h3>
                      <p className="text-purple-300 text-sm">
                        Unlimited analyses
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="bg-gray-900 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Analyses run</span>
                  <span className="text-white font-medium">{analysesUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Remaining</span>
                  <span className="text-white font-medium">
                    {isPro ? "∞" : analysesRemaining}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Plan</span>
                  <Badge
                    className={
                      isPro
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-300 border-gray-700"
                    }
                  >
                    {isPro ? "Pro" : "Free"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent History */}
            <Card className="bg-gray-900 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base">
                  Recent Analyses
                </CardTitle>
                <Link to="/history">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {/* Placeholder for recent analyses */}
                <div className="text-center py-6">
                  <History className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No recent analyses</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Your analysis history will appear here
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade CTA (Free users) */}
            {!isPro && (
              <Card className="bg-gradient-to-br from-purple-900/30 to-gray-900 border-purple-500/20">
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        Upgrade to Pro
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Get unlimited analyses, Auto-Fix Agent, and GitHub PR
                        creation.
                      </p>
                      <Button
                        asChild
                        size="sm"
                        className="mt-3 bg-purple-600 hover:bg-purple-700"
                      >
                        <Link to="/billing">View Plans</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
