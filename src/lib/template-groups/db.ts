import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listCustomTemplatesForUser } from "@/lib/runtime-templates/db";
import {
  buildTemplateSelectionKey,
  getBuiltInSelectableTemplateCandidatesForUser,
} from "@/lib/templates/selectableTemplates";
import type { TemplateUserGroupSummary } from "@/lib/templates/templateGroupMetadata";
import { ensureTemplateRecordsForUser } from "@/lib/templates/templateRecords";

const templateGroupTransactionOptions = {
  maxWait: 10_000,
  timeout: 20_000,
} satisfies Parameters<typeof prisma.$transaction>[1];

const templateGroupInclude = Prisma.validator<Prisma.TemplateGroupInclude>()({
  _count: {
    select: {
      assignments: true,
    },
  },
});

const templateGroupAssignmentInclude =
  Prisma.validator<Prisma.TemplateGroupAssignmentInclude>()({
    group: true,
    template: true,
  });

type TemplateGroupDbClient = Prisma.TransactionClient | typeof prisma;

export type AssignableTemplateForUser = {
  id: string;
  templateId: string;
  templateVersionId: string | null;
  selectionKey: string;
  name: string;
  slug: string | null;
  description: string | null;
  sourceKind: "BUILTIN" | "CUSTOM";
  rendererKind: "BUILTIN_COMPONENT" | "RUNTIME_SCHEMA";
  lifecycleStatus: "DRAFT" | "FINALIZED" | "ARCHIVED";
  previewPath: string | null;
  updatedAt: Date;
  systemCategories: string[];
  templateCategories: string[];
  userGroups: TemplateUserGroupSummary[];
  userGroupIds: string[];
};

export async function listTemplateGroupsForUser(userId: string) {
  return prisma.templateGroup.findMany({
    where: {
      userId,
    },
    include: templateGroupInclude,
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export async function getTemplateGroupForUser(userId: string, groupId: string) {
  return prisma.templateGroup.findFirst({
    where: {
      id: groupId,
      userId,
    },
    include: templateGroupInclude,
  });
}

export async function createTemplateGroupForUser(input: {
  userId: string;
  name: string;
  description?: string | null;
}) {
  const name = normalizeRequiredName(input.name);
  const description = normalizeOptionalText(input.description);

  return prisma.$transaction(async (tx) => {
    await assertTemplateGroupNameAvailable(tx, {
      userId: input.userId,
      name,
    });

    const slug = await buildUniqueTemplateGroupSlug(tx, {
      userId: input.userId,
      name,
    });

    return tx.templateGroup.create({
      data: {
        userId: input.userId,
        name,
        slug,
        description,
      },
      include: templateGroupInclude,
    });
  }, templateGroupTransactionOptions);
}

export async function updateTemplateGroupForUser(input: {
  userId: string;
  groupId: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
}) {
  const name = normalizeRequiredName(input.name);
  const description = normalizeOptionalText(input.description);

  return prisma.$transaction(async (tx) => {
    const group = await getOwnedTemplateGroupOrThrow(tx, input.userId, input.groupId);

    await assertTemplateGroupNameAvailable(tx, {
      userId: input.userId,
      name,
      excludeGroupId: group.id,
    });

    const slug = await buildUniqueTemplateGroupSlug(tx, {
      userId: input.userId,
      name,
      excludeGroupId: group.id,
    });

    return tx.templateGroup.update({
      where: {
        id: group.id,
      },
      data: {
        name,
        slug,
        description,
        sortOrder: input.sortOrder ?? undefined,
      },
      include: templateGroupInclude,
    });
  }, templateGroupTransactionOptions);
}

export async function deleteTemplateGroupForUser(input: {
  userId: string;
  groupId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const group = await getOwnedTemplateGroupOrThrow(tx, input.userId, input.groupId);

    await tx.templateGroup.delete({
      where: {
        id: group.id,
      },
    });

    return {
      deleted: true,
      groupId: group.id,
    };
  }, templateGroupTransactionOptions);
}

export async function assignTemplatesToGroupForUser(input: {
  userId: string;
  groupId: string;
  templateIds: string[];
}) {
  const templateIds = normalizeTemplateIds(input.templateIds);
  if (templateIds.length === 0) {
    return [] as Prisma.TemplateGroupAssignmentGetPayload<{
      include: typeof templateGroupAssignmentInclude;
    }>[];
  }

  return prisma.$transaction(async (tx) => {
    const group = await getOwnedTemplateGroupOrThrow(tx, input.userId, input.groupId);
    const templates = await ensureTemplateRecordsForUser({
      userId: input.userId,
      templateIds,
      tx,
    });

    await tx.templateGroupAssignment.createMany({
      data: templates.map((template) => ({
        groupId: group.id,
        templateId: template.id,
      })),
      skipDuplicates: true,
    });

    return tx.templateGroupAssignment.findMany({
      where: {
        groupId: group.id,
        templateId: {
          in: templates.map((template) => template.id),
        },
      },
      include: templateGroupAssignmentInclude,
      orderBy: [
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],
    });
  }, templateGroupTransactionOptions);
}

export async function removeTemplatesFromGroupForUser(input: {
  userId: string;
  groupId: string;
  templateIds: string[];
}) {
  const templateIds = normalizeTemplateIds(input.templateIds);
  if (templateIds.length === 0) {
    return {
      groupId: input.groupId,
      removedCount: 0,
    };
  }

  return prisma.$transaction(async (tx) => {
    const group = await getOwnedTemplateGroupOrThrow(tx, input.userId, input.groupId);

    const result = await tx.templateGroupAssignment.deleteMany({
      where: {
        groupId: group.id,
        templateId: {
          in: templateIds,
        },
      },
    });

    return {
      groupId: group.id,
      removedCount: result.count,
    };
  }, templateGroupTransactionOptions);
}

export async function listTemplateGroupAssignmentsForUser(userId: string) {
  const assignments = await prisma.templateGroupAssignment.findMany({
    where: {
      group: {
        userId,
      },
    },
    include: templateGroupAssignmentInclude,
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  return assignments.sort((left, right) => {
    if (left.group.sortOrder !== right.group.sortOrder) {
      return left.group.sortOrder - right.group.sortOrder;
    }

    const groupNameComparison = left.group.name.localeCompare(right.group.name);
    if (groupNameComparison !== 0) {
      return groupNameComparison;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}

export async function listTemplatesForGroupForUser(input: {
  userId: string;
  groupId: string;
}) {
  await getOwnedTemplateGroupOrThrow(prisma, input.userId, input.groupId);

  return prisma.template.findMany({
    where: {
      templateGroupAssignments: {
        some: {
          groupId: input.groupId,
          group: {
            userId: input.userId,
          },
        },
      },
    },
    include: {
      activeVersion: {
        select: {
          id: true,
          versionNumber: true,
          lifecycleStatus: true,
          isActive: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      templateGroupAssignments: {
        where: {
          groupId: input.groupId,
        },
        select: {
          id: true,
          groupId: true,
          createdAt: true,
        },
      },
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
}

export async function getTemplateGroupDetailsForUser(input: {
  userId: string;
  groupId: string;
}) {
  const [group, assignableTemplates] = await Promise.all([
    getTemplateGroupForUser(input.userId, input.groupId),
    listAssignableTemplatesForUser(input.userId),
  ]);

  if (!group) {
    return null;
  }

  return {
    ...group,
    templates: assignableTemplates.filter((template) =>
      template.userGroupIds.includes(group.id),
    ),
  };
}

export async function listAssignableTemplatesForUser(userId: string) {
  const [builtInTemplates, customTemplates] = await Promise.all([
    getBuiltInSelectableTemplateCandidatesForUser(userId),
    listCustomTemplatesForUser(userId),
  ]);

  const assignableTemplates = [
    ...builtInTemplates.map((template) => ({
      id: template.id,
      templateId: template.templateId,
      templateVersionId: template.templateVersionId,
      selectionKey: template.selectionKey,
      name: template.name,
      slug: template.slug,
      description: template.description,
      sourceKind: template.sourceKind,
      rendererKind: template.rendererKind,
      lifecycleStatus: template.lifecycleStatus,
      previewPath: template.previewPath,
      updatedAt: template.updatedAt,
      systemCategories: template.systemCategories,
      templateCategories: template.templateCategories,
      userGroups: template.userGroups,
      userGroupIds: template.userGroupIds,
    })),
    ...customTemplates.map((template) => ({
      id: template.id,
      templateId: template.id,
      templateVersionId: template.activeVersionId ?? null,
      selectionKey: buildTemplateSelectionKey({
        templateId: template.id,
        templateVersionId: template.activeVersionId ?? null,
      }),
      name: template.name,
      slug: template.slug,
      description: template.description,
      sourceKind: template.sourceKind,
      rendererKind: template.rendererKind,
      lifecycleStatus: template.lifecycleStatus,
      previewPath: template.activeVersionId
        ? `/dashboard/templates/${template.id}/preview?versionId=${template.activeVersionId}`
        : `/dashboard/templates/${template.id}/preview`,
      updatedAt: template.updatedAt,
      systemCategories: template.systemCategories,
      templateCategories: template.systemCategories,
      userGroups: template.userGroups,
      userGroupIds: template.userGroupIds,
    })),
  ] satisfies AssignableTemplateForUser[];

  return assignableTemplates.sort((left, right) =>
    left.sourceKind === right.sourceKind
      ? left.name.localeCompare(right.name)
      : left.sourceKind === "BUILTIN"
        ? -1
        : 1,
  );
}

async function getOwnedTemplateGroupOrThrow(
  db: TemplateGroupDbClient,
  userId: string,
  groupId: string,
) {
  const group = await db.templateGroup.findFirst({
    where: {
      id: groupId,
      userId,
    },
  });

  if (!group) {
    throw new Error("Template group not found.");
  }

  return group;
}

async function assertTemplateGroupNameAvailable(
  db: TemplateGroupDbClient,
  input: {
    userId: string;
    name: string;
    excludeGroupId?: string;
  },
) {
  const existingGroup = await db.templateGroup.findFirst({
    where: {
      userId: input.userId,
      name: input.name,
      id: input.excludeGroupId
        ? {
            not: input.excludeGroupId,
          }
        : undefined,
    },
    select: {
      id: true,
    },
  });

  if (existingGroup) {
    throw new Error("A template group with this name already exists.");
  }
}

async function buildUniqueTemplateGroupSlug(
  db: TemplateGroupDbClient,
  input: {
    userId: string;
    name: string;
    excludeGroupId?: string;
  },
) {
  const baseSlug = slugifyTemplateGroupName(input.name);
  let slug = baseSlug;
  let suffix = 2;

  for (;;) {
    const existingGroup = await db.templateGroup.findFirst({
      where: {
        userId: input.userId,
        slug,
        id: input.excludeGroupId
          ? {
              not: input.excludeGroupId,
            }
          : undefined,
      },
      select: {
        id: true,
      },
    });

    if (!existingGroup) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function normalizeRequiredName(name: string) {
  const normalized = name.trim();
  if (!normalized) {
    throw new Error("Template group name is required.");
  }

  return normalized;
}

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeTemplateIds(templateIds: string[]) {
  return Array.from(
    new Set(
      templateIds
        .map((templateId) => templateId.trim())
        .filter(Boolean),
    ),
  );
}

function slugifyTemplateGroupName(name: string) {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "template-group";
}
