import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type OperationContext = {
  correlationId: string;
  action?: string;
  userId?: string;
  jobId?: string;
  planId?: string;
  generatedPinId?: string;
  workspaceId?: string;
};

const operationContextStorage = new AsyncLocalStorage<OperationContext>();

export function createCorrelationId(prefix = "op") {
  return `${prefix}_${randomUUID()}`;
}

export function runWithOperationContext<T>(
  context: Partial<OperationContext>,
  operation: () => Promise<T>,
) {
  const current = operationContextStorage.getStore();
  const nextContext: OperationContext = {
    ...current,
    ...context,
    correlationId:
      context.correlationId?.trim() ||
      current?.correlationId ||
      createCorrelationId(context.action ?? "op"),
  };

  return operationContextStorage.run(nextContext, operation);
}

export function getOperationContext() {
  return operationContextStorage.getStore();
}

export async function timeAsyncOperation<T>(
  name: string,
  metadata: Record<string, unknown>,
  operation: () => Promise<T>,
) {
  const startedAt = Date.now();
  logStructuredEvent("info", `${name}.started`, metadata);

  try {
    const result = await operation();
    logStructuredEvent("info", `${name}.succeeded`, {
      ...metadata,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    logStructuredEvent("error", `${name}.failed`, {
      ...metadata,
      durationMs: Date.now() - startedAt,
      error: normalizeErrorForLogging(error),
    });
    throw error;
  }
}

export function logStructuredEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, unknown> = {},
) {
  const context = getOperationContext();
  const payload = {
    event,
    level,
    timestamp: new Date().toISOString(),
    correlationId: context?.correlationId ?? null,
    action: context?.action ?? null,
    userId: context?.userId ?? null,
    jobId: context?.jobId ?? null,
    planId: context?.planId ?? null,
    generatedPinId: context?.generatedPinId ?? null,
    workspaceId: context?.workspaceId ?? null,
    ...details,
  };

  const serialized = JSON.stringify(payload);
  if (level === "error") {
    console.error("[pinforge.obs]", serialized);
    return;
  }

  if (level === "warn") {
    console.warn("[pinforge.obs]", serialized);
    return;
  }

  console.info("[pinforge.obs]", serialized);
}

export function normalizeErrorForLogging(error: unknown) {
  if (error instanceof Error) {
    const errorRecord = error as Error & {
      statusCode?: number;
      responseBody?: string;
      cause?: unknown;
    };

    return {
      name: error.name,
      message: error.message,
      statusCode: errorRecord.statusCode ?? null,
      responseBody: truncateText(errorRecord.responseBody),
      cause:
        errorRecord.cause && typeof errorRecord.cause !== "function"
          ? truncateText(String(errorRecord.cause))
          : null,
      stack: truncateText(error.stack),
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
      statusCode: null,
      responseBody: null,
      cause: null,
      stack: null,
    };
  }

  return {
    name: "UnknownError",
    message: "Unknown error",
    statusCode: null,
    responseBody: truncateText(safeJsonStringify(error)),
    cause: null,
    stack: null,
  };
}

function truncateText(value: string | undefined | null, maxLength = 2000) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…`;
}

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
