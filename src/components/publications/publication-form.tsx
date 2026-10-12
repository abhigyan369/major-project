"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PublicationType,
  ScopusQuartile,
  StudentInvolvement,
  DocumentType,
} from "@prisma/client";
import { createPublicationSchema } from "@/validators/publication";
import {
  createPublicationAction,
  updatePublicationAction,
} from "@/server/actions/publication.actions";
import {
  FileText,
  BookOpen,
  Award,
  Calendar,
  Link as LinkIcon,
  HelpCircle,
  Paperclip,
  Save,
  Send,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-provider";


interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface JournalOption {
  id: string;
  name: string;
  scopusQuartile: string;
}

interface ResearchAreaOption {
  id: string;
  name: string;
}

interface InitialData {
  id?: string;
  title?: string;
  publicationType?: PublicationType;
  rawAuthors?: string;
  correspondingAuthorName?: string;
  departmentId?: string;
  researchAreaId?: string;
  journalId?: string;
  venueName?: string;
  publisher?: string;
  issn?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  isScopus?: boolean;
  isWebOfScience?: boolean;
  quartile?: ScopusQuartile;
  impactFactor?: number | null;
  submissionDate?: string | null;
  acceptanceDate?: string | null;
  publicationDate?: string | null;
  doi?: string;
  publicationUrl?: string;
  fundingAgency?: string;
  grantTitle?: string;
  grantAmountLakhs?: number | null;
  studentInvolvement?: StudentInvolvement;
  hasCollaboration?: boolean;
  externalCollaborators?: string;
}

interface PublicationFormProps {
  initialData?: InitialData;
  departments: DepartmentOption[];
  journals: JournalOption[];
  researchAreas: ResearchAreaOption[];
  userDefaultDepartmentId?: string;
}

export function PublicationForm({
  initialData,
  departments,
  journals,
  researchAreas,
  userDefaultDepartmentId,
}: PublicationFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    publicationType: initialData?.publicationType || PublicationType.JOURNAL_ARTICLE,
    rawAuthors: initialData?.rawAuthors || "",
    correspondingAuthorName: initialData?.correspondingAuthorName || "",
    departmentId: initialData?.departmentId || userDefaultDepartmentId || "",
    researchAreaId: initialData?.researchAreaId || "",

    journalId: initialData?.journalId || "",
    venueName: initialData?.venueName || "",
    publisher: initialData?.publisher || "",
    issn: initialData?.issn || "",
    volume: initialData?.volume || "",
    issue: initialData?.issue || "",
    pages: initialData?.pages || "",

    isScopus: initialData?.isScopus ?? false,
    isWebOfScience: initialData?.isWebOfScience ?? false,
    quartile: initialData?.quartile || ScopusQuartile.UNSPECIFIED,
    impactFactor: initialData?.impactFactor !== undefined && initialData?.impactFactor !== null ? String(initialData.impactFactor) : "",

    submissionDate: initialData?.submissionDate ? new Date(initialData.submissionDate).toISOString().split("T")[0] : "",
    acceptanceDate: initialData?.acceptanceDate ? new Date(initialData.acceptanceDate).toISOString().split("T")[0] : "",
    publicationDate: initialData?.publicationDate ? new Date(initialData.publicationDate).toISOString().split("T")[0] : "",

    doi: initialData?.doi || "",
    publicationUrl: initialData?.publicationUrl || "",

    fundingAgency: initialData?.fundingAgency || "",
    grantTitle: initialData?.grantTitle || "",
    grantAmountLakhs: initialData?.grantAmountLakhs !== undefined && initialData?.grantAmountLakhs !== null ? String(initialData.grantAmountLakhs) : "",
    studentInvolvement: initialData?.studentInvolvement || StudentInvolvement.NONE,
    hasCollaboration: initialData?.hasCollaboration ?? false,
    externalCollaborators: initialData?.externalCollaborators || "",
  });

  // Supporting Documents attachment list (Simulated upload state)
  const [documents, setDocuments] = useState<
    Array<{ fileName: string; fileType: string; documentType: DocumentType }>
  >([]);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<DocumentType>(DocumentType.MANUSCRIPT);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for field on edit
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAddDocument = () => {
    if (!docName.trim()) return;
    setDocuments((prev) => [
      ...prev,
      {
        fileName: docName.trim(),
        fileType: "application/pdf",
        documentType: docType,
      },
    ]);
    setDocName("");
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (actionType: "draft" | "submit") => {
    setServerError(null);
    setErrors({});

    const rawPayload = {
      ...formData,
      actionType,
      impactFactor: formData.impactFactor === "" ? null : Number(formData.impactFactor),
      grantAmountLakhs: formData.grantAmountLakhs === "" ? null : Number(formData.grantAmountLakhs),
    };

    // Zod validation check
    const validationResult = createPublicationSchema.safeParse(rawPayload);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      setServerError("Please fix the validation errors marked in red below.");
      toast.error("Form Validation Failed", "Please review highlighted fields in red.");
      return;
    }

    setLoading(true);

    try {
      if (initialData?.id) {
        // Update existing publication
        await updatePublicationAction(initialData.id, rawPayload);
        toast.success(
          actionType === "draft" ? "Draft Saved" : "Publication Submitted",
          actionType === "draft" ? "Your changes have been saved." : "Submitted for admin approval."
        );
        router.push(`/user/publications/${initialData.id}`);
      } else {
        // Create new publication
        const res = await createPublicationAction(rawPayload);
        if (res.success && res.publication) {
          toast.success(
            actionType === "draft" ? "Draft Saved" : "Publication Submitted",
            actionType === "draft" ? "Saved to your drafts." : "Submitted for admin approval."
          );
          router.push(`/user/publications/${res.publication.id}`);
        }
      }
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      const msg = errorObj.message || "An unexpected error occurred. Please try again.";
      setServerError(msg);
      toast.error("Submission Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {serverError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="space-y-8">
        {/* SECTION 1: BASIC INFORMATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              1. Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Deep Learning Architecture for Smart Grid Load Forecasting"
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 focus:outline-none transition-colors ${
                  errors.title
                    ? "border-red-500 bg-red-50 focus:border-red-600"
                    : "border-slate-300 bg-slate-50 focus:border-amber-500 focus:bg-white"
                }`}
              />
              {errors.title && <p className="mt-1 text-[11px] text-red-500">{errors.title}</p>}
            </div>

            {/* Publication Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication Type <span className="text-red-500">*</span>
              </label>
              <select
                name="publicationType"
                value={formData.publicationType}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                {Object.values(PublicationType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 focus:outline-none ${
                  errors.departmentId
                    ? "border-red-500 bg-red-50"
                    : "border-slate-300 bg-slate-50 focus:border-amber-500 focus:bg-white"
                }`}
              >
                <option value="" disabled>Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="mt-1 text-[11px] text-red-500">{errors.departmentId}</p>
              )}
            </div>

            {/* Authors */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authors (Comma-separated) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rawAuthors"
                value={formData.rawAuthors}
                onChange={handleInputChange}
                placeholder="e.g., Dr. Rajesh Kumar, Prof. S. Sharma, Ankit V."
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 focus:outline-none ${
                  errors.rawAuthors
                    ? "border-red-500 bg-red-50"
                    : "border-slate-300 bg-slate-50 focus:border-amber-500 focus:bg-white"
                }`}
              />
              {errors.rawAuthors && (
                <p className="mt-1 text-[11px] text-red-500">{errors.rawAuthors}</p>
              )}
            </div>

            {/* Corresponding Author */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corresponding Author Name
              </label>
              <input
                type="text"
                name="correspondingAuthorName"
                value={formData.correspondingAuthorName}
                onChange={handleInputChange}
                placeholder="e.g. Dr. Rajesh Kumar"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Research Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Research Area / Domain
              </label>
              <select
                name="researchAreaId"
                value={formData.researchAreaId}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                <option value="">Select Research Area (Optional)</option>
                {researchAreas.map((ra) => (
                  <option key={ra.id} value={ra.id}>
                    {ra.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2: JOURNAL / CONFERENCE INFORMATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              2. Journal & Conference Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Master Journal Picker */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Journal Master Selector (Optional)
              </label>
              <select
                name="journalId"
                value={formData.journalId}
                onChange={(e) => {
                  handleInputChange(e);
                  const selectedJ = journals.find((j) => j.id === e.target.value);
                  if (selectedJ) {
                    setFormData((prev) => ({
                      ...prev,
                      venueName: selectedJ.name,
                      quartile: (selectedJ.scopusQuartile as ScopusQuartile) || ScopusQuartile.UNSPECIFIED,
                    }));
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                <option value="">Choose from Indexed Journals database...</option>
                {journals.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.scopusQuartile})
                  </option>
                ))}
              </select>
            </div>

            {/* Journal / Conference Name */}
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Journal / Conference Name
              </label>
              <input
                type="text"
                name="venueName"
                value={formData.venueName}
                onChange={handleInputChange}
                placeholder="IEEE Transactions on Smart Grid"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publisher
              </label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleInputChange}
                placeholder="IEEE / Elsevier / Springer"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* ISSN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ISSN / E-ISSN
              </label>
              <input
                type="text"
                name="issn"
                value={formData.issn}
                onChange={handleInputChange}
                placeholder="1949-3053"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Volume
              </label>
              <input
                type="text"
                name="volume"
                value={formData.volume}
                onChange={handleInputChange}
                placeholder="14"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Issue */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue
              </label>
              <input
                type="text"
                name="issue"
                value={formData.issue}
                onChange={handleInputChange}
                placeholder="3"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Pages */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pages
              </label>
              <input
                type="text"
                name="pages"
                value={formData.pages}
                onChange={handleInputChange}
                placeholder="1420-1432"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: INDEXING & QUALITY METRICS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              3. Indexing & Impact Factor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Scopus Checkbox */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50">
              <input
                type="checkbox"
                id="isScopus"
                name="isScopus"
                checked={formData.isScopus}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              <label htmlFor="isScopus" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Scopus Indexed
              </label>
            </div>

            {/* Web of Science Checkbox */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50">
              <input
                type="checkbox"
                id="isWebOfScience"
                name="isWebOfScience"
                checked={formData.isWebOfScience}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              <label htmlFor="isWebOfScience" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Web of Science (WoS)
              </label>
            </div>

            {/* Quartile */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quartile (Scopus/WoS)
              </label>
              <select
                name="quartile"
                value={formData.quartile}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                {Object.values(ScopusQuartile).map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* Impact Factor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Impact Factor
              </label>
              <input
                type="number"
                step="0.001"
                name="impactFactor"
                value={formData.impactFactor}
                onChange={handleInputChange}
                placeholder="4.850"
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 focus:outline-none ${
                  errors.impactFactor
                    ? "border-red-500 bg-red-50"
                    : "border-slate-300 bg-slate-50 focus:border-amber-500 focus:bg-white"
                }`}
              />
              {errors.impactFactor && (
                <p className="mt-1 text-[11px] text-red-500">{errors.impactFactor}</p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 4: DATES */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              4. Publication Pipeline Dates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Submission Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Submission Date
              </label>
              <input
                type="date"
                name="submissionDate"
                value={formData.submissionDate}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Acceptance Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Acceptance Date
              </label>
              <input
                type="date"
                name="acceptanceDate"
                value={formData.acceptanceDate}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Publication Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication Date
              </label>
              <input
                type="date"
                name="publicationDate"
                value={formData.publicationDate}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: LINKS & IDENTIFIERS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <LinkIcon className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              5. Digital Links & Identifiers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DOI */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DOI (Digital Object Identifier)
              </label>
              <input
                type="text"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                placeholder="10.1109/TPAMI.2025.334455"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Publication URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication URL
              </label>
              <input
                type="url"
                name="publicationUrl"
                value={formData.publicationUrl}
                onChange={handleInputChange}
                placeholder="https://ieeexplore.ieee.org/document/1045..."
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 focus:outline-none ${
                  errors.publicationUrl
                    ? "border-red-500 bg-red-50"
                    : "border-slate-300 bg-slate-50 focus:border-amber-500 focus:bg-white"
                }`}
              />
              {errors.publicationUrl && (
                <p className="mt-1 text-[11px] text-red-500">{errors.publicationUrl}</p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 6: ADDITIONAL INFORMATION (FUNDING, COLLABORATION, STUDENTS) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              6. Additional Information & Grants
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Funding Agency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Funding Agency
              </label>
              <input
                type="text"
                name="fundingAgency"
                value={formData.fundingAgency}
                onChange={handleInputChange}
                placeholder="DST / SERB / VGST / AICTE"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Grant Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grant Title / Project Code
              </label>
              <input
                type="text"
                name="grantTitle"
                value={formData.grantTitle}
                onChange={handleInputChange}
                placeholder="SERB/EEQ/2024/00012"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Grant Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grant Amount (in Lakhs INR)
              </label>
              <input
                type="number"
                step="0.01"
                name="grantAmountLakhs"
                value={formData.grantAmountLakhs}
                onChange={handleInputChange}
                placeholder="12.50"
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 focus:outline-none ${
                  errors.grantAmountLakhs
                    ? "border-red-500 bg-red-50"
                    : "border-slate-300 bg-slate-50 focus:border-amber-500 focus:bg-white"
                }`}
              />
              {errors.grantAmountLakhs && (
                <p className="mt-1 text-[11px] text-red-500">{errors.grantAmountLakhs}</p>
              )}
            </div>

            {/* Student Involvement */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Involvement
              </label>
              <select
                name="studentInvolvement"
                value={formData.studentInvolvement}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                {Object.values(StudentInvolvement).map((si) => (
                  <option key={si} value={si}>
                    {si.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* External Collaboration Checkbox & Input */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 bg-slate-50">
                <input
                  type="checkbox"
                  id="hasCollaboration"
                  name="hasCollaboration"
                  checked={formData.hasCollaboration}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="hasCollaboration" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Includes External Institution / Industry Collaboration
                </label>
              </div>

              {formData.hasCollaboration && (
                <input
                  type="text"
                  name="externalCollaborators"
                  value={formData.externalCollaborators}
                  onChange={handleInputChange}
                  placeholder="e.g., IISc Bengaluru, IIT Madras, Intel India"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              )}
            </div>
          </div>
        </section>

        {/* SECTION 7: DOCUMENTS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Paperclip className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              7. Supporting Documents
            </h2>
          </div>

          <p className="text-xs text-slate-500">
            Attach supporting materials (Accepted Manuscript, Acceptance Letter, Published PDF, or Raw Data).
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Manuscript_Final_IEEE.pdf"
              className="flex-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            />

            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="w-full sm:w-auto rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            >
              {Object.values(DocumentType).map((dt) => (
                <option key={dt} value={dt}>
                  {dt.replace("_", " ")}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddDocument}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Attach File</span>
            </button>
          </div>

          {/* Attached documents list */}
          {documents.length > 0 && (
            <div className="space-y-2 pt-2">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-slate-800">{doc.fileName}</span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {doc.documentType}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ACTION BUTTONS: SAVE DRAFT & SUBMIT FOR APPROVAL */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmitForm("draft")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmitForm("submit")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4 text-slate-950" />
            <span>Submit for Approval</span>
          </button>
        </div>
      </div>
    </div>
  );
}
