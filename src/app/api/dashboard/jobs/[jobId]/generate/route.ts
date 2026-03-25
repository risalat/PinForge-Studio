import { NextResponse } from "next/server";
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

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

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
            generatedPinCount: result.generatedPins.length,
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
