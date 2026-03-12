import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const IV_BYTES = 12;

function getPrimaryKeyMaterial() {
  if (!env.appEncryptionKey.trim()) {
    throw new Error("APP_ENCRYPTION_KEY is required for saving integration settings.");
  }

  return createHash("sha256").update(env.appEncryptionKey).digest();
}

function getCandidateKeyMaterials() {
  const rawKeys = [env.appEncryptionKey, ...env.appEncryptionKeyFallbacks].filter(
    (value) => value.trim() !== "",
  );

  if (rawKeys.length === 0) {
    throw new Error("APP_ENCRYPTION_KEY is required for saving integration settings.");
  }

  return Array.from(new Set(rawKeys)).map((value) => createHash("sha256").update(value).digest());
}

export function encryptSecret(plaintext: string) {
  const key = getPrimaryKeyMaterial();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload: string | null | undefined) {
  if (!payload) {
    return "";
  }

  const [ivHex, tagHex, encryptedHex] = payload.split(":");
  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Stored secret could not be decrypted.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  let lastError: unknown = null;

  for (const key of getCandidateKeyMaterials()) {
    try {
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString("utf8");
    } catch (error) {
      lastError = error;
    }
  }

  if (
    lastError instanceof Error &&
    ["Unsupported state or unable to authenticate data", "Unsupported state"].includes(
      lastError.message,
    )
  ) {
    throw new Error(
      "Stored secret was encrypted with a different APP_ENCRYPTION_KEY. Keep the current key stable across deployments or add the previous key to APP_ENCRYPTION_KEY_FALLBACKS.",
    );
  }

  throw new Error("Stored secret could not be decrypted.");
}
