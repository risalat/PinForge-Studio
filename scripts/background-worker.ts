import process from "node:process";
import { runBackgroundWorker } from "../src/lib/tasks/worker";

const once = process.argv.includes("--once");
const workerId = process.env.BACKGROUND_WORKER_ID;
const pollIntervalMs = parseInteger(process.env.BACKGROUND_WORKER_POLL_MS);
const leaseTimeoutMs = parseInteger(process.env.BACKGROUND_WORKER_LEASE_TIMEOUT_MS);

runBackgroundWorker({
  workerId,
  pollIntervalMs,
  leaseTimeoutMs,
  once,
}).catch((error) => {
  console.error(
    "[pinforge.worker]",
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
