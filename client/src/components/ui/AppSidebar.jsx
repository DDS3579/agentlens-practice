// client/src/components/ui/AppSidebar.jsx
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Settings,
  CreditCard,
  Code2,
  Sparkles,
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
import UserProfileDropdown from "./UserProfileDropdown";
import { useCallback } from "react";
import useAuthStore from "../../store/authStore";
import useAgentStore from "../../store/agentStore";
import useFixStore from "../../store/fixStore";
import CustomAgentPanel from "../agents/CustomAgentPanel";

// Navigation items configuration - updated paths to match your routes
const navigationItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "History",
    path: "/history",
    icon: Clock,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    title: "Billing",
    path: "/billing",
    icon: CreditCard,
  },
];

// Logo component with inline icon
function AgentLensLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
        <Code2 className="h-4 w-4 text-white" />
      </div>
      {!isCollapsed && (
        <div className="flex flex-col">
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            AgentLens
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
            AI Code Analysis
          </span>
        </div>
      )}
    </div>
  );
}

// Usage indicator for free tier
function UsageIndicator() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // TODO: Connect to your actual billing store
  // import { useBillingStore } from '@/stores/billingStore'
  // const { usedAnalyses, maxAnalyses } = useBillingStore()
  const usedAnalyses = 3;
  const maxAnalyses = 5;
  const remainingAnalyses = maxAnalyses - usedAnalyses;
  const usagePercentage = (usedAnalyses / maxAnalyses) * 100;

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center px-2 py-3">
        <div
          className="relative flex h-8 w-8 items-center justify-center rounded-full"
          title={`${remainingAnalyses} analyses remaining`}
        >
          {/* Background circle */}
          <svg className="h-8 w-8 -rotate-90 transform">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-sidebar-accent"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${usagePercentage * 0.88} 88`}
              className="text-violet-500"
            />
          </svg>
          <span className="absolute text-xs font-bold text-sidebar-foreground">
            {remainingAnalyses}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-medium text-sidebar-foreground">
              Free Tier
            </span>
          </div>
          <span className="text-xs text-sidebar-foreground/70">
            {remainingAnalyses} left
          </span>
        </div>
        <Progress value={usagePercentage} className="h-1.5 bg-sidebar-accent" />
        <p className="mt-2 text-[10px] text-sidebar-foreground/50">
          {usedAnalyses} of {maxAnalyses} analyses used this month
        </p>
      </div>
    </div>
  );
}

// Navigation menu component
function NavigationMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarMenu>
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
                group relative transition-all duration-200
                ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }
              `}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-500" />
              )}

              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? "text-violet-400" : "group-hover:text-violet-400"
                }`}
              />

              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export default function AppSidebar() {
  const navigate = useNavigate();

  // Get Pro status
  const isPro = useAuthStore((state) => state.isPro);

  // Get session info
  const sessionId = useAgentStore((state) => state.sessionId);
  const isAnalyzing = useAgentStore((state) => state.isAnalyzing);

  // Fix store actions
  const setCustomPrompt = useFixStore((state) => state.setCustomPrompt);

  // Handle custom prompt submission
  const handleCustomPromptSubmit = useCallback(
    async (promptText) => {
      // Store the prompt
      setCustomPrompt(promptText);

      // If there's an active session, trigger the custom agent immediately
      if (sessionId && !isAnalyzing) {
        try {
          // Get auth token
          const getToken = window.__agentlens_getToken;
          if (!getToken) {
            console.warn("[AppSidebar] No getToken function available");
            return;
          }

          const token = await getToken();

          // POST to custom agent endpoint
          const response = await fetch("/api/fix/custom", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId,
              customPrompt: promptText,
            }),
          });

          if (!response.ok) {
            console.error(
              "[AppSidebar] Custom agent request failed:",
              response.status,
            );
          }
        } catch (error) {
          console.error("[AppSidebar] Error triggering custom agent:", error);
        }
      } else {
        // No active session - prompt will be used in next analysis
        console.log(
          "[AppSidebar] Custom prompt stored, will run with next analysis",
        );
      }
    },
    [sessionId, isAnalyzing, setCustomPrompt],
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border/50 px-2 py-4">
        <AgentLensLogo />
      </SidebarHeader>

      {/* Main Navigation Content */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/40">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavigationMenu />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ============================================
            CUSTOM AGENT PANEL - ADD THIS SECTION
            Only show for Pro users, but render with isPro prop
            so free users see the teaser/disabled state
            ============================================ */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/40">
            Pro Tools
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-1">
            <CustomAgentPanel
              onSubmitPrompt={handleCustomPromptSubmit}
              isPro={isPro}
            />
          </SidebarGroupContent>
        </SidebarGroup>
        {/* ============================================
            END CUSTOM AGENT PANEL
            ============================================ */}
      </SidebarContent>

      {/* Footer with Usage & Profile */}
      <SidebarFooter className="mt-auto">
        {/* Usage Indicator */}
        <UsageIndicator />

        <Separator className="bg-sidebar-border/50" />

        {/* User Profile Dropdown */}
        <div className="p-2">
          <UserProfileDropdown />
        </div>
      </SidebarFooter>

      {/* Rail for collapsed state hover */}
      <SidebarRail />
    </Sidebar>
  );
}
