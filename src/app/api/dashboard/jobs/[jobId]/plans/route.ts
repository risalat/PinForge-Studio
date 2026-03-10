import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { createAssistedGenerationPlans, createManualGenerationPlan } from "@/lib/jobs/generatePins";

export const runtime = "nodejs";

const plansSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("assisted_auto"),
    pinCount: z.number().int().positive().max(20),
    templateIds: z.array(z.string().min(1)).optional(),
  }),
  z.object({
    mode: z.literal("manual"),
    templateId: z.string().min(1),
    sourceImageIds: z.array(z.string().min(1)).min(1),
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
      });
    } else {
      await createManualGenerationPlan({
        userId: user.id,
        jobId,
        templateId: payload.templateId,
        sourceImageIds: payload.sourceImageIds,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save generation plans.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
