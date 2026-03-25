import os from "node:os";
import process from "node:process";
import type { BackgroundTask } from "@prisma/client";
import {
  claimNextBackgroundTask,
  completeBackgroundTask,
  DEFAULT_BACKGROUND_TASK_LEASE_TIMEOUT_MS,
  failBackgroundTask,
  retryBackgroundTask,
  updateBackgroundTaskProgress,
} from "@/lib/tasks/backgroundTasks";
import {
  classifyBackgroundTaskFailure,
  executeBackgroundTask,
} from "@/lib/tasks/handlers";
import {
  createCorrelationId,
  logStructuredEvent,
  runWithOperationContext,
  timeAsyncOperation,
} from "@/lib/observability/operationContext";

type RunBackgroundWorkerOptions = {
  workerId?: string;
  pollIntervalMs?: number;
  leaseTimeoutMs?: number;
  once?: boolean;
};

export async function runBackgroundWorker(options: RunBackgroundWorkerOptions = {}) {
  const workerId = options.workerId?.trim() || defaultWorkerId();
  const pollIntervalMs = Math.max(500, options.pollIntervalMs ?? 3_000);
  const leaseTimeoutMs = Math.max(
    5_000,
    options.leaseTimeoutMs ?? DEFAULT_BACKGROUND_TASK_LEASE_TIMEOUT_MS,
  );

  logStructuredEvent("info", "background_worker.started", {
    workerId,
    pollIntervalMs,
    leaseTimeoutMs,
    once: Boolean(options.once),
  });

  while (true) {
    const task = await claimNextBackgroundTask({
      workerId,
      leaseTimeoutMs,
    });

    if (!task) {
      if (options.once) {
        logStructuredEvent("info", "background_worker.idle_exit", {
          workerId,
        });
        return;
      }

      await sleep(pollIntervalMs);
      continue;
    }

    await processBackgroundTask(task, workerId);

    if (options.once) {
      return;
    }
  }
}

async function processBackgroundTask(task: BackgroundTask, workerId: string) {
  await runWithOperationContext(
    {
      correlationId: createCorrelationId("background_task"),
      action: "worker.background_task",
      userId: task.userId ?? undefined,
      jobId: task.jobId ?? undefined,
      planId: task.planId ?? undefined,
      generatedPinId: task.generatedPinId ?? undefined,
      workspaceId: task.workspaceId ?? undefined,
    },
    async () =>
      timeAsyncOperation(
        "background_task.run",
        {
          taskId: task.id,
          kind: task.kind,
          status: task.status,
          attempts: task.attempts,
          maxAttempts: task.maxAttempts,
          workerId,
        },
        async () => {
          logStructuredEvent("info", "background_task.claimed", {
            taskId: task.id,
            kind: task.kind,
            attempts: task.attempts,
            maxAttempts: task.maxAttempts,
            workerId,
          });

          try {
            const result = await executeBackgroundTask(task, {
              workerId,
              reportProgress: async (progressJson) => {
                await updateBackgroundTaskProgress({
                  taskId: task.id,
                  workerId,
                  progressJson,
                });
              },
            });

            await completeBackgroundTask({
              taskId: task.id,
              workerId,
              progressJson: result.progressJson,
            });

            logStructuredEvent("info", "background_task.completed", {
              taskId: task.id,
              kind: task.kind,
              attempts: task.attempts,
              workerId,
            });
          } catch (error) {
            const failure = classifyBackgroundTaskFailure(task, error);

            if (failure.retryable) {
              const runAfter = new Date(Date.now() + failure.delayMs);
              await retryBackgroundTask({
                taskId: task.id,
                workerId,
                runAfter,
                lastError: failure.lastError,
                progressJson: {
                  stage: "retry_scheduled",
                  workerId,
                  retryAt: runAfter.toISOString(),
                  diagnostics: failure.diagnostics,
                },
              });

              logStructuredEvent("warn", "background_task.retry_scheduled", {
                taskId: task.id,
                kind: task.kind,
                attempts: task.attempts,
                maxAttempts: task.maxAttempts,
                workerId,
                retryAt: runAfter.toISOString(),
                error: failure.diagnostics,
              });

              return;
            }

            await failBackgroundTask({
              taskId: task.id,
              workerId,
              lastError: failure.lastError,
              progressJson: {
                stage: "failed",
                workerId,
                diagnostics: failure.diagnostics,
              },
            });

            logStructuredEvent("error", "background_task.failed", {
              taskId: task.id,
              kind: task.kind,
              attempts: task.attempts,
              maxAttempts: task.maxAttempts,
              workerId,
              error: failure.diagnostics,
            });

            throw error;
          }
        },
      ),
  );
}

function defaultWorkerId() {
  return `${os.hostname()}-${process.pid}`;
}

function sleep(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
