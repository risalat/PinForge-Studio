import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getApiEffectiveUserId } from "@/lib/team/effectiveUserContext";
import { isDatabaseConfigured } from "@/lib/env";
import { saveWorkspaceProfileDefaults } from "@/lib/settings/integrationSettings";

const schema = z.object({
  workspaceId: z.string().trim().min(1),
  defaultAccountId: z.string().trim().optional(),
  defaultBoardId: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const payload = schema.parse(await request.json());
    const effectiveUserId = await getApiEffectiveUserId();
    const profile = await saveWorkspaceProfileDefaults({ ...payload, userId: effectiveUserId });

    return NextResponse.json({
      ok: true,
      profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save workspace profile defaults.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
