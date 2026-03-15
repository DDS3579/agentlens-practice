// client/src/components/ui/UserProfileDropdown.jsx
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  ChevronUp,
  User,
  CreditCard,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";

// Get user initials from name
function getInitials(firstName, lastName, fullName) {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (fullName) {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  return "AL";
}

export default function UserProfileDropdown() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex h-12 items-center justify-center rounded-lg bg-sidebar-accent/30">
        <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground/50" />
      </div>
    );
  }

  // No user (shouldn't happen in authenticated routes)
  if (!user) {
    return null;
  }

  const initials = getInitials(user.firstName, user.lastName, user.fullName);
  const displayName = user.fullName || user.firstName || "User";
  const displayEmail = user.primaryEmailAddress?.emailAddress || "";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleViewProfile = () => {
    openUserProfile();
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`
            flex w-full items-center gap-3 rounded-lg p-2 
            text-left transition-colors duration-200
            hover:bg-sidebar-accent focus-visible:outline-none 
            focus-visible:ring-2 focus-visible:ring-sidebar-ring
            ${isCollapsed ? "justify-center" : ""}
          `}
        >
          {/* Avatar */}
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border">
            <AvatarImage 
              src={user.imageUrl} 
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-medium text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* User Info (hidden when collapsed) */}
          {!isCollapsed && (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-sidebar-foreground">
                  {displayName}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/50">
                  {displayEmail}
                </span>
              </div>

              {/* Chevron indicator */}
              <ChevronUp className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align={isCollapsed ? "center" : "start"}
        sideOffset={8}
        className="w-64 rounded-xl border-sidebar-border bg-popover p-2 shadow-xl"
      >
        {/* User Header */}
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 rounded-lg bg-accent/50 p-3">
            <Avatar className="h-10 w-10 ring-2 ring-border">
              <AvatarImage 
                src={user.imageUrl} 
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-medium text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {displayEmail}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-2" />

        {/* Menu Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleViewProfile}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span>View Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleNavigate("/billing")}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>Manage Billing</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleNavigate("/settings")}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}