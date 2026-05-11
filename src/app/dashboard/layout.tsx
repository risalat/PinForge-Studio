import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AppFeedbackProvider } from "@/components/ui/AppFeedbackProvider";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { listPinterestCalendarNotifications } from "@/lib/dashboard/pinterestCalendar";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { touchRuntimeHeartbeat } from "@/lib/observability/persistence";
import { getIntegrationSettingsSummaryForUserId } from "@/lib/settings/integrationSettings";
import { getDashboardEffectiveUserContext } from "@/lib/team/effectiveUserContext";
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
  let effectiveUserBanner: string | null = null;
  const calendarNotifications = listPinterestCalendarNotifications();

  if (isDatabaseConfigured()) {
    try {
      const actorUser = await getOrCreateDashboardUser();
      const context = await getDashboardEffectiveUserContext(actorUser.id);

      if (context.isOperatingAsTeammate) {
        effectiveUserBanner = `Operating as ${context.effectiveUser.email} — using their workspace and Publer settings.`;
      }

      const settings = await getIntegrationSettingsSummaryForUserId(context.effectiveUserId);
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
        effectiveUserBanner={effectiveUserBanner}
      >
        {children}
      </DashboardShell>
    </AppFeedbackProvider>
  );
}
