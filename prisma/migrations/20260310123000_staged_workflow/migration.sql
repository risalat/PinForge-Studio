-- CreateEnum
CREATE TYPE "GenerationPlanMode" AS ENUM ('ASSISTED_AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "GenerationPlanStatus" AS ENUM ('DRAFT', 'READY', 'GENERATED', 'FAILED');

-- CreateEnum
CREATE TYPE "MediaUploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "PinCopyFieldStatus" AS ENUM ('EMPTY', 'GENERATED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "ScheduleRunStatus" AS ENUM ('DRAFT', 'SUBMITTING', 'SCHEDULED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScheduleRunItemStatus" AS ENUM ('PENDING', 'SUBMITTING', 'SCHEDULED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "GenerationJobStatus_new" AS ENUM (
  'RECEIVED',
  'REVIEWING',
  'READY_FOR_GENERATION',
  'PINS_GENERATED',
  'MEDIA_UPLOADED',
  'TITLES_GENERATED',
  'DESCRIPTIONS_GENERATED',
  'READY_TO_SCHEDULE',
  'SCHEDULED',
  'COMPLETED',
  'FAILED'
);
ALTER TABLE "public"."GenerationJob" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."GenerationJob"
  ALTER COLUMN "status" TYPE "GenerationJobStatus_new"
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'RECEIVED'
      WHEN 'PROCESSING' THEN 'REVIEWING'
      ELSE "status"::text
    END
  )::"GenerationJobStatus_new";
ALTER TYPE "public"."GenerationJobStatus" RENAME TO "GenerationJobStatus_old";
ALTER TYPE "GenerationJobStatus_new" RENAME TO "GenerationJobStatus";
DROP TYPE "public"."GenerationJobStatus_old";
ALTER TABLE "public"."GenerationJob" ALTER COLUMN "status" SET DEFAULT 'RECEIVED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."GeneratedPin"
  DROP COLUMN "description",
  DROP COLUMN "publerPostId",
  DROP COLUMN "scheduledAt",
  DROP COLUMN "title",
  ADD COLUMN "planId" TEXT NOT NULL,
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."GenerationJob"
  DROP COLUMN "generatedCopy",
  DROP COLUMN "requestedTemplates",
  DROP COLUMN "sourceImages",
  ADD COLUMN "articleTitleSnapshot" TEXT NOT NULL,
  ADD COLUMN "domainSnapshot" TEXT NOT NULL,
  ADD COLUMN "globalKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "listCountHint" INTEGER,
  ADD COLUMN "postUrlSnapshot" TEXT NOT NULL,
  ADD COLUMN "requestedPinCount" INTEGER,
  ADD COLUMN "titleStyle" TEXT,
  ADD COLUMN "titleVariationCount" INTEGER,
  ADD COLUMN "toneHint" TEXT,
  ADD COLUMN "userId" TEXT NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'RECEIVED';

-- CreateTable
CREATE TABLE "public"."JobSourceImage" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "caption" TEXT,
  "nearestHeading" TEXT,
  "sectionHeadingPath" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "surroundingTextSnippet" TEXT,
  "isSelected" BOOLEAN NOT NULL DEFAULT true,
  "isPreferred" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "JobSourceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GenerationPlan" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "mode" "GenerationPlanMode" NOT NULL,
  "templateId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "GenerationPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GenerationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GenerationPlanImageAssignment" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "sourceImageId" TEXT NOT NULL,
  "slotIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GenerationPlanImageAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PublerMedia" (
  "id" TEXT NOT NULL,
  "generatedPinId" TEXT NOT NULL,
  "status" "MediaUploadStatus" NOT NULL DEFAULT 'PENDING',
  "uploadJobId" TEXT,
  "mediaId" TEXT,
  "sourceUrl" TEXT,
  "errorMessage" TEXT,
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PublerMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PinCopy" (
  "id" TEXT NOT NULL,
  "generatedPinId" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "titleStatus" "PinCopyFieldStatus" NOT NULL DEFAULT 'EMPTY',
  "descriptionStatus" "PinCopyFieldStatus" NOT NULL DEFAULT 'EMPTY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PinCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleRun" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" "ScheduleRunStatus" NOT NULL DEFAULT 'DRAFT',
  "workspaceId" TEXT,
  "accountId" TEXT,
  "boardId" TEXT,
  "firstPublishAt" TIMESTAMP(3),
  "intervalMinutes" INTEGER,
  "jitterMinutes" INTEGER,
  "errorMessage" TEXT,
  "rawResponse" JSONB,
  "submittedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScheduleRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleRunItem" (
  "id" TEXT NOT NULL,
  "scheduleRunId" TEXT NOT NULL,
  "generatedPinId" TEXT NOT NULL,
  "publerJobId" TEXT,
  "publerPostId" TEXT,
  "scheduledFor" TIMESTAMP(3),
  "status" "ScheduleRunItemStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScheduleRunItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobMilestone" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" "GenerationJobStatus" NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "JobMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobSourceImage_jobId_sortOrder_idx" ON "public"."JobSourceImage"("jobId", "sortOrder");

-- CreateIndex
CREATE INDEX "GenerationPlan_jobId_status_sortOrder_idx" ON "public"."GenerationPlan"("jobId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "GenerationPlanImageAssignment_sourceImageId_idx" ON "public"."GenerationPlanImageAssignment"("sourceImageId");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationPlanImageAssignment_planId_slotIndex_key" ON "public"."GenerationPlanImageAssignment"("planId", "slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PublerMedia_generatedPinId_key" ON "public"."PublerMedia"("generatedPinId");

-- CreateIndex
CREATE INDEX "PublerMedia_status_createdAt_idx" ON "public"."PublerMedia"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PinCopy_generatedPinId_key" ON "public"."PinCopy"("generatedPinId");

-- CreateIndex
CREATE INDEX "ScheduleRun_jobId_status_createdAt_idx" ON "public"."ScheduleRun"("jobId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleRunItem_scheduleRunId_generatedPinId_key" ON "public"."ScheduleRunItem"("scheduleRunId", "generatedPinId");

-- CreateIndex
CREATE INDEX "JobMilestone_jobId_createdAt_idx" ON "public"."JobMilestone"("jobId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobMilestone_jobId_status_key" ON "public"."JobMilestone"("jobId", "status");

-- CreateIndex
CREATE INDEX "GeneratedPin_jobId_createdAt_idx" ON "public"."GeneratedPin"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedPin_planId_idx" ON "public"."GeneratedPin"("planId");

-- CreateIndex
CREATE INDEX "GenerationJob_userId_status_createdAt_idx" ON "public"."GenerationJob"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_postId_createdAt_idx" ON "public"."GenerationJob"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."GenerationJob"
  ADD CONSTRAINT "GenerationJob_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobSourceImage"
  ADD CONSTRAINT "JobSourceImage_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "public"."GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GenerationPlan"
  ADD CONSTRAINT "GenerationPlan_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "public"."GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GenerationPlan"
  ADD CONSTRAINT "GenerationPlan_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "public"."Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GenerationPlanImageAssignment"
  ADD CONSTRAINT "GenerationPlanImageAssignment_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "public"."GenerationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GenerationPlanImageAssignment"
  ADD CONSTRAINT "GenerationPlanImageAssignment_sourceImageId_fkey"
  FOREIGN KEY ("sourceImageId") REFERENCES "public"."JobSourceImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedPin"
  ADD CONSTRAINT "GeneratedPin_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "public"."GenerationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublerMedia"
  ADD CONSTRAINT "PublerMedia_generatedPinId_fkey"
  FOREIGN KEY ("generatedPinId") REFERENCES "public"."GeneratedPin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PinCopy"
  ADD CONSTRAINT "PinCopy_generatedPinId_fkey"
  FOREIGN KEY ("generatedPinId") REFERENCES "public"."GeneratedPin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleRun"
  ADD CONSTRAINT "ScheduleRun_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "public"."GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleRunItem"
  ADD CONSTRAINT "ScheduleRunItem_scheduleRunId_fkey"
  FOREIGN KEY ("scheduleRunId") REFERENCES "public"."ScheduleRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleRunItem"
  ADD CONSTRAINT "ScheduleRunItem_generatedPinId_fkey"
  FOREIGN KEY ("generatedPinId") REFERENCES "public"."GeneratedPin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobMilestone"
  ADD CONSTRAINT "JobMilestone_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "public"."GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
