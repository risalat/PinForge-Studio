import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { duplicateRuntimeTemplateDraftForUser } from "@/lib/runtime-templates/db";

export const runtime = "nodejs";

const duplicateTemplateSchema = z
  .object({
    asVariant: z.boolean().optional(),
  })
  .default({});

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
    const payload = duplicateTemplateSchema.parse(
      request.headers.get("content-length") === "0" ? {} : await request.json().catch(() => ({})),
    );
    const user = await getOrCreateDashboardUser();
    const result = await duplicateRuntimeTemplateDraftForUser({
      userId: user.id,
      templateId,
      asVariant: payload.asVariant,
    });

    return NextResponse.json({
      ok: true,
      templateId: result.templateId,
      versionId: result.versionId,
      editPath: `/dashboard/templates/${result.templateId}/edit`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to duplicate runtime template draft.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
