import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { runtimeTemplateEditorStateSchema } from "@/lib/runtime-templates/schema";
import { runtimeTemplateDocumentDraftSchema } from "@/lib/runtime-templates/schema.zod";
import { saveRuntimeTemplateDraftForUser } from "@/lib/runtime-templates/db";

export const runtime = "nodejs";

const saveDraftSchema = z.object({
  versionId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  document: runtimeTemplateDocumentDraftSchema,
  editorState: runtimeTemplateEditorStateSchema,
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
    const payload = saveDraftSchema.parse(await request.json());
    const user = await getOrCreateDashboardUser();
    const result = await saveRuntimeTemplateDraftForUser({
      userId: user.id,
      templateId,
      versionId: payload.versionId,
      name: payload.name,
      description: payload.description,
      document: payload.document,
      editorState: payload.editorState,
    });

    return NextResponse.json({
      ok: true,
      updatedAt: result.version.updatedAt.toISOString(),
      summary: result.summary,
      validation: result.validation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save runtime template draft.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
