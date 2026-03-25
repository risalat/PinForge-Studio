import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { EditablePinDescriptionSchema, EditablePinTitleSchema } from "@/lib/ai/validators";
import { isDatabaseConfigured } from "@/lib/env";
import {
  generateDescriptionsForJobPins,
  generateTitlesForJobPins,
  getJobForUser,
  saveJobPinCopyEdits,
  scheduleJobPins,
  uploadJobPinsToPubler,
} from "@/lib/jobs/generatePins";
import {
  createCorrelationId,
  normalizeErrorForLogging,
  runWithOperationContext,
} from "@/lib/observability/operationContext";
import { resolveStoredAssetUrl } from "@/lib/storage/assetUrl";

export const runtime = "nodejs";
export const maxDuration = 300;

const publishSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("upload_media"),
    generatedPinIds: z.array(z.string().min(1)).optional(),
    workspaceId: z.string().optional(),
  }),
  z.object({
    action: z.literal("generate_titles"),
    generatedPinIds: z.array(z.string().min(1)).optional(),
    aiCredentialId: z.string().optional(),
  }),
  z.object({
    action: z.literal("save_copy"),
    copies: z.array(
      z.object({
        generatedPinId: z.string().min(1),
        title: EditablePinTitleSchema.optional(),
        description: EditablePinDescriptionSchema.optional(),
      }),
    ),
  }),
  z.object({
    action: z.literal("generate_descriptions"),
    generatedPinIds: z.array(z.string().min(1)).optional(),
    aiCredentialId: z.string().optional(),
  }),
  z.object({
    action: z.literal("schedule"),
    firstPublishAt: z.string().min(1),
    intervalMinutes: z.number().int().positive().max(60 * 24 * 60),
    jitterMinutes: z.number().int().min(0).max(60 * 24 * 60).optional(),
    schedulePlan: z
      .array(
        z.object({
          pinId: z.string().min(1),
          scheduledFor: z.string().min(1),
          boardId: z.string().min(1).optional(),
        }),
      )
      .optional(),
    workspaceId: z.string().optional(),
    accountId: z.string().optional(),
    boardId: z.string().optional(),
    boardIds: z.array(z.string().min(1)).optional(),
    boardDistributionMode: z.enum(["round_robin", "first_selected", "primary_weighted"]).optional(),
    primaryBoardId: z.string().optional(),
    primaryBoardPercent: z.number().int().min(0).max(100).optional(),
    generatedPinIds: z.array(z.string().min(1)).optional(),
  }),
]);

type RouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const correlationId = createCorrelationId("publish_status");

  return runWithOperationContext(
    {
      correlationId,
      action: "api.dashboard.jobs.publish.status",
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
        const job = await getJobForUser(jobId, user.id);
        if (!job) {
          return withCorrelationHeader(
            NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 }),
            correlationId,
          );
        }

        return withCorrelationHeader(
          NextResponse.json({
            ok: true,
            jobStatus: job.status,
            pins: job.generatedPins.map(serializePin),
            latestScheduleRun: job.scheduleRuns[0]
              ? {
                  id: job.scheduleRuns[0].id,
                  status: job.scheduleRuns[0].status,
                  submittedAt: job.scheduleRuns[0].submittedAt?.toISOString() ?? null,
                  completedAt: job.scheduleRuns[0].completedAt?.toISOString() ?? null,
                  errorMessage: job.scheduleRuns[0].errorMessage ?? null,
                }
              : null,
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
  const correlationId = createCorrelationId("publish_action");

  return runWithOperationContext(
    {
      correlationId,
      action: "api.dashboard.jobs.publish.action",
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
        const payload = publishSchema.parse(await request.json());
        const user = await getOrCreateDashboardUser();
        let result: unknown = null;

        switch (payload.action) {
          case "upload_media":
            result = await uploadJobPinsToPubler({
              userId: user.id,
              jobId,
              generatedPinIds: payload.generatedPinIds,
              workspaceId: payload.workspaceId,
            });
            break;
          case "generate_titles":
            result = await generateTitlesForJobPins({
              userId: user.id,
              jobId,
              generatedPinIds: payload.generatedPinIds,
              aiCredentialId: payload.aiCredentialId,
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
              aiCredentialId: payload.aiCredentialId,
            });
            break;
          case "schedule":
            result = await scheduleJobPins({
              userId: user.id,
              jobId,
              firstPublishAt: payload.firstPublishAt,
              intervalMinutes: payload.intervalMinutes,
              jitterMinutes: payload.jitterMinutes,
              schedulePlan: payload.schedulePlan,
              workspaceId: payload.workspaceId,
              accountId: payload.accountId,
              boardId: payload.boardId,
              boardIds: payload.boardIds,
              boardDistributionMode: payload.boardDistributionMode,
              primaryBoardId: payload.primaryBoardId,
              primaryBoardPercent: payload.primaryBoardPercent,
              generatedPinIds: payload.generatedPinIds,
            });
            break;
        }

        return withCorrelationHeader(NextResponse.json({ ok: true, result }), correlationId);
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

function serializePin(pin: NonNullable<Awaited<ReturnType<typeof getJobForUser>>>["generatedPins"][number]) {
  return {
    id: pin.id,
    templateId: pin.templateId,
    exportPath: resolveStoredAssetUrl({
      storageKey: pin.storageKey,
      exportPath: pin.exportPath,
    }),
    mediaStatus: pin.publerMedia?.status ?? "PENDING",
    mediaId: pin.publerMedia?.mediaId ?? null,
    mediaError: pin.publerMedia?.errorMessage ?? null,
    title: pin.pinCopy?.title ?? "",
    titleOptions: pin.pinCopy?.titleOptions ?? [],
    description: pin.pinCopy?.description ?? "",
    titleStatus: pin.pinCopy?.titleStatus ?? "EMPTY",
    descriptionStatus: pin.pinCopy?.descriptionStatus ?? "EMPTY",
    scheduleStatus: pin.scheduleRunItems[0]?.status ?? "PENDING",
    scheduledFor: pin.scheduleRunItems[0]?.scheduledFor?.toISOString() ?? null,
    scheduleError: pin.scheduleRunItems[0]?.errorMessage ?? null,
  };
}
