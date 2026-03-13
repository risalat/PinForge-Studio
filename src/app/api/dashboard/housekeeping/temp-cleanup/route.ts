import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { cleanupStaleTempAssets } from "@/lib/housekeeping/storageMaintenance";

export const runtime = "nodejs";

const schema = z.object({
  days: z.number().int().positive().max(365).optional(),
  apply: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = schema.parse(await request.json().catch(() => ({})));
    const result = await cleanupStaleTempAssets(payload);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to clean temp assets.",
      },
      { status: 500 },
    );
  }
}
