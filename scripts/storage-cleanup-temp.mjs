import fs from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { loadEnvFiles } from "./_load-env.mjs";

loadEnvFiles();

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has("--apply");
  const days = getDaysArg(process.argv.slice(2)) ?? 7;
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

  console.log(
    JSON.stringify(
      {
        provider: provider.kind,
        apply,
        days,
        cutoff: cutoff.toISOString(),
        staleObjectCount: staleKeys.length,
        staleKeys,
      },
      null,
      2,
    ),
  );
}

function resolveStorageProvider() {
  const hasR2Config = Boolean(
    process.env.R2_BUCKET_NAME &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID),
  );
  const storageProvider = process.env.STORAGE_PROVIDER ?? (hasR2Config ? "r2" : "local");

  if (storageProvider === "r2") {
    return {
      kind: "r2",
      bucketName: process.env.R2_BUCKET_NAME,
      client: new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT?.trim()
          ? process.env.R2_ENDPOINT.trim()
          : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      }),
    };
  }

  return {
    kind: "local",
    basePath: path.resolve(process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "storage")),
  };
}

function getDaysArg(args) {
  const match = args.find((arg) => arg.startsWith("--days="));
  if (!match) {
    return null;
  }

  const parsed = Number(match.slice("--days=".length));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function collectLocalTempKeys(basePath, cutoff) {
  const tempPath = path.join(basePath, "temp");
  const keys = [];

  async function walk(currentPath) {
    let entries = [];
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

async function collectR2TempKeys(provider, cutoff) {
  const keys = [];
  let continuationToken = undefined;

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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
