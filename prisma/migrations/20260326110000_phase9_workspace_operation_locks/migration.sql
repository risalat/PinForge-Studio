-- CreateEnum
CREATE TYPE "WorkspaceOperationLockScope" AS ENUM ('MEDIA_UPLOAD', 'SCHEDULING', 'SYNC');

-- CreateTable
CREATE TABLE "WorkspaceOperationLock" (
    "id" TEXT NOT NULL,
    "scope" "WorkspaceOperationLockScope" NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "holderId" TEXT,
    "acquiredAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "ownerContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceOperationLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceOperationLock_leaseExpiresAt_idx" ON "WorkspaceOperationLock"("leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceOperationLock_scope_workspaceId_key" ON "WorkspaceOperationLock"("scope", "workspaceId");
