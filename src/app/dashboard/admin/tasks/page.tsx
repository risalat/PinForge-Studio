import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { AdminRetryFailedTaskButton } from "@/app/dashboard/admin/AdminActionButtons";
import {
  AdminSection,
  CounterPill,
  EmptyState,
  StatusPill,
  formatDateTime,
  taskKindLabel,
  truncateMiddle,
} from "@/app/dashboard/admin/AdminUi";

export default async function DashboardAdminTasksPage() {
  const data = await getAdminDashboardData();

  return (
    <AdminSection
      title="Tasks"
      subtitle="Queue shape by task kind plus the most recent failures that can be retried safely from the admin surface."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.95fr)]">
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {data.taskQueueByKind.map((taskKind) => (
            <div
              key={taskKind.kind}
              className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                    {taskKindLabel(taskKind.kind)}
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--dashboard-text)]">
                    {taskKind.queued + taskKind.running + taskKind.failed}
                  </p>
                </div>
                <StatusPill tone={taskKind.failed > 0 ? "danger" : taskKind.running > 0 ? "info" : "neutral"}>
                  {taskKind.failed > 0 ? "Attention" : taskKind.running > 0 ? "Active" : "Quiet"}
                </StatusPill>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <CounterPill label="Queued" value={taskKind.queued} />
                <CounterPill label="Running" value={taskKind.running} />
                <CounterPill label="Failed" value={taskKind.failed} tone={taskKind.failed > 0 ? "danger" : "neutral"} />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                Recent failed tasks
              </p>
              <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                Safe retries are enabled only for render, AI, sync, and cleanup tasks.
              </p>
            </div>
            <StatusPill tone={data.recentFailedTasks.length > 0 ? "danger" : "success"}>
              {data.recentFailedTasks.length > 0 ? "Needs review" : "Clean"}
            </StatusPill>
          </div>

          <div className="mt-4 space-y-3">
            {data.recentFailedTasks.length === 0 ? (
              <EmptyState label="No failed tasks right now." />
            ) : (
              data.recentFailedTasks.map((task) => (
                <div key={task.id} className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="danger">Failed</StatusPill>
                    <StatusPill tone="neutral">{taskKindLabel(task.kind)}</StatusPill>
                    {task.workspaceId ? <StatusPill tone="neutral">WS {truncateMiddle(task.workspaceId)}</StatusPill> : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--dashboard-text)]">
                    {task.lastError?.trim() || "No failure message captured."}
                  </p>
                  <p className="mt-2 text-xs text-[var(--dashboard-muted)]">
                    Attempts {task.attempts}/{task.maxAttempts} | {formatDateTime(task.finishedAt ?? task.updatedAt)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.safeToRetry ? (
                      <AdminRetryFailedTaskButton taskId={task.id} />
                    ) : (
                      <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-muted)]">
                        Retry manually
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}
