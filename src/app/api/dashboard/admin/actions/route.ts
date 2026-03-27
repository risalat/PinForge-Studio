import { NextResponse } from "next/server";
import {
  BackgroundTaskKind,
  BackgroundTaskStatus,
} from "@prisma/client";
import { z } from "zod";
import { requireDashboardAdminApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { prisma } from "@/lib/prisma";
import {
  buildCleanTempAssetsTaskDedupeKey,
  buildSyncPublicationsTaskDedupeKey,
  enqueueBackgroundTask,
  requeueFailedBackgroundTask,
  serializeBackgroundTaskSummary,
} from "@/lib/tasks/backgroundTasks";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("queue_temp_cleanup"),
    days: z.number().int().positive().max(365).default(14),
    apply: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("trigger_publication_sync"),
    workspaceId: z.string().trim().min(1),
  }),
  z.object({
    action: z.literal("retry_failed_task"),
    taskId: z.string().trim().min(1),
  }),
]);

const SAFE_RETRY_TASK_KINDS = new Set<BackgroundTaskKind>([
  BackgroundTaskKind.RENDER_PLANS,
  BackgroundTaskKind.RERENDER_PLAN,
  BackgroundTaskKind.GENERATE_TITLE_BATCH,
  BackgroundTaskKind.GENERATE_DESCRIPTION_BATCH,
  BackgroundTaskKind.SYNC_PUBLICATIONS,
  BackgroundTaskKind.CLEAN_TEMP_ASSETS,
]);

export async function POST(request: Request) {
  const auth = await requireDashboardAdminApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = schema.parse(await request.json().catch(() => ({})));

    if (payload.action === "queue_temp_cleanup") {
      const user = await getOrCreateDashboardUser();
      const queued = await enqueueBackgroundTask({
        kind: BackgroundTaskKind.CLEAN_TEMP_ASSETS,
        userId: user.id,
        priority: 15,
        dedupeKey: buildCleanTempAssetsTaskDedupeKey(payload.days, payload.apply),
        payloadJson: {
          days: payload.days,
          apply: payload.apply,
        },
        progressJson: {
          stage: "queued_from_admin",
          requestedAt: new Date().toISOString(),
        },
        maxAttempts: 3,
      });

      return NextResponse.json({
        ok: true,
        action: payload.action,
        reused: queued.reused,
        task: serializeBackgroundTaskSummary(queued.task),
      });
    }

    if (payload.action === "trigger_publication_sync") {
      const user = await getOrCreateDashboardUser();
      const syncState = await prisma.publicationSyncState.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: payload.workspaceId,
          },
        },
        select: {
          mode: true,
          nextPage: true,
        },
      });

      const mode = syncState?.mode?.toLowerCase() ?? "backfill";
      const page = Math.max(syncState?.nextPage ?? 1, 1);
      const queued = await enqueueBackgroundTask({
        kind: BackgroundTaskKind.SYNC_PUBLICATIONS,
        userId: user.id,
        workspaceId: payload.workspaceId,
        priority: 20,
        dedupeKey: buildSyncPublicationsTaskDedupeKey({
          userId: user.id,
          workspaceId: payload.workspaceId,
          mode,
          page,
        }),
        payloadJson: {
          userId: user.id,
          workspaceId: payload.workspaceId,
        },
        progressJson: {
          stage: "queued_from_admin",
          requestedAt: new Date().toISOString(),
        },
        maxAttempts: 3,
      });

      return NextResponse.json({
        ok: true,
        action: payload.action,
        reused: queued.reused,
        task: serializeBackgroundTaskSummary(queued.task),
      });
    }

    const task = await prisma.backgroundTask.findUnique({
      where: { id: payload.taskId },
      select: {
        id: true,
        kind: true,
        status: true,
      },
    });

    if (!task || task.status !== BackgroundTaskStatus.FAILED) {
      return NextResponse.json(
        {
          ok: false,
          error: "The selected task is not available for retry.",
        },
        { status: 400 },
      );
    }

    if (!SAFE_RETRY_TASK_KINDS.has(task.kind)) {
      return NextResponse.json(
        {
          ok: false,
          error: "This failed task kind is not marked safe for one-click retry yet.",
        },
        { status: 400 },
      );
    }

    const requeued = await requeueFailedBackgroundTask({
      taskId: task.id,
      lastError: null,
      runAfter: new Date(),
      progressJson: {
        stage: "requeued_from_admin",
        requestedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      ok: true,
      action: payload.action,
      task: serializeBackgroundTaskSummary(requeued),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to run admin action.",
      },
      { status: 500 },
    );
  }
}
