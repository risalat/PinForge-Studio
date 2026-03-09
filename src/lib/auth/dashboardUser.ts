import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function getOrCreateDashboardUser() {
  try {
    return await prisma.user.upsert({
      where: {
        email: env.defaultUserEmail,
      },
      update: {},
      create: {
        email: env.defaultUserEmail,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return prisma.user.findUniqueOrThrow({
        where: {
          email: env.defaultUserEmail,
        },
      });
    }

    throw error;
  }
}
