import {
  BackgroundTaskKind,
  BackgroundTaskStatus,
  OperationMetricStatus,
  PostPulseFreshnessStatus,
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

const SAFE_RETRY_TASK_KINDS = new Set<BackgroundTaskKind>([
  BackgroundTaskKind.RENDER_PLANS,
  BackgroundTaskKind.RERENDER_PLAN,
  BackgroundTaskKind.GENERATE_TITLE_BATCH,
  BackgroundTaskKind.GENERATE_DESCRIPTION_BATCH,
  BackgroundTaskKind.SYNC_PUBLICATIONS,
  BackgroundTaskKind.CLEAN_TEMP_ASSETS,
]);

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

export async function getAdminDashboardData() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
    workspaceProfiles,
    integrationSettings,
    publicationSyncStates,
    publicationRecordsByWorkspace,
    scheduleFailuresByWorkspace,
    postPulseSnapshots,
    workspaceTaskCounts,
  ] = await Promise.all([
    prisma.backgroundTask.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.backgroundTask.groupBy({
      by: ["kind", "status"],
      where: {
        status: {
          in: [BackgroundTaskStatus.QUEUED, BackgroundTaskStatus.RUNNING, BackgroundTaskStatus.FAILED],
        },
      },
      _count: { _all: true },
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
        kind: { in: [...PUBLER_TASK_KINDS] },
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
        operationName: { in: [...PERFORMANCE_OPERATION_NAMES] },
        occurredAt: { gte: weekAgo },
      },
      orderBy: [{ occurredAt: "desc" }],
      take: 500,
    }),
    prisma.workspaceOperationLock.findMany({
      where: {
        leaseExpiresAt: { gt: now },
      },
      orderBy: [{ leaseExpiresAt: "asc" }],
      take: 20,
    }),
    prisma.backgroundTask.findMany({
      where: {
        kind: { in: [...PUBLER_TASK_KINDS] },
        status: BackgroundTaskStatus.FAILED,
        updatedAt: { gte: dayAgo },
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
        expiresAt: { gt: now },
      },
      orderBy: [{ fetchedAt: "desc" }],
      take: 200,
      select: {
        workspaceId: true,
        cacheKind: true,
        fetchedAt: true,
      },
    }),
    prisma.workspaceProfile.findMany({
      orderBy: [{ workspaceName: "asc" }],
      select: {
        userId: true,
        workspaceId: true,
        workspaceName: true,
        isDefault: true,
        defaultAccountId: true,
        defaultBoardId: true,
        dailyPublishTarget: true,
        allowedDomains: true,
      },
    }),
    prisma.userIntegrationSettings.findMany({
      select: {
        userId: true,
        publerWorkspaceId: true,
        publerAccountId: true,
        publerBoardId: true,
      },
    }),
    prisma.publicationSyncState.findMany({
      select: {
        userId: true,
        workspaceId: true,
        mode: true,
        nextPage: true,
        lastCompletedAt: true,
        lastRunAt: true,
        lastError: true,
        updatedAt: true,
      },
    }),
    prisma.publicationRecord.groupBy({
      by: ["providerWorkspaceId", "state"],
      where: {
        syncedAt: { gte: monthAgo },
      },
      _count: { _all: true },
    }),
    prisma.scheduleRunItem.findMany({
      where: {
        status: "FAILED",
        updatedAt: { gte: monthAgo },
      },
      select: {
        scheduleRun: {
          select: {
            workspaceId: true,
          },
        },
      },
    }),
    prisma.postPulseSnapshot.findMany({
      select: {
        workspaceId: true,
        freshnessStatus: true,
        totalJobs: true,
        totalGeneratedPins: true,
        publishedCount: true,
        scheduledCount: true,
        lastPublishedAt: true,
        lastScheduledAt: true,
      },
    }),
    prisma.backgroundTask.groupBy({
      by: ["workspaceId", "status"],
      where: {
        workspaceId: {
          not: null,
        },
        status: {
          in: [BackgroundTaskStatus.QUEUED, BackgroundTaskStatus.RUNNING, BackgroundTaskStatus.FAILED],
        },
      },
      _count: { _all: true },
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

  const workspaceDiagnostics = buildWorkspaceDiagnostics({
    workspaceProfiles,
    integrationSettings,
    publicationSyncStates,
    publicationRecordsByWorkspace,
    scheduleFailuresByWorkspace,
    postPulseSnapshots,
    workspaceTaskCounts,
    recentMetadataCacheEntries,
    activeWorkspaceLocks,
    now,
  });

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
    recentFailedTasks: recentFailedTasks.map((task) => ({
      ...task,
      safeToRetry: SAFE_RETRY_TASK_KINDS.has(task.kind),
    })),
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
    workspaceDiagnostics,
    performance,
  };
}

function buildWorkspaceDiagnostics(input: {
  workspaceProfiles: Array<{
    userId: string;
    workspaceId: string;
    workspaceName: string;
    isDefault: boolean;
    defaultAccountId: string | null;
    defaultBoardId: string | null;
    dailyPublishTarget: number | null;
    allowedDomains: string[];
  }>;
  integrationSettings: Array<{
    userId: string;
    publerWorkspaceId: string | null;
    publerAccountId: string | null;
    publerBoardId: string | null;
  }>;
  publicationSyncStates: Array<{
    userId: string;
    workspaceId: string;
    mode: string;
    nextPage: number;
    lastCompletedAt: Date | null;
    lastRunAt: Date | null;
    lastError: string | null;
    updatedAt: Date;
  }>;
  publicationRecordsByWorkspace: Array<{
    providerWorkspaceId: string | null;
    state: string;
    _count: { _all: number };
  }>;
  scheduleFailuresByWorkspace: Array<{
    scheduleRun: {
      workspaceId: string | null;
    };
  }>;
  postPulseSnapshots: Array<{
    workspaceId: string | null;
    freshnessStatus: PostPulseFreshnessStatus;
    totalJobs: number;
    totalGeneratedPins: number;
    publishedCount: number;
    scheduledCount: number;
    lastPublishedAt: Date | null;
    lastScheduledAt: Date | null;
  }>;
  workspaceTaskCounts: Array<{
    workspaceId: string | null;
    status: BackgroundTaskStatus;
    _count: { _all: number };
  }>;
  recentMetadataCacheEntries: Array<{
    workspaceId: string;
    cacheKind: PublerMetadataCacheKind;
    fetchedAt: Date;
  }>;
  activeWorkspaceLocks: Array<{
    workspaceId: string;
    scope: string;
    leaseExpiresAt: Date | null;
    holderId: string | null;
  }>;
  now: Date;
}) {
  const workspaceMap = new Map<
    string,
    {
      workspaceId: string;
      workspaceName: string;
      userId: string | null;
      isDefault: boolean;
      defaultAccountId: string | null;
      defaultBoardId: string | null;
      dailyPublishTarget: number | null;
      allowedDomains: string[];
    }
  >();

  for (const profile of input.workspaceProfiles) {
    workspaceMap.set(profile.workspaceId, {
      workspaceId: profile.workspaceId,
      workspaceName: profile.workspaceName,
      userId: profile.userId,
      isDefault: profile.isDefault,
      defaultAccountId: profile.defaultAccountId,
      defaultBoardId: profile.defaultBoardId,
      dailyPublishTarget: profile.dailyPublishTarget,
      allowedDomains: profile.allowedDomains,
    });
  }

  for (const settings of input.integrationSettings) {
    const workspaceId = settings.publerWorkspaceId?.trim() ?? "";
    if (!workspaceId || workspaceMap.has(workspaceId)) {
      continue;
    }

    workspaceMap.set(workspaceId, {
      workspaceId,
      workspaceName: workspaceId,
      userId: settings.userId,
      isDefault: true,
      defaultAccountId: settings.publerAccountId,
      defaultBoardId: settings.publerBoardId,
      dailyPublishTarget: null,
      allowedDomains: [],
    });
  }

  for (const syncState of input.publicationSyncStates) {
    if (!workspaceMap.has(syncState.workspaceId)) {
      workspaceMap.set(syncState.workspaceId, {
        workspaceId: syncState.workspaceId,
        workspaceName: syncState.workspaceId,
        userId: syncState.userId,
        isDefault: false,
        defaultAccountId: null,
        defaultBoardId: null,
        dailyPublishTarget: null,
        allowedDomains: [],
      });
    }
  }

  const publicationCountByWorkspace = new Map<string, { scheduled: number; published: number }>();
  for (const row of input.publicationRecordsByWorkspace) {
    const workspaceId = row.providerWorkspaceId?.trim() ?? "";
    if (!workspaceId) {
      continue;
    }

    const current = publicationCountByWorkspace.get(workspaceId) ?? { scheduled: 0, published: 0 };
    if (row.state === "SCHEDULED") {
      current.scheduled += row._count._all;
    } else {
      current.published += row._count._all;
    }
    publicationCountByWorkspace.set(workspaceId, current);
  }

  const scheduleFailuresByWorkspace = new Map<string, number>();
  for (const row of input.scheduleFailuresByWorkspace) {
    const workspaceId = row.scheduleRun.workspaceId?.trim() ?? "";
    if (!workspaceId) {
      continue;
    }
    scheduleFailuresByWorkspace.set(
      workspaceId,
      (scheduleFailuresByWorkspace.get(workspaceId) ?? 0) + 1,
    );
  }

  const pulseByWorkspace = new Map<
    string,
    {
      postsTracked: number;
      needsFreshPins: number;
      noPinsYet: number;
      lastPublishedAt: Date | null;
      lastScheduledAt: Date | null;
      totalJobs: number;
      totalPins: number;
    }
  >();
  for (const snapshot of input.postPulseSnapshots) {
    const workspaceId = snapshot.workspaceId?.trim() ?? "";
    if (!workspaceId) {
      continue;
    }

    const current =
      pulseByWorkspace.get(workspaceId) ??
      {
        postsTracked: 0,
        needsFreshPins: 0,
        noPinsYet: 0,
        lastPublishedAt: null,
        lastScheduledAt: null,
        totalJobs: 0,
        totalPins: 0,
      };

    current.postsTracked += 1;
    current.totalJobs += snapshot.totalJobs;
    current.totalPins += snapshot.totalGeneratedPins;
    if (snapshot.freshnessStatus === PostPulseFreshnessStatus.NEEDS_FRESH_PINS) {
      current.needsFreshPins += 1;
    }
    if (snapshot.freshnessStatus === PostPulseFreshnessStatus.NO_PINS_YET) {
      current.noPinsYet += 1;
    }
    if (!current.lastPublishedAt || (snapshot.lastPublishedAt && snapshot.lastPublishedAt > current.lastPublishedAt)) {
      current.lastPublishedAt = snapshot.lastPublishedAt;
    }
    if (!current.lastScheduledAt || (snapshot.lastScheduledAt && snapshot.lastScheduledAt > current.lastScheduledAt)) {
      current.lastScheduledAt = snapshot.lastScheduledAt;
    }

    pulseByWorkspace.set(workspaceId, current);
  }

  const taskCountsByWorkspace = new Map<string, { queued: number; running: number; failed: number }>();
  for (const row of input.workspaceTaskCounts) {
    const workspaceId = row.workspaceId?.trim() ?? "";
    if (!workspaceId) {
      continue;
    }

    const current = taskCountsByWorkspace.get(workspaceId) ?? { queued: 0, running: 0, failed: 0 };
    if (row.status === BackgroundTaskStatus.QUEUED) {
      current.queued += row._count._all;
    } else if (row.status === BackgroundTaskStatus.RUNNING) {
      current.running += row._count._all;
    } else if (row.status === BackgroundTaskStatus.FAILED) {
      current.failed += row._count._all;
    }
    taskCountsByWorkspace.set(workspaceId, current);
  }

  const latestCacheByWorkspace = new Map<string, Date>();
  for (const row of input.recentMetadataCacheEntries) {
    const workspaceId = row.workspaceId.trim();
    if (!workspaceId || latestCacheByWorkspace.has(workspaceId)) {
      continue;
    }
    latestCacheByWorkspace.set(workspaceId, row.fetchedAt);
  }

  const lockByWorkspace = new Map<string, { scope: string; leaseExpiresAt: Date | null; holderId: string | null }>();
  for (const lock of input.activeWorkspaceLocks) {
    if (!lockByWorkspace.has(lock.workspaceId)) {
      lockByWorkspace.set(lock.workspaceId, {
        scope: lock.scope,
        leaseExpiresAt: lock.leaseExpiresAt,
        holderId: lock.holderId,
      });
    }
  }

  return Array.from(workspaceMap.values())
    .map((workspace) => {
      const pulse = pulseByWorkspace.get(workspace.workspaceId) ?? {
        postsTracked: 0,
        needsFreshPins: 0,
        noPinsYet: 0,
        lastPublishedAt: null,
        lastScheduledAt: null,
        totalJobs: 0,
        totalPins: 0,
      };
      const publicationCounts = publicationCountByWorkspace.get(workspace.workspaceId) ?? {
        scheduled: 0,
        published: 0,
      };
      const taskCounts = taskCountsByWorkspace.get(workspace.workspaceId) ?? {
        queued: 0,
        running: 0,
        failed: 0,
      };
      const syncState =
        input.publicationSyncStates.find((item) => item.workspaceId === workspace.workspaceId) ?? null;
      const activeLock = lockByWorkspace.get(workspace.workspaceId) ?? null;

      return {
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        isDefault: workspace.isDefault,
        allowedDomainCount: workspace.allowedDomains.length,
        dailyPublishTarget: workspace.dailyPublishTarget,
        defaultAccountId: workspace.defaultAccountId,
        defaultBoardId: workspace.defaultBoardId,
        jobsTracked: pulse.totalJobs,
        generatedPinsTracked: pulse.totalPins,
        postsTracked: pulse.postsTracked,
        needsFreshPins: pulse.needsFreshPins,
        noPinsYet: pulse.noPinsYet,
        scheduledPosts30d: publicationCounts.scheduled,
        publishedPosts30d: publicationCounts.published,
        scheduleFailures30d: scheduleFailuresByWorkspace.get(workspace.workspaceId) ?? 0,
        queuedTasks: taskCounts.queued,
        runningTasks: taskCounts.running,
        failedTasks: taskCounts.failed,
        latestMetadataRefreshAt: latestCacheByWorkspace.get(workspace.workspaceId) ?? null,
        lastPublishedAt: pulse.lastPublishedAt,
        lastScheduledAt: pulse.lastScheduledAt,
        syncState: syncState
          ? {
              mode: syncState.mode.toLowerCase(),
              nextPage: syncState.nextPage,
              lastCompletedAt: syncState.lastCompletedAt,
              lastRunAt: syncState.lastRunAt,
              lastError: syncState.lastError,
              updatedAt: syncState.updatedAt,
            }
          : null,
        activeLock: activeLock
          ? {
              scope: activeLock.scope,
              holderId: activeLock.holderId,
              expiresInMinutes:
                activeLock.leaseExpiresAt
                  ? Math.max(0, Math.round((activeLock.leaseExpiresAt.getTime() - input.now.getTime()) / 60000))
                  : null,
            }
          : null,
      };
    })
    .sort((left, right) => {
      if (left.isDefault && !right.isDefault) {
        return -1;
      }
      if (!left.isDefault && right.isDefault) {
        return 1;
      }
      return left.workspaceName.localeCompare(right.workspaceName);
    });
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

  const index = Math.min(durations.length - 1, Math.max(0, Math.ceil(durations.length * percentile) - 1));
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
