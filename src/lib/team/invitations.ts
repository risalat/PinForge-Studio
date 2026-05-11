import { createHash, randomBytes } from "node:crypto";
import {
  StudioTeamRole,
  StudioTeamInvitationStatus,
  StudioTeamMembershipStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getOrCreateOwnedStudioTeamForUser } from "@/lib/team/studioTeam";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createTeamInvitation(input: {
  invitedByUserId: string;
  email: string;
  role?: "ADMIN" | "MEMBER";
}) {
  // Phase 1: only the actual team owner (the person who owns the mother team)
  // can invite teammates. Prevent invited members from using their auto-created
  // personal team to send invites.
  const nonOwnedActiveMembership = await prisma.studioTeamMembership.findFirst({
    where: {
      userId: input.invitedByUserId,
      status: StudioTeamMembershipStatus.ACTIVE,
      team: {
        ownerUserId: {
          not: input.invitedByUserId,
        },
      },
    },
  });

  if (nonOwnedActiveMembership) {
    throw new Error("Only the team owner can invite teammates.");
  }

  const ownedTeam = await prisma.studioTeam.findFirst({
    where: {
      ownerUserId: input.invitedByUserId,
    },
    include: {
      memberships: {
        where: {
          userId: input.invitedByUserId,
          status: StudioTeamMembershipStatus.ACTIVE,
          role: StudioTeamRole.OWNER,
        },
        take: 1,
      },
    },
  });

  if (!ownedTeam || ownedTeam.memberships.length === 0) {
    throw new Error("Only the team owner can invite teammates.");
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Email is required.");
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.studioTeamInvitation.create({
    data: {
      email,
      teamId: ownedTeam.id,
      invitedByUserId: input.invitedByUserId,
      role: input.role === "ADMIN" ? StudioTeamRole.ADMIN : StudioTeamRole.MEMBER,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl = env.appUrl.replace(/\/+$/, "");
  const inviteUrl = `${baseUrl}/invite/${rawToken}`;

  return { inviteUrl };
}

export async function acceptTeamInvitation(input: {
  token: string;
  userId: string;
  email: string;
}) {
  const tokenHash = hashToken(input.token);
  const invitation = await prisma.studioTeamInvitation.findUnique({
    where: { tokenHash },
    include: { team: true },
  });

  if (!invitation) {
    throw new Error("Invalid invitation token.");
  }

  if (invitation.status !== StudioTeamInvitationStatus.PENDING) {
    if (invitation.status === StudioTeamInvitationStatus.ACCEPTED) {
      throw new Error("This invitation has already been accepted.");
    }
    if (invitation.status === StudioTeamInvitationStatus.REVOKED) {
      throw new Error("This invitation has been revoked.");
    }
    if (invitation.status === StudioTeamInvitationStatus.EXPIRED) {
      throw new Error("This invitation has expired.");
    }
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.studioTeamInvitation.update({
      where: { id: invitation.id },
      data: { status: StudioTeamInvitationStatus.EXPIRED },
    });
    throw new Error("This invitation has expired.");
  }

  const normalizedInputEmail = input.email.trim().toLowerCase();
  const normalizedInviteEmail = invitation.email.trim().toLowerCase();
  if (normalizedInputEmail !== normalizedInviteEmail) {
    throw new Error(
      `This invitation was sent to ${invitation.email}. Please sign in with that email.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    const existingMembership = await tx.studioTeamMembership.findUnique({
      where: {
        teamId_userId: {
          teamId: invitation.teamId,
          userId: input.userId,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status !== StudioTeamMembershipStatus.ACTIVE) {
        await tx.studioTeamMembership.update({
          where: { id: existingMembership.id },
          data: {
            status: StudioTeamMembershipStatus.ACTIVE,
            role: invitation.role,
          },
        });
      }
    } else {
      await tx.studioTeamMembership.create({
        data: {
          teamId: invitation.teamId,
          userId: input.userId,
          role: invitation.role,
          status: StudioTeamMembershipStatus.ACTIVE,
        },
      });
    }

    await tx.studioTeamInvitation.update({
      where: { id: invitation.id },
      data: {
        status: StudioTeamInvitationStatus.ACCEPTED,
        acceptedByUserId: input.userId,
        acceptedAt: new Date(),
      },
    });
  });

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true },
  });

  if (user?.email) {
    await getOrCreateOwnedStudioTeamForUser({
      userId: input.userId,
      email: user.email,
    });
  }

  return { teamId: invitation.teamId };
}

export async function getInvitationByToken(token: string) {
  const tokenHash = hashToken(token);
  const invitation = await prisma.studioTeamInvitation.findUnique({
    where: { tokenHash },
    select: {
      email: true,
      status: true,
      expiresAt: true,
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  return invitation;
}

export async function revokeInvitation(input: {
  userId: string;
  invitationId: string;
}) {
  // Phase 1: only the team owner can revoke invitations.
  const invitation = await prisma.studioTeamInvitation.findFirst({
    where: {
      id: input.invitationId,
      status: StudioTeamInvitationStatus.PENDING,
    },
    include: {
      team: {
        select: {
          ownerUserId: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error("Pending invitation not found.");
  }

  if (invitation.team.ownerUserId !== input.userId) {
    throw new Error("Only the team owner can revoke invitations.");
  }

  await prisma.studioTeamInvitation.update({
    where: { id: invitation.id },
    data: {
      status: StudioTeamInvitationStatus.REVOKED,
      revokedAt: new Date(),
    },
  });

  return { revoked: true };
}
