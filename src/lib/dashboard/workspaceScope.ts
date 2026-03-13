import { cookies } from "next/headers";

export const DASHBOARD_WORKSPACE_COOKIE = "pinforge_dashboard_workspace";

export function normalizeDashboardWorkspaceId(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export async function getDashboardWorkspaceScope(fallbackWorkspaceId = "") {
  const cookieStore = await cookies();
  const scopedWorkspaceId = normalizeDashboardWorkspaceId(
    cookieStore.get(DASHBOARD_WORKSPACE_COOKIE)?.value,
  );

  return scopedWorkspaceId || normalizeDashboardWorkspaceId(fallbackWorkspaceId);
}
