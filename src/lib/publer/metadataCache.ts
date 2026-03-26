import { Prisma, PublerMetadataCacheKind } from "@prisma/client";
import type {
  PinterestBoard,
  PublerAccount,
  PublerWorkspace,
} from "@/lib/publer/publerClient";
import { prisma } from "@/lib/prisma";

const PUBLER_METADATA_TTL_MS = 30 * 60 * 1000;

export async function getCachedPublerWorkspaces(input: {
  userId: string;
  forceRefresh?: boolean;
  loader: () => Promise<PublerWorkspace[]>;
}) {
  return getCachedPublerMetadata({
    userId: input.userId,
    workspaceId: "",
    cacheKind: PublerMetadataCacheKind.WORKSPACES,
    cacheKey: "all",
    loader: input.loader,
    forceRefresh: input.forceRefresh,
    label: "Publer workspaces",
  });
}

export async function getCachedPublerAccounts(input: {
  userId: string;
  workspaceId: string;
  workspaceLabel?: string;
  forceRefresh?: boolean;
  loader: () => Promise<PublerAccount[]>;
}) {
  return getCachedPublerMetadata({
    userId: input.userId,
    workspaceId: input.workspaceId,
    cacheKind: PublerMetadataCacheKind.ACCOUNTS,
    cacheKey: "all",
    loader: input.loader,
    forceRefresh: input.forceRefresh,
    label: input.workspaceLabel ? `Accounts for ${input.workspaceLabel}` : "Publer accounts",
  });
}

export async function getCachedPublerBoards(input: {
  userId: string;
  workspaceId: string;
  accountId: string;
  accountLabel?: string;
  forceRefresh?: boolean;
  loader: () => Promise<PinterestBoard[]>;
}) {
  return getCachedPublerMetadata({
    userId: input.userId,
    workspaceId: input.workspaceId,
    cacheKind: PublerMetadataCacheKind.BOARDS,
    cacheKey: input.accountId.trim() || "default",
    loader: input.loader,
    forceRefresh: input.forceRefresh,
    label: input.accountLabel ? `Boards for ${input.accountLabel}` : "Publer boards",
  });
}

async function getCachedPublerMetadata<T>(input: {
  userId: string;
  workspaceId: string;
  cacheKind: PublerMetadataCacheKind;
  cacheKey: string;
  forceRefresh?: boolean;
  label?: string;
  loader: () => Promise<T>;
}) {
  if (!input.forceRefresh) {
    const cached = await prisma.publerMetadataCache.findUnique({
      where: {
        userId_workspaceId_cacheKind_cacheKey: {
          userId: input.userId,
          workspaceId: input.workspaceId,
          cacheKind: input.cacheKind,
          cacheKey: input.cacheKey,
        },
      },
      select: {
        rawJson: true,
        expiresAt: true,
      },
    });

    if (cached && cached.expiresAt > new Date()) {
      return cached.rawJson as T;
    }
  }

  const fresh = await input.loader();
  await prisma.publerMetadataCache.upsert({
    where: {
      userId_workspaceId_cacheKind_cacheKey: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        cacheKind: input.cacheKind,
        cacheKey: input.cacheKey,
      },
    },
    update: {
      label: input.label ?? null,
      rawJson: fresh as Prisma.InputJsonValue,
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + PUBLER_METADATA_TTL_MS),
    },
    create: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      cacheKind: input.cacheKind,
      cacheKey: input.cacheKey,
      label: input.label ?? null,
      rawJson: fresh as Prisma.InputJsonValue,
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + PUBLER_METADATA_TTL_MS),
    },
  });

  return fresh;
}
