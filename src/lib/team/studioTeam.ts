import { StudioTeamRole, StudioTeamMembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getOrCreateOwnedStudioTeamForUser(input: {
  userId: string;
  email: string;
}) {
  const existingTeam = await prisma.studioTeam.findFirst({
    where: {
      ownerUserId: input.userId,
    },
  });

  if (existingTeam) {
    await ensureOwnerMembership(existingTeam.id, input.userId);
    return existingTeam;
  }

  const name = buildTeamName(input.email);
  const team = await prisma.studioTeam.create({
    data: {
      name,
      ownerUserId: input.userId,
      memberships: {
        create: {
          userId: input.userId,
          role: StudioTeamRole.OWNER,
          status: StudioTeamMembershipStatus.ACTIVE,
        },
      },
    },
  });

  return team;
}

async function ensureOwnerMembership(teamId: string, userId: string) {
  const existing = await prisma.studioTeamMembership.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });

  if (!existing) {
    await prisma.studioTeamMembership.create({
      data: {
        teamId,
        userId,
        role: StudioTeamRole.OWNER,
        status: StudioTeamMembershipStatus.ACTIVE,
      },
    });
    return;
  }

  if (existing.status !== StudioTeamMembershipStatus.ACTIVE) {
    await prisma.studioTeamMembership.update({
      where: {
        id: existing.id,
      },
      data: {
        status: StudioTeamMembershipStatus.ACTIVE,
      },
    });
  }

  if (existing.role !== StudioTeamRole.OWNER) {
    await prisma.studioTeamMembership.update({
      where: {
        id: existing.id,
      },
      data: {
        role: StudioTeamRole.OWNER,
      },
    });
  }
}

function buildTeamName(email: string) {
  const localPart = email.split("@")[0] ?? email;
  const capitalized = localPart.charAt(0).toUpperCase() + localPart.slice(1);
  return `${capitalized}'s team`;
}
