-- CreateEnum
CREATE TYPE "PublerMetadataCacheKind" AS ENUM ('WORKSPACES', 'ACCOUNTS', 'BOARDS');

-- CreateTable
CREATE TABLE "PublerMetadataCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT '',
    "cacheKind" "PublerMetadataCacheKind" NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "label" TEXT,
    "rawJson" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublerMetadataCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublerMetadataCache_userId_workspaceId_cacheKind_cacheKey_key" ON "PublerMetadataCache"("userId", "workspaceId", "cacheKind", "cacheKey");

-- CreateIndex
CREATE INDEX "PublerMetadataCache_userId_cacheKind_expiresAt_idx" ON "PublerMetadataCache"("userId", "cacheKind", "expiresAt");

-- CreateIndex
CREATE INDEX "PublerMetadataCache_workspaceId_cacheKind_expiresAt_idx" ON "PublerMetadataCache"("workspaceId", "cacheKind", "expiresAt");

-- AddForeignKey
ALTER TABLE "PublerMetadataCache" ADD CONSTRAINT "PublerMetadataCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
