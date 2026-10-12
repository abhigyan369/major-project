"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Building2,
  BarChart3,
  GraduationCap,
  Award,
  ChevronRight,
  ShieldCheck,
  Users,
  FileText,
  PlusCircle,
  Bell,
  User,
  FileSpreadsheet,
} from "lucide-react";
import { UserProfileButton } from "./user-profile-button";

const ADMIN_NAV_ITEMS = [
  { name: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "All Publications", href: "/admin/publications", icon: BookOpen },
  { name: "Pending Approvals", href: "/admin/approvals", icon: ShieldCheck },
  { name: "Data Quality Dashboard", href: "/admin/data-quality", icon: ShieldCheck },
  { name: "Excel Data Import", href: "/admin/import", icon: FileSpreadsheet },
  { name: "Reports & Data Export", href: "/admin/reports", icon: FileSpreadsheet },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Departments & Faculty", href: "/admin/departments", icon: Building2 },
  { name: "Analytics & NIRF KPIs", href: "/admin/analytics", icon: BarChart3 },
  { name: "System Audit Logs", href: "/admin/audit-logs", icon: FileText },
];

const USER_NAV_ITEMS = [
  { name: "My Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
  { name: "My Publications", href: "/user/publications", icon: BookOpen },
  { name: "New Submission", href: "/user/publications/new", icon: PlusCircle },
  { name: "My Profile", href: "/user/profile", icon: User },
  { name: "Notifications", href: "/user/notifications", icon: Bell },
];


export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "USER";

  const navItems = role === "ADMIN" ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-900 text-slate-200 border-r border-slate-800 min-h-screen">
      {/* Institutional Branding Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 shadow-md">
          <GraduationCap className="h-5 w-5 font-bold" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-white text-sm">
            NIE MYSORE
          </span>
          <span className="text-[10px] font-semibold text-amber-400 tracking-wider uppercase">
            {role === "ADMIN" ? "Admin Control Hub" : "Faculty Portal"}
          </span>
        </div>
      </div>

      {/* Primary Navigation Menu */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {role === "ADMIN" ? "Administrator Navigation" : "Faculty Workspace"}
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              item.href !== "/user/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-amber-400" />}
            </Link>
          );
        })}
      </nav>

      {/* NIRF Target Callout Card */}
      <div className="px-3 py-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Award className="h-4 w-4" />
            <span>NIRF Target FY25-26</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-snug">
            3.0 publications per faculty target active across 10 departments.
          </p>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="border-t border-slate-800 p-3">
        <UserProfileButton />
      </div>
    </aside>
  );
}
