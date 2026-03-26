import { randomUUID } from "node:crypto";
import { Prisma, WorkspaceOperationLockScope } from "@prisma/client";
import { logStructuredEvent } from "@/lib/observability/operationContext";
import { prisma } from "@/lib/prisma";

const DEFAULT_LOCK_LEASE_MS = 5 * 60 * 1000;
const DEFAULT_LOCK_WAIT_MS = 5 * 60 * 1000;
const DEFAULT_LOCK_POLL_MS = 2 * 1000;

type WorkspaceOperationLockInput<T> = {
  scope: WorkspaceOperationLockScope;
  workspaceId: string;
  operation: () => Promise<T>;
  holderId?: string;
  leaseMs?: number;
  waitMs?: number;
  pollMs?: number;
  ownerContext?: Prisma.InputJsonValue;
};

export async function runWithWorkspaceOperationLock<T>(
  input: WorkspaceOperationLockInput<T>,
) {
  const workspaceId = input.workspaceId.trim();
  if (!workspaceId) {
    return input.operation();
  }

  const holderId = input.holderId?.trim() || `workspace_lock_${randomUUID()}`;
  const leaseMs = Math.max(input.leaseMs ?? DEFAULT_LOCK_LEASE_MS, 30_000);
  const pollMs = Math.max(input.pollMs ?? DEFAULT_LOCK_POLL_MS, 500);
  const waitMs = Math.max(input.waitMs ?? DEFAULT_LOCK_WAIT_MS, pollMs);
  const deadline = Date.now() + waitMs;
  let attemptCount = 0;

  while (true) {
    attemptCount += 1;

    const acquired = await tryAcquireWorkspaceOperationLock({
      scope: input.scope,
      workspaceId,
      holderId,
      leaseMs,
      ownerContext: input.ownerContext,
    });

    if (acquired) {
      logStructuredEvent("info", "publer.workspace_lock.acquired", {
        scope: input.scope,
        workspaceId,
        holderId,
        leaseMs,
        waitMs,
        attempts: attemptCount,
      });
      break;
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `Another ${formatLockScopeLabel(input.scope)} operation is already running for this workspace. Try again shortly.`,
      );
    }

    if (attemptCount === 1 || attemptCount % 10 === 0) {
      logStructuredEvent("info", "publer.workspace_lock.waiting", {
        scope: input.scope,
        workspaceId,
        holderId,
        attempts: attemptCount,
        pollMs,
      });
    }

    await delay(pollMs);
  }

  const heartbeatMs = Math.max(5_000, Math.min(30_000, Math.floor(leaseMs / 3)));
  const heartbeat = setInterval(() => {
    void refreshWorkspaceOperationLock({
      scope: input.scope,
      workspaceId,
      holderId,
      leaseMs,
      ownerContext: input.ownerContext,
    }).catch((error) => {
      logStructuredEvent("warn", "publer.workspace_lock.heartbeat_failed", {
        scope: input.scope,
        workspaceId,
        holderId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, heartbeatMs);
  heartbeat.unref?.();

  try {
    return await input.operation();
  } finally {
    clearInterval(heartbeat);
    await releaseWorkspaceOperationLock({
      scope: input.scope,
      workspaceId,
      holderId,
    });
    logStructuredEvent("info", "publer.workspace_lock.released", {
      scope: input.scope,
      workspaceId,
      holderId,
    });
  }
}

async function tryAcquireWorkspaceOperationLock(input: {
  scope: WorkspaceOperationLockScope;
  workspaceId: string;
  holderId: string;
  leaseMs: number;
  ownerContext?: Prisma.InputJsonValue;
}) {
  await ensureWorkspaceOperationLockRow(input.scope, input.workspaceId);

  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + input.leaseMs);
  const updated = await prisma.workspaceOperationLock.updateMany({
    where: {
      scope: input.scope,
      workspaceId: input.workspaceId,
      OR: [
        { holderId: null },
        { leaseExpiresAt: null },
        { leaseExpiresAt: { lte: now } },
        { holderId: input.holderId },
      ],
    },
    data: {
      holderId: input.holderId,
      acquiredAt: now,
      leaseExpiresAt,
      ownerContext: input.ownerContext ?? Prisma.JsonNull,
    },
  });

  return updated.count > 0;
}

async function refreshWorkspaceOperationLock(input: {
  scope: WorkspaceOperationLockScope;
  workspaceId: string;
  holderId: string;
  leaseMs: number;
  ownerContext?: Prisma.InputJsonValue;
}) {
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + input.leaseMs);
  await prisma.workspaceOperationLock.updateMany({
    where: {
      scope: input.scope,
      workspaceId: input.workspaceId,
      holderId: input.holderId,
    },
    data: {
      acquiredAt: now,
      leaseExpiresAt,
      ownerContext: input.ownerContext ?? Prisma.JsonNull,
    },
  });
}

async function releaseWorkspaceOperationLock(input: {
  scope: WorkspaceOperationLockScope;
  workspaceId: string;
  holderId: string;
}) {
  await prisma.workspaceOperationLock.updateMany({
    where: {
      scope: input.scope,
      workspaceId: input.workspaceId,
      holderId: input.holderId,
    },
    data: {
      holderId: null,
      acquiredAt: null,
      leaseExpiresAt: null,
      ownerContext: Prisma.JsonNull,
    },
  });
}

async function ensureWorkspaceOperationLockRow(
  scope: WorkspaceOperationLockScope,
  workspaceId: string,
) {
  try {
    await prisma.workspaceOperationLock.create({
      data: {
        scope,
        workspaceId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }

    throw error;
  }
}

function formatLockScopeLabel(scope: WorkspaceOperationLockScope) {
  switch (scope) {
    case WorkspaceOperationLockScope.MEDIA_UPLOAD:
      return "media upload";
    case WorkspaceOperationLockScope.SCHEDULING:
      return "scheduling";
    case WorkspaceOperationLockScope.SYNC:
      return "publication sync";
    default:
      return "workspace";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
