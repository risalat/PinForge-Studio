import process from "node:process";
import { runBackgroundScheduler } from "../src/lib/tasks/scheduler";

const once = process.argv.includes("--once");
const schedulerId = process.env.BACKGROUND_SCHEDULER_ID;
const pollIntervalMs = parseInteger(process.env.BACKGROUND_SCHEDULER_INTERVAL_MS);
const syncIntervalMinutes = parseInteger(process.env.BACKGROUND_SYNC_INTERVAL_MINUTES);
const tempCleanupDays = parseInteger(process.env.BACKGROUND_TEMP_CLEANUP_DAYS);
const taskRetentionDays = parseInteger(process.env.BACKGROUND_TASK_RETENTION_DAYS);
const failedTaskRetentionDays = parseInteger(process.env.BACKGROUND_FAILED_TASK_RETENTION_DAYS);
const staleTaskTimeoutMs = parseInteger(process.env.BACKGROUND_TASK_STALE_TIMEOUT_MS);

runBackgroundScheduler({
  schedulerId,
  pollIntervalMs,
  syncIntervalMinutes,
  tempCleanupDays,
  taskRetentionDays,
  failedTaskRetentionDays,
  staleTaskTimeoutMs,
  once,
}).catch((error) => {
  console.error(
    "[pinforge.scheduler]",
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exitCode = 1;
});

function parseInteger(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
