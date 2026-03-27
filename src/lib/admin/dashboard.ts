import {
  BackgroundTaskKind,
  BackgroundTaskStatus,
  OperationMetricStatus,
  PublerMetadataCacheKind,
  RuntimeHeartbeatKind,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PERFORMANCE_OPERATION_NAMES = [
  "workflow.bulk_render",
  "workflow.single_pin_rerender",
  "workflow.publish_title_generation",
  "workflow.description_generation",
  "workflow.publer_media_upload",
  "workflow.schedule_submission",
  "dashboard.post_pulse.load",
  "query.job_detail_load",
] as const;

const PUBLER_TASK_KINDS = [
  BackgroundTaskKind.UPLOAD_MEDIA_BATCH,
  BackgroundTaskKind.SCHEDULE_PINS,
  BackgroundTaskKind.SYNC_PUBLICATIONS,
] as const;

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

export async function getAdminDashboardData() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    taskCountsByStatus,
    taskCountsByKindAndStatus,
    recentFailedTasks,
    recentPublerTasks,
    runtimeHeartbeats,
    recentMetrics,
    activeWorkspaceLocks,
    recentPublerFailures,
    latestTempCleanupTask,
    latestSyncTask,
    recentMetadataCacheEntries,
  ] = await Promise.all([
    prisma.backgroundTask.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.backgroundTask.groupBy({
      by: ["kind", "status"],
      where: {
        status: {
          in: [BackgroundTaskStatus.QUEUED, BackgroundTaskStatus.RUNNING, BackgroundTaskStatus.FAILED],
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.backgroundTask.findMany({
      where: {
        status: BackgroundTaskStatus.FAILED,
      },
      orderBy: [{ finishedAt: "desc" }, { updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        kind: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        workspaceId: true,
        userId: true,
        jobId: true,
        lastError: true,
        finishedAt: true,
        updatedAt: true,
      },
    }),
    prisma.backgroundTask.findMany({
      where: {
        kind: {
          in: [...PUBLER_TASK_KINDS],
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 10,
      select: {
        id: true,
        kind: true,
        status: true,
        workspaceId: true,
        userId: true,
        lockedBy: true,
        startedAt: true,
        finishedAt: true,
        updatedAt: true,
        progressJson: true,
        lastError: true,
      },
    }),
    prisma.runtimeHeartbeat.findMany({
      orderBy: [{ kind: "asc" }, { lastSeenAt: "desc" }],
      take: 20,
    }),
    prisma.operationMetric.findMany({
      where: {
        operationName: {
          in: [...PERFORMANCE_OPERATION_NAMES],
        },
        occurredAt: {
          gte: weekAgo,
        },
      },
      orderBy: [{ occurredAt: "desc" }],
      take: 500,
    }),
    prisma.workspaceOperationLock.findMany({
      where: {
        leaseExpiresAt: {
          gt: now,
        },
      },
      orderBy: [{ leaseExpiresAt: "asc" }],
      take: 20,
    }),
    prisma.backgroundTask.findMany({
      where: {
        kind: {
          in: [...PUBLER_TASK_KINDS],
        },
        status: BackgroundTaskStatus.FAILED,
        updatedAt: {
          gte: dayAgo,
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        kind: true,
        workspaceId: true,
        lastError: true,
        updatedAt: true,
      },
    }),
    prisma.backgroundTask.findFirst({
      where: {
        kind: BackgroundTaskKind.CLEAN_TEMP_ASSETS,
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        status: true,
        updatedAt: true,
        finishedAt: true,
        progressJson: true,
        lastError: true,
      },
    }),
    prisma.backgroundTask.findFirst({
      where: {
        kind: BackgroundTaskKind.SYNC_PUBLICATIONS,
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        status: true,
        updatedAt: true,
        finishedAt: true,
        workspaceId: true,
        progressJson: true,
        lastError: true,
      },
    }),
    prisma.publerMetadataCache.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
      },
      orderBy: [{ fetchedAt: "desc" }],
      take: 200,
      select: {
        cacheKind: true,
        fetchedAt: true,
      },
    }),
  ]);

  const taskStatusCounts = {
    queued: getGroupedCount(taskCountsByStatus, BackgroundTaskStatus.QUEUED),
    running: getGroupedCount(taskCountsByStatus, BackgroundTaskStatus.RUNNING),
    succeeded: getGroupedCount(taskCountsByStatus, BackgroundTaskStatus.SUCCEEDED),
    failed: getGroupedCount(taskCountsByStatus, BackgroundTaskStatus.FAILED),
    cancelled: getGroupedCount(taskCountsByStatus, BackgroundTaskStatus.CANCELLED),
  };

  const recentFailedTaskCount = recentFailedTasks.filter((task) => {
    const timestamp = task.finishedAt ?? task.updatedAt;
    return timestamp >= dayAgo;
  }).length;

  const runtimeByKind = {
    web: buildRuntimeCards(runtimeHeartbeats, RuntimeHeartbeatKind.WEB, now),
    worker: buildRuntimeCards(runtimeHeartbeats, RuntimeHeartbeatKind.WORKER, now),
    scheduler: buildRuntimeCards(runtimeHeartbeats, RuntimeHeartbeatKind.SCHEDULER, now),
  };

  const performance = PERFORMANCE_OPERATION_NAMES.map((name) =>
    buildPerformanceSummary(
      name,
      recentMetrics.filter((metric) => metric.operationName === name),
      now,
    ),
  );

  const metadataCacheSummary = {
    totalFreshEntries: recentMetadataCacheEntries.length,
    workspaces: recentMetadataCacheEntries.filter((item) => item.cacheKind === PublerMetadataCacheKind.WORKSPACES)
      .length,
    accounts: recentMetadataCacheEntries.filter((item) => item.cacheKind === PublerMetadataCacheKind.ACCOUNTS)
      .length,
    boards: recentMetadataCacheEntries.filter((item) => item.cacheKind === PublerMetadataCacheKind.BOARDS).length,
    latestFetchedAt: recentMetadataCacheEntries[0]?.fetchedAt ?? null,
  };

  return {
    generatedAt: now,
    overview: {
      taskStatusCounts,
      recentFailedTaskCount,
      activeWorkspaceLocks: activeWorkspaceLocks.length,
      healthyWorkers: runtimeByKind.worker.filter((item) => item.health === "healthy").length,
      healthySchedulers: runtimeByKind.scheduler.filter((item) => item.health === "healthy").length,
      healthyWebNodes: runtimeByKind.web.filter((item) => item.health === "healthy").length,
      metadataCacheSummary,
    },
    runtimeByKind,
    taskQueueByKind: buildTaskQueueCards(taskCountsByKindAndStatus),
    recentFailedTasks,
    recentPublerTasks: recentPublerTasks.map((task) => ({
      ...task,
      durationMs: task.startedAt
        ? (task.finishedAt ?? now).getTime() - task.startedAt.getTime()
        : null,
      progressLabel: readProgressLabel(task.progressJson),
    })),
    recentPublerFailures,
    activeWorkspaceLocks: activeWorkspaceLocks.map((lock) => ({
      ...lock,
      expiresInMinutes: Math.max(0, Math.round((lock.leaseExpiresAt!.getTime() - now.getTime()) / 60000)),
    })),
    latestTempCleanupTask: latestTempCleanupTask
      ? {
          ...latestTempCleanupTask,
          summary: readCleanupSummary(latestTempCleanupTask.progressJson),
        }
      : null,
    latestSyncTask: latestSyncTask
      ? {
          ...latestSyncTask,
          summary: readProgressLabel(latestSyncTask.progressJson),
        }
      : null,
    performance,
  };
}

function getGroupedCount<T extends { status: BackgroundTaskStatus; _count: { _all: number } }>(
  rows: T[],
  status: BackgroundTaskStatus,
) {
  return rows.find((row) => row.status === status)?._count._all ?? 0;
}

function buildTaskQueueCards(
  rows: Array<{
    kind: BackgroundTaskKind;
    status: BackgroundTaskStatus;
    _count: { _all: number };
  }>,
) {
  return Object.values(BackgroundTaskKind).map((kind) => ({
    kind,
    queued: rows.find((row) => row.kind === kind && row.status === BackgroundTaskStatus.QUEUED)?._count._all ?? 0,
    running: rows.find((row) => row.kind === kind && row.status === BackgroundTaskStatus.RUNNING)?._count._all ?? 0,
    failed: rows.find((row) => row.kind === kind && row.status === BackgroundTaskStatus.FAILED)?._count._all ?? 0,
  }));
}

function buildRuntimeCards(
  rows: Array<{
    kind: RuntimeHeartbeatKind;
    instanceId: string;
    displayName: string | null;
    metadataJson: unknown;
    lastSeenAt: Date;
  }>,
  kind: RuntimeHeartbeatKind,
  now: Date,
) {
  return rows.filter((row) => row.kind === kind).map((row) => {
    const metadata = asRecord(row.metadataJson);
    const ageMs = now.getTime() - row.lastSeenAt.getTime();
    const expectedMs = readExpectedHeartbeatMs(kind, metadata);
    const health =
      ageMs <= expectedMs * 2
        ? "healthy"
        : ageMs <= expectedMs * 6
          ? "stale"
          : "offline";

    return {
      instanceId: row.instanceId,
      displayName: row.displayName || row.instanceId,
      lastSeenAt: row.lastSeenAt,
      ageMs,
      expectedMs,
      health,
      metadata,
    };
  });
}

function buildPerformanceSummary(
  operationName: string,
  rows: Array<{
    status: OperationMetricStatus;
    durationMs: number | null;
    occurredAt: Date;
  }>,
  now: Date,
) {
  const succeeded = rows
    .filter((row) => row.status === OperationMetricStatus.SUCCEEDED && typeof row.durationMs === "number")
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
  const last24h = succeeded.filter((row) => row.occurredAt.getTime() >= now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = succeeded.filter((row) => row.occurredAt.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    operationName,
    latestDurationMs: succeeded[0]?.durationMs ?? null,
    latestOccurredAt: succeeded[0]?.occurredAt ?? null,
    runs24h: last24h.length,
    avg24hMs: averageDuration(last24h),
    p95Last7dMs: percentileDuration(last7d, 0.95),
    recentRuns: succeeded.slice(0, 6).map((row) => ({
      durationMs: row.durationMs,
      occurredAt: row.occurredAt,
    })),
  };
}

function averageDuration(rows: Array<{ durationMs: number | null }>) {
  const durations = rows
    .map((row) => row.durationMs)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (durations.length === 0) {
    return null;
  }

  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function percentileDuration(rows: Array<{ durationMs: number | null }>, percentile: number) {
  const durations = rows
    .map((row) => row.durationMs)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((left, right) => left - right);

  if (durations.length === 0) {
    return null;
  }

  const index = Math.min(
    durations.length - 1,
    Math.max(0, Math.ceil(durations.length * percentile) - 1),
  );
  return durations[index] ?? null;
}

function readExpectedHeartbeatMs(kind: RuntimeHeartbeatKind, metadata: Record<string, unknown>) {
  const pollIntervalMs = numberFromUnknown(metadata.pollIntervalMs);
  if (typeof pollIntervalMs === "number" && pollIntervalMs > 0) {
    return pollIntervalMs;
  }

  switch (kind) {
    case RuntimeHeartbeatKind.WEB:
      return 60_000;
    case RuntimeHeartbeatKind.SCHEDULER:
      return 5 * 60_000;
    default:
      return 3_000;
  }
}

function readCleanupSummary(value: unknown) {
  const metadata = asRecord(value);
  const deletedCount = numberFromUnknown(metadata.deletedCount);
  const foundCount = numberFromUnknown(metadata.foundCount);
  const preview = Boolean(metadata.preview);

  if (typeof deletedCount === "number") {
    return `${deletedCount} temp assets deleted`;
  }
  if (typeof foundCount === "number") {
    return preview ? `${foundCount} stale assets found in preview` : `${foundCount} stale assets scanned`;
  }
  return "Cleanup result available";
}

function readProgressLabel(value: unknown) {
  const metadata = asRecord(value);
  const stage = typeof metadata.stage === "string" ? metadata.stage.replace(/[_-]+/g, " ") : "";
  const completed = numberFromUnknown(metadata.completedPins) ?? numberFromUnknown(metadata.completedCount);
  const total = numberFromUnknown(metadata.totalPins) ?? numberFromUnknown(metadata.totalCount);

  if (typeof completed === "number" && typeof total === "number" && total > 0) {
    return `${stage || "Progress"} ${completed}/${total}`;
  }
  if (stage) {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
  return "No progress details";
}

function numberFromUnknown(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
