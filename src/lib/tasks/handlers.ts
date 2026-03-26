import {
  BackgroundTaskKind,
  type BackgroundTask,
  type Prisma,
} from "@prisma/client";
import { z } from "zod";
import { cleanupStaleTempAssets } from "@/lib/housekeeping/storageMaintenance";
import {
  generateDescriptionsForJobPins,
  generateTitlesForJobPins,
  renderPlansForJobTask,
  scheduleJobPins,
  uploadJobPinsToPubler,
} from "@/lib/jobs/generatePins";
import { normalizeErrorForLogging } from "@/lib/observability/operationContext";

const cleanTempAssetsPayloadSchema = z.object({
  days: z.number().int().positive().max(365).optional(),
  apply: z.boolean().optional(),
});

const renderPlansPayloadSchema = z.object({
  userId: z.string().min(1),
  jobId: z.string().min(1),
  planIds: z.array(z.string().min(1)).optional(),
  aiCredentialId: z.string().min(1).nullable().optional(),
});

const generateTitleBatchPayloadSchema = z.object({
  userId: z.string().min(1),
  jobId: z.string().min(1),
  generatedPinIds: z.array(z.string().min(1)).optional(),
  aiCredentialId: z.string().min(1).nullable().optional(),
});

const generateDescriptionBatchPayloadSchema = z.object({
  userId: z.string().min(1),
  jobId: z.string().min(1),
  generatedPinIds: z.array(z.string().min(1)).optional(),
  aiCredentialId: z.string().min(1).nullable().optional(),
});

const uploadMediaBatchPayloadSchema = z.object({
  userId: z.string().min(1),
  jobId: z.string().min(1),
  generatedPinIds: z.array(z.string().min(1)).optional(),
  workspaceId: z.string().min(1).nullable().optional(),
});

const schedulePinsPayloadSchema = z.object({
  userId: z.string().min(1),
  jobId: z.string().min(1),
  scheduleRunId: z.string().min(1).optional(),
  firstPublishAt: z.string().min(1),
  intervalMinutes: z.number().int().positive(),
  jitterMinutes: z.number().int().min(0).optional(),
  schedulePlan: z
    .array(
      z.object({
        pinId: z.string().min(1),
        scheduledFor: z.string().min(1),
        boardId: z.string().min(1).optional(),
      }),
    )
    .optional(),
  workspaceId: z.string().min(1).nullable().optional(),
  accountId: z.string().min(1).nullable().optional(),
  boardId: z.string().min(1).nullable().optional(),
  boardIds: z.array(z.string().min(1)).optional(),
  boardDistributionMode: z.enum(["round_robin", "first_selected", "primary_weighted"]).optional(),
  primaryBoardId: z.string().min(1).nullable().optional(),
  primaryBoardPercent: z.number().int().min(0).max(100).nullable().optional(),
  generatedPinIds: z.array(z.string().min(1)).optional(),
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
    case BackgroundTaskKind.RENDER_PLANS:
    case BackgroundTaskKind.RERENDER_PLAN:
      return executeRenderPlansTask(task, context);
    case BackgroundTaskKind.UPLOAD_MEDIA_BATCH:
      return executeUploadMediaBatchTask(task, context);
    case BackgroundTaskKind.GENERATE_TITLE_BATCH:
      return executeGenerateTitleBatchTask(task, context);
    case BackgroundTaskKind.GENERATE_DESCRIPTION_BATCH:
      return executeGenerateDescriptionBatchTask(task, context);
    case BackgroundTaskKind.SCHEDULE_PINS:
      return executeSchedulePinsTask(task, context);
    case BackgroundTaskKind.CLEAN_TEMP_ASSETS:
      return executeCleanTempAssetsTask(task, context);
    default:
      throw new Error(`Background task kind ${task.kind} is not implemented yet.`);
  }
}

async function executeRenderPlansTask(
  task: BackgroundTask,
  context: BackgroundTaskHandlerContext,
): Promise<BackgroundTaskExecutionResult> {
  const payload = renderPlansPayloadSchema.parse(task.payloadJson);
  const result = await renderPlansForJobTask({
    userId: payload.userId,
    jobId: payload.jobId,
    planIds: payload.planIds,
    aiCredentialId: payload.aiCredentialId ?? null,
    onProgress: async (progress) => {
      await context.reportProgress(progress satisfies Prisma.InputJsonValue);
    },
  });

  return {
    progressJson: result.progress satisfies Prisma.InputJsonValue,
  };
}

async function executeGenerateTitleBatchTask(
  task: BackgroundTask,
  context: BackgroundTaskHandlerContext,
): Promise<BackgroundTaskExecutionResult> {
  const payload = generateTitleBatchPayloadSchema.parse(task.payloadJson);

  await context.reportProgress({
    stage: "running",
    total: payload.generatedPinIds?.length ?? 0,
    completed: 0,
    workerId: context.workerId,
    startedAt: new Date().toISOString(),
  });

  const result = await generateTitlesForJobPins({
    userId: payload.userId,
    jobId: payload.jobId,
    generatedPinIds: payload.generatedPinIds,
    aiCredentialId: payload.aiCredentialId ?? undefined,
  });

  const completed = result.succeeded + result.failed + result.skipped;
  const progressJson = {
    stage: result.failed > 0 ? "completed_with_failures" : "completed",
    total: result.processed,
    completed,
    workerId: context.workerId,
    finishedAt: new Date().toISOString(),
    result,
  } satisfies Prisma.InputJsonValue;

  await context.reportProgress(progressJson);

  return {
    progressJson,
  };
}

async function executeGenerateDescriptionBatchTask(
  task: BackgroundTask,
  context: BackgroundTaskHandlerContext,
): Promise<BackgroundTaskExecutionResult> {
  const payload = generateDescriptionBatchPayloadSchema.parse(task.payloadJson);

  await context.reportProgress({
    stage: "running",
    total: payload.generatedPinIds?.length ?? 0,
    completed: 0,
    workerId: context.workerId,
    startedAt: new Date().toISOString(),
  });

  const result = await generateDescriptionsForJobPins({
    userId: payload.userId,
    jobId: payload.jobId,
    generatedPinIds: payload.generatedPinIds,
    aiCredentialId: payload.aiCredentialId ?? undefined,
  });

  const completed = result.succeeded + result.failed + result.skipped;
  const progressJson = {
    stage: result.failed > 0 ? "completed_with_failures" : "completed",
    total: result.processed,
    completed,
    workerId: context.workerId,
    finishedAt: new Date().toISOString(),
    result,
  } satisfies Prisma.InputJsonValue;

  await context.reportProgress(progressJson);

  return {
    progressJson,
  };
}

async function executeUploadMediaBatchTask(
  task: BackgroundTask,
  context: BackgroundTaskHandlerContext,
): Promise<BackgroundTaskExecutionResult> {
  const payload = uploadMediaBatchPayloadSchema.parse(task.payloadJson);

  await context.reportProgress({
    stage: "running",
    total: payload.generatedPinIds?.length ?? 0,
    completed: 0,
    workerId: context.workerId,
    startedAt: new Date().toISOString(),
  });

  const result = await uploadJobPinsToPubler({
    userId: payload.userId,
    jobId: payload.jobId,
    generatedPinIds: payload.generatedPinIds,
    workspaceId: payload.workspaceId ?? undefined,
  });

  const completed = result.succeeded + result.failed + result.skipped;
  const progressJson = {
    stage: result.failed > 0 ? "completed_with_failures" : "completed",
    total: result.processed,
    completed,
    workerId: context.workerId,
    finishedAt: new Date().toISOString(),
    result,
  } satisfies Prisma.InputJsonValue;

  await context.reportProgress(progressJson);

  return {
    progressJson,
  };
}

async function executeSchedulePinsTask(
  task: BackgroundTask,
  context: BackgroundTaskHandlerContext,
): Promise<BackgroundTaskExecutionResult> {
  const payload = schedulePinsPayloadSchema.parse(task.payloadJson);

  await context.reportProgress({
    stage: "running",
    total: payload.generatedPinIds?.length ?? 0,
    completed: 0,
    workerId: context.workerId,
    scheduleRunId: payload.scheduleRunId ?? null,
    startedAt: new Date().toISOString(),
  });

  const result = await scheduleJobPins({
    userId: payload.userId,
    jobId: payload.jobId,
    scheduleRunId: payload.scheduleRunId,
    firstPublishAt: payload.firstPublishAt,
    intervalMinutes: payload.intervalMinutes,
    jitterMinutes: payload.jitterMinutes,
    schedulePlan: payload.schedulePlan,
    workspaceId: payload.workspaceId ?? undefined,
    accountId: payload.accountId ?? undefined,
    boardId: payload.boardId ?? undefined,
    boardIds: payload.boardIds,
    boardDistributionMode: payload.boardDistributionMode,
    primaryBoardId: payload.primaryBoardId ?? undefined,
    primaryBoardPercent: payload.primaryBoardPercent ?? undefined,
    generatedPinIds: payload.generatedPinIds,
  });

  const completed = result.succeeded + result.failed + result.skipped;
  const progressJson = {
    stage: result.failed > 0 ? "completed_with_failures" : "completed",
    total: result.processed,
    completed,
    workerId: context.workerId,
    scheduleRunId: payload.scheduleRunId ?? result.scheduleRunId ?? null,
    finishedAt: new Date().toISOString(),
    result,
  } satisfies Prisma.InputJsonValue;

  await context.reportProgress(progressJson);

  return {
    progressJson,
  };
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
