import { NextResponse } from "next/server";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { createFreshPinsJobFromPost, getJobForUser } from "@/lib/jobs/generatePins";

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
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const { jobId } = await params;
    const user = await getOrCreateDashboardUser();
    const job = await getJobForUser(jobId, user.id);

    if (!job) {
      return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });
    }

    const latestScheduleStatus = job.scheduleRuns[0]?.status ?? null;
    const isFailedCycle = job.status === "FAILED" || latestScheduleStatus === "FAILED";

    if (!isFailedCycle) {
      return NextResponse.json(
        {
          ok: false,
          error: "A new cycle can only be started explicitly from a failed job.",
        },
        { status: 400 },
      );
    }

    const result = await createFreshPinsJobFromPost({
      userId: user.id,
      postId: job.postId,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start a new cycle.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
