import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const IV_BYTES = 12;

function getKeyMaterial() {
  if (!env.appEncryptionKey.trim()) {
    throw new Error("APP_ENCRYPTION_KEY is required for saving integration settings.");
  }

  return createHash("sha256").update(env.appEncryptionKey).digest();
}

export function encryptSecret(plaintext: string) {
  const key = getKeyMaterial();
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

  const key = getKeyMaterial();
  const [ivHex, tagHex, encryptedHex] = payload.split(":");
  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Stored secret could not be decrypted.");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
