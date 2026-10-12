"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  User,
  PlusCircle,
} from "lucide-react";

import { UserProfileButton } from "./user-profile-button";

const NAV_ITEMS = [
  { name: "My Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
  { name: "My Publications", href: "/user/publications", icon: BookOpen },
  { name: "New Submission", href: "/user/publications/new", icon: PlusCircle },
  { name: "My Profile", href: "/user/profile", icon: User },
];


export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      {/* Mobile Top Bar Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label="Open Mobile Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop & Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex w-full max-w-xs flex-col bg-slate-900 text-slate-100 p-4 shadow-xl border-r border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
                  <GraduationCap className="h-5 w-5 font-bold" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold tracking-tight text-white text-sm">
                    NIE MYSORE
                  </span>
                  <span className="text-[10px] font-semibold text-amber-400">
                    Research Portal
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 space-y-1.5 py-4">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Action Button */}
            <div className="pb-4">
              <Link
                href="/user/publications/new"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow hover:bg-amber-400 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Publication</span>
              </Link>
            </div>


            {/* User Profile */}
            <div className="border-t border-slate-800 pt-3">
              <UserProfileButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
