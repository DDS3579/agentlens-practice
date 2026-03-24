// client/src/components/github/GitHubPRButton.jsx
import { GitPullRequest, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GitHubPRButton() {
  return (
    <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 overflow-hidden w-full">
      {/* Header */}
      <div className="px-3 py-2">
        <span className="text-xs font-semibold text-sidebar-foreground flex items-center gap-1.5">
          <GitPullRequest className="h-3.5 w-3.5 text-violet-500" />
          GitHub Pull Request
        </span>
      </div>

      <div className="px-3 pb-3">
        <div className="flex flex-col items-center justify-center py-5 gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center">
            <Construction className="w-6 h-6 text-violet-400" />
          </div>
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider px-3 py-1">
            Coming Soon
          </Badge>
          <p className="text-[11px] text-sidebar-foreground/40 text-center leading-relaxed max-w-[200px]">
            Push AI-generated fixes directly to your repository as a Pull Request.
          </p>
        </div>
      </div>
    </div>
  );
}