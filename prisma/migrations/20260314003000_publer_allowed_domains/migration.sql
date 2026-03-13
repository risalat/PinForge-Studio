ALTER TABLE "UserIntegrationSettings"
ADD COLUMN "publerAllowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "UserIntegrationSettings"
SET "publerAllowedDomains" = ARRAY[]::TEXT[]
WHERE "publerAllowedDomains" IS NULL;

ALTER TABLE "UserIntegrationSettings"
ALTER COLUMN "publerAllowedDomains" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "publerAllowedDomains" SET NOT NULL;
