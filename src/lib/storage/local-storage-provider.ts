import fs from "fs/promises";
import path from "path";
import { StorageProvider, StoredFileStream } from "./storage-provider";
import { NotFoundError } from "@/lib/errors";

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    // Default to process.cwd()/uploads/
    this.baseDir = path.resolve(baseDir || process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
  }

  private resolvePath(key: string): string {
    // Sanitize path to prevent directory traversal
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.resolve(this.baseDir, safeKey);

    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error("Access denied: Invalid storage key path.");
    }

    return fullPath;
  }

  async uploadFile(file: Buffer, key: string): Promise<{ key: string }> {
    const filePath = this.resolvePath(key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, file);

    return { key };
  }

  async getFileStream(key: string): Promise<StoredFileStream> {
    const filePath = this.resolvePath(key);

    try {
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);

      return {
        stream: buffer,
        contentType: "application/octet-stream",
        contentLength: stats.size,
      };
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        throw new NotFoundError("Document file on disk");
      }
      throw err;
    }
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = this.resolvePath(key);

    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      // Ignore if already deleted
      if (error.code !== "ENOENT") {
        throw err;
      }
    }
  }

  async getFileUrl(key: string): Promise<string> {
    return `/api/documents/key?key=${encodeURIComponent(key)}`;
  }
}
