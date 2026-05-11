import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { getLeaderAccessibleUserIds } from "@/lib/team/teamAccess";

export const DASHBOARD_EFFECTIVE_USER_COOKIE = "pinforge_dashboard_effective_user";

export type EffectiveUserContext = {
  actorUser: {
    id: string;
    email: string;
  };
  effectiveUser: {
    id: string;
    email: string;
  };
  effectiveUserId: string;
  isOperatingAsTeammate: boolean;
  canOperateTeammates: boolean;
};

export async function getDashboardEffectiveUserContext(
  actorUserId: string,
): Promise<EffectiveUserContext> {
  const cookieStore = await cookies();
  const requestedEffectiveUserId =
    cookieStore.get(DASHBOARD_EFFECTIVE_USER_COOKIE)?.value ?? "";

  const allowedUserIds = await getLeaderAccessibleUserIds(actorUserId);
  const effectiveUserId = requestedEffectiveUserId &&
    allowedUserIds.includes(requestedEffectiveUserId)
    ? requestedEffectiveUserId
    : actorUserId;

  const effectiveUser = await prisma.user.findUnique({
    where: { id: effectiveUserId },
    select: { id: true, email: true },
  });

  if (!effectiveUser) {
    return {
      actorUser: { id: actorUserId, email: "" },
      effectiveUser: { id: actorUserId, email: "" },
      effectiveUserId: actorUserId,
      isOperatingAsTeammate: false,
      canOperateTeammates: allowedUserIds.length > 1,
    };
  }

  const actorUser = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { id: true, email: true },
  });

  return {
    actorUser: actorUser ?? { id: actorUserId, email: "" },
    effectiveUser,
    effectiveUserId,
    isOperatingAsTeammate: effectiveUserId !== actorUserId,
    canOperateTeammates: allowedUserIds.length > 1,
  };
}

export async function getApiEffectiveUserId(): Promise<string> {
  const user = await getOrCreateDashboardUser();
  const cookieStore = await cookies();
  const requestedEffectiveUserId =
    cookieStore.get(DASHBOARD_EFFECTIVE_USER_COOKIE)?.value ?? "";

  if (!requestedEffectiveUserId) {
    return user.id;
  }

  const allowedUserIds = await getLeaderAccessibleUserIds(user.id);
  if (allowedUserIds.includes(requestedEffectiveUserId)) {
    return requestedEffectiveUserId;
  }

  return user.id;
}

export async function getApiEffectiveUserContext() {
  const user = await getOrCreateDashboardUser();
  const effectiveUserId = await getApiEffectiveUserId();
  return {
    actorUserId: user.id,
    effectiveUserId,
    isOperatingAsTeammate: effectiveUserId !== user.id,
  };
}
