import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { saveJobImageSelections } from "@/lib/jobs/generatePins";

export const runtime = "nodejs";

const reviewSchema = z.object({
  images: z.array(
    z.object({
      id: z.string().min(1),
      isSelected: z.boolean(),
      isPreferred: z.boolean(),
    }),
  ),
  globalKeywords: z.array(z.string().trim().min(1)).optional(),
  titleStyle: z.enum(["balanced", "seo", "curiosity", "benefit"]).optional(),
  toneHint: z.string().optional(),
  listCountHint: z.number().int().positive().nullable().optional(),
  titleVariationCount: z.number().int().positive().nullable().optional(),
});

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
    const payload = reviewSchema.parse(await request.json());
    const user = await getOrCreateDashboardUser();

    await saveJobImageSelections({
      userId: user.id,
      jobId,
      images: payload.images,
      globalKeywords: payload.globalKeywords,
      titleStyle: payload.titleStyle,
      toneHint: payload.toneHint,
      listCountHint: payload.listCountHint,
      titleVariationCount: payload.titleVariationCount,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save review state.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
