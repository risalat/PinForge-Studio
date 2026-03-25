import { NextResponse } from "next/server";
import { BackgroundTaskKind, BackgroundTaskStatus } from "@prisma/client";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import {
  discardGeneratedPinsForJob,
  generatePinsForJob,
} from "@/lib/jobs/generatePins";
import {
  createCorrelationId,
  normalizeErrorForLogging,
  runWithOperationContext,
} from "@/lib/observability/operationContext";
import {
  getActiveBackgroundTaskStatuses,
  getBackgroundTaskForJob,
  isRenderBackgroundTaskKind,
  listBackgroundTasksForJob,
  serializeBackgroundTaskSummary,
} from "@/lib/tasks/backgroundTasks";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const correlationId = createCorrelationId("job_generate_status");

  return runWithOperationContext(
    {
      correlationId,
      action: "api.dashboard.jobs.generate.status",
    },
    async () => {
      const auth = await requireAuthenticatedDashboardApiUser();
      if (!auth.ok) {
        return withCorrelationHeader(auth.response, correlationId);
      }

      if (!isDatabaseConfigured()) {
        return withCorrelationHeader(
          NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 }),
          correlationId,
        );
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
                kinds: [BackgroundTaskKind.RENDER_PLANS, BackgroundTaskKind.RERENDER_PLAN],
                statuses: [
                  ...getActiveBackgroundTaskStatuses(),
                  BackgroundTaskStatus.SUCCEEDED,
                  BackgroundTaskStatus.FAILED,
                ],
                limit: 1,
              })
            )[0] ?? null;

        if (!task || !isRenderBackgroundTaskKind(task.kind)) {
          return withCorrelationHeader(
            NextResponse.json({
              ok: true,
              task: null,
            }),
            correlationId,
          );
        }

        if (task.userId && task.userId !== user.id) {
          return withCorrelationHeader(
            NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 }),
            correlationId,
          );
        }

        return withCorrelationHeader(
          NextResponse.json({
            ok: true,
            task: {
              ...serializeBackgroundTaskSummary(task),
              payloadJson: task.payloadJson,
              progressJson: task.progressJson,
            },
          }),
          correlationId,
        );
      } catch (error) {
        const normalized = normalizeErrorForLogging(error);
        return withCorrelationHeader(
          NextResponse.json(
            { ok: false, error: normalized.message, correlationId, diagnostics: normalized },
            { status: 400 },
          ),
          correlationId,
        );
      }
    },
  );
}

export async function POST(request: Request, { params }: RouteProps) {
  const correlationId = createCorrelationId("job_generate");

  return runWithOperationContext(
    {
      correlationId,
      action: "api.dashboard.jobs.generate",
    },
    async () => {
      const auth = await requireAuthenticatedDashboardApiUser();
      if (!auth.ok) {
        return withCorrelationHeader(auth.response, correlationId);
      }

      if (!isDatabaseConfigured()) {
        return withCorrelationHeader(
          NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 }),
          correlationId,
        );
      }

      try {
        const { jobId } = await params;
        const user = await getOrCreateDashboardUser();
        const body = (await request.json().catch(() => ({}))) as {
          action?: "generate" | "discard_generated_pins";
          generatedPinIds?: string[];
          planIds?: string[];
          aiCredentialId?: string;
        };

        if (body.action === "discard_generated_pins") {
          const result = await discardGeneratedPinsForJob({
            userId: user.id,
            jobId,
            generatedPinIds: body.generatedPinIds,
          });

          return withCorrelationHeader(
            NextResponse.json({
              ok: true,
              discardedPinCount: result.discardedPinCount,
            }),
            correlationId,
          );
        }

        const result = await generatePinsForJob({
          userId: user.id,
          jobId,
          planIds: body.planIds,
          aiCredentialId: body.aiCredentialId,
        });

        return withCorrelationHeader(
          NextResponse.json({
            ok: true,
            queued: true,
            queuedPlanCount: result.queuedPlanCount,
            reused: result.reused,
            task: result.task,
          }),
          correlationId,
        );
      } catch (error) {
        const normalized = normalizeErrorForLogging(error);
        return withCorrelationHeader(
          NextResponse.json(
            { ok: false, error: normalized.message, correlationId, diagnostics: normalized },
            { status: 400 },
          ),
          correlationId,
        );
      }
    },
  );
}

function withCorrelationHeader(response: NextResponse, correlationId: string) {
  response.headers.set("X-Correlation-Id", correlationId);
  return response;
}
