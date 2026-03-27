import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AppFeedbackProvider } from "@/components/ui/AppFeedbackProvider";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { listPinterestCalendarNotifications } from "@/lib/dashboard/pinterestCalendar";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { touchRuntimeHeartbeat } from "@/lib/observability/persistence";
import { getIntegrationSettingsSummary } from "@/lib/settings/integrationSettings";
import type { WorkspaceProfileSummary } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedDashboardUser();
  await touchRuntimeHeartbeat({
    kind: "WEB",
    instanceId: "dashboard-web",
    displayName: "Dashboard web",
    minIntervalMs: 60_000,
    metadataJson: {
      surface: "dashboard",
    },
  });
  let activeWorkspaceId = "";
  let workspaceProfiles: WorkspaceProfileSummary[] = [];
  const calendarNotifications = listPinterestCalendarNotifications();

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
    <AppFeedbackProvider>
      <DashboardShell
        activeWorkspaceId={activeWorkspaceId}
        workspaceProfiles={workspaceProfiles}
        calendarNotifications={calendarNotifications}
      >
        {children}
      </DashboardShell>
    </AppFeedbackProvider>
  );
}
