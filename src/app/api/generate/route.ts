import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiKeyRequest } from "@/lib/auth/apiKeyAuth";
import { isDatabaseConfigured } from "@/lib/env";
import { createIntakeJob } from "@/lib/jobs/generatePins";
import {
  createCorrelationId,
  normalizeErrorForLogging,
  runWithOperationContext,
} from "@/lib/observability/operationContext";

export const runtime = "nodejs";
export const maxDuration = 60;

const titleStyleOptions = ["balanced", "seo", "curiosity", "benefit"] as const;

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().max(200).optional(),
  caption: z.string().trim().max(500).optional(),
  nearestHeading: z.string().trim().max(200).optional(),
  sectionHeadingPath: z.array(z.string().trim().min(1)).optional(),
  surroundingTextSnippet: z.string().trim().max(1000).optional(),
});

const generateSchema = z.object({
  postUrl: z.string().url(),
  title: z.string().min(1),
  domain: z.string().min(1).optional(),
  images: z.array(imageSchema).min(1),
  globalKeywords: z.array(z.string().trim().min(1)).optional(),
  titleStyle: z.enum(titleStyleOptions).optional(),
  toneHint: z.string().trim().max(120).optional(),
  listCountHint: z.number().int().positive().optional(),
  titleVariationCount: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const correlationId = createCorrelationId("api_generate");

  return runWithOperationContext(
    {
      correlationId,
      action: "api.generate.intake",
    },
    async () => {
      if (!isDatabaseConfigured()) {
        return withCorrelationHeader(
          NextResponse.json(
            {
              error: "DATABASE_URL is not configured. Run Prisma migrations before generating pins.",
            },
            { status: 500 },
          ),
          correlationId,
        );
      }

      try {
        const auth = await authenticateApiKeyRequest(request);
        if (!auth.ok) {
          return withCorrelationHeader(auth.response, correlationId);
        }

        const rawPayload = await request.json();
        const payload = generateSchema.parse(rawPayload);
        const result = await createIntakeJob({
          payload,
          userId: auth.user.id,
        });

        return withCorrelationHeader(
          NextResponse.json({
            ok: true,
            jobId: result.jobId,
            status: result.status,
            dashboardUrl: result.dashboardUrl,
            intakeAction: result.intakeAction,
            message: result.message,
          }),
          correlationId,
        );
      } catch (error) {
        const normalized = normalizeErrorForLogging(error);

        return withCorrelationHeader(
          NextResponse.json(
            {
              ok: false,
              error: normalized.message,
              correlationId,
              diagnostics: normalized,
            },
            { status: 500 },
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
