import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { getIntegrationSettingsSummary } from "@/lib/settings/integrationSettings";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedDashboardUser();
  let activeWorkspaceId = "";

  if (isDatabaseConfigured()) {
    try {
      const settings = await getIntegrationSettingsSummary();
      activeWorkspaceId = await getDashboardWorkspaceScope(settings.publerWorkspaceId);
    } catch {
      activeWorkspaceId = "";
    }
  }

  return <DashboardShell activeWorkspaceId={activeWorkspaceId}>{children}</DashboardShell>;
}
