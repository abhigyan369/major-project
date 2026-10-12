"use client";

import React from "react";
import { Search, Plus, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Breadcrumb } from "@/components/shared/breadcrumb";

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur gap-2 sm:gap-4">
      {/* Left Area: Mobile Drawer & Branding + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav />
        <div className="hidden lg:flex flex-col min-w-0">
          <h1 className="text-xs font-bold text-slate-900 leading-tight truncate">
            The National Institute of Engineering, Mysore
          </h1>
          <Breadcrumb className="mt-0.5" />
        </div>
      </div>

      {/* Center Search Input Area */}
      <div className="flex flex-1 items-center justify-center px-2 max-w-sm sm:max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            aria-label="Search research publications"
            placeholder="Search papers, DOIs, authors, or venues..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Interactive Notification Bell */}
        <NotificationBell />

        {/* Quick Submit Publication Link Button */}
        <Link
          href="/user/publications/new"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-950 focus:ring-offset-1"
        >
          <Plus className="h-3.5 w-3.5 text-amber-400" />
          <span>New Submission</span>
        </Link>

        {/* Top Header Sign Out Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign Out"
          aria-label="Sign Out"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors focus:ring-2 focus:ring-rose-500"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
