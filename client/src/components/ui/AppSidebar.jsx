import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Settings,
  CreditCard,
  Code2,
  Sparkles,
  Zap,
  Bug,
  BarChart3,
  TerminalSquare,
  ArrowRight
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserProfileDropdown from "./UserProfileDropdown";
import useAuthStore from "../../store/authStore";
import useAgentStore from "../../store/agentStore";

const navigationItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Code Editor", path: "/editor", icon: TerminalSquare },
  { title: "Results", path: "/results", icon: BarChart3 },
  { title: "Fix Agent", path: "/fix", icon: Zap },
  { title: "History", path: "/history", icon: Clock },
  { title: "Settings", path: "/settings", icon: Settings },
  { title: "Billing", path: "/billing", icon: CreditCard },
];

function AgentLensLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex items-center gap-3 px-2 py-1 group cursor-pointer transition-all duration-300">
      <div className="flex h-9 w-9 items-center justify-center">
        <img src="/logo.png" alt="AgentLens Logo" className="h-7 w-7 object-contain bg-transparent" />
      </div>
      {!isCollapsed && (
        <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Agent<span className="text-violet-500">Lens</span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            AI Code Analysis
          </span>
        </div>
      )}
    </div>
  );
}

function UsageIndicator() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const usedAnalyses = 3;
  const maxAnalyses = 5;
  const remainingAnalyses = maxAnalyses - usedAnalyses;
  const usagePercentage = (usedAnalyses / maxAnalyses) * 100;

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center px-2 py-3">
        <div
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border/50 shadow-sm"
          title={`${remainingAnalyses} analyses remaining`}
        >
          <svg className="h-8 w-8 -rotate-90 transform">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" className="text-muted/30" />
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={`${usagePercentage * 0.88} 88`} className="text-violet-500 transition-all duration-500" />
          </svg>
          <span className="absolute text-[10px] font-bold text-foreground">{remainingAnalyses}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-md p-3 shadow-sm transition-all hover:bg-background/80 hover:border-violet-500/30">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-bold text-foreground">Free Tier</span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {remainingAnalyses} left
          </span>
        </div>
        <Progress value={usagePercentage} className="h-1.5 bg-muted/50 [&>div]:bg-violet-500" />
        <p className="mt-1.5 text-[10px] text-muted-foreground font-medium">
          {usedAnalyses} of {maxAnalyses} analyses used
        </p>
      </div>
    </div>
  );
}

function NavigationMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarMenu className="gap-1">
      {navigationItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              onClick={() => navigate(item.path)}
              isActive={active}
              tooltip={isCollapsed ? item.title : undefined}
              className={`
                group relative transition-all duration-200 rounded-lg h-9
                ${active
                  ? "bg-violet-500/10 text-violet-500 font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }
              `}
            >
              {active && (
                <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-violet-500" />
              )}
              <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-violet-500" : ""}`} />
              {!isCollapsed && (
                <span className="text-[13px] ml-1">{item.title}</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function FixAgentShortcut() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const securitySummary = useAgentStore((s) => s.securitySummary);
  const pipelinePhase = useAgentStore((s) => s.currentPhase);

  const bugCount = securitySummary?.totalIssues || securitySummary?.bugs?.length || securitySummary?.issues?.length || 0;
  const hasResults = pipelinePhase === "complete";

  if (isCollapsed) return null;

  return (
    <div className="px-3 py-3">
      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-bold text-foreground">Fix Agent</span>
          </div>
          {hasResults && bugCount > 0 && (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] font-bold px-1.5 py-0">
              <Bug className="w-3 h-3 mr-0.5" /> {bugCount}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          {hasResults
            ? bugCount > 0
              ? `${bugCount} bug${bugCount !== 1 ? 's' : ''} detected — auto-fix with AI`
              : 'No bugs detected in your code'
            : 'Run an analysis to detect fixable bugs'
          }
        </p>
        <Button
          size="sm"
          onClick={() => navigate('/fix')}
          className="w-full h-7 text-[11px] font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm"
        >
          <Zap className="w-3 h-3 mr-1" />
          Go to Fix Agent
          <ArrowRight className="w-3 h-3 ml-auto" />
        </Button>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const isPro = useAuthStore((state) => state.isPro);
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30 bg-background/90 backdrop-blur-xl z-50">
      
      <SidebarHeader className="border-b border-border/20 px-3 py-3.5">
        <AgentLensLogo />
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        {/* Navigation */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1.5">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavigationMenu />
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-border/20 mx-4 w-auto" />

        {/* Fix Agent Shortcut */}
        <FixAgentShortcut />

        {/* Usage indicator for free users */}
        {!isPro && <UsageIndicator />}
      </SidebarContent>

      <SidebarFooter className="mt-auto px-3 py-2.5 border-t border-border/20">
        <UserProfileDropdown />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}