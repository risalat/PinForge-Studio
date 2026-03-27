import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { AdminSection, EmptyState, StatusPill, formatDateTime, truncateMiddle } from "@/app/dashboard/admin/AdminUi";

export default async function DashboardAdminStoragePage() {
  const data = await getAdminDashboardData();

  return (
    <AdminSection
      title="Storage"
      subtitle="Operational view into temp retention so old jobs do not silently lose previews without context."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                Latest temp cleanup
              </p>
              <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                Scheduler-driven cleanup currently governs temp preview retention.
              </p>
            </div>
            <Link href="/dashboard/housekeeping" className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]">
              Open housekeeping
            </Link>
          </div>
          <div className="mt-4 rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
            {data.latestTempCleanupTask ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={data.latestTempCleanupTask.status === "SUCCEEDED" ? "success" : data.latestTempCleanupTask.status === "FAILED" ? "danger" : "info"}>
                    {String(data.latestTempCleanupTask.status).replace(/_/g, " ")}
                  </StatusPill>
                </div>
                <p className="mt-3 text-lg font-bold text-[var(--dashboard-text)]">{data.latestTempCleanupTask.summary}</p>
                <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">Updated {formatDateTime(data.latestTempCleanupTask.updatedAt)}</p>
                {data.latestTempCleanupTask.lastError ? <p className="mt-3 text-sm text-[#b42318]">{data.latestTempCleanupTask.lastError}</p> : null}
              </>
            ) : (
              <EmptyState label="No cleanup task recorded yet." />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
              Latest publication sync
            </p>
            <div className="mt-4 rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
              {data.latestSyncTask ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={data.latestSyncTask.status === "SUCCEEDED" ? "success" : data.latestSyncTask.status === "FAILED" ? "danger" : "info"}>
                      {String(data.latestSyncTask.status).replace(/_/g, " ")}
                    </StatusPill>
                    {data.latestSyncTask.workspaceId ? <StatusPill tone="neutral">WS {truncateMiddle(data.latestSyncTask.workspaceId)}</StatusPill> : null}
                  </div>
                  <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">{data.latestSyncTask.summary}</p>
                  <p className="mt-2 text-xs text-[var(--dashboard-muted)]">Updated {formatDateTime(data.latestSyncTask.updatedAt)}</p>
                </>
              ) : (
                <EmptyState label="No sync task recorded yet." />
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminSection>
  );
}
