"use client";

import React, { useState, useRef } from "react";
import { DocumentType } from "@prisma/client";
import {
  uploadPublicationDocumentAction,
  deletePublicationDocumentAction,
} from "@/server/actions/publication.actions";
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export interface PublicationDocumentItem {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize?: number;
  documentType: DocumentType;
  createdAt: Date;
  uploadedBy?: {
    name: string | null;
    email: string | null;
  };
}

interface PublicationDocumentManagerProps {
  publicationId: string;
  documents: PublicationDocumentItem[];
  canEdit?: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  MANUSCRIPT: "Manuscript",
  ACCEPTANCE_LETTER: "Acceptance Letter",
  PUBLISHED_PAPER: "Published Paper",
  CERTIFICATE: "Certificate",
  OTHER: "Other Supporting Document",
  PUBLISHED_PDF: "Published PDF",
  REVISION_RESPONSE: "Revision Response",
  RAW_DATA: "Raw Data / Dataset",
};

function formatBytes(bytes: number = 0): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function PublicationDocumentManager({
  publicationId,
  documents,
  canEdit = true,
}: PublicationDocumentManagerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.MANUSCRIPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds the 10MB limit.");
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("publicationId", publicationId);
      formData.append("documentType", documentType);
      formData.append("file", selectedFile);

      const res = await uploadPublicationDocumentAction(formData);

      if (res.success) {
        setSuccess(`Document '${selectedFile.name}' uploaded successfully.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || "Failed to upload document.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      await deletePublicationDocumentAction(publicationId, docId);
      setSuccess(`Document '${name}' deleted.`);
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || "Failed to delete document.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-amber-500" />
          <span>Supporting Documents ({documents.length})</span>
        </h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Section */}
      {canEdit && (
        <form
          onSubmit={handleUpload}
          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Document Category
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:outline-none"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Choose File (PDF, PNG, JPG, DOCX, TXT - Max 10MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.txt"
                onChange={handleFileChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-amber-800 hover:file:bg-amber-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              {selectedFile ? (
                <strong className="text-slate-700">
                  Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </strong>
              ) : (
                "Select a supporting document file to attach to this publication."
              )}
            </span>

            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 disabled:opacity-50 transition-colors shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Documents Roster */}
      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
          No supporting documents uploaded yet for this publication.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{doc.fileName}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold uppercase text-slate-700">
                      {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </span>
                    <span>• {formatBytes(doc.fileSize)}</span>
                    <span>• {doc.fileType}</span>
                    <span>• {new Date(doc.createdAt).toLocaleDateString("en-IN")}</span>
                    {doc.uploadedBy && (
                      <span>• Uploaded by {doc.uploadedBy.name || doc.uploadedBy.email}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`/api/documents/${doc.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 items-center gap-1 px-2.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                  title="View Document"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-600" />
                  <span className="hidden sm:inline">View</span>
                </a>

                <a
                  href={`/api/documents/${doc.id}?download=true`}
                  download={doc.fileName}
                  className="flex h-8 items-center gap-1 px-2.5 rounded-lg bg-amber-500/20 text-amber-900 text-xs font-bold hover:bg-amber-500/30 transition-colors"
                  title="Download File"
                >
                  <Download className="h-3.5 w-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
