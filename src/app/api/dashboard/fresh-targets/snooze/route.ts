import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const snoozeSchema = z.object({
  postId: z.string().min(1),
  workspaceId: z.string().optional(),
});

const SNOOZE_DAYS = 7;

export async function POST(request: Request) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = snoozeSchema.parse(await request.json());
    const user = await getOrCreateDashboardUser();
    const workspaceId = payload.workspaceId?.trim() ?? "";
    const snoozedUntil = addDays(new Date(), SNOOZE_DAYS);

    await prisma.freshTargetSnooze.upsert({
      where: {
        userId_postId_workspaceId: {
          userId: user.id,
          postId: payload.postId,
          workspaceId,
        },
      },
      update: {
        snoozedUntil,
      },
      create: {
        userId: user.id,
        postId: payload.postId,
        workspaceId,
        snoozedUntil,
      },
    });

    return NextResponse.json({
      ok: true,
      snoozedUntil: snoozedUntil.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to snooze fresh-pin target.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}
