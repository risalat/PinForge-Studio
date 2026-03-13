import { NextResponse } from "next/server";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { getPublishScheduleContextForPost } from "@/lib/jobs/publishScheduleContext";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
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

  const user = await getOrCreateDashboardUser();
  const { jobId } = await context.params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim() ?? "";

  const job = await prisma.generationJob.findFirst({
    where: {
      id: jobId,
      userId: user.id,
    },
    select: {
      postId: true,
    },
  });

  if (!job) {
    return NextResponse.json(
      {
        ok: false,
        error: "Job not found.",
      },
      { status: 404 },
    );
  }

  const scheduleContext = await getPublishScheduleContextForPost({
    userId: user.id,
    postId: job.postId,
    workspaceId,
  });

  return NextResponse.json({
    ok: true,
    scheduleContext,
  });
}
