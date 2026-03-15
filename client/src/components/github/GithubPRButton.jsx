// client/src/components/github/GitHubPRButton.jsx
import { useState, useMemo, useEffect } from "react";
import {
  GitPullRequest,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useFixStore from "../../store/fixStore";
import useAgentStore from "../../store/agentStore";

const GH_TOKEN_KEY = "gh_token";

// Loading step messages
const LOADING_STEPS = [
  "Creating branch...",
  "Uploading files...",
  "Opening PR...",
];

export default function GitHubPRButton() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [prUrl, setPrUrl] = useState("");
  const [ghToken, setGhToken] = useState(() => {
    try {
      return localStorage.getItem(GH_TOKEN_KEY) || "";
    } catch {
      return "";
    }
  });
  const [showToken, setShowToken] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Get edits from fix store
  const customAgentEdits = useFixStore((s) => s.customAgentEdits) || [];
  const fixAgentEdits = useFixStore((s) => s.fixAgentEdits) || [];

  // Get repo URL
  const repoInfo = useAgentStore((s) => s.repoInfo);
  const repoUrl = repoInfo?.url || repoInfo?.repoUrl || "";

  // Combine all edits
  const allEdits = useMemo(() => {
    return [...fixAgentEdits, ...customAgentEdits];
  }, [fixAgentEdits, customAgentEdits]);

  const hasEdits = allEdits.length > 0;
  const hasToken = ghToken.trim().length > 0;

  // Save token to localStorage when it changes
  useEffect(() => {
    try {
      if (ghToken) {
        localStorage.setItem(GH_TOKEN_KEY, ghToken);
      } else {
        localStorage.removeItem(GH_TOKEN_KEY);
      }
    } catch {
      // localStorage not available
    }
  }, [ghToken]);

  // Cycle through loading steps
  useEffect(() => {
    if (status !== "loading") {
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [status]);

  const handleCreatePR = async () => {
    if (!hasEdits || !hasToken) return;

    setStatus("loading");
    setErrorMessage("");
    setPrUrl("");
    setLoadingStep(0);

    try {
      // Build edits payload — normalize shape
      const editsPayload = allEdits.map((edit) => ({
        file: edit.file || edit.filePath,
        newContent: edit.newContent || edit.content || "",
        explanation: edit.explanation || edit.reason || edit.description || "AI fix",
      }));

      const response = await fetch("/api/github/pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-github-token": ghToken.trim(),
        },
        body: JSON.stringify({
          repoUrl,
          edits: editsPayload,
          prTitle: "AgentLens: AI-powered fixes and improvements",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let friendlyError = data.error || "Failed to create PR";
        if (response.status === 401) {
          friendlyError = "Invalid token — check repo scope";
        } else if (response.status === 404) {
          friendlyError = "Repo not found — is it private?";
        } else if (response.status === 422) {
          friendlyError = "Branch exists — a previous PR may be open";
        }
        setErrorMessage(friendlyError);
        setStatus("error");
        return;
      }

      setPrUrl(data.prUrl);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err.message || "Network error");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setErrorMessage("");
    setPrUrl("");
    setLoadingStep(0);
  };

  // Truncate error message
  const displayError =
    errorMessage.length > 60
      ? errorMessage.slice(0, 57) + "..."
      : errorMessage;

  return (
    <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2">
        <span className="text-xs font-semibold text-sidebar-foreground">
          GitHub Pull Request
        </span>
      </div>

      <div className="px-3 pb-3 space-y-2">
        {/* ── IDLE STATE ── */}
        {status === "idle" && (
          <>
            {/* Token input */}
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder="GitHub token — needs repo scope"
                className="w-full h-8 rounded-md border border-sidebar-border/60 bg-sidebar-accent/30 px-2.5 pr-8 text-[11px] text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/30 hover:text-sidebar-foreground/60"
              >
                {showToken ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Token disclaimer */}
            <p className="text-[9px] text-sidebar-foreground/30 leading-tight">
              Token stored locally in your browser only
            </p>

            {/* Create PR button */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      onClick={handleCreatePR}
                      disabled={!hasEdits || !hasToken}
                      className="w-full h-9 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      Create Pull Request
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">
                    {!hasEdits
                      ? "No edits to push yet"
                      : !hasToken
                        ? "Enter a GitHub token first"
                        : `Push ${allEdits.length} edit(s) as a PR to your repository`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {hasEdits && (
              <p className="text-[10px] text-sidebar-foreground/40 text-center">
                {allEdits.length} edit{allEdits.length !== 1 ? "s" : ""} ready
                to push
              </p>
            )}
          </>
        )}

        {/* ── LOADING STATE ── */}
        {status === "loading" && (
          <div className="text-center py-3 space-y-2">
            <Button disabled className="w-full h-9 text-xs">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating PR...
            </Button>
            <p className="text-[10px] text-amber-400 animate-pulse">
              {LOADING_STEPS[loadingStep]}
            </p>
          </div>
        )}

        {/* ── SUCCESS STATE ── */}
        {status === "success" && (
          <div className="text-center py-2 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">PR Created!</span>
            </div>
            {prUrl && (
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
              >
                View PR
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-full h-7 text-[10px] text-sidebar-foreground/50"
            >
              Create Another
            </Button>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {status === "error" && (
          <div className="py-2 space-y-2">
            <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-2.5 py-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-[11px] text-red-300 leading-tight">
                {displayError}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full h-8 text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}