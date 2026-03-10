import { NextResponse } from "next/server";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { generatePinsForJob } from "@/lib/jobs/generatePins";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
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
    const result = await generatePinsForJob({
      userId: user.id,
      jobId,
    });

    return NextResponse.json({
      ok: true,
      generatedPinCount: result.generatedPins.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate pins.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
