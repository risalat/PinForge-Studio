import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { runtimeTemplateDocumentDraftSchema } from "@/lib/runtime-templates/schema.zod";
import { createTemplateBlockForUser } from "@/lib/template-blocks/db";

export const runtime = "nodejs";

const createTemplateBlockSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).optional().nullable(),
  sourceTemplateId: z.string().trim().min(1).optional().nullable(),
  document: runtimeTemplateDocumentDraftSchema,
  elementIds: z.array(z.string().trim().min(1)).min(1),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  try {
    const payload = createTemplateBlockSchema.parse(await request.json());
    const user = await getOrCreateDashboardUser();
    const block = await createTemplateBlockForUser({
      userId: user.id,
      name: payload.name,
      description: payload.description || undefined,
      document: payload.document,
      elementIds: payload.elementIds,
      sourceTemplateId: payload.sourceTemplateId || undefined,
    });

    return NextResponse.json({
      ok: true,
      block: {
        ...block,
        block: block.blockJson,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save template block.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
