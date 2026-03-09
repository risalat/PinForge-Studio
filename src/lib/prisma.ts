import { PrismaClient } from "@prisma/client";

declare global {
  var __pinforgePrisma: PrismaClient | undefined;
}

export const prisma =
  global.__pinforgePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__pinforgePrisma = prisma;
}
