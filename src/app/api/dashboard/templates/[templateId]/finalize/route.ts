import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { finalizeRuntimeTemplateVersionForUser } from "@/lib/runtime-templates/db";
import { enqueueTemplateQaPackForUser } from "@/lib/template-qa/db";

export const runtime = "nodejs";

const finalizeSchema = z.object({
  versionId: z.string().trim().min(1),
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
    const payload = finalizeSchema.parse(await request.json());
    const user = await getOrCreateDashboardUser();
    const result = await finalizeRuntimeTemplateVersionForUser({
      userId: user.id,
      templateId,
      versionId: payload.versionId,
    });
    await enqueueTemplateQaPackForUser({
      userId: user.id,
      templateId,
      versionId: payload.versionId,
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      versionId: result.version.id,
      validation: result.validation,
      previewPath: "previewPath" in result ? result.previewPath : null,
      renderPath: "renderPath" in result ? result.renderPath : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to finalize runtime template version.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
