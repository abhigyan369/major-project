import { ValidationError } from "@/lib/errors";
import crypto from "crypto";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface ValidatedFileMetadata {
  sanitizedFileName: string;
  detectedMimeType: string;
  fileSize: number;
  storageKey: string;
}

/**
 * Detect actual MIME type by inspecting file header magic bytes
 */
export function detectMimeTypeFromBuffer(buffer: Buffer, originalFileName: string): string {
  if (buffer.length < 4) {
    throw new ValidationError("File is too small or corrupted.");
  }

  // PDF check: %PDF (0x25, 0x50, 0x44, 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }

  // PNG check: 0x89 0x50 0x4E 0x47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  // JPEG check: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // ZIP / DOCX check: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    const ext = originalFileName.slice(originalFileName.lastIndexOf(".")).toLowerCase();
    if (ext === ".docx") {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    // Generic zip or openxml document
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  // Legacy DOC check: 0xD0 0xCF 0x11 0xE0
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
    return "application/msword";
  }

  // Plain Text check: Ensure printable ASCII/UTF-8
  const isText = buffer.slice(0, 512).every((byte) => (byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13);
  if (isText) {
    return "text/plain";
  }

  throw new ValidationError(
    "Invalid file content signature. Supported document formats include PDF, PNG, JPEG, DOCX, DOC, and TXT."
  );
}

/**
 * Sanitize filename to remove dangerous characters and path sequences
 */
export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.replace(/^.*[\\\/]/, ""); // strip paths
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_"); // replace non-alphanumeric except . _ -
  return sanitized.length > 0 ? sanitized.slice(0, 150) : "document";
}

/**
 * Validate upload file buffer, size, magic bytes, and generate secure storage key
 */
export function validateAndPrepareDocumentUpload(
  fileBuffer: Buffer,
  originalFileName: string,
  publicationId: string
): ValidatedFileMetadata {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new ValidationError("Uploaded file is empty.");
  }

  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size exceeds the 10MB limit (Uploaded size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB).`
    );
  }

  const sanitizedFileName = sanitizeFileName(originalFileName);
  const detectedMimeType = detectMimeTypeFromBuffer(fileBuffer, originalFileName);

  const uuid = crypto.randomUUID();
  const storageKey = `publications/${publicationId}/${uuid}-${sanitizedFileName}`;

  return {
    sanitizedFileName,
    detectedMimeType,
    fileSize: fileBuffer.length,
    storageKey,
  };
}
