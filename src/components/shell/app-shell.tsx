import React from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area Wrapper */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
