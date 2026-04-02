import { prisma } from "@/lib/prisma";

export type TemplateUserGroupSummary = {
  id: string;
  name: string;
  slug: string;
};

type TemplateGroupSummaryWithSortOrder = TemplateUserGroupSummary & {
  sortOrder?: number | null;
};

type TemplateGroupAssignmentWithGroup = {
  group: TemplateGroupSummaryWithSortOrder;
};

export async function listTemplateUserGroupsByTemplateIdForUser(userId: string) {
  const assignments = await prisma.templateGroupAssignment.findMany({
    where: {
      group: {
        userId,
      },
    },
    select: {
      templateId: true,
      group: {
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  const groupsByTemplateId = new Map<string, TemplateUserGroupSummary[]>();

  for (const assignment of assignments) {
    const currentGroups = groupsByTemplateId.get(assignment.templateId) ?? [];
    currentGroups.push(toTemplateUserGroupSummary(assignment.group));
    groupsByTemplateId.set(assignment.templateId, dedupeTemplateUserGroups(currentGroups));
  }

  return groupsByTemplateId;
}

export async function getTemplateUserGroupsForTemplateForUser(input: {
  userId: string;
  templateId: string;
}) {
  const assignments = await prisma.templateGroupAssignment.findMany({
    where: {
      templateId: input.templateId,
      group: {
        userId: input.userId,
      },
    },
    select: {
      group: {
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  return resolveTemplateUserGroupsFromAssignments(assignments);
}

export function resolveTemplateUserGroupsFromAssignments(
  assignments: TemplateGroupAssignmentWithGroup[],
) {
  return dedupeTemplateUserGroups(
    assignments.map((assignment) => toTemplateUserGroupSummary(assignment.group)),
  );
}

export function buildTemplateGroupingMetadata(input: {
  systemCategories?: string[];
  userGroups?: TemplateUserGroupSummary[];
}) {
  const systemCategories = Array.from(
    new Set(
      (input.systemCategories ?? [])
        .map((category) => category.trim())
        .filter(Boolean),
    ),
  );
  const userGroups = dedupeTemplateUserGroups(input.userGroups ?? []);

  return {
    systemCategories,
    userGroups,
    userGroupIds: userGroups.map((group) => group.id),
  };
}

function toTemplateUserGroupSummary(group: TemplateGroupSummaryWithSortOrder): TemplateUserGroupSummary {
  return {
    id: group.id,
    name: group.name,
    slug: group.slug,
  };
}

function dedupeTemplateUserGroups(groups: TemplateUserGroupSummary[]) {
  return Array.from(
    new Map(groups.map((group) => [group.id, group])).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));
}
