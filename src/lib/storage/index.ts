import { StorageProvider } from "./storage-provider";
import { LocalStorageProvider } from "./local-storage-provider";

let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const providerType = process.env.STORAGE_PROVIDER || "local";

  switch (providerType.toLowerCase()) {
    case "local":
    default:
      storageInstance = new LocalStorageProvider();
      break;

    // Pluggable drivers for cloud storage can be instantiated here:
    // case "s3":
    //   storageInstance = new S3StorageProvider();
    //   break;
    // case "r2":
    //   storageInstance = new R2StorageProvider();
    //   break;
    // case "supabase":
    //   storageInstance = new SupabaseStorageProvider();
    //   break;
  }

  return storageInstance;
}

export * from "./storage-provider";
export * from "./local-storage-provider";
export * from "./validation";
