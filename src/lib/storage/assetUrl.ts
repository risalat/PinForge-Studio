import { env } from "@/lib/env";

export function encodeStorageKey(key: string) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function buildStorageAssetUrl(key: string) {
  const publicBaseUrl = env.r2PublicBaseUrl.trim();
  if (env.storageProvider === "r2" && publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
  }

  return new URL(`/api/storage/${encodeStorageKey(key)}`, env.appUrl).toString();
}
