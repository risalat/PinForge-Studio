CREATE TABLE "AiCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKeyEnc" TEXT,
    "model" TEXT,
    "customEndpoint" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCredential_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiCredential_userId_isDefault_idx" ON "AiCredential"("userId", "isDefault");

ALTER TABLE "AiCredential"
ADD CONSTRAINT "AiCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
