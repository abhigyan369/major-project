"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  admin: "Admin",
  user: "Faculty Portal",
  dashboard: "Dashboard",
  publications: "Publications",
  new: "New Submission",
  approvals: "Pending Approvals",
  "data-quality": "Data Quality",
  import: "Excel Import",
  reports: "Reports & Export",
  users: "Users",
  departments: "Departments",
  analytics: "Analytics & NIRF",
  "audit-logs": "Audit Logs",
  profile: "Profile",
  notifications: "Notifications",
};

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const pathname = usePathname();

  let breadcrumbs: BreadcrumbItem[] = [];

  if (items && items.length > 0) {
    breadcrumbs = items;
  } else {
    // Generate automatically from pathname
    const segments = pathname.split("/").filter(Boolean);
    let accumPath = "";

    breadcrumbs = segments.map((segment) => {
      accumPath += `/${segment}`;
      const label =
        ROUTE_LABELS[segment] ||
        (segment.length > 20 ? "Detail" : segment.charAt(0).toUpperCase() + segment.slice(1));

      return {
        label,
        href: accumPath,
      };
    });
  }

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-slate-500 ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link
            href={pathname.startsWith("/admin") ? "/admin/dashboard" : "/user/dashboard"}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
          >
            <Home className="h-3.5 w-3.5 text-slate-400" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbs.map((item, idx) => {
          const isLast = idx === breadcrumbs.length - 1;

          return (
            <li key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              {isLast || !item.href ? (
                <span className="font-semibold text-slate-900 truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-slate-900 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
