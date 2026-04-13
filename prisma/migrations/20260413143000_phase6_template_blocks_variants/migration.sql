-- Additive Phase 6 editor block and template variant support.

ALTER TABLE "Template"
ADD COLUMN "variantFamilyId" TEXT,
ADD COLUMN "variantName" TEXT,
ADD COLUMN "variantSortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "TemplateBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sourceTemplateId" TEXT,
    "elementCount" INTEGER NOT NULL DEFAULT 0,
    "imageSlotCount" INTEGER NOT NULL DEFAULT 0,
    "blockJson" JSONB NOT NULL,
    "previewMetaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TemplateBlock_userId_slug_key" ON "TemplateBlock"("userId", "slug");
CREATE INDEX "TemplateBlock_userId_updatedAt_idx" ON "TemplateBlock"("userId", "updatedAt");
CREATE INDEX "TemplateBlock_sourceTemplateId_idx" ON "TemplateBlock"("sourceTemplateId");
CREATE INDEX "Template_variantFamilyId_variantSortOrder_updatedAt_idx" ON "Template"("variantFamilyId", "variantSortOrder", "updatedAt");

ALTER TABLE "Template"
ADD CONSTRAINT "Template_variantFamilyId_fkey"
FOREIGN KEY ("variantFamilyId") REFERENCES "Template"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TemplateBlock"
ADD CONSTRAINT "TemplateBlock_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemplateBlock"
ADD CONSTRAINT "TemplateBlock_sourceTemplateId_fkey"
FOREIGN KEY ("sourceTemplateId") REFERENCES "Template"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
