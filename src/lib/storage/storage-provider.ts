export interface StoredFileStream {
  stream: ReadableStream | Buffer;
  contentType: string;
  contentLength: number;
}

export interface StorageProvider {
  /**
   * Upload a file buffer to storage under the given storage key
   */
  uploadFile(file: Buffer, key: string, contentType?: string): Promise<{ key: string }>;

  /**
   * Retrieve file stream/buffer and metadata from storage
   */
  getFileStream(key: string): Promise<StoredFileStream>;

  /**
   * Delete a file from storage by key
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Return a file URL or key reference
   */
  getFileUrl(key: string): Promise<string>;
}
