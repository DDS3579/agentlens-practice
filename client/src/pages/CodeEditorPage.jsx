import { useEffect } from "react";
import useAgentStore from "../store/agentStore.js";
import useFixStore from "../store/fixStore.js";
import useAuth from "../hooks/useAuth.js";
import useQuota from "../hooks/useQuota.js";
import MonacoEditor from "../components/editor/MonacoEditor.jsx";
import FileTabBar from "../components/editor/FileTabBar.jsx";
import DiffViewer from "../components/editor/DiffViewer.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCode, Code2, GitBranch, Sparkles, Lock, FolderOpen } from "lucide-react";

export default function CodeEditorPage() {
  const { isPro } = useQuota();
  const { getToken } = useAuth();

  const pipelinePhase = useAgentStore((s) => s.currentPhase);
  const repoInfo = useAgentStore((s) => s.repoInfo);
  const securitySummary = useAgentStore((s) => s.securitySummary);
  const compilationResult = useAgentStore((s) => s.compilationResult);

  const {
    openFiles, activeFilePath, unsavedFiles, showDiff, diffData,
    openFile, closeFile, setActiveFile, updateFileContent,
    saveFile, hideDiffView,
  } = useFixStore();

  // Auto-open files when analysis completes
  useEffect(() => {
    if (pipelinePhase !== "complete") return;
    const alreadyOpen = Object.keys(openFiles);
    if (alreadyOpen.length > 0) return;

    const repoFiles = repoInfo?.files || [];
    if (repoFiles.length > 0) {
      repoFiles.slice(0, 8).forEach((file) => {
        const path = typeof file === "string" ? file : file.path || file.name;
        const content = typeof file === "string" ? "" : file.content || "";
        const lang = typeof file === "string" ? "plaintext" : file.language || "plaintext";
        if (path) openFile(path, content, lang);
      });
    } else {
      const repoFiles = repoInfo?.files || [];
      const bugs = securitySummary?.bugs || compilationResult?.bugs || [];
      const bugFiles = new Set();
      bugs.forEach((b) => { if (b.file) bugFiles.add(b.file); if (b.filePath) bugFiles.add(b.filePath); });
      Array.from(bugFiles).slice(0, 8).forEach((fp) => {
        const fileObj = repoFiles.find((f) => f.path === fp || f.name === fp);
        const fileContent = fileObj?.content || "";
        const lang = fileObj?.language || "plaintext";
        openFile(fp, fileContent, lang);
      });
    }
  }, [pipelinePhase, repoInfo, securitySummary, compilationResult, openFiles, openFile]);

  const openFileTabs = Object.keys(openFiles).map((path) => ({
    path, hasChanges: unsavedFiles.has(path), isActive: path === activeFilePath,
  }));

  const activeFile = activeFilePath ? openFiles[activeFilePath] : null;
  const handleEditorChange = (v) => { if (activeFilePath) updateFileContent(activeFilePath, v); };
  const handleEditorSave = () => { if (activeFilePath) saveFile(activeFilePath); };

  const handleDiffAccept = () => {
    if (diffData?.bugId) {
      if (diffData.filename && openFiles[diffData.filename]) updateFileContent(diffData.filename, diffData.modified);
      hideDiffView();
    }
  };

  // Empty state — no analysis done yet
  if (pipelinePhase !== "complete" && openFileTabs.length === 0) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-8">
        <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <img src="/logo.png" alt="AgentLens Logo" className="w-16 h-16 object-contain bg-transparent" />
            </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground mb-3">Code Editor</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Run an analysis from the Dashboard first. Files from the analyzed repository will appear here for editing.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="text-muted-foreground border-border/50 bg-background/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide">
              <FileCode className="w-3 h-3 mr-1.5 text-blue-500" /> Syntax Highlighting
            </Badge>
            <Badge variant="outline" className="text-muted-foreground border-border/50 bg-background/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide">
              <GitBranch className="w-3 h-3 mr-1.5 text-emerald-500" /> Diff View
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col p-4 md:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <Code2 className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">Code Editor</h1>
            <p className="text-muted-foreground text-xs font-medium">
              {openFileTabs.length} file{openFileTabs.length !== 1 ? "s" : ""} open
              {unsavedFiles.size > 0 && <span className="text-amber-500 ml-2">• {unsavedFiles.size} unsaved</span>}
            </p>
          </div>
        </div>
        {/* Editor is always editable */}
      </div>

      {/* Editor Card — takes all available space */}
      <Card className="border-border/40 shadow-lg overflow-hidden bg-background/60 backdrop-blur-xl flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <FileTabBar
            tabs={openFileTabs}
            onTabClick={(p) => setActiveFile(p)}
            onTabClose={(p) => closeFile(p)}
            onTabSave={(p) => saveFile(p)}
          />

          <div className="flex-1 min-h-0">
            {showDiff && diffData ? (
              <DiffViewer
                original={diffData.original}
                modified={diffData.modified}
                filename={diffData.filename}
                language={diffData.language}
                onAccept={handleDiffAccept}
                onReject={() => hideDiffView()}
                height="100%"
              />
            ) : activeFile ? (
              <MonacoEditor
                file={{ path: activeFilePath, content: activeFile.current, language: activeFile.language }}
                isPro={isPro}
                onChange={handleEditorChange}
                onSave={handleEditorSave}
                initialContent={activeFile.original}
                height="100%"
                showToolbar={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 bg-background/20">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground/60">No file selected</p>
                <p className="text-xs text-muted-foreground">Click a tab above to view file contents</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
