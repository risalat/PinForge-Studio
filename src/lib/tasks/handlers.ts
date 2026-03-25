import {
  BackgroundTaskKind,
  type BackgroundTask,
  type Prisma,
} from "@prisma/client";
import { z } from "zod";
import { cleanupStaleTempAssets } from "@/lib/housekeeping/storageMaintenance";
import { normalizeErrorForLogging } from "@/lib/observability/operationContext";

const cleanTempAssetsPayloadSchema = z.object({
  days: z.number().int().positive().max(365).optional(),
  apply: z.boolean().optional(),
});

export type BackgroundTaskExecutionResult = {
  progressJson?: Prisma.InputJsonValue;
};

export type BackgroundTaskHandlerContext = {
  workerId: string;
  reportProgress: (progressJson: Prisma.InputJsonValue) => Promise<void>;
};

export async function executeBackgroundTask(
  task: BackgroundTask,
  context: BackgroundTaskHandlerContext,
): Promise<BackgroundTaskExecutionResult> {
  switch (task.kind) {
    case BackgroundTaskKind.CLEAN_TEMP_ASSETS:
      return executeCleanTempAssetsTask(task, context);
    default:
      throw new Error(`Background task kind ${task.kind} is not implemented yet.`);
  }
}

export function classifyBackgroundTaskFailure(task: BackgroundTask, error: unknown) {
  const normalized = normalizeErrorForLogging(error);
  const message = normalized.message.toLowerCase();
  const responseBody = normalized.responseBody?.toLowerCase() ?? "";
  const combined = `${message}\n${responseBody}`;
  const attemptsRemaining = task.attempts < task.maxAttempts;

  const validationError = error instanceof z.ZodError || combined.includes("validation");
  const missingConfiguration =
    combined.includes("not configured") ||
    combined.includes("missing configuration") ||
    combined.includes("select a publer") ||
    combined.includes("provide a valid");
  const aiRateLimit = normalized.statusCode === 429 || combined.includes("rate limit");
  const publerQueueLimit =
    combined.includes("please wait until your other download media from url jobs have finished");
  const browserCrash =
    combined.includes("target page, context or browser has been closed") ||
    combined.includes("browser has been closed") ||
    combined.includes("page crashed");
  const transientHttpStatus =
    normalized.statusCode !== null && [408, 425, 429, 500, 502, 503, 504].includes(normalized.statusCode);
  const transientNetwork =
    combined.includes("timed out") ||
    combined.includes("timeout") ||
    combined.includes("econnreset") ||
    combined.includes("enotfound") ||
    combined.includes("network");

  const retryable =
    attemptsRemaining &&
    !validationError &&
    !missingConfiguration &&
    (aiRateLimit || publerQueueLimit || browserCrash || transientHttpStatus || transientNetwork);

  return {
    retryable,
    delayMs: retryable ? buildRetryDelayMs(task.attempts) : 0,
    lastError: buildTaskErrorMessage(normalized),
    diagnostics: normalized,
  };
}

async function executeCleanTempAssetsTask(
  task: BackgroundTask,
  context: BackgroundTaskHandlerContext,
): Promise<BackgroundTaskExecutionResult> {
  const payload = cleanTempAssetsPayloadSchema.parse(task.payloadJson);

  await context.reportProgress({
    stage: "running",
    workerId: context.workerId,
    startedAt: new Date().toISOString(),
  });

  const result = await cleanupStaleTempAssets(payload);
  const progressJson = {
    stage: "completed",
    workerId: context.workerId,
    finishedAt: new Date().toISOString(),
    result,
  } satisfies Prisma.InputJsonValue;

  await context.reportProgress(progressJson);

  return {
    progressJson,
  };
}

function buildRetryDelayMs(attempts: number) {
  const baseDelayMs = 5_000;
  const scaledDelayMs = baseDelayMs * 2 ** Math.max(0, attempts - 1);
  return Math.min(scaledDelayMs, 5 * 60 * 1000);
}

function buildTaskErrorMessage(
  normalized: ReturnType<typeof normalizeErrorForLogging>,
) {
  if (normalized.statusCode) {
    return `${normalized.message} (status ${normalized.statusCode})`;
  }

  return normalized.message;
}
