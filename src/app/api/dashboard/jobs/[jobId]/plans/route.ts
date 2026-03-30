import { NextResponse } from "next/server";
import { ArtworkReviewState, BackgroundTaskKind, BackgroundTaskStatus } from "@prisma/client";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { EditablePinSubtitleSchema, EditablePinTitleSchema } from "@/lib/ai/validators";
import { isDatabaseConfigured } from "@/lib/env";
import {
  createAssistedGenerationPlans,
  createManualGenerationPlan,
  discardGenerationPlansForJob,
  queuePlanPresetRecommendation,
  setGenerationPlanArtworkReviewState,
  updateGenerationPlanRenderContext,
} from "@/lib/jobs/generatePins";
import {
  getActiveBackgroundTaskStatuses,
  getBackgroundTaskForJob,
  listBackgroundTasksForJob,
  serializeBackgroundTaskSummary,
} from "@/lib/tasks/backgroundTasks";
import { templateVisualPresetCategories } from "@/lib/templates/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const plansSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("assisted_auto"),
    pinCount: z.number().int().positive(),
    templateIds: z.array(z.string().min(1)).optional(),
    templates: z
      .array(
        z.object({
          templateId: z.string().min(1),
          templateVersionId: z.string().min(1).nullable().optional(),
        }),
      )
      .optional(),
    presetStrategy: z.enum(["recommended", "random_all", "random_bold", "random_feminine"]).optional(),
    presetCategoryIds: z.array(z.enum(templateVisualPresetCategories)).optional(),
    allowAnyPresetOverride: z.boolean().optional(),
  }),
  z.object({
    mode: z.literal("manual"),
    templateId: z.string().min(1),
    templateVersionId: z.string().min(1).nullable().optional(),
    sourceImageIds: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    mode: z.literal("update_render_context"),
    planId: z.string().min(1),
    title: EditablePinTitleSchema.optional(),
    subtitle: EditablePinSubtitleSchema.optional(),
    itemNumber: z.number().int().positive().max(999).nullable().optional(),
    visualPreset: z.string().nullable().optional(),
  }),
  z.object({
    mode: z.literal("discard"),
    planIds: z.array(z.string().min(1)).min(1).optional(),
  }),
  z.object({
    mode: z.literal("set_review_state"),
    planId: z.string().min(1),
    artworkReviewState: z.enum([ArtworkReviewState.FLAGGED, ArtworkReviewState.NORMAL]),
    artworkFlagReason: z.string().optional(),
  }),
  z.object({
    mode: z.literal("retune_preset"),
    planIds: z.array(z.string().min(1)).min(1).optional(),
    force: z.boolean().optional(),
  }),
]);

type RouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  try {
    const { jobId } = await params;
    const user = await getOrCreateDashboardUser();
    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId")?.trim() || null;

    const task = taskId
      ? await getBackgroundTaskForJob(taskId, jobId)
      : (
          await listBackgroundTasksForJob({
            jobId,
            kinds: [BackgroundTaskKind.RECOMMEND_PLAN_PRESETS],
            statuses: [
              ...getActiveBackgroundTaskStatuses(),
              BackgroundTaskStatus.SUCCEEDED,
              BackgroundTaskStatus.FAILED,
            ],
            limit: 1,
          })
        )[0] ?? null;

    if (!task || task.kind !== BackgroundTaskKind.RECOMMEND_PLAN_PRESETS) {
      return NextResponse.json({ ok: true, task: null });
    }

    if (task.userId && task.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      task: {
        ...serializeBackgroundTaskSummary(task),
        payloadJson: task.payloadJson,
        progressJson: task.progressJson,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch preset tuning status.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  try {
    const { jobId } = await params;
    const payload = plansSchema.parse(await request.json());
    const user = await getOrCreateDashboardUser();

    if (payload.mode === "assisted_auto") {
      const result = await createAssistedGenerationPlans({
        userId: user.id,
        jobId,
        pinCount: payload.pinCount,
        templates:
          payload.templates ??
          payload.templateIds?.map((templateId) => ({
            templateId,
            templateVersionId: null,
          })),
        presetStrategy: payload.presetStrategy,
        presetCategoryIds: payload.presetCategoryIds,
        allowAnyPresetOverride: payload.allowAnyPresetOverride,
      });
      return NextResponse.json({
        ok: true,
        createdPlanCount: result.createdPlanCount,
        presetRecommendationTask: result.presetRecommendationTask,
      });
    } else if (payload.mode === "manual") {
      await createManualGenerationPlan({
        userId: user.id,
        jobId,
        templateId: payload.templateId,
        templateVersionId: payload.templateVersionId,
        sourceImageIds: payload.sourceImageIds,
      });
    } else if (payload.mode === "update_render_context") {
      await updateGenerationPlanRenderContext({
        userId: user.id,
        jobId,
        planId: payload.planId,
        title: payload.title,
        subtitle: payload.subtitle,
        itemNumber: payload.itemNumber,
        visualPreset: payload.visualPreset,
      });
    } else if (payload.mode === "set_review_state") {
      await setGenerationPlanArtworkReviewState({
        userId: user.id,
        jobId,
        planId: payload.planId,
        artworkReviewState: payload.artworkReviewState,
        artworkFlagReason: payload.artworkFlagReason,
      });
    } else if (payload.mode === "retune_preset") {
      const result = await queuePlanPresetRecommendation({
        userId: user.id,
        jobId,
        planIds: payload.planIds,
        force: payload.force,
      });

      return NextResponse.json({
        ok: true,
        queuedPlanCount: result.queuedPlanCount,
        task: result.task,
        message: result.message,
      });
    } else {
      const result = await discardGenerationPlansForJob({
        userId: user.id,
        jobId,
        planIds: payload.planIds,
      });

      return NextResponse.json({
        ok: true,
        discardedPlanCount: result.discardedPlanCount,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save generation plans.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
