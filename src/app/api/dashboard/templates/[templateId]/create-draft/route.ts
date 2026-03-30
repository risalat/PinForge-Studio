import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { createEditableDraftFromFinalizedTemplateForUser } from "@/lib/runtime-templates/db";

export const runtime = "nodejs";

const createDraftSchema = z.object({
  sourceVersionId: z.string().trim().min(1).optional(),
});

type RouteProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  try {
    const { templateId } = await params;
    const payload = createDraftSchema.parse(await request.json().catch(() => ({})));
    const user = await getOrCreateDashboardUser();
    const result = await createEditableDraftFromFinalizedTemplateForUser({
      userId: user.id,
      templateId,
      sourceVersionId: payload.sourceVersionId,
    });

    return NextResponse.json({
      ok: true,
      templateId: result.templateId,
      versionId: result.versionId,
      cloned: result.cloned,
      editPath: `/dashboard/templates/${result.templateId}/edit`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create runtime template draft.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
