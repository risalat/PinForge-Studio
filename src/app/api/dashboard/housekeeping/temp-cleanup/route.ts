import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { cleanupStaleTempAssets } from "@/lib/housekeeping/storageMaintenance";
import {
  buildCleanTempAssetsTaskDedupeKey,
  enqueueBackgroundTask,
  serializeBackgroundTaskSummary,
} from "@/lib/tasks/backgroundTasks";
import { BackgroundTaskKind } from "@prisma/client";

export const runtime = "nodejs";

const schema = z.object({
  days: z.number().int().positive().max(365).optional(),
  apply: z.boolean().optional(),
  background: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = schema.parse(await request.json().catch(() => ({})));

    if (payload.background) {
      const user = await getOrCreateDashboardUser();
      const days = payload.days && payload.days > 0 ? payload.days : 7;
      const apply = Boolean(payload.apply);
      const queued = await enqueueBackgroundTask({
        kind: BackgroundTaskKind.CLEAN_TEMP_ASSETS,
        userId: user.id,
        priority: 10,
        dedupeKey: buildCleanTempAssetsTaskDedupeKey(days, apply),
        payloadJson: {
          days,
          apply,
        },
        progressJson: {
          stage: "queued",
          requestedAt: new Date().toISOString(),
        },
        maxAttempts: 3,
      });

      return NextResponse.json({
        ok: true,
        queued: true,
        reused: queued.reused,
        task: serializeBackgroundTaskSummary(queued.task),
      });
    }

    const result = await cleanupStaleTempAssets(payload);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to clean temp assets.",
      },
      { status: 500 },
    );
  }
}
