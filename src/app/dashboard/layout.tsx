import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { getIntegrationSettingsSummary } from "@/lib/settings/integrationSettings";
import type { WorkspaceProfileSummary } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedDashboardUser();
  let activeWorkspaceId = "";
  let workspaceProfiles: WorkspaceProfileSummary[] = [];

  if (isDatabaseConfigured()) {
    try {
      const settings = await getIntegrationSettingsSummary();
      activeWorkspaceId = await getDashboardWorkspaceScope(settings.publerWorkspaceId);
      workspaceProfiles = settings.workspaceProfiles;
    } catch {
      activeWorkspaceId = "";
      workspaceProfiles = [];
    }
  }

  return (
    <DashboardShell activeWorkspaceId={activeWorkspaceId} workspaceProfiles={workspaceProfiles}>
      {children}
    </DashboardShell>
  );
}
