-- CreateEnum
CREATE TYPE "BackgroundTaskStatus" AS ENUM (
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
);

-- CreateEnum
CREATE TYPE "BackgroundTaskKind" AS ENUM (
  'RENDER_PLANS',
  'RERENDER_PLAN',
  'UPLOAD_MEDIA_BATCH',
  'GENERATE_TITLE_BATCH',
  'GENERATE_DESCRIPTION_BATCH',
  'SCHEDULE_PINS',
  'SYNC_PUBLICATIONS',
  'CLEAN_TEMP_ASSETS'
);

-- CreateTable
CREATE TABLE "public"."BackgroundTask" (
  "id" TEXT NOT NULL,
  "kind" "BackgroundTaskKind" NOT NULL,
  "status" "BackgroundTaskStatus" NOT NULL DEFAULT 'QUEUED',
  "userId" TEXT,
  "jobId" TEXT,
  "planId" TEXT,
  "generatedPinId" TEXT,
  "workspaceId" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "dedupeKey" TEXT,
  "payloadJson" JSONB NOT NULL,
  "progressJson" JSONB,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BackgroundTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackgroundTask_status_runAfter_priority_createdAt_idx"
ON "public"."BackgroundTask"("status", "runAfter", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "BackgroundTask_dedupeKey_status_createdAt_idx"
ON "public"."BackgroundTask"("dedupeKey", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BackgroundTask_userId_status_createdAt_idx"
ON "public"."BackgroundTask"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BackgroundTask_jobId_kind_status_createdAt_idx"
ON "public"."BackgroundTask"("jobId", "kind", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BackgroundTask_workspaceId_kind_status_createdAt_idx"
ON "public"."BackgroundTask"("workspaceId", "kind", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."BackgroundTask"
  ADD CONSTRAINT "BackgroundTask_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackgroundTask"
  ADD CONSTRAINT "BackgroundTask_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "public"."GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackgroundTask"
  ADD CONSTRAINT "BackgroundTask_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "public"."GenerationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackgroundTask"
  ADD CONSTRAINT "BackgroundTask_generatedPinId_fkey"
  FOREIGN KEY ("generatedPinId") REFERENCES "public"."GeneratedPin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
