import { getAdminDashboardData } from "@/lib/admin/dashboard";
import {
  AdminSection,
  EmptyState,
  InlineMetric,
  StatusPill,
  formatDateTime,
  formatDuration,
  taskKindLabel,
  truncateMiddle,
} from "@/app/dashboard/admin/AdminUi";

export default async function DashboardAdminPublerPage() {
  const data = await getAdminDashboardData();

  return (
    <AdminSection
      title="Publer"
      subtitle="Workspace locks, recent Publer-facing tasks, and metadata cache warmth."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                Active workspace locks
              </p>
              <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                DB-backed serialization across upload, scheduling, and sync.
              </p>
            </div>
            <StatusPill tone={data.activeWorkspaceLocks.length > 0 ? "info" : "success"}>
              {data.activeWorkspaceLocks.length} active
            </StatusPill>
          </div>

          <div className="mt-4 space-y-3">
            {data.activeWorkspaceLocks.length === 0 ? (
              <EmptyState label="No active workspace locks." />
            ) : (
              data.activeWorkspaceLocks.map((lock) => (
                <div key={lock.id} className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="info">{String(lock.scope).replace(/_/g, " ")}</StatusPill>
                    <StatusPill tone="neutral">WS {truncateMiddle(lock.workspaceId)}</StatusPill>
                  </div>
                  <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">
                    Held by {lock.holderId?.trim() || "unknown holder"} | expires in {lock.expiresInMinutes} min
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
              Publer cache
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InlineMetric label="Workspaces" value={String(data.overview.metadataCacheSummary.workspaces)} />
              <InlineMetric label="Accounts" value={String(data.overview.metadataCacheSummary.accounts)} />
              <InlineMetric label="Boards" value={String(data.overview.metadataCacheSummary.boards)} />
              <InlineMetric
                label="Latest refresh"
                value={data.overview.metadataCacheSummary.latestFetchedAt ? formatDateTime(data.overview.metadataCacheSummary.latestFetchedAt) : "-"}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
              Recent Publer task failures
            </p>
            <div className="mt-4 space-y-3">
              {data.recentPublerFailures.length === 0 ? (
                <EmptyState label="No Publer-facing failures in the last 24h." />
              ) : (
                data.recentPublerFailures.map((failure) => (
                  <div key={failure.id} className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="danger">{taskKindLabel(failure.kind)}</StatusPill>
                      {failure.workspaceId ? <StatusPill tone="neutral">WS {truncateMiddle(failure.workspaceId)}</StatusPill> : null}
                    </div>
                    <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">
                      {failure.lastError?.trim() || "No error details captured."}
                    </p>
                    <p className="mt-2 text-xs text-[var(--dashboard-muted)]">{formatDateTime(failure.updatedAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
          Recent Publer-facing tasks
        </p>
        <div className="mt-4 space-y-3">
          {data.recentPublerTasks.map((task) => (
            <div key={task.id} className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={task.status === "FAILED" ? "danger" : task.status === "RUNNING" ? "info" : task.status === "SUCCEEDED" ? "success" : "neutral"}>
                  {String(task.status).replace(/_/g, " ")}
                </StatusPill>
                <StatusPill tone="neutral">{taskKindLabel(task.kind)}</StatusPill>
                {task.workspaceId ? <StatusPill tone="neutral">WS {truncateMiddle(task.workspaceId)}</StatusPill> : null}
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[var(--dashboard-subtle)] md:grid-cols-3">
                <InlineMetric label="Updated" value={formatDateTime(task.updatedAt)} />
                <InlineMetric label="Worker" value={task.lockedBy?.trim() || "Idle"} />
                <InlineMetric label="Run time" value={task.durationMs ? formatDuration(task.durationMs) : "-"} />
              </div>
              <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">{task.progressLabel}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminSection>
  );
}
