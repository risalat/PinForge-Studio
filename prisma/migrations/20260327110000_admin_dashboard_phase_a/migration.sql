-- CreateEnum
CREATE TYPE "RuntimeHeartbeatKind" AS ENUM (
  'WEB',
  'WORKER',
  'SCHEDULER'
);

-- CreateEnum
CREATE TYPE "OperationMetricStatus" AS ENUM (
  'SUCCEEDED',
  'FAILED'
);

-- CreateTable
CREATE TABLE "public"."RuntimeHeartbeat" (
  "id" TEXT NOT NULL,
  "kind" "RuntimeHeartbeatKind" NOT NULL,
  "instanceId" TEXT NOT NULL,
  "displayName" TEXT,
  "metadataJson" JSONB,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RuntimeHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OperationMetric" (
  "id" TEXT NOT NULL,
  "operationName" TEXT NOT NULL,
  "status" "OperationMetricStatus" NOT NULL,
  "correlationId" TEXT,
  "userId" TEXT,
  "jobId" TEXT,
  "planId" TEXT,
  "generatedPinId" TEXT,
  "workspaceId" TEXT,
  "durationMs" INTEGER,
  "metadataJson" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OperationMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeHeartbeat_kind_instanceId_key"
ON "public"."RuntimeHeartbeat"("kind", "instanceId");

-- CreateIndex
CREATE INDEX "RuntimeHeartbeat_kind_lastSeenAt_idx"
ON "public"."RuntimeHeartbeat"("kind", "lastSeenAt");

-- CreateIndex
CREATE INDEX "OperationMetric_operationName_occurredAt_idx"
ON "public"."OperationMetric"("operationName", "occurredAt");

-- CreateIndex
CREATE INDEX "OperationMetric_status_occurredAt_idx"
ON "public"."OperationMetric"("status", "occurredAt");

-- CreateIndex
CREATE INDEX "OperationMetric_workspaceId_occurredAt_idx"
ON "public"."OperationMetric"("workspaceId", "occurredAt");

-- CreateIndex
CREATE INDEX "OperationMetric_userId_occurredAt_idx"
ON "public"."OperationMetric"("userId", "occurredAt");
