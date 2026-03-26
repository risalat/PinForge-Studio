-- CreateEnum
CREATE TYPE "PostPulseFreshnessStatus" AS ENUM (
  'FRESH',
  'NEEDS_FRESH_PINS',
  'SCHEDULED_IN_FLIGHT',
  'NEVER_PUBLISHED',
  'NO_PINS_YET'
);

-- CreateTable
CREATE TABLE "PostPulseSnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL DEFAULT '',
  "latestJobId" TEXT,
  "totalJobs" INTEGER NOT NULL DEFAULT 0,
  "totalGeneratedPins" INTEGER NOT NULL DEFAULT 0,
  "totalPublerRecords" INTEGER NOT NULL DEFAULT 0,
  "publishedCount" INTEGER NOT NULL DEFAULT 0,
  "scheduledCount" INTEGER NOT NULL DEFAULT 0,
  "lastGeneratedAt" TIMESTAMP(3),
  "lastPublishedAt" TIMESTAMP(3),
  "lastScheduledAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "freshnessStatus" "PostPulseFreshnessStatus" NOT NULL DEFAULT 'NO_PINS_YET',
  "freshnessAgeDays" INTEGER,
  "recentActivityDotsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PostPulseSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostPulseSnapshot_userId_postId_workspaceId_key"
ON "PostPulseSnapshot"("userId", "postId", "workspaceId");

-- CreateIndex
CREATE INDEX "PostPulseSnapshot_userId_workspaceId_freshnessStatus_upd_idx"
ON "PostPulseSnapshot"("userId", "workspaceId", "freshnessStatus", "updatedAt");

-- CreateIndex
CREATE INDEX "PostPulseSnapshot_userId_postId_workspaceId_idx"
ON "PostPulseSnapshot"("userId", "postId", "workspaceId");

-- AddForeignKey
ALTER TABLE "PostPulseSnapshot"
ADD CONSTRAINT "PostPulseSnapshot_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostPulseSnapshot"
ADD CONSTRAINT "PostPulseSnapshot_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
