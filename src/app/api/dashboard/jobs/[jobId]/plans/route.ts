import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { EditablePinSubtitleSchema, EditablePinTitleSchema } from "@/lib/ai/validators";
import { isDatabaseConfigured } from "@/lib/env";
import {
  createAssistedGenerationPlans,
  createManualGenerationPlan,
  discardGenerationPlansForJob,
  updateGenerationPlanRenderContext,
} from "@/lib/jobs/generatePins";
import { templateVisualPresetCategories } from "@/lib/templates/types";

export const runtime = "nodejs";

const plansSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("assisted_auto"),
    pinCount: z.number().int().positive().max(20),
    templateIds: z.array(z.string().min(1)).optional(),
    presetStrategy: z.enum(["recommended", "random_all", "random_bold"]).optional(),
    presetCategoryIds: z.array(z.enum(templateVisualPresetCategories)).optional(),
  }),
  z.object({
    mode: z.literal("manual"),
    templateId: z.string().min(1),
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
]);

type RouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

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
      await createAssistedGenerationPlans({
        userId: user.id,
        jobId,
        pinCount: payload.pinCount,
        templateIds: payload.templateIds,
        presetStrategy: payload.presetStrategy,
        presetCategoryIds: payload.presetCategoryIds,
      });
    } else if (payload.mode === "manual") {
      await createManualGenerationPlan({
        userId: user.id,
        jobId,
        templateId: payload.templateId,
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
