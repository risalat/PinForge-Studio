import { StudioTeamRole, StudioTeamMembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getTeamTemplateVisibleUserIds(userId: string): Promise<string[]> {
  const userIds = new Set<string>([userId]);

  const memberships = await prisma.studioTeamMembership.findMany({
    where: {
      userId,
      status: StudioTeamMembershipStatus.ACTIVE,
    },
    select: {
      teamId: true,
    },
  });

  if (memberships.length === 0) {
    return Array.from(userIds);
  }

  const teamIds = memberships.map((m) => m.teamId);

  const teammateMemberships = await prisma.studioTeamMembership.findMany({
    where: {
      teamId: { in: teamIds },
      status: StudioTeamMembershipStatus.ACTIVE,
    },
    select: {
      userId: true,
    },
  });

  for (const tm of teammateMemberships) {
    userIds.add(tm.userId);
  }

  return Array.from(userIds);
}

export async function getLeaderAccessibleUserIds(userId: string): Promise<string[]> {
  const userIds = new Set<string>([userId]);

  const ownedTeams = await prisma.studioTeam.findMany({
    where: {
      ownerUserId: userId,
    },
    select: {
      id: true,
    },
  });

  const leadershipMemberships = await prisma.studioTeamMembership.findMany({
    where: {
      userId,
      status: StudioTeamMembershipStatus.ACTIVE,
      role: {
        in: [StudioTeamRole.OWNER, StudioTeamRole.ADMIN],
      },
    },
    select: {
      teamId: true,
    },
  });

  const teamIds = new Set([
    ...ownedTeams.map((t) => t.id),
    ...leadershipMemberships.map((m) => m.teamId),
  ]);

  if (teamIds.size === 0) {
    return Array.from(userIds);
  }

  const teammateMemberships = await prisma.studioTeamMembership.findMany({
    where: {
      teamId: { in: Array.from(teamIds) },
      status: StudioTeamMembershipStatus.ACTIVE,
    },
    select: {
      userId: true,
    },
  });

  for (const tm of teammateMemberships) {
    userIds.add(tm.userId);
  }

  return Array.from(userIds);
}

export async function getUserTeamRole(userId: string): Promise<{
  role: StudioTeamRole | null;
  teamId: string | null;
}> {
  const membership = await prisma.studioTeamMembership.findFirst({
    where: {
      userId,
      status: StudioTeamMembershipStatus.ACTIVE,
    },
    orderBy: {
      role: "asc",
    },
  });

  if (!membership) {
    return { role: null, teamId: null };
  }

  return { role: membership.role, teamId: membership.teamId };
}

export async function getPrimaryTeamMembershipForDashboard(userId: string): Promise<{
  teamId: string;
  role: StudioTeamRole;
  ownerUserId: string;
  isOwnedByUser: boolean;
} | null> {
  const memberships = await prisma.studioTeamMembership.findMany({
    where: {
      userId,
      status: StudioTeamMembershipStatus.ACTIVE,
    },
    include: {
      team: {
        select: {
          ownerUserId: true,
        },
      },
    },
  });

  if (memberships.length === 0) {
    return null;
  }

  // Prefer a membership where the user was invited to someone else's team
  // (the "mother" team), rather than their own auto-created personal team.
  const nonOwnedMembership = memberships.find(
    (m) => m.team.ownerUserId !== userId,
  );

  if (nonOwnedMembership) {
    return {
      teamId: nonOwnedMembership.teamId,
      role: nonOwnedMembership.role,
      ownerUserId: nonOwnedMembership.team.ownerUserId,
      isOwnedByUser: false,
    };
  }

  // Fall back to the user's own owned team.
  const ownedMembership = memberships.find(
    (m) => m.team.ownerUserId === userId,
  );

  if (!ownedMembership) {
    return null;
  }

  return {
    teamId: ownedMembership.teamId,
    role: ownedMembership.role,
    ownerUserId: ownedMembership.team.ownerUserId,
    isOwnedByUser: true,
  };
}
