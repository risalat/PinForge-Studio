import { NextResponse } from "next/server";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { duplicateRuntimeTemplateDraftForUser } from "@/lib/runtime-templates/db";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  try {
    const { templateId } = await params;
    const user = await getOrCreateDashboardUser();
    const result = await duplicateRuntimeTemplateDraftForUser({
      userId: user.id,
      templateId,
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
