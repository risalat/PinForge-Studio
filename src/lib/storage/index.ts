import { env } from "@/lib/env";
import { LocalStorageProvider } from "@/lib/storage/LocalStorageProvider";
import type { StorageProvider } from "@/lib/storage/StorageProvider";
import { R2StorageProvider } from "@/lib/storage/R2StorageProvider";

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  cachedProvider =
    env.storageProvider === "r2"
      ? new R2StorageProvider()
      : new LocalStorageProvider();

  return cachedProvider;
}
