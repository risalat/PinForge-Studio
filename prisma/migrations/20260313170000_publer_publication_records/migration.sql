-- CreateEnum
CREATE TYPE "PublicationRecordState" AS ENUM ('SCHEDULED', 'PUBLISHED', 'PUBLISHED_POSTED', 'OTHER');

-- CreateTable
CREATE TABLE "PublicationRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "generatedPinId" TEXT,
    "providerPostId" TEXT NOT NULL,
    "providerPostLink" TEXT,
    "providerAccountId" TEXT,
    "providerBoardId" TEXT,
    "state" "PublicationRecordState" NOT NULL,
    "rawState" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicationRecord_userId_providerPostId_key" ON "PublicationRecord"("userId", "providerPostId");

-- CreateIndex
CREATE INDEX "PublicationRecord_postId_state_publishedAt_idx" ON "PublicationRecord"("postId", "state", "publishedAt");

-- CreateIndex
CREATE INDEX "PublicationRecord_userId_syncedAt_idx" ON "PublicationRecord"("userId", "syncedAt");

-- CreateIndex
CREATE INDEX "PublicationRecord_generatedPinId_idx" ON "PublicationRecord"("generatedPinId");

-- AddForeignKey
ALTER TABLE "PublicationRecord" ADD CONSTRAINT "PublicationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationRecord" ADD CONSTRAINT "PublicationRecord_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationRecord" ADD CONSTRAINT "PublicationRecord_generatedPinId_fkey" FOREIGN KEY ("generatedPinId") REFERENCES "GeneratedPin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
