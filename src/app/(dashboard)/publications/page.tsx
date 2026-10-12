import React from "react";
import { getRecentPublications } from "@/server/services/publication.service";
import { StatusBadge } from "@/components/shared/status-badge";
import { BookOpen, Filter, Search, Plus } from "lucide-react";

export const revalidate = 0;

export default async function PublicationsPage() {
  const publications = await getRecentPublications(20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Research Publications Tracker
          </h1>
          <p className="text-xs text-slate-500">
            Central repository for faculty manuscripts, Scopus/WoS indexed articles, and review pipeline status.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition-colors">
          <Plus className="h-4 w-4 text-amber-400" />
          <span>New Submission</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, author, DOI..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter Options</span>
          </button>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {publications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-700">
              No publications created yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Phase 1 application shell is active. Legacy Excel data migration will take place in Phase 2.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Title & Authors</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Venue / Journal</th>
                  <th className="px-4 py-3">Quartile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publications.map((pub) => (
                  <tr key={pub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 max-w-md">
                        <div className="font-semibold text-slate-900 line-clamp-1">{pub.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {pub.authors.map((a) => a.authorName).join(", ") || "No authors listed"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {pub.department.code}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={pub.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {pub.journal?.name || pub.venueName || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge quartile={pub.quartile} />
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
