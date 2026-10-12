"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Shield, LogOut } from "lucide-react";

interface UserProfileButtonProps {
  collapsed?: boolean;
  className?: string;
}

export function UserProfileButton({
  collapsed = false,
  className,
}: UserProfileButtonProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className={cn("flex items-center gap-3 p-2.5 text-xs text-slate-400 animate-pulse", className)}>
        <div className="h-9 w-9 rounded-full bg-slate-800" />
        {!collapsed && <div className="h-4 w-24 rounded bg-slate-800" />}
      </div>
    );
  }

  const user = session?.user;
  const name = user?.name || user?.email || "Guest User";
  const role = user?.role || "USER";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  if (collapsed) {
    return (
      <button
        onClick={handleSignOut}
        title={`Sign out ${name} (${role})`}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-amber-400 ring-2 ring-amber-500/30 transition-all hover:ring-amber-500 hover:bg-slate-700",
          className
        )}
      >
        {initials}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-800/80 p-2.5 transition-all hover:border-slate-600",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 font-bold text-amber-400 ring-1 ring-amber-500/40 text-xs">
          {initials}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-semibold text-slate-100">
              {name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
            <Shield className="h-3 w-3 shrink-0" />
            <span className="truncate tracking-wide uppercase">{role}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        title="Sign Out"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/60 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
