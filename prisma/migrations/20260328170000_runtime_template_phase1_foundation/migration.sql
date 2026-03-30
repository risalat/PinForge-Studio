CREATE TYPE "TemplateSourceKind" AS ENUM ('BUILTIN', 'CUSTOM');
CREATE TYPE "TemplateLifecycleStatus" AS ENUM ('DRAFT', 'FINALIZED', 'ARCHIVED');
CREATE TYPE "TemplateRendererKind" AS ENUM ('BUILTIN_COMPONENT', 'RUNTIME_SCHEMA');

ALTER TABLE "GenerationPlan"
ADD COLUMN "templateVersionId" TEXT;

ALTER TABLE "GeneratedPin"
ADD COLUMN "templateVersionId" TEXT;

ALTER TABLE "Template"
ADD COLUMN "sourceKind" "TemplateSourceKind" NOT NULL DEFAULT 'BUILTIN',
ADD COLUMN "rendererKind" "TemplateRendererKind" NOT NULL DEFAULT 'BUILTIN_COMPONENT',
ADD COLUMN "lifecycleStatus" "TemplateLifecycleStatus" NOT NULL DEFAULT 'FINALIZED',
ADD COLUMN "slug" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "activeVersionId" TEXT,
ADD COLUMN "thumbnailPath" TEXT,
ADD COLUMN "previewImagePath" TEXT,
ADD COLUMN "canvasWidth" INTEGER NOT NULL DEFAULT 1080,
ADD COLUMN "canvasHeight" INTEGER NOT NULL DEFAULT 1920,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "lifecycleStatus" "TemplateLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "schemaJson" JSONB NOT NULL,
    "editorStateJson" JSONB,
    "summaryJson" JSONB,
    "validationJson" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");
CREATE UNIQUE INDEX "Template_activeVersionId_key" ON "Template"("activeVersionId");
CREATE INDEX "Template_sourceKind_lifecycleStatus_updatedAt_idx" ON "Template"("sourceKind", "lifecycleStatus", "updatedAt");
CREATE INDEX "Template_createdByUserId_updatedAt_idx" ON "Template"("createdByUserId", "updatedAt");

CREATE UNIQUE INDEX "TemplateVersion_templateId_versionNumber_key" ON "TemplateVersion"("templateId", "versionNumber");
CREATE INDEX "TemplateVersion_templateId_lifecycleStatus_createdAt_idx" ON "TemplateVersion"("templateId", "lifecycleStatus", "createdAt");
CREATE INDEX "TemplateVersion_createdByUserId_createdAt_idx" ON "TemplateVersion"("createdByUserId", "createdAt");

CREATE INDEX "GenerationPlan_templateVersionId_idx" ON "GenerationPlan"("templateVersionId");
CREATE INDEX "GeneratedPin_templateVersionId_idx" ON "GeneratedPin"("templateVersionId");

ALTER TABLE "Template"
ADD CONSTRAINT "Template_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Template"
ADD CONSTRAINT "Template_activeVersionId_fkey"
FOREIGN KEY ("activeVersionId") REFERENCES "TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TemplateVersion"
ADD CONSTRAINT "TemplateVersion_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemplateVersion"
ADD CONSTRAINT "TemplateVersion_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GenerationPlan"
ADD CONSTRAINT "GenerationPlan_templateVersionId_fkey"
FOREIGN KEY ("templateVersionId") REFERENCES "TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GeneratedPin"
ADD CONSTRAINT "GeneratedPin_templateVersionId_fkey"
FOREIGN KEY ("templateVersionId") REFERENCES "TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
