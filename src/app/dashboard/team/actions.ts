"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { createTeamInvitation, revokeInvitation } from "@/lib/team/invitations";
import { getLeaderAccessibleUserIds } from "@/lib/team/teamAccess";
import { DASHBOARD_EFFECTIVE_USER_COOKIE } from "@/lib/team/effectiveUserContext";
import { DASHBOARD_WORKSPACE_COOKIE } from "@/lib/dashboard/workspaceScope";

export async function inviteTeammateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as "ADMIN" | "MEMBER";

  if (!email) {
    throw new Error("Email is required.");
  }

  const result = await createTeamInvitation({
    invitedByUserId: user.id,
    email,
    role: role === "ADMIN" ? "ADMIN" : "MEMBER",
  });

  revalidatePath("/dashboard/team");
  return { inviteUrl: result.inviteUrl };
}

export async function revokeInvitationAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const invitationId = String(formData.get("invitationId") ?? "").trim();

  if (!invitationId) {
    throw new Error("Invitation is missing.");
  }

  await revokeInvitation({
    userId: user.id,
    invitationId,
  });

  revalidatePath("/dashboard/team");
}

export async function setDashboardEffectiveUserAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const effectiveUserId = String(formData.get("effectiveUserId") ?? "").trim();
  const returnPath = String(formData.get("returnPath") ?? "").trim();

  const allowedUserIds = await getLeaderAccessibleUserIds(user.id);
  const cookieStore = await cookies();

  if (effectiveUserId && allowedUserIds.includes(effectiveUserId)) {
    cookieStore.set(DASHBOARD_EFFECTIVE_USER_COOKIE, effectiveUserId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    cookieStore.delete(DASHBOARD_WORKSPACE_COOKIE);
  } else {
    cookieStore.delete(DASHBOARD_EFFECTIVE_USER_COOKIE);
  }

  redirect(returnPath || "/dashboard/team");
}
