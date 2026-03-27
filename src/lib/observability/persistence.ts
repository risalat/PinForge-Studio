import {
  OperationMetricStatus,
  RuntimeHeartbeatKind,
  type Prisma,
} from "@prisma/client";
import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type PersistedOperationContext = {
  correlationId?: string;
  userId?: string;
  jobId?: string;
  planId?: string;
  generatedPinId?: string;
  workspaceId?: string;
};

export async function recordOperationMetric(input: {
  operationName: string;
  status: "SUCCEEDED" | "FAILED";
  durationMs?: number;
  metadataJson?: Prisma.InputJsonValue;
  context?: PersistedOperationContext;
}) {
  if (!isDatabaseConfigured()) {
    return;
  }

  try {
    await prisma.operationMetric.create({
      data: {
        operationName: input.operationName,
        status: input.status as OperationMetricStatus,
        durationMs: typeof input.durationMs === "number" ? Math.max(0, Math.round(input.durationMs)) : null,
        metadataJson: input.metadataJson,
        correlationId: input.context?.correlationId ?? null,
        userId: input.context?.userId ?? null,
        jobId: input.context?.jobId ?? null,
        planId: input.context?.planId ?? null,
        generatedPinId: input.context?.generatedPinId ?? null,
        workspaceId: input.context?.workspaceId ?? null,
      },
    });
  } catch (error) {
    console.warn("[pinforge.obs]", `Failed to persist operation metric ${input.operationName}: ${String(error)}`);
  }
}

export async function touchRuntimeHeartbeat(input: {
  kind: "WEB" | "WORKER" | "SCHEDULER";
  instanceId: string;
  displayName?: string;
  metadataJson?: Prisma.InputJsonValue;
  minIntervalMs?: number;
}) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const instanceId = input.instanceId.trim();
  if (!instanceId) {
    return;
  }

  try {
    const now = new Date();
    const kind = input.kind as RuntimeHeartbeatKind;
    const existing = await prisma.runtimeHeartbeat.findUnique({
      where: {
        kind_instanceId: {
          kind,
          instanceId,
        },
      },
      select: {
        id: true,
        lastSeenAt: true,
      },
    });

    if (
      existing &&
      typeof input.minIntervalMs === "number" &&
      input.minIntervalMs > 0 &&
      now.getTime() - existing.lastSeenAt.getTime() < input.minIntervalMs
    ) {
      return;
    }

    await prisma.runtimeHeartbeat.upsert({
      where: {
        kind_instanceId: {
          kind,
          instanceId,
        },
      },
      create: {
        kind,
        instanceId,
        displayName: input.displayName?.trim() || null,
        metadataJson: input.metadataJson,
        lastSeenAt: now,
      },
      update: {
        displayName: input.displayName?.trim() || null,
        metadataJson: input.metadataJson,
        lastSeenAt: now,
      },
    });
  } catch (error) {
    console.warn("[pinforge.obs]", `Failed to persist runtime heartbeat ${input.kind}:${instanceId}: ${String(error)}`);
  }
}
