CREATE TABLE "TemplateGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TemplateGroupAssignment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateGroupAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TemplateGroup_userId_slug_key" ON "TemplateGroup"("userId", "slug");
CREATE UNIQUE INDEX "TemplateGroup_userId_name_key" ON "TemplateGroup"("userId", "name");
CREATE INDEX "TemplateGroup_userId_sortOrder_name_idx" ON "TemplateGroup"("userId", "sortOrder", "name");

CREATE UNIQUE INDEX "TemplateGroupAssignment_groupId_templateId_key" ON "TemplateGroupAssignment"("groupId", "templateId");
CREATE INDEX "TemplateGroupAssignment_groupId_createdAt_idx" ON "TemplateGroupAssignment"("groupId", "createdAt");
CREATE INDEX "TemplateGroupAssignment_templateId_idx" ON "TemplateGroupAssignment"("templateId");

ALTER TABLE "TemplateGroup"
ADD CONSTRAINT "TemplateGroup_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemplateGroupAssignment"
ADD CONSTRAINT "TemplateGroupAssignment_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "TemplateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemplateGroupAssignment"
ADD CONSTRAINT "TemplateGroupAssignment_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
