import os from "node:os";
import process from "node:process";
import {
  BackgroundTaskKind,
  BackgroundTaskStatus,
} from "@prisma/client";
import {
  buildCleanTempAssetsTaskDedupeKey,
  buildSyncPublicationsTaskDedupeKey,
  DEFAULT_BACKGROUND_TASK_LEASE_TIMEOUT_MS,
  enqueueBackgroundTask,
  getActiveBackgroundTaskStatuses,
} from "@/lib/tasks/backgroundTasks";
import { prisma } from "@/lib/prisma";
import { logStructuredEvent } from "@/lib/observability/operationContext";
import { touchRuntimeHeartbeat } from "@/lib/observability/persistence";

const DEFAULT_SCHEDULER_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_SYNC_INTERVAL_MINUTES = 30;
const DEFAULT_TEMP_CLEANUP_DAYS = 14;
const DEFAULT_TASK_RETENTION_DAYS = 30;
const DEFAULT_FAILED_TASK_RETENTION_DAYS = 60;
const DEFAULT_STALE_TASK_TIMEOUT_MS = DEFAULT_BACKGROUND_TASK_LEASE_TIMEOUT_MS * 2;

type RunBackgroundSchedulerOptions = {
  schedulerId?: string;
  pollIntervalMs?: number;
  syncIntervalMinutes?: number;
  tempCleanupDays?: number;
  taskRetentionDays?: number;
  failedTaskRetentionDays?: number;
  staleTaskTimeoutMs?: number;
  once?: boolean;
};

export async function runBackgroundScheduler(
  options: RunBackgroundSchedulerOptions = {},
) {
  const schedulerId = options.schedulerId?.trim() || defaultSchedulerId();
  const pollIntervalMs = Math.max(1_000, options.pollIntervalMs ?? DEFAULT_SCHEDULER_INTERVAL_MS);
  const syncIntervalMinutes = Math.max(5, options.syncIntervalMinutes ?? DEFAULT_SYNC_INTERVAL_MINUTES);
  const tempCleanupDays = Math.max(1, options.tempCleanupDays ?? DEFAULT_TEMP_CLEANUP_DAYS);
  const taskRetentionDays = Math.max(1, options.taskRetentionDays ?? DEFAULT_TASK_RETENTION_DAYS);
  const failedTaskRetentionDays = Math.max(
    taskRetentionDays,
    options.failedTaskRetentionDays ?? DEFAULT_FAILED_TASK_RETENTION_DAYS,
  );
  const staleTaskTimeoutMs = Math.max(
    DEFAULT_BACKGROUND_TASK_LEASE_TIMEOUT_MS,
    options.staleTaskTimeoutMs ?? DEFAULT_STALE_TASK_TIMEOUT_MS,
  );

  logStructuredEvent("info", "background_scheduler.started", {
    schedulerId,
    pollIntervalMs,
    syncIntervalMinutes,
    tempCleanupDays,
    taskRetentionDays,
    failedTaskRetentionDays,
    staleTaskTimeoutMs,
    once: Boolean(options.once),
  });
  await touchRuntimeHeartbeat({
    kind: "SCHEDULER",
    instanceId: schedulerId,
    displayName: "Background scheduler",
    minIntervalMs: 0,
    metadataJson: {
      pollIntervalMs,
      syncIntervalMinutes,
      tempCleanupDays,
      once: Boolean(options.once),
    },
  });

  while (true) {
    await runSchedulerIteration({
      schedulerId,
      syncIntervalMinutes,
      tempCleanupDays,
      taskRetentionDays,
      failedTaskRetentionDays,
      staleTaskTimeoutMs,
    });
    await touchRuntimeHeartbeat({
      kind: "SCHEDULER",
      instanceId: schedulerId,
      displayName: "Background scheduler",
      minIntervalMs: pollIntervalMs,
      metadataJson: {
        pollIntervalMs,
        syncIntervalMinutes,
        tempCleanupDays,
        state: "sleeping",
      },
    });

    if (options.once) {
      return;
    }

    await sleep(pollIntervalMs);
  }
}

async function runSchedulerIteration(input: {
  schedulerId: string;
  syncIntervalMinutes: number;
  tempCleanupDays: number;
  taskRetentionDays: number;
  failedTaskRetentionDays: number;
  staleTaskTimeoutMs: number;
}) {
  await touchRuntimeHeartbeat({
    kind: "SCHEDULER",
    instanceId: input.schedulerId,
    displayName: "Background scheduler",
    minIntervalMs: 0,
    metadataJson: {
      syncIntervalMinutes: input.syncIntervalMinutes,
      tempCleanupDays: input.tempCleanupDays,
      state: "running_iteration",
    },
  });
  const recovered = await recoverExpiredBackgroundTasks({
    schedulerId: input.schedulerId,
    staleTaskTimeoutMs: input.staleTaskTimeoutMs,
  });
  const syncEnqueued = await enqueueRecurringPublicationSyncTasks({
    schedulerId: input.schedulerId,
    syncIntervalMinutes: input.syncIntervalMinutes,
  });
  const tempCleanupEnqueued = await enqueueRecurringTempCleanupTask({
    schedulerId: input.schedulerId,
    tempCleanupDays: input.tempCleanupDays,
  });
  const pruned = await pruneBackgroundTaskHistory({
    schedulerId: input.schedulerId,
    taskRetentionDays: input.taskRetentionDays,
    failedTaskRetentionDays: input.failedTaskRetentionDays,
  });

  logStructuredEvent("info", "background_scheduler.iteration.completed", {
    schedulerId: input.schedulerId,
    recoveredQueued: recovered.requeued,
    recoveredFailed: recovered.failed,
    syncTasksEnqueued: syncEnqueued,
    tempCleanupTasksEnqueued: tempCleanupEnqueued,
    prunedCompletedTasks: pruned.completedDeleted,
    prunedFailedTasks: pruned.failedDeleted,
  });
}

async function recoverExpiredBackgroundTasks(input: {
  schedulerId: string;
  staleTaskTimeoutMs: number;
}) {
  const staleBefore = new Date(Date.now() - input.staleTaskTimeoutMs);
  const staleTasks = await prisma.backgroundTask.findMany({
    where: {
      status: BackgroundTaskStatus.RUNNING,
      lockedAt: {
        lt: staleBefore,
      },
    },
    orderBy: [{ lockedAt: "asc" }],
    take: 100,
  });

  let requeued = 0;
  let failed = 0;

  for (const task of staleTasks) {
    if (task.attempts < task.maxAttempts) {
      await prisma.backgroundTask.update({
        where: { id: task.id },
        data: {
          status: BackgroundTaskStatus.QUEUED,
          runAfter: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: "Recovered after stale worker lease expiry.",
          progressJson: {
            stage: "recovered",
            schedulerId: input.schedulerId,
            recoveredAt: new Date().toISOString(),
          },
        },
      });
      requeued += 1;
      logStructuredEvent("warn", "background_task.recovered_to_queue", {
        taskId: task.id,
        kind: task.kind,
        schedulerId: input.schedulerId,
        attempts: task.attempts,
        maxAttempts: task.maxAttempts,
      });
      continue;
    }

    await prisma.backgroundTask.update({
      where: { id: task.id },
      data: {
        status: BackgroundTaskStatus.FAILED,
        finishedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: "Marked failed after stale worker lease expiry and retries exhausted.",
        progressJson: {
          stage: "failed_stale_recovery",
          schedulerId: input.schedulerId,
          failedAt: new Date().toISOString(),
        },
      },
    });
    failed += 1;
    logStructuredEvent("error", "background_task.failed_stale_recovery", {
      taskId: task.id,
      kind: task.kind,
      schedulerId: input.schedulerId,
      attempts: task.attempts,
      maxAttempts: task.maxAttempts,
    });
  }

  return { requeued, failed };
}

async function enqueueRecurringPublicationSyncTasks(input: {
  schedulerId: string;
  syncIntervalMinutes: number;
}) {
  const settingsRows = await prisma.userIntegrationSettings.findMany({
    where: {
      publerApiKeyEnc: {
        not: null,
      },
    },
    select: {
      userId: true,
      publerApiKeyEnc: true,
      publerWorkspaceId: true,
    },
  });
  const workspaceProfiles = await prisma.workspaceProfile.findMany({
    select: {
      userId: true,
      workspaceId: true,
    },
  });
  const syncStates = await prisma.publicationSyncState.findMany({
    select: {
      userId: true,
      workspaceId: true,
      mode: true,
      nextPage: true,
      lastRunAt: true,
    },
  });

  const workspacesByUser = new Map<string, Set<string>>();
  for (const settings of settingsRows) {
    if (!settings.publerApiKeyEnc?.trim()) {
      continue;
    }
    const set = workspacesByUser.get(settings.userId) ?? new Set<string>();
    const defaultWorkspaceId = settings.publerWorkspaceId?.trim() ?? "";
    if (defaultWorkspaceId) {
      set.add(defaultWorkspaceId);
    }
    workspacesByUser.set(settings.userId, set);
  }
  for (const profile of workspaceProfiles) {
    const workspaceId = profile.workspaceId.trim();
    if (!workspaceId) {
      continue;
    }
    const set = workspacesByUser.get(profile.userId) ?? new Set<string>();
    set.add(workspaceId);
    workspacesByUser.set(profile.userId, set);
  }

  const syncStateByScope = new Map(
    syncStates.map((state) => [`${state.userId}:${state.workspaceId}`, state]),
  );
  const cutoff = new Date(Date.now() - input.syncIntervalMinutes * 60 * 1000);
  let enqueued = 0;

  for (const [userId, workspaceIds] of workspacesByUser.entries()) {
    for (const workspaceId of workspaceIds) {
      const activeTask = await prisma.backgroundTask.findFirst({
        where: {
          kind: BackgroundTaskKind.SYNC_PUBLICATIONS,
          userId,
          workspaceId,
          status: {
            in: getActiveBackgroundTaskStatuses(),
          },
        },
        select: { id: true },
      });
      if (activeTask) {
        continue;
      }

      const syncState = syncStateByScope.get(`${userId}:${workspaceId}`);
      if (syncState?.lastRunAt && syncState.lastRunAt > cutoff) {
        continue;
      }

      const mode = syncState?.mode?.toLowerCase?.() ?? "backfill";
      const page = Math.max(syncState?.nextPage ?? 1, 1);

      const result = await enqueueBackgroundTask({
        kind: BackgroundTaskKind.SYNC_PUBLICATIONS,
        userId,
        workspaceId,
        priority: -20,
        dedupeKey: buildSyncPublicationsTaskDedupeKey({
          userId,
          workspaceId,
          mode,
          page,
        }),
        payloadJson: {
          userId,
          workspaceId,
        },
      });

      if (!result.reused) {
        enqueued += 1;
        logStructuredEvent("info", "background_scheduler.sync_task_enqueued", {
          schedulerId: input.schedulerId,
          taskId: result.task.id,
          userId,
          workspaceId,
          mode,
          page,
        });
      }
    }
  }

  return enqueued;
}

async function enqueueRecurringTempCleanupTask(input: {
  schedulerId: string;
  tempCleanupDays: number;
}) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const dedupeKey = `${buildCleanTempAssetsTaskDedupeKey(input.tempCleanupDays, true)}:${todayKey}`;
  const existing = await prisma.backgroundTask.findFirst({
    where: {
      dedupeKey,
    },
    select: { id: true },
  });

  if (existing) {
    return 0;
  }

  const result = await enqueueBackgroundTask({
    kind: BackgroundTaskKind.CLEAN_TEMP_ASSETS,
    priority: -50,
    dedupeKey,
    payloadJson: {
      days: input.tempCleanupDays,
      apply: true,
    },
  });

  if (!result.reused) {
    logStructuredEvent("info", "background_scheduler.temp_cleanup_enqueued", {
      schedulerId: input.schedulerId,
      taskId: result.task.id,
      days: input.tempCleanupDays,
      dedupeKey,
    });
    return 1;
  }

  return 0;
}

async function pruneBackgroundTaskHistory(input: {
  schedulerId: string;
  taskRetentionDays: number;
  failedTaskRetentionDays: number;
}) {
  const completedBefore = new Date(Date.now() - input.taskRetentionDays * 24 * 60 * 60 * 1000);
  const failedBefore = new Date(
    Date.now() - input.failedTaskRetentionDays * 24 * 60 * 60 * 1000,
  );

  const [completedResult, failedResult] = await Promise.all([
    prisma.backgroundTask.deleteMany({
      where: {
        status: {
          in: [BackgroundTaskStatus.SUCCEEDED, BackgroundTaskStatus.CANCELLED],
        },
        finishedAt: {
          lt: completedBefore,
        },
      },
    }),
    prisma.backgroundTask.deleteMany({
      where: {
        status: BackgroundTaskStatus.FAILED,
        finishedAt: {
          lt: failedBefore,
        },
      },
    }),
  ]);

  return {
    completedDeleted: completedResult.count,
    failedDeleted: failedResult.count,
  };
}

function defaultSchedulerId() {
  return `scheduler-${os.hostname()}-${process.pid}`;
}

function sleep(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
