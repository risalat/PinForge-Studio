import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { runRuntimeTemplateValidationForUser } from "@/lib/runtime-templates/db";

export const runtime = "nodejs";

const validateSchema = z.object({
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
    const payload = validateSchema.parse(await request.json());
    const user = await getOrCreateDashboardUser();
    const result = await runRuntimeTemplateValidationForUser({
      userId: user.id,
      templateId,
      versionId: payload.versionId,
    });

    return NextResponse.json({
      ok: true,
      validation: result.validation,
      summary: result.summary,
      versionId: result.versionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate runtime template.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
