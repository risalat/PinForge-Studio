-- CreateTable
CREATE TABLE "FreshTargetSnooze" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT '',
    "snoozedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreshTargetSnooze_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FreshTargetSnooze_userId_postId_workspaceId_key" ON "FreshTargetSnooze"("userId", "postId", "workspaceId");

-- CreateIndex
CREATE INDEX "FreshTargetSnooze_userId_workspaceId_snoozedUntil_idx" ON "FreshTargetSnooze"("userId", "workspaceId", "snoozedUntil");

-- AddForeignKey
ALTER TABLE "FreshTargetSnooze" ADD CONSTRAINT "FreshTargetSnooze_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshTargetSnooze" ADD CONSTRAINT "FreshTargetSnooze_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
