import fs from "node:fs/promises";
import path from "node:path";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { loadEnvFiles } from "./_load-env.mjs";

loadEnvFiles();

const prisma = new PrismaClient();

async function main() {
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

  let checked = 0;
  const missing = [];

  for (const pin of pins) {
    const storageKey = pin.storageKey?.trim();
    if (!storageKey) {
      continue;
    }

    checked += 1;
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

  console.log(JSON.stringify({
    provider: provider.kind,
    checkedPins: checked,
    missingCount: missing.length,
    missing,
  }, null, 2));
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

async function objectExists(provider, key) {
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

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
