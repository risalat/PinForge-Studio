ALTER TABLE "PublicationRecord"
ADD COLUMN "providerWorkspaceId" TEXT;

CREATE INDEX "PublicationRecord_userId_providerWorkspaceId_syncedAt_idx"
ON "PublicationRecord"("userId", "providerWorkspaceId", "syncedAt");
