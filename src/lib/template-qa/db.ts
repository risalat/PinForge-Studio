import { chromium, type Page } from "playwright";
import {
  BackgroundTaskKind,
  Prisma,
  TemplateLifecycleStatus,
  TemplateRendererKind,
  TemplateSourceKind,
} from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { RuntimeTemplateDocument } from "@/lib/runtime-templates/schema";
import { buildRuntimeTemplateStressCases } from "@/lib/runtime-templates/stressTest";
import { getStorageProvider } from "@/lib/storage";
import { buildStorageAssetUrl } from "@/lib/storage/assetUrl";
import type { StorageProvider } from "@/lib/storage/StorageProvider";
import { enqueueBackgroundTask } from "@/lib/tasks/backgroundTasks";
import { getPresetIdsForCategories } from "@/lib/templates/visualPresets";

type TemplateQaCaptureStatus = "ready" | "failed";

export type TemplateQaArtifactEntry = {
  id: string;
  label: string;
  presetId: string;
  stressCaseId: string | null;
  stressCaseLabel: string | null;
  previewStorageKey: string | null;
  previewUrl: string | null;
  renderStorageKey: string | null;
  renderUrl: string | null;
  status: TemplateQaCaptureStatus;
  diagnostics: string[];
};

export type TemplateQaArtifactManifest = {
  templateId: string;
  versionId: string;
  templateName: string;
  versionNumber: number;
  generatedAt: string;
  defaultPresetId: string;
  matrixCount: number;
  stressCaseCount: number;
  failedCaptureCount: number;
  compareEntry: TemplateQaArtifactEntry | null;
  presetMatrix: TemplateQaArtifactEntry[];
  stressPack: TemplateQaArtifactEntry[];
};

export async function enqueueTemplateQaPackForUser(input: {
  userId: string;
  templateId: string;
  versionId: string;
}) {
  const version = await prisma.templateVersion.findFirst({
    where: {
      id: input.versionId,
      templateId: input.templateId,
      template: {
        createdByUserId: input.userId,
        sourceKind: TemplateSourceKind.CUSTOM,
        rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
      },
    },
    select: {
      id: true,
      lifecycleStatus: true,
      templateId: true,
    },
  });

  if (!version) {
    throw new Error("Template version not found.");
  }

  if (version.lifecycleStatus !== TemplateLifecycleStatus.FINALIZED) {
    throw new Error("Only finalized template versions can generate QA packs.");
  }

  const dedupeKey = buildTemplateQaTaskDedupeKey(input.templateId, input.versionId);
  return enqueueBackgroundTask({
    kind: BackgroundTaskKind.GENERATE_TEMPLATE_QA,
    userId: input.userId,
    priority: 1,
    dedupeKey,
    payloadJson: {
      userId: input.userId,
      templateId: input.templateId,
      versionId: input.versionId,
    } satisfies Prisma.InputJsonValue,
  });
}

export async function getTemplateQaReviewForUser(input: {
  userId: string;
  templateId: string;
  versionId: string;
}) {
  const version = await prisma.templateVersion.findFirst({
    where: {
      id: input.versionId,
      templateId: input.templateId,
      template: {
        createdByUserId: input.userId,
        sourceKind: TemplateSourceKind.CUSTOM,
      },
    },
    select: {
      id: true,
      qaArtifactJson: true,
    },
  });

  if (!version) {
    return null;
  }

  const task = await prisma.backgroundTask.findFirst({
    where: {
      kind: BackgroundTaskKind.GENERATE_TEMPLATE_QA,
      dedupeKey: buildTemplateQaTaskDedupeKey(input.templateId, input.versionId),
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return {
    manifest: parseTemplateQaArtifactManifest(version.qaArtifactJson),
    task: task
      ? {
          id: task.id,
          status: task.status,
          lastError: task.lastError,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          finishedAt: task.finishedAt?.toISOString() ?? null,
        }
      : null,
  };
}

export async function generateTemplateQaArtifactsForVersionTask(input: {
  templateId: string;
  versionId: string;
}) {
  const version = await prisma.templateVersion.findFirst({
    where: {
      id: input.versionId,
      templateId: input.templateId,
      template: {
        sourceKind: TemplateSourceKind.CUSTOM,
        rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
      },
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!version) {
    throw new Error("Template version not found for QA generation.");
  }

  const document = version.schemaJson as RuntimeTemplateDocument;
  const presetIds = resolveQaPresetIds(document);
  const defaultPresetId = presetIds[0];
  if (!defaultPresetId) {
    throw new Error("No preset is available for QA generation.");
  }

  const generatedAt = new Date().toISOString();
  const storageProvider = getStorageProvider();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 2400,
    },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    const compareEntry = await captureQaEntry({
      page,
      storageProvider,
      templateId: version.templateId,
      versionId: version.id,
      templateName: version.template.name,
      versionNumber: version.versionNumber,
      generatedAt,
      presetId: defaultPresetId,
      label: `Default ${defaultPresetId}`,
      id: `compare-${defaultPresetId}`,
    });

    const presetMatrix = await Promise.all(
      presetIds.map((presetId) =>
        captureQaEntry({
          page,
          storageProvider,
          templateId: version.templateId,
          versionId: version.id,
          templateName: version.template.name,
          versionNumber: version.versionNumber,
          generatedAt,
          presetId,
          label: presetId,
          id: `preset-${presetId}`,
        }),
      ),
    );

    const stressPack = await Promise.all(
      buildRuntimeTemplateStressCases(document).map((stressCase) =>
        captureQaEntry({
          page,
          storageProvider,
          templateId: version.templateId,
          versionId: version.id,
          templateName: version.template.name,
          versionNumber: version.versionNumber,
          generatedAt,
          presetId: defaultPresetId,
          label: stressCase.label,
          id: `stress-${stressCase.id}`,
          stressCaseId: stressCase.id,
          stressCaseLabel: stressCase.label,
        }),
      ),
    );

    const entries = [compareEntry, ...presetMatrix, ...stressPack];
    const successfulCaptureCount = entries.reduce((count, entry) => {
      return count + (entry.previewStorageKey ? 1 : 0) + (entry.renderStorageKey ? 1 : 0);
    }, 0);

    if (successfulCaptureCount === 0) {
      const diagnostics = entries.flatMap((entry) => entry.diagnostics);
      throw new Error(diagnostics[0] ?? "No QA screenshots could be generated.");
    }

    const manifest = {
      templateId: version.templateId,
      versionId: version.id,
      templateName: version.template.name,
      versionNumber: version.versionNumber,
      generatedAt,
      defaultPresetId,
      matrixCount: presetMatrix.length,
      stressCaseCount: stressPack.length,
      failedCaptureCount: entries.reduce((count, entry) => count + entry.diagnostics.length, 0),
      compareEntry,
      presetMatrix,
      stressPack,
    } satisfies TemplateQaArtifactManifest;

    await prisma.templateVersion.update({
      where: { id: version.id },
      data: {
        qaArtifactJson: manifest as Prisma.InputJsonValue,
      },
    });

    return manifest;
  } finally {
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}

export function buildTemplateQaTaskDedupeKey(templateId: string, versionId: string) {
  return `template-qa:${templateId}:${versionId}`;
}

function resolveQaPresetIds(document: RuntimeTemplateDocument) {
  if (document.presetPolicy.allowedPresetIds.length > 0) {
    return Array.from(new Set(document.presetPolicy.allowedPresetIds)).slice(0, 4);
  }

  return Array.from(
    new Set(
      getPresetIdsForCategories(
        document.presetPolicy.allowedPresetCategories as Parameters<typeof getPresetIdsForCategories>[0],
      ),
    ),
  ).slice(0, 4);
}

async function captureQaEntry(input: {
  page: Page;
  storageProvider: StorageProvider;
  templateId: string;
  versionId: string;
  templateName: string;
  versionNumber: number;
  generatedAt: string;
  presetId: string;
  label: string;
  id: string;
  stressCaseId?: string;
  stressCaseLabel?: string;
}): Promise<TemplateQaArtifactEntry> {
  const diagnostics: string[] = [];
  const baseKey = `template-qa/${input.templateId}/${input.versionId}/${sanitizeKeySegment(input.generatedAt)}/${input.id}`;
  const previewUrl = buildRuntimeQaPreviewUrl({
    templateId: input.templateId,
    versionId: input.versionId,
    presetId: input.presetId,
    stressCaseId: input.stressCaseId,
  });
  const renderUrl = buildRuntimeQaRenderUrl({
    templateId: input.templateId,
    versionId: input.versionId,
    presetId: input.presetId,
    stressCaseId: input.stressCaseId,
  });

  const previewCapture = await captureAndUpload({
    page: input.page,
    storageProvider: input.storageProvider,
    url: previewUrl,
    key: `${baseKey}-preview.png`,
    mode: "page",
  }).catch((error) => {
    diagnostics.push(`Preview capture failed for ${input.label}: ${toErrorMessage(error)}`);
    return null;
  });

  const renderCapture = await captureAndUpload({
    page: input.page,
    storageProvider: input.storageProvider,
    url: renderUrl,
    key: `${baseKey}-render.png`,
    mode: "canvas",
  }).catch((error) => {
    diagnostics.push(`Render capture failed for ${input.label}: ${toErrorMessage(error)}`);
    return null;
  });

  return {
    id: input.id,
    label: input.label,
    presetId: input.presetId,
    stressCaseId: input.stressCaseId ?? null,
    stressCaseLabel: input.stressCaseLabel ?? null,
    previewStorageKey: previewCapture?.key ?? null,
    previewUrl: previewCapture?.url ?? null,
    renderStorageKey: renderCapture?.key ?? null,
    renderUrl: renderCapture?.url ?? null,
    status: diagnostics.length > 0 ? "failed" : "ready",
    diagnostics,
  };
}

async function captureAndUpload(input: {
  page: Page;
  storageProvider: StorageProvider;
  url: string;
  key: string;
  mode: "page" | "canvas";
}) {
  await input.page.goto(input.url, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await waitForStablePage(input.page);

  const body =
    input.mode === "page"
      ? await input.page.screenshot({
          type: "png",
          fullPage: true,
          animations: "disabled",
          caret: "hide",
        })
      : await capturePinCanvas(input.page);

  const stored = await input.storageProvider.upload({
    key: input.key,
    body,
    contentType: "image/png",
  });

  return {
    key: stored.key,
    url: buildStorageAssetUrl(stored.key),
  };
}

async function waitForStablePage(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => null);
  await page.waitForFunction(() => document.fonts?.status === "loaded", { timeout: 15_000 }).catch((error) => {
    if (page.isClosed()) {
      throw error;
    }
  });
  await page.waitForTimeout(150);
}

async function capturePinCanvas(page: Page) {
  const canvas = page.locator("[data-pin-canvas='true']");
  await canvas.scrollIntoViewIfNeeded().catch(() => null);

  try {
    return await canvas.screenshot({
      type: "png",
      animations: "disabled",
      caret: "hide",
    });
  } catch {
    const boundingBox = await canvas.boundingBox();
    if (!boundingBox) {
      throw new Error("Pin canvas bounds could not be resolved before screenshot.");
    }

    return page.screenshot({
      type: "png",
      animations: "disabled",
      caret: "hide",
      clip: {
        x: Math.max(0, Math.floor(boundingBox.x)),
        y: Math.max(0, Math.floor(boundingBox.y)),
        width: Math.ceil(boundingBox.width),
        height: Math.ceil(boundingBox.height),
      },
    });
  }
}

function buildRuntimeQaPreviewUrl(input: {
  templateId: string;
  versionId: string;
  presetId: string;
  stressCaseId?: string;
}) {
  const search = new URLSearchParams({
    versionId: input.versionId,
    preset: input.presetId,
  });
  if (input.stressCaseId) {
    search.set("stressCase", input.stressCaseId);
  }

  return `${env.appUrl}/preview/runtime/${input.templateId}?${search.toString()}`;
}

function buildRuntimeQaRenderUrl(input: {
  templateId: string;
  versionId: string;
  presetId: string;
  stressCaseId?: string;
}) {
  const search = new URLSearchParams({
    versionId: input.versionId,
    preset: input.presetId,
  });
  if (input.stressCaseId) {
    search.set("stressCase", input.stressCaseId);
  }

  return `${env.appUrl}/render/${input.templateId}?${search.toString()}`;
}

function parseTemplateQaArtifactManifest(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as unknown as TemplateQaArtifactManifest;
}

function sanitizeKeySegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
