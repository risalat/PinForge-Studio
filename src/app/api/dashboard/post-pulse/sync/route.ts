import { NextResponse } from "next/server";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { syncPublerPublicationRecordsForUser } from "@/lib/dashboard/publerSync";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  try {
    const user = await getOrCreateDashboardUser();
    const result = await syncPublerPublicationRecordsForUser(user.id);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync Publer post activity.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
