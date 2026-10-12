"use client";

import React, { useState, useTransition } from "react";
import { ScopusQuartile, PublicationType } from "@prisma/client";
import { fixDataQualityIssueAction } from "@/server/actions/data-quality.actions";
import { QualityMetricKey, AffectedPublicationItem } from "@/server/services/data-quality.service";
import { Edit3, Loader2, X, Save, AlertTriangle, ShieldAlert } from "lucide-react";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface DataQualityFixModalProps {
  publication: AffectedPublicationItem;
  departments: DepartmentOption[];
  activeMetricKey: QualityMetricKey;
  onSuccess: () => void;
}

export function DataQualityFixModal({
  publication,
  departments,
  activeMetricKey,
  onSuccess,
}: DataQualityFixModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatDateInput = (dateVal?: Date | string | null) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    title: publication.title,
    publicationType: publication.publicationType,
    departmentId: publication.department.id,
    venueName: publication.venueName || "",
    doi: publication.doi || "",
    quartile: publication.quartile,
    isScopus: publication.isScopus,
    isWebOfScience: publication.isWebOfScience,
    submissionDate: formatDateInput(publication.submissionDate),
    acceptanceDate: formatDateInput(publication.acceptanceDate),
    publicationDate: formatDateInput(publication.publicationDate),
    adminComment: `Data quality correction for ${activeMetricKey.replace(/_/g, " ")}`,
  });

  const openModal = () => {
    setErrorMsg(null);
    setFormData({
      title: publication.title,
      publicationType: publication.publicationType,
      departmentId: publication.department.id,
      venueName: publication.venueName || "",
      doi: publication.doi || "",
      quartile: publication.quartile,
      isScopus: publication.isScopus,
      isWebOfScience: publication.isWebOfScience,
      submissionDate: formatDateInput(publication.submissionDate),
      acceptanceDate: formatDateInput(publication.acceptanceDate),
      publicationDate: formatDateInput(publication.publicationDate),
      adminComment: `Data quality correction for ${activeMetricKey.replace(/_/g, " ")}`,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await fixDataQualityIssueAction(publication.id, {
          metricKey: activeMetricKey,
          title: formData.title,
          publicationType: formData.publicationType,
          departmentId: formData.departmentId,
          venueName: formData.venueName || null,
          doi: formData.doi || null,
          quartile: formData.quartile,
          isScopus: formData.isScopus,
          isWebOfScience: formData.isWebOfScience,
          submissionDate: formData.submissionDate || null,
          acceptanceDate: formData.acceptanceDate || null,
          publicationDate: formData.publicationDate || null,
          adminComment: formData.adminComment,
        });

        if (res.success) {
          setIsOpen(false);
          onSuccess();
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Failed to apply data quality correction.");
        }
      }
    });
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-colors"
      >
        <Edit3 className="h-3.5 w-3.5" />
        <span>Fix Issue</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 z-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold">Data Quality Correction</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Reported Issues Banner */}
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Detected Issues on Record:</span>
              </div>
              <ul className="mt-1.5 space-y-1 pl-6 list-disc text-xs text-amber-800">
                {publication.issues.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Correction Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Publication Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Publication Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.code} - {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Publication Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Publication Type
                  </label>
                  <select
                    value={formData.publicationType}
                    onChange={(e) =>
                      setFormData({ ...formData, publicationType: e.target.value as PublicationType })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                  >
                    {Object.values(PublicationType).map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DOI */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    DOI (Digital Object Identifier)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10.1016/j.jss.2024.111900"
                    value={formData.doi}
                    onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Scopus Quartile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Scopus Quartile
                  </label>
                  <select
                    value={formData.quartile}
                    onChange={(e) =>
                      setFormData({ ...formData, quartile: e.target.value as ScopusQuartile })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                  >
                    {Object.values(ScopusQuartile).map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Indexing Checkboxes */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="block text-xs font-bold text-slate-700 mb-2">
                  Indexing Compliance Flags
                </span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isScopus}
                      onChange={(e) => setFormData({ ...formData, isScopus: e.target.checked })}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Scopus Indexed</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isWebOfScience}
                      onChange={(e) => setFormData({ ...formData, isWebOfScience: e.target.checked })}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Web of Science (WoS) Indexed</span>
                  </label>
                </div>
              </div>

              {/* Pipeline Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">
                    Submission Date
                  </label>
                  <input
                    type="date"
                    value={formData.submissionDate}
                    onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700">
                    Acceptance Date
                  </label>
                  <input
                    type="date"
                    value={formData.acceptanceDate}
                    onChange={(e) => setFormData({ ...formData, acceptanceDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formData.publicationDate}
                    onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Justification note for AuditLog */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Audit Correction Justification
                </label>
                <input
                  type="text"
                  required
                  value={formData.adminComment}
                  onChange={(e) => setFormData({ ...formData, adminComment: e.target.value })}
                  placeholder="Reason recorded in AuditLog for this data fix..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Correction...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save & Record AuditLog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
