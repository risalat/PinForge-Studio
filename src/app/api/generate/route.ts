import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiKeyRequest } from "@/lib/auth/apiKeyAuth";
import { isDatabaseConfigured } from "@/lib/env";
import { createIntakeJob } from "@/lib/jobs/generatePins";

export const runtime = "nodejs";
export const maxDuration = 60;

const titleStyleOptions = ["balanced", "seo", "curiosity", "benefit"] as const;

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().max(200).optional(),
  caption: z.string().trim().max(500).optional(),
  nearestHeading: z.string().trim().max(200).optional(),
  sectionHeadingPath: z.array(z.string().trim().min(1)).max(12).optional(),
  surroundingTextSnippet: z.string().trim().max(1000).optional(),
});

const generateSchema = z.object({
  postUrl: z.string().url(),
  title: z.string().min(1),
  domain: z.string().min(1).optional(),
  images: z.array(imageSchema).min(1),
  globalKeywords: z.array(z.string().trim().min(1)).max(20).optional(),
  titleStyle: z.enum(titleStyleOptions).optional(),
  toneHint: z.string().trim().max(120).optional(),
  listCountHint: z.number().int().positive().max(50).optional(),
  titleVariationCount: z.number().int().positive().max(10).optional(),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: "DATABASE_URL is not configured. Run Prisma migrations before generating pins.",
      },
      { status: 500 },
    );
  }

  try {
    const auth = await authenticateApiKeyRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    const rawPayload = await request.json();
    const payload = generateSchema.parse(rawPayload);
    const result = await createIntakeJob({
      payload,
      userId: auth.user.id,
    });

    return NextResponse.json({
      ok: true,
      jobId: result.jobId,
      status: result.status,
      dashboardUrl: result.dashboardUrl,
      intakeAction: result.intakeAction,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
