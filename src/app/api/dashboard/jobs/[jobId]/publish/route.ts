import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import {
  generateDescriptionsForJobPins,
  generateTitlesForJobPins,
  saveJobPinCopyEdits,
  scheduleJobPins,
  uploadJobPinsToPubler,
} from "@/lib/jobs/generatePins";

export const runtime = "nodejs";
export const maxDuration = 60;

const publishSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("upload_media"),
    generatedPinIds: z.array(z.string().min(1)).optional(),
  }),
  z.object({
    action: z.literal("generate_titles"),
    generatedPinIds: z.array(z.string().min(1)).optional(),
  }),
  z.object({
    action: z.literal("save_copy"),
    copies: z.array(
      z.object({
        generatedPinId: z.string().min(1),
        title: z.string().optional(),
        description: z.string().optional(),
      }),
    ),
  }),
  z.object({
    action: z.literal("generate_descriptions"),
    generatedPinIds: z.array(z.string().min(1)).optional(),
  }),
  z.object({
    action: z.literal("schedule"),
    firstPublishAt: z.string().min(1),
    intervalMinutes: z.number().int().positive().max(60 * 24 * 60),
    jitterMinutes: z.number().int().min(0).max(60 * 24).optional(),
    workspaceId: z.string().optional(),
    accountId: z.string().optional(),
    boardId: z.string().optional(),
    generatedPinIds: z.array(z.string().min(1)).optional(),
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
    const payload = publishSchema.parse(await request.json());
    const user = await getOrCreateDashboardUser();
    let result: unknown = null;

    switch (payload.action) {
      case "upload_media":
        result = await uploadJobPinsToPubler({
          userId: user.id,
          jobId,
          generatedPinIds: payload.generatedPinIds,
        });
        break;
      case "generate_titles":
        result = await generateTitlesForJobPins({
          userId: user.id,
          jobId,
          generatedPinIds: payload.generatedPinIds,
        });
        break;
      case "save_copy":
        result = await saveJobPinCopyEdits({
          userId: user.id,
          jobId,
          copies: payload.copies,
        });
        break;
      case "generate_descriptions":
        result = await generateDescriptionsForJobPins({
          userId: user.id,
          jobId,
          generatedPinIds: payload.generatedPinIds,
        });
        break;
      case "schedule":
        result = await scheduleJobPins({
          userId: user.id,
          jobId,
          firstPublishAt: payload.firstPublishAt,
          intervalMinutes: payload.intervalMinutes,
          jitterMinutes: payload.jitterMinutes,
          workspaceId: payload.workspaceId,
          accountId: payload.accountId,
          boardId: payload.boardId,
          generatedPinIds: payload.generatedPinIds,
        });
        break;
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete publish action.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
