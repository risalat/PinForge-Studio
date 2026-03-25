CREATE TYPE "ArtworkReviewState" AS ENUM (
  'NORMAL',
  'FLAGGED',
  'RERENDER_QUEUED',
  'RERENDERING',
  'RERENDER_FAILED'
);

ALTER TABLE "GenerationPlan"
ADD COLUMN "artworkReviewState" "ArtworkReviewState" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "artworkFlagReason" TEXT,
ADD COLUMN "rerenderRequestedAt" TIMESTAMP(3),
ADD COLUMN "rerenderError" TEXT;

CREATE INDEX "GenerationJob_userId_postId_status_createdAt_idx"
ON "GenerationJob"("userId", "postId", "status", "createdAt");

CREATE INDEX "GenerationJob_userId_postId_createdAt_idx"
ON "GenerationJob"("userId", "postId", "createdAt");

CREATE INDEX "GenerationPlan_jobId_artworkReviewState_sortOrder_idx"
ON "GenerationPlan"("jobId", "artworkReviewState", "sortOrder");

CREATE INDEX "PublicationRecord_userId_state_scheduledAt_idx"
ON "PublicationRecord"("userId", "state", "scheduledAt");

CREATE INDEX "PublicationRecord_userId_postId_providerWorkspaceId_publishedAt_idx"
ON "PublicationRecord"("userId", "postId", "providerWorkspaceId", "publishedAt");

CREATE INDEX "ScheduleRunItem_status_scheduledFor_idx"
ON "ScheduleRunItem"("status", "scheduledFor");
