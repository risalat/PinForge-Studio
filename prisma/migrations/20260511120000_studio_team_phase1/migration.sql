-- CreateEnum
CREATE TYPE "StudioTeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "StudioTeamMembershipStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "StudioTeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "StudioTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTeamMembership" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StudioTeamRole" NOT NULL DEFAULT 'MEMBER',
    "status" "StudioTeamMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioTeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTeamInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "acceptedByUserId" TEXT,
    "role" "StudioTeamRole" NOT NULL DEFAULT 'MEMBER',
    "status" "StudioTeamInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioTeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioTeam_ownerUserId_idx" ON "StudioTeam"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTeamMembership_teamId_userId_key" ON "StudioTeamMembership"("teamId", "userId");

-- CreateIndex
CREATE INDEX "StudioTeamMembership_userId_status_idx" ON "StudioTeamMembership"("userId", "status");

-- CreateIndex
CREATE INDEX "StudioTeamMembership_teamId_status_idx" ON "StudioTeamMembership"("teamId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTeamInvitation_tokenHash_key" ON "StudioTeamInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "StudioTeamInvitation_email_status_idx" ON "StudioTeamInvitation"("email", "status");

-- CreateIndex
CREATE INDEX "StudioTeamInvitation_teamId_status_idx" ON "StudioTeamInvitation"("teamId", "status");

-- CreateIndex
CREATE INDEX "StudioTeamInvitation_invitedByUserId_createdAt_idx" ON "StudioTeamInvitation"("invitedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "StudioTeam" ADD CONSTRAINT "StudioTeam_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTeamMembership" ADD CONSTRAINT "StudioTeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "StudioTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTeamMembership" ADD CONSTRAINT "StudioTeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTeamInvitation" ADD CONSTRAINT "StudioTeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "StudioTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTeamInvitation" ADD CONSTRAINT "StudioTeamInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioTeamInvitation" ADD CONSTRAINT "StudioTeamInvitation_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
