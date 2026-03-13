import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { env, isR2Configured } from "@/lib/env";

type LocalMaintenanceProvider = {
  kind: "local";
  basePath: string;
};

type R2MaintenanceProvider = {
  kind: "r2";
  bucketName: string;
  client: S3Client;
};

type MaintenanceProvider = LocalMaintenanceProvider | R2MaintenanceProvider;

export type MissingStoredAsset = {
  pinId: string;
  storageKey: string;
  createdAt: string;
  jobId: string;
  articleTitle: string;
  postUrl: string;
};

export type StorageAuditResult = {
  provider: MaintenanceProvider["kind"];
  checkedPins: number;
  missingCount: number;
  missing: MissingStoredAsset[];
};

export type TempCleanupResult = {
  provider: MaintenanceProvider["kind"];
  apply: boolean;
  days: number;
  cutoff: string;
  staleObjectCount: number;
  staleKeys: string[];
};

export async function auditStoredPinAssets(): Promise<StorageAuditResult> {
  const provider = resolveStorageProvider();
  const pins = await prisma.generatedPin.findMany({
    where: {
      NOT: {
        storageKey: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      storageKey: true,
      createdAt: true,
      job: {
        select: {
          id: true,
          articleTitleSnapshot: true,
          postUrlSnapshot: true,
        },
      },
    },
  });

  let checkedPins = 0;
  const missing: MissingStoredAsset[] = [];

  for (const pin of pins) {
    const storageKey = pin.storageKey?.trim();
    if (!storageKey) {
      continue;
    }

    checkedPins += 1;
    const exists = await objectExists(provider, storageKey);
    if (!exists) {
      missing.push({
        pinId: pin.id,
        storageKey,
        createdAt: pin.createdAt.toISOString(),
        jobId: pin.job.id,
        articleTitle: pin.job.articleTitleSnapshot,
        postUrl: pin.job.postUrlSnapshot,
      });
    }
  }

  return {
    provider: provider.kind,
    checkedPins,
    missingCount: missing.length,
    missing,
  };
}

export async function cleanupStaleTempAssets(input?: {
  days?: number;
  apply?: boolean;
}): Promise<TempCleanupResult> {
  const days = input?.days && input.days > 0 ? input.days : 7;
  const apply = Boolean(input?.apply);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const provider = resolveStorageProvider();
  const staleKeys =
    provider.kind === "local"
      ? await collectLocalTempKeys(provider.basePath, cutoff)
      : await collectR2TempKeys(provider, cutoff);

  if (apply && staleKeys.length > 0) {
    if (provider.kind === "local") {
      await Promise.allSettled(
        staleKeys.map((key) => fs.rm(path.join(provider.basePath, key), { force: true })),
      );
    } else {
      for (let index = 0; index < staleKeys.length; index += 1000) {
        const batch = staleKeys.slice(index, index + 1000);
        await provider.client.send(
          new DeleteObjectsCommand({
            Bucket: provider.bucketName,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
            },
          }),
        );
      }
    }
  }

  return {
    provider: provider.kind,
    apply,
    days,
    cutoff: cutoff.toISOString(),
    staleObjectCount: staleKeys.length,
    staleKeys,
  };
}

function resolveStorageProvider(): MaintenanceProvider {
  if (env.storageProvider === "r2" && isR2Configured()) {
    return {
      kind: "r2",
      bucketName: env.r2BucketName,
      client: new S3Client({
        region: "auto",
        endpoint: env.r2Endpoint.trim()
          ? env.r2Endpoint.trim()
          : `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.r2AccessKeyId,
          secretAccessKey: env.r2SecretAccessKey,
        },
      }),
    };
  }

  return {
    kind: "local",
    basePath: path.resolve(env.localStoragePath),
  };
}

async function objectExists(provider: MaintenanceProvider, key: string) {
  if (provider.kind === "local") {
    try {
      await fs.access(path.join(provider.basePath, key));
      return true;
    } catch {
      return false;
    }
  }

  try {
    await provider.client.send(
      new HeadObjectCommand({
        Bucket: provider.bucketName,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

async function collectLocalTempKeys(basePath: string, cutoff: Date) {
  const tempPath = path.join(basePath, "temp");
  const keys: string[] = [];

  async function walk(currentPath: string) {
    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      const stats = await fs.stat(absolutePath);
      if (stats.mtime <= cutoff) {
        keys.push(path.relative(basePath, absolutePath).replaceAll("\\", "/"));
      }
    }
  }

  await walk(tempPath);
  return keys.sort();
}

async function collectR2TempKeys(provider: R2MaintenanceProvider, cutoff: Date) {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await provider.client.send(
      new ListObjectsV2Command({
        Bucket: provider.bucketName,
        Prefix: "temp/",
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.Contents ?? []) {
      if (item.Key && item.LastModified && item.LastModified <= cutoff) {
        keys.push(item.Key);
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys.sort();
}
