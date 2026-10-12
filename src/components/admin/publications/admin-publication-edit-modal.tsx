"use client";

import React, { useState, useTransition } from "react";
import { PublicationType, ScopusQuartile, StudentInvolvement } from "@prisma/client";
import { adminUpdatePublicationAction } from "@/server/actions/publication.actions";
import { Edit3, Loader2, X, Save, BookOpen, Sparkles, DollarSign, Calendar } from "lucide-react";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface PublicationEditData {
  id: string;
  title: string;
  publicationType: PublicationType;
  departmentId: string;
  venueName?: string | null;
  publisher?: string | null;
  issn?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  isScopus: boolean;
  isWebOfScience: boolean;
  quartile: ScopusQuartile;
  impactFactor?: unknown;
  submissionDate?: Date | string | null;
  acceptanceDate?: Date | string | null;
  publicationDate?: Date | string | null;
  doi?: string | null;
  publicationUrl?: string | null;
  fundingAgency?: string | null;
  grantTitle?: string | null;
  grantAmountLakhs?: unknown;
  studentInvolvement: StudentInvolvement;
}

interface AdminPublicationEditModalProps {
  publication: PublicationEditData;
  departments: DepartmentOption[];
  onSuccess?: () => void;
}

export function AdminPublicationEditModal({
  publication,
  departments,
  onSuccess,
}: AdminPublicationEditModalProps) {
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
    departmentId: publication.departmentId,
    venueName: publication.venueName || "",
    publisher: publication.publisher || "",
    issn: publication.issn || "",
    volume: publication.volume || "",
    issue: publication.issue || "",
    pages: publication.pages || "",
    isScopus: publication.isScopus,
    isWebOfScience: publication.isWebOfScience,
    quartile: publication.quartile,
    impactFactor: publication.impactFactor !== undefined && publication.impactFactor !== null ? String(publication.impactFactor) : "",
    submissionDate: formatDateInput(publication.submissionDate),
    acceptanceDate: formatDateInput(publication.acceptanceDate),
    publicationDate: formatDateInput(publication.publicationDate),
    doi: publication.doi || "",
    publicationUrl: publication.publicationUrl || "",
    fundingAgency: publication.fundingAgency || "",
    grantTitle: publication.grantTitle || "",
    grantAmountLakhs: publication.grantAmountLakhs !== undefined && publication.grantAmountLakhs !== null ? String(publication.grantAmountLakhs) : "",
    studentInvolvement: publication.studentInvolvement,
  });

  const openModal = () => {
    setErrorMsg(null);
    setFormData({
      title: publication.title,
      publicationType: publication.publicationType,
      departmentId: publication.departmentId,
      venueName: publication.venueName || "",
      publisher: publication.publisher || "",
      issn: publication.issn || "",
      volume: publication.volume || "",
      issue: publication.issue || "",
      pages: publication.pages || "",
      isScopus: publication.isScopus,
      isWebOfScience: publication.isWebOfScience,
      quartile: publication.quartile,
      impactFactor: publication.impactFactor !== undefined && publication.impactFactor !== null ? String(publication.impactFactor) : "",
      submissionDate: formatDateInput(publication.submissionDate),
      acceptanceDate: formatDateInput(publication.acceptanceDate),
      publicationDate: formatDateInput(publication.publicationDate),
      doi: publication.doi || "",
      publicationUrl: publication.publicationUrl || "",
      fundingAgency: publication.fundingAgency || "",
      grantTitle: publication.grantTitle || "",
      grantAmountLakhs: publication.grantAmountLakhs !== undefined && publication.grantAmountLakhs !== null ? String(publication.grantAmountLakhs) : "",
      studentInvolvement: publication.studentInvolvement,
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    if (isPending) return;
    setIsOpen(false);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg("Publication title is required.");
      return;
    }

    startTransition(async () => {
      try {
        await adminUpdatePublicationAction(publication.id, {
          title: formData.title,
          publicationType: formData.publicationType,
          departmentId: formData.departmentId,
          venueName: formData.venueName || null,
          publisher: formData.publisher || null,
          issn: formData.issn || null,
          volume: formData.volume || null,
          issue: formData.issue || null,
          pages: formData.pages || null,
          isScopus: formData.isScopus,
          isWebOfScience: formData.isWebOfScience,
          quartile: formData.quartile,
          impactFactor: formData.impactFactor ? parseFloat(formData.impactFactor) : null,
          submissionDate: formData.submissionDate || null,
          acceptanceDate: formData.acceptanceDate || null,
          publicationDate: formData.publicationDate || null,
          doi: formData.doi || null,
          publicationUrl: formData.publicationUrl || null,
          fundingAgency: formData.fundingAgency || null,
          grantTitle: formData.grantTitle || null,
          grantAmountLakhs: formData.grantAmountLakhs ? parseFloat(formData.grantAmountLakhs) : null,
          studentInvolvement: formData.studentInvolvement,
        });

        closeModal();
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Update failed. Please try again.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all shrink-0"
      >
        <Edit3 className="h-3.5 w-3.5 text-slate-500" />
        <span>Edit Record</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-6 my-8">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-amber-400" />
                  <span>Admin Publication Record Editor</span>
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Editing record <span className="font-mono text-slate-300">ID: {publication.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Primary Metadata */}
              <div className="space-y-4">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-800 pb-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Core Information</span>
                </h4>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Publication Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Publication Type</label>
                    <select
                      value={formData.publicationType}
                      onChange={(e) => setFormData({ ...formData, publicationType: e.target.value as PublicationType })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="JOURNAL_ARTICLE">Journal Article</option>
                      <option value="CONFERENCE_PAPER">Conference Paper</option>
                      <option value="BOOK_CHAPTER">Book Chapter</option>
                      <option value="REVIEW_ARTICLE">Review Article</option>
                      <option value="PATENT">Patent</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Assigned Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} — {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Journal & Indexing */}
              <div className="space-y-4">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-800 pb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Journal, Indexing & Quality Metrics</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Journal / Venue Name</label>
                    <input
                      type="text"
                      value={formData.venueName}
                      onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Publisher</label>
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">ISSN / eISSN</label>
                    <input
                      type="text"
                      value={formData.issn}
                      onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Scopus Quartile</label>
                    <select
                      value={formData.quartile}
                      onChange={(e) => setFormData({ ...formData, quartile: e.target.value as ScopusQuartile })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Q1">Q1 (Top Quartile)</option>
                      <option value="Q2">Q2 (Second Quartile)</option>
                      <option value="Q3">Q3 (Third Quartile)</option>
                      <option value="Q4">Q4 (Fourth Quartile)</option>
                      <option value="UNSPECIFIED">Unspecified</option>
                      <option value="NOT_SCOPUS">Not Scopus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Impact Factor</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.impactFactor}
                      onChange={(e) => setFormData({ ...formData, impactFactor: e.target.value })}
                      placeholder="e.g. 4.52"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">DOI Identifier</label>
                    <input
                      type="text"
                      value={formData.doi}
                      onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                      placeholder="10.1016/j.example..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isScopus}
                      onChange={(e) => setFormData({ ...formData, isScopus: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-300">Scopus Indexed</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isWebOfScience}
                      onChange={(e) => setFormData({ ...formData, isWebOfScience: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-300">Web of Science (WoS)</span>
                  </label>
                </div>
              </div>

              {/* Pipeline Dates */}
              <div className="space-y-4">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-800 pb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Pipeline Dates</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Submission Date</label>
                    <input
                      type="date"
                      value={formData.submissionDate}
                      onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Acceptance Date</label>
                    <input
                      type="date"
                      value={formData.acceptanceDate}
                      onChange={(e) => setFormData({ ...formData, acceptanceDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Publication Date</label>
                    <input
                      type="date"
                      value={formData.publicationDate}
                      onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Funding & Grants */}
              <div className="space-y-4">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-800 pb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Funding & Student Involvement</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Funding Agency</label>
                    <input
                      type="text"
                      value={formData.fundingAgency}
                      onChange={(e) => setFormData({ ...formData, fundingAgency: e.target.value })}
                      placeholder="e.g. DST / ISRO / Self"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Grant Amount (Lakhs ₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.grantAmountLakhs}
                      onChange={(e) => setFormData({ ...formData, grantAmountLakhs: e.target.value })}
                      placeholder="e.g. 5.50"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Student Involvement</label>
                    <select
                      value={formData.studentInvolvement}
                      onChange={(e) => setFormData({ ...formData, studentInvolvement: e.target.value as StudentInvolvement })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="NONE">None</option>
                      <option value="UG_ONLY">UG Students</option>
                      <option value="PG_ONLY">PG Students</option>
                      <option value="PHD_ONLY">PhD Scholars</option>
                      <option value="MIXED">Mixed Involvement</option>
                    </select>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-all disabled:opacity-40"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Record Updates</span>
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
