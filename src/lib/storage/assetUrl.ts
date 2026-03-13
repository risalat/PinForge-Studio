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

export function resolveStoredAssetUrl(input: {
  storageKey?: string | null;
  exportPath?: string | null;
}) {
  const storageKey = input.storageKey?.trim();
  if (storageKey) {
    return buildStorageAssetUrl(storageKey);
  }

  const exportPath = input.exportPath?.trim();
  if (!exportPath) {
    return "";
  }

  const legacyStorageKey = extractStorageKeyFromUrl(exportPath);
  if (legacyStorageKey) {
    return buildStorageAssetUrl(legacyStorageKey);
  }

  return exportPath;
}

function extractStorageKeyFromUrl(value: string) {
  if (!value.includes("/api/storage/")) {
    return null;
  }

  try {
    const parsed = new URL(value);
    const marker = "/api/storage/";
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    return parsed.pathname
      .slice(markerIndex + marker.length)
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    return null;
  }
}
