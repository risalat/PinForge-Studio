import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";

const scrypt = promisify(nodeScrypt);
const KEY_SCHEME = "pfs_live";
const SECRET_BYTES = 24;
const PREFIX_BYTES = 4;
const SCRYPT_BYTES = 32;

export async function listApiKeys() {
  const user = await getOrCreateDashboardUser();
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return apiKeys.map((apiKey) => ({
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    createdAt: apiKey.createdAt.toISOString(),
    lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? null,
    revokedAt: apiKey.revokedAt?.toISOString() ?? null,
    isActive: apiKey.isActive && apiKey.revokedAt === null,
  }));
}

export async function createApiKey(input: { name: string }) {
  const user = await getOrCreateDashboardUser();
  const material = await generateApiKeyMaterial();

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: input.name.trim(),
      keyPrefix: material.keyPrefix,
      keyHash: material.keyHash,
      isActive: true,
    },
  });

  return {
    record: apiKey,
    plaintextKey: material.plaintextKey,
  };
}

export async function revokeApiKey(id: string) {
  const user = await getOrCreateDashboardUser();

  return prisma.apiKey.updateMany({
    where: {
      id,
      userId: user.id,
      revokedAt: null,
      isActive: true,
    },
    data: {
      revokedAt: new Date(),
      isActive: false,
    },
  });
}

export async function findActiveApiKeyByToken(token: string) {
  const keyPrefix = extractKeyPrefix(token);
  if (!keyPrefix) {
    return null;
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: {
      keyPrefix,
    },
    include: {
      user: true,
    },
  });

  if (!apiKey || !apiKey.isActive || apiKey.revokedAt) {
    return null;
  }

  const valid = await verifyApiKey(token, apiKey.keyHash);
  if (!valid) {
    return null;
  }

  return apiKey;
}

export async function touchApiKeyLastUsed(id: string) {
  await prisma.apiKey.update({
    where: { id },
    data: {
      lastUsedAt: new Date(),
    },
  });
}

export function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export function extractKeyPrefix(token: string) {
  const match = token.trim().match(/^(pfs_live_[^_]+)_/);
  return match?.[1] ?? null;
}

async function generateApiKeyMaterial() {
  const suffix = randomBytes(PREFIX_BYTES).toString("hex");
  const keyPrefix = `${KEY_SCHEME}_${suffix}`;
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const plaintextKey = `${keyPrefix}_${secret}`;
  const keyHash = await hashApiKey(plaintextKey);

  return {
    plaintextKey,
    keyPrefix,
    keyHash,
  };
}

async function hashApiKey(plaintextKey: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(plaintextKey, salt, SCRYPT_BYTES)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyApiKey(plaintextKey: string, storedHash: string) {
  const [salt, storedDigest] = storedHash.split(":");
  if (!salt || !storedDigest) {
    return false;
  }

  const candidateDigest = (await scrypt(plaintextKey, salt, SCRYPT_BYTES)) as Buffer;
  const storedBuffer = Buffer.from(storedDigest, "hex");

  if (candidateDigest.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateDigest, storedBuffer);
}
