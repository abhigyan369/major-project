"use client";

import React, { useState } from "react";
import { FacultyDesignation } from "@prisma/client";
import { updateUserProfileAction } from "@/server/actions/user.actions";
import { User, CheckCircle, AlertCircle, Save } from "lucide-react";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface UserProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    status: string;
    designation: FacultyDesignation | null;
    departmentId: string | null;
    department?: {
      code: string;
      name: string;
    } | null;
  };
  departments: DepartmentOption[];
}

export function UserProfileForm({ user, departments }: UserProfileFormProps) {
  const [name, setName] = useState(user.name || "");
  const [designation, setDesignation] = useState<FacultyDesignation | "">(
    user.designation || ""
  );
  const [departmentId, setDepartmentId] = useState(user.departmentId || "");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateUserProfileAction({
        name,
        designation: designation ? (designation as FacultyDesignation) : null,
        departmentId: departmentId || null,
      });
      setSuccessMsg("Profile updated successfully!");
    } catch (err: unknown) {
      const errorObj = err as Error;
      setErrorMsg(errorObj.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <User className="h-4 w-4 text-amber-500" />
        <span>Personal & Academic Details</span>
      </h2>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Email (Disabled read-only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Institutional Email (Immutable)
          </label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs text-slate-500 cursor-not-allowed"
          />
        </div>

        {/* Designation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Faculty Designation
          </label>
          <select
            value={designation}
            onChange={(e) => setDesignation(e.target.value as FacultyDesignation)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="">Select Designation...</option>
            {Object.values(FacultyDesignation).map((desig) => (
              <option key={desig} value={desig}>
                {desig.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Department
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="">Select Department...</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Update Profile Details</span>
        </button>
      </div>
    </form>
  );
}
