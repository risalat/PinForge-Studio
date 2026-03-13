CREATE TYPE "PublicationSyncMode" AS ENUM ('BACKFILL', 'INCREMENTAL');

CREATE TABLE "PublicationSyncState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "mode" "PublicationSyncMode" NOT NULL DEFAULT 'BACKFILL',
    "nextPage" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationSyncState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicationSyncState_userId_workspaceId_key" ON "PublicationSyncState"("userId", "workspaceId");
CREATE INDEX "PublicationSyncState_userId_mode_updatedAt_idx" ON "PublicationSyncState"("userId", "mode", "updatedAt");

ALTER TABLE "PublicationSyncState" ADD CONSTRAINT "PublicationSyncState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
