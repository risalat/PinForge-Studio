import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { AdminSyncWorkspaceButton } from "@/app/dashboard/admin/AdminActionButtons";
import {
  AdminSection,
  CounterPill,
  EmptyState,
  InlineMetric,
  StatusPill,
  formatDateTime,
  formatMaybeDateTime,
  truncateMiddle,
} from "@/app/dashboard/admin/AdminUi";

export default async function DashboardAdminWorkspacesPage() {
  const data = await getAdminDashboardData();

  return (
    <AdminSection
      title="Workspaces"
      subtitle="Workspace diagnostics for sync health, publish pressure, metadata freshness, and queue load."
    >
      <div className="grid gap-4 2xl:grid-cols-2">
        {data.workspaceDiagnostics.length === 0 ? (
          <EmptyState label="No workspace diagnostics are available yet." />
        ) : (
          data.workspaceDiagnostics.map((workspace) => (
            <div
              key={workspace.workspaceId}
              className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black tracking-[-0.03em] text-[var(--dashboard-text)]">
                      {workspace.workspaceName}
                    </p>
                    {workspace.isDefault ? <StatusPill tone="success">Default</StatusPill> : null}
                    {workspace.activeLock ? (
                      <StatusPill tone="info">{String(workspace.activeLock.scope).replace(/_/g, " ")}</StatusPill>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                    Workspace {truncateMiddle(workspace.workspaceId, 22)}
                  </p>
                </div>
                <AdminSyncWorkspaceButton
                  workspaceId={workspace.workspaceId}
                  workspaceName={workspace.workspaceName}
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <InlineMetric label="Jobs tracked" value={String(workspace.jobsTracked)} />
                <InlineMetric label="Pins tracked" value={String(workspace.generatedPinsTracked)} />
                <InlineMetric label="Posts tracked" value={String(workspace.postsTracked)} />
                <InlineMetric label="Scheduled 30d" value={String(workspace.scheduledPosts30d)} />
                <InlineMetric label="Published 30d" value={String(workspace.publishedPosts30d)} />
                <InlineMetric label="Schedule failures" value={String(workspace.scheduleFailures30d)} />
                <InlineMetric label="Fresh pin prompts" value={String(workspace.needsFreshPins)} />
                <InlineMetric label="No pins yet" value={String(workspace.noPinsYet)} />
                <InlineMetric label="Allowed domains" value={String(workspace.allowedDomainCount)} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <CounterPill label="Queued" value={workspace.queuedTasks} />
                <CounterPill label="Running" value={workspace.runningTasks} />
                <CounterPill
                  label="Failed"
                  value={workspace.failedTasks}
                  tone={workspace.failedTasks > 0 ? "danger" : "neutral"}
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InlineMetric
                  label="Default destination"
                  value={workspace.defaultAccountId && workspace.defaultBoardId ? "Configured" : "Incomplete"}
                />
                <InlineMetric
                  label="Daily target"
                  value={workspace.dailyPublishTarget ? String(workspace.dailyPublishTarget) : "-"}
                />
                <InlineMetric
                  label="Metadata refresh"
                  value={workspace.latestMetadataRefreshAt ? formatDateTime(workspace.latestMetadataRefreshAt) : "-"}
                />
                <InlineMetric
                  label="Last published"
                  value={workspace.lastPublishedAt ? formatDateTime(workspace.lastPublishedAt) : "-"}
                />
              </div>

              <div className="mt-4 rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={workspace.syncState?.lastError ? "danger" : "info"}>
                    {workspace.syncState ? workspace.syncState.mode : "No sync state"}
                  </StatusPill>
                  {workspace.activeLock?.expiresInMinutes != null ? (
                    <StatusPill tone="neutral">{workspace.activeLock.expiresInMinutes} min left</StatusPill>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">
                  {workspace.syncState
                    ? workspace.syncState.lastError?.trim() ||
                      `Next page ${workspace.syncState.nextPage} | last run ${formatMaybeDateTime(workspace.syncState.lastRunAt)}`
                    : "This workspace has not established sync state yet."}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminSection>
  );
}
