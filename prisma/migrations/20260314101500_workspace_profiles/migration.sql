CREATE TABLE "WorkspaceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "workspaceName" TEXT NOT NULL,
    "allowedDomains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "defaultAccountId" TEXT,
    "defaultBoardId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceProfile_userId_workspaceId_key" ON "WorkspaceProfile"("userId", "workspaceId");
CREATE INDEX "WorkspaceProfile_userId_isDefault_idx" ON "WorkspaceProfile"("userId", "isDefault");

ALTER TABLE "WorkspaceProfile"
ADD CONSTRAINT "WorkspaceProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "WorkspaceProfile" (
    "id",
    "userId",
    "workspaceId",
    "workspaceName",
    "allowedDomains",
    "defaultAccountId",
    "defaultBoardId",
    "isDefault",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT('legacy-', "userId", '-', "publerWorkspaceId"),
    "userId",
    "publerWorkspaceId",
    "publerWorkspaceId",
    COALESCE("publerAllowedDomains", ARRAY[]::TEXT[]),
    "publerAccountId",
    "publerBoardId",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "UserIntegrationSettings"
WHERE COALESCE("publerWorkspaceId", '') <> ''
ON CONFLICT ("userId", "workspaceId") DO NOTHING;
