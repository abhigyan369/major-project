"use client";

import React from "react";
import Link from "next/link";
import { UserRole, UserStatus, FacultyDesignation } from "@prisma/client";
import {
  Eye,
  Edit,
  ShieldAlert,
  UserCheck,
  UserX,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  designation: FacultyDesignation | null;
  createdAt: Date;
  department: {
    id: string;
    code: string;
    name: string;
    campus: {
      name: string;
    };
  } | null;
  _count: {
    publicationsCreated: number;
    authorships: number;
  };
}

interface UserTableProps {
  users: UserItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onEditUser: (user: UserItem) => void;
  onToggleStatus: (user: UserItem) => void;
  onChangeRole: (user: UserItem) => void;
}

export function UserTable({
  users,
  totalCount,
  currentPage,
  totalPages,
  onEditUser,
  onToggleStatus,
  onChangeRole,
}: UserTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function formatDesignation(designation: FacultyDesignation | null) {
    if (!designation) return "Unassigned";
    switch (designation) {
      case "PROFESSOR":
        return "Professor";
      case "ASSOCIATE_PROFESSOR":
        return "Assoc. Professor";
      case "ASSISTANT_PROFESSOR":
        return "Asst. Professor";
      case "CONTRACT_FACULTY":
        return "Contract Faculty";
      case "RESEARCH_SCHOLAR":
        return "Research Scholar";
      default:
        return "Other";
    }
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider font-bold text-[10px] text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3.5">Name</th>
              <th scope="col" className="px-4 py-3.5">Email</th>
              <th scope="col" className="px-4 py-3.5">Department</th>
              <th scope="col" className="px-4 py-3.5">Designation</th>
              <th scope="col" className="px-4 py-3.5">Role</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Pubs</th>
              <th scope="col" className="px-4 py-3.5">Created</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {users.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  No users found matching the selected search and filter criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const totalPubs = user._count.publicationsCreated;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-xs uppercase border border-slate-200">
                          {user.name ? user.name.charAt(0) : "U"}
                        </div>
                        <div>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="font-bold text-slate-900 hover:text-amber-600 transition-colors block"
                          >
                            {user.name || "Unnamed User"}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-normal">ID: {user.id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-slate-700 font-mono text-[11px]">
                      {user.email}
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5">
                      {user.department ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Building className="h-3 w-3 text-slate-400" />
                            {user.department.code}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {user.department.campus.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {formatDesignation(user.designation)}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      {user.role === UserRole.ADMIN ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200">
                          <Shield className="h-3 w-3 text-amber-600" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                          USER
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {user.status === UserStatus.ACTIVE && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          ACTIVE
                        </span>
                      )}
                      {user.status === UserStatus.INACTIVE && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          INACTIVE
                        </span>
                      )}
                      {user.status === UserStatus.SUSPENDED && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          SUSPENDED
                        </span>
                      )}
                    </td>

                    {/* Publications */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        {totalPubs}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Detail Link */}
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="View User Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        {/* Edit User Button */}
                        <button
                          onClick={() => onEditUser(user)}
                          className="rounded-lg p-1 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit User Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Change Role Button */}
                        <button
                          onClick={() => onChangeRole(user)}
                          className="rounded-lg p-1 text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Change Authorization Role"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => onToggleStatus(user)}
                          className={`rounded-lg p-1 transition-colors ${
                            user.status === UserStatus.ACTIVE
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={user.status === UserStatus.ACTIVE ? "Deactivate User" : "Reactivate User"}
                        >
                          {user.status === UserStatus.ACTIVE ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Page <span className="font-bold text-slate-800">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-800">{totalPages}</span> (Total {totalCount} users)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
