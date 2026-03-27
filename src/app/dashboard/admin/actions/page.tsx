import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import {
  AdminSyncWorkspaceButton,
  AdminTempCleanupButton,
} from "@/app/dashboard/admin/AdminActionButtons";
import { AdminSection, StatusPill } from "@/app/dashboard/admin/AdminUi";

export default async function DashboardAdminActionsPage() {
  const data = await getAdminDashboardData();

  return (
    <AdminSection
      title="Actions"
      subtitle="Single-user-safe actions only. Riskier repair tools stay deferred until the write path proves stable."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
            Maintenance
          </p>
          <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">
            Queue a fresh temp cleanup run without leaving the admin area.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <AdminTempCleanupButton days={14} />
            <Link
              href="/dashboard/housekeeping"
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
            >
              Review housekeeping
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
            Workspace sync
          </p>
          <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">
            Queue a fresh Publer sync per workspace. This is intentionally manual and explicit.
          </p>
          <div className="mt-4 space-y-3">
            {data.workspaceDiagnostics.map((workspace) => (
              <div
                key={workspace.workspaceId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--dashboard-text)]">{workspace.workspaceName}</p>
                    {workspace.isDefault ? <StatusPill tone="success">Default</StatusPill> : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--dashboard-muted)]">
                    {workspace.syncState ? `Next page ${workspace.syncState.nextPage}` : "No sync state yet"}
                  </p>
                </div>
                <AdminSyncWorkspaceButton
                  workspaceId={workspace.workspaceId}
                  workspaceName={workspace.workspaceName}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}
