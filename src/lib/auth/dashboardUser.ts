import { cache } from "react";
import { Prisma } from "@prisma/client";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { prisma } from "@/lib/prisma";
import { getOrCreateOwnedStudioTeamForUser } from "@/lib/team/studioTeam";

export const getOrCreateDashboardUser = cache(async function getOrCreateDashboardUser() {
  const authUser = await requireAuthenticatedDashboardUser();
  const email = authUser.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Supabase user email is required for dashboard access.");
  }

  try {
    const user = await prisma.user.upsert({
      where: {
        authUserId: authUser.id,
      },
      update: {
        email,
      },
      create: {
        authUserId: authUser.id,
        email,
      },
    });

    await getOrCreateOwnedStudioTeamForUser({
      userId: user.id,
      email: user.email ?? email,
    }).catch(() => {
      // non-blocking: team creation failure should not prevent dashboard access
    });

    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingByEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!existingByEmail) {
        throw error;
      }

      if (!existingByEmail.authUserId || existingByEmail.authUserId === authUser.id) {
        const user = await prisma.user.update({
          where: {
            id: existingByEmail.id,
          },
          data: {
            authUserId: authUser.id,
            email,
          },
        });

        await getOrCreateOwnedStudioTeamForUser({
          userId: user.id,
          email: user.email ?? email,
        }).catch(() => {
          // non-blocking
        });

        return user;
      }
    }

    throw error;
  }
});
