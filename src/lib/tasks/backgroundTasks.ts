import { createHash } from "node:crypto";
import {
  BackgroundTaskKind,
  BackgroundTaskStatus,
  Prisma,
  type BackgroundTask,
} from "@prisma/client";
import { logStructuredEvent } from "@/lib/observability/operationContext";
import { prisma } from "@/lib/prisma";

const ACTIVE_TASK_STATUSES = [
  BackgroundTaskStatus.QUEUED,
  BackgroundTaskStatus.RUNNING,
] as const;

const RENDER_TASK_KINDS = [
  BackgroundTaskKind.RENDER_PLANS,
  BackgroundTaskKind.RERENDER_PLAN,
] as const;

export const DEFAULT_BACKGROUND_TASK_LEASE_TIMEOUT_MS = 5 * 60 * 1000;

export type BackgroundTaskRecord = BackgroundTask;

export type EnqueueBackgroundTaskInput = {
  kind: BackgroundTaskKind;
  userId?: string | null;
  jobId?: string | null;
  planId?: string | null;
  generatedPinId?: string | null;
  workspaceId?: string | null;
  priority?: number;
  dedupeKey?: string | null;
  payloadJson: Prisma.InputJsonValue;
  progressJson?: Prisma.InputJsonValue;
  maxAttempts?: number;
  runAfter?: Date;
};

export type EnqueueBackgroundTaskResult = {
  task: BackgroundTaskRecord;
  reused: boolean;
};

export async function enqueueBackgroundTask(
  input: EnqueueBackgroundTaskInput,
): Promise<EnqueueBackgroundTaskResult> {
  const dedupeKey = input.dedupeKey?.trim() || null;

  if (dedupeKey) {
    const existing = await prisma.backgroundTask.findFirst({
      where: {
        dedupeKey,
        status: {
          in: [...ACTIVE_TASK_STATUSES],
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    if (existing) {
      logStructuredEvent("info", "background_task.enqueue.reused", {
        taskId: existing.id,
        kind: existing.kind,
        status: existing.status,
        dedupeKey,
      });

      return {
        task: existing,
        reused: true,
      };
    }
  }

  const task = await prisma.backgroundTask.create({
    data: {
      kind: input.kind,
      status: BackgroundTaskStatus.QUEUED,
      userId: normalizeNullableId(input.userId),
      jobId: normalizeNullableId(input.jobId),
      planId: normalizeNullableId(input.planId),
      generatedPinId: normalizeNullableId(input.generatedPinId),
      workspaceId: normalizeNullableId(input.workspaceId),
      priority: input.priority ?? 0,
      dedupeKey,
      payloadJson: input.payloadJson,
      progressJson: input.progressJson,
      maxAttempts: Math.max(1, input.maxAttempts ?? 5),
      runAfter: input.runAfter ?? new Date(),
    },
  });

  logStructuredEvent("info", "background_task.enqueue.created", {
    taskId: task.id,
    kind: task.kind,
    dedupeKey,
    priority: task.priority,
    runAfter: task.runAfter.toISOString(),
  });

  return {
    task,
    reused: false,
  };
}

export async function claimNextBackgroundTask(input: {
  workerId: string;
  leaseTimeoutMs?: number;
}) {
  const staleBefore = new Date(
    Date.now() - (input.leaseTimeoutMs ?? DEFAULT_BACKGROUND_TASK_LEASE_TIMEOUT_MS),
  );

  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH candidate AS (
      SELECT id
      FROM "BackgroundTask"
      WHERE (
        ("status" = 'QUEUED' AND "runAfter" <= NOW())
        OR ("status" = 'RUNNING' AND "lockedAt" IS NOT NULL AND "lockedAt" < ${staleBefore})
      )
      ORDER BY priority DESC, "runAfter" ASC, "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "BackgroundTask" AS task
    SET
      "status" = 'RUNNING',
      "lockedAt" = NOW(),
      "lockedBy" = ${input.workerId},
      "startedAt" = COALESCE(task."startedAt", NOW()),
      "attempts" = task."attempts" + 1,
      "updatedAt" = NOW()
    FROM candidate
    WHERE task.id = candidate.id
    RETURNING task.id
  `);

  const taskId = rows[0]?.id;
  if (!taskId) {
    return null;
  }

  return prisma.backgroundTask.findUnique({
    where: { id: taskId },
  });
}

export async function updateBackgroundTaskProgress(input: {
  taskId: string;
  workerId: string;
  progressJson: Prisma.InputJsonValue;
}) {
  return prisma.backgroundTask.update({
    where: { id: input.taskId },
    data: {
      progressJson: input.progressJson,
      lockedAt: new Date(),
      lockedBy: input.workerId,
    },
  });
}

export async function completeBackgroundTask(input: {
  taskId: string;
  workerId: string;
  progressJson?: Prisma.InputJsonValue;
}) {
  return prisma.backgroundTask.update({
    where: { id: input.taskId },
    data: {
      status: BackgroundTaskStatus.SUCCEEDED,
      progressJson: input.progressJson,
      finishedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

export async function retryBackgroundTask(input: {
  taskId: string;
  workerId: string;
  runAfter: Date;
  lastError: string;
  progressJson?: Prisma.InputJsonValue;
}) {
  return prisma.backgroundTask.update({
    where: { id: input.taskId },
    data: {
      status: BackgroundTaskStatus.QUEUED,
      runAfter: input.runAfter,
      progressJson: input.progressJson,
      lockedAt: null,
      lockedBy: null,
      finishedAt: null,
      lastError: input.lastError,
    },
  });
}

export async function failBackgroundTask(input: {
  taskId: string;
  workerId: string;
  lastError: string;
  progressJson?: Prisma.InputJsonValue;
}) {
  return prisma.backgroundTask.update({
    where: { id: input.taskId },
    data: {
      status: BackgroundTaskStatus.FAILED,
      progressJson: input.progressJson,
      finishedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: input.lastError,
    },
  });
}

export function buildRenderPlansTaskDedupeKey(jobId: string, planIds: string[]) {
  return `render-plans:${jobId}:${hashIds(planIds)}`;
}

export function buildRerenderPlanTaskDedupeKey(planId: string) {
  return `rerender-plan:${planId}`;
}

export function buildUploadMediaBatchTaskDedupeKey(
  jobId: string,
  workspaceId: string,
  pinIds: string[],
) {
  return `upload-media:${jobId}:${workspaceId}:${hashIds(pinIds)}`;
}

export function buildGenerateTitleBatchTaskDedupeKey(
  jobId: string,
  pinIds: string[],
  aiCredentialId?: string | null,
) {
  return `generate-title-batch:${jobId}:${hashIds(pinIds)}:${aiCredentialId?.trim() || "default"}`;
}

export function buildGenerateDescriptionBatchTaskDedupeKey(
  jobId: string,
  pinIds: string[],
  aiCredentialId?: string | null,
) {
  return `generate-description-batch:${jobId}:${hashIds(pinIds)}:${aiCredentialId?.trim() || "default"}`;
}

export function buildSchedulePinsTaskDedupeKey(scheduleRunId: string) {
  return `schedule-run:${scheduleRunId}`;
}

export function buildSyncPublicationsTaskDedupeKey(input: {
  userId: string;
  workspaceId: string;
  mode: string;
  page: number;
}) {
  return `sync-publications:${input.userId}:${input.workspaceId}:${input.mode}:${input.page}`;
}

export function buildCleanTempAssetsTaskDedupeKey(days: number, apply: boolean) {
  return `clean-temp-assets:${days}:${apply ? "apply" : "preview"}`;
}

export function serializeBackgroundTaskSummary(task: BackgroundTaskRecord) {
  return {
    id: task.id,
    kind: task.kind,
    status: task.status,
    dedupeKey: task.dedupeKey,
    attempts: task.attempts,
    maxAttempts: task.maxAttempts,
    runAfter: task.runAfter.toISOString(),
    lockedAt: task.lockedAt?.toISOString() ?? null,
    lockedBy: task.lockedBy ?? null,
    startedAt: task.startedAt?.toISOString() ?? null,
    finishedAt: task.finishedAt?.toISOString() ?? null,
    lastError: task.lastError ?? null,
  };
}

export async function listBackgroundTasksForJob(input: {
  jobId: string;
  kinds?: BackgroundTaskKind[];
  statuses?: BackgroundTaskStatus[];
  limit?: number;
}) {
  return prisma.backgroundTask.findMany({
    where: {
      jobId: input.jobId,
      kind: input.kinds?.length ? { in: input.kinds } : undefined,
      status: input.statuses?.length ? { in: input.statuses } : undefined,
    },
    orderBy: [{ createdAt: "desc" }],
    take: input.limit ?? 10,
  });
}

export async function getBackgroundTaskForJob(taskId: string, jobId: string) {
  return prisma.backgroundTask.findFirst({
    where: {
      id: taskId,
      jobId,
    },
  });
}

export function isRenderBackgroundTaskKind(kind: BackgroundTaskKind) {
  return (RENDER_TASK_KINDS as readonly BackgroundTaskKind[]).includes(kind);
}

export function getActiveBackgroundTaskStatuses() {
  return [...ACTIVE_TASK_STATUSES];
}

function hashIds(ids: string[]) {
  const normalized = Array.from(
    new Set(ids.map((value) => value.trim()).filter((value) => value.length > 0)),
  ).sort();

  return createHash("sha1").update(normalized.join("|")).digest("hex").slice(0, 16);
}

function normalizeNullableId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
