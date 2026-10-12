"use client";

import React, { useState, useTransition } from "react";
import { X, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { UserRole, UserStatus, FacultyDesignation } from "@prisma/client";
import { adminCreateUserAction } from "@/server/actions/user-admin.actions";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Array<{ id: string; code: string; name: string }>;
}

export function CreateUserModal({ isOpen, onClose, departments }: CreateUserModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [departmentId, setDepartmentId] = useState("");
  const [designation, setDesignation] = useState<FacultyDesignation | "">("");
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [status, setStatus] = useState<UserStatus>(UserStatus.ACTIVE);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await adminCreateUserAction({
        name,
        email,
        password,
        departmentId: departmentId || null,
        designation: (designation as FacultyDesignation) || null,
        role,
        status,
      });

      if (res.success) {
        onClose();
        // reset form
        setName("");
        setEmail("");
        setPassword("password123");
        setDepartmentId("");
        setDesignation("");
        setRole(UserRole.USER);
        setStatus(UserStatus.ACTIVE);
      } else {
        setError(res.error || "Failed to create user");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Institutional User</h2>
              <p className="text-xs text-slate-500">Register new faculty, research scholars, or administrators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. ramesh.kumar@nie.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
            <input
              type="text"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default password set to password123</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value as FacultyDesignation)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">None / Unspecified</option>
                <option value="PROFESSOR">Professor</option>
                <option value="ASSOCIATE_PROFESSOR">Associate Professor</option>
                <option value="ASSISTANT_PROFESSOR">Assistant Professor</option>
                <option value="CONTRACT_FACULTY">Contract Faculty</option>
                <option value="RESEARCH_SCHOLAR">Research Scholar</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Authorization Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="USER">User (Faculty / Scholar)</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 disabled:opacity-50 transition-all"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
