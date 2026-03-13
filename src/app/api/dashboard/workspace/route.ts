import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import {
  DASHBOARD_WORKSPACE_COOKIE,
  normalizeDashboardWorkspaceId,
} from "@/lib/dashboard/workspaceScope";

const schema = z.object({
  workspaceId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  const payload = schema.parse(await request.json());
  const workspaceId = normalizeDashboardWorkspaceId(payload.workspaceId);
  const response = NextResponse.json({ ok: true, workspaceId });

  if (workspaceId) {
    response.cookies.set(DASHBOARD_WORKSPACE_COOKIE, workspaceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    response.cookies.delete(DASHBOARD_WORKSPACE_COOKIE);
  }

  return response;
}
