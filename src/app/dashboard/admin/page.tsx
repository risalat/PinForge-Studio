import Link from "next/link";
import { BackgroundTaskKind } from "@prisma/client";
import { requireDashboardAdminUser } from "@/lib/auth/dashboardSession";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

const ADMIN_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "runtime", label: "Runtime" },
  { id: "tasks", label: "Tasks" },
  { id: "performance", label: "Performance" },
  { id: "publer", label: "Publer" },
  { id: "storage", label: "Storage" },
] as const;

export default async function DashboardAdminPage() {
  await requireDashboardAdminUser();
  const data = await getAdminDashboardData();

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-[140px] xl:self-start">
        <div className="space-y-4 rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5 shadow-[var(--dashboard-shadow-sm)]">
          <div className="rounded-[24px] bg-[linear-gradient(145deg,#0d5fff_0%,#1f7bf6_58%,#69d6ff_100%)] p-5 text-white shadow-[var(--dashboard-shadow-accent)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Single-user mode</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Admin control room</h2>
            <p className="mt-2 text-sm text-white/85">
              Internal ops only. Multi-user controls stay deferred, but the health and metrics foundation is now in place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStatCard label="Queued" value={String(data.overview.taskStatusCounts.queued)} />
            <MiniStatCard label="Running" value={String(data.overview.taskStatusCounts.running)} />
            <MiniStatCard label="Failed 24h" value={String(data.overview.recentFailedTaskCount)} />
            <MiniStatCard label="Locks" value={String(data.overview.activeWorkspaceLocks)} />
          </div>

          <nav className="space-y-2">
            {ADMIN_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center justify-between rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-3 text-sm font-semibold text-[var(--dashboard-text)] transition hover:border-[var(--dashboard-accent)] hover:text-[var(--dashboard-accent)]"
              >
                <span>{section.label}</span>
                <span className="text-[var(--dashboard-muted)]">#</span>
              </a>
            ))}
          </nav>

          <div className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">Updated</p>
            <p className="mt-2 text-sm font-semibold text-[var(--dashboard-text)]">
              {formatDateTime(data.generatedAt)}
            </p>
            <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
              Persisted timing metrics and runtime heartbeats now back this page, so later multi-user ops can layer on top without another redesign.
            </p>
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <SectionCard
          id="overview"
          title="System overview"
          subtitle="Fast health checks for the task queue, runtime processes, and Publer support data."
        >
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              label="Runtime health"
              value={`${data.overview.healthyWorkers} worker / ${data.overview.healthySchedulers} scheduler / ${data.overview.healthyWebNodes} web`}
              note="Healthy heartbeats seen recently"
            />
            <MetricCard
              label="Queue pressure"
              value={`${data.overview.taskStatusCounts.queued} queued`}
              note={`${data.overview.taskStatusCounts.running} running right now`}
            />
            <MetricCard
              label="Failure load"
              value={`${data.overview.recentFailedTaskCount} in 24h`}
              note={`${data.overview.taskStatusCounts.failed} failed tasks retained`}
            />
            <MetricCard
              label="Publer cache"
              value={`${data.overview.metadataCacheSummary.totalFreshEntries} warm entries`}
              note={`${data.overview.metadataCacheSummary.boards} board entries cached`}
            />
          </div>
        </SectionCard>

        <SectionCard
          id="runtime"
          title="Runtime health"
          subtitle="Heartbeat-backed status for the web surface, workers, and scheduler."
        >
          <div className="grid gap-4 xl:grid-cols-3">
            <RuntimeColumn title="Web" items={data.runtimeByKind.web} />
            <RuntimeColumn title="Workers" items={data.runtimeByKind.worker} />
            <RuntimeColumn title="Scheduler" items={data.runtimeByKind.scheduler} />
          </div>
        </SectionCard>

        <SectionCard
          id="tasks"
          title="Background tasks"
          subtitle="Queue shape by task kind, plus the most recent failures that need operator attention."
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
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
                    Latest failures retained in the task table.
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
                    <div
                      key={task.id}
                      className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="danger">Failed</StatusPill>
                        <StatusPill tone="neutral">{taskKindLabel(task.kind)}</StatusPill>
                        {task.workspaceId ? <StatusPill tone="neutral">WS {truncateMiddle(task.workspaceId)}</StatusPill> : null}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[var(--dashboard-text)]">
                        {task.lastError?.trim() || "No failure message captured."}
                      </p>
                      <p className="mt-2 text-xs text-[var(--dashboard-muted)]">
                        Attempts {task.attempts}/{task.maxAttempts} • {formatDateTime(task.finishedAt ?? task.updatedAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          id="performance"
          title="Performance snapshot"
          subtitle="Persisted timing metrics from the workflow instrumentation, ready for deeper trend views later."
        >
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {data.performance.map((metric) => (
              <div
                key={metric.operationName}
                className="rounded-[26px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                  {operationLabel(metric.operationName)}
                </p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
                      {metric.latestDurationMs ? formatDuration(metric.latestDurationMs) : "—"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--dashboard-muted)]">
                      Latest{metric.latestOccurredAt ? ` • ${formatDateTime(metric.latestOccurredAt)}` : ""}
                    </p>
                  </div>
                  <StatusPill tone={metric.runs24h > 0 ? "info" : "neutral"}>{metric.runs24h} runs / 24h</StatusPill>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InlineMetric label="Avg 24h" value={metric.avg24hMs ? formatDuration(metric.avg24hMs) : "—"} />
                  <InlineMetric label="P95 7d" value={metric.p95Last7dMs ? formatDuration(metric.p95Last7dMs) : "—"} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {metric.recentRuns.length > 0 ? (
                    metric.recentRuns.map((run, index) => (
                      <span
                        key={`${metric.operationName}-${index}-${run.occurredAt.toISOString()}`}
                        className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold text-[var(--dashboard-subtle)]"
                      >
                        {formatDuration(run.durationMs ?? 0)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--dashboard-muted)]">No recent persisted runs.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          id="publer"
          title="Publer operations"
          subtitle="Workspace lock visibility, recent Publer-facing tasks, and metadata-cache warmth."
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
                    <div
                      key={lock.id}
                      className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="info">{String(lock.scope).replace(/_/g, " ")}</StatusPill>
                        <StatusPill tone="neutral">WS {truncateMiddle(lock.workspaceId)}</StatusPill>
                      </div>
                      <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">
                        Held by {lock.holderId?.trim() || "unknown holder"} • expires in {lock.expiresInMinutes} min
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
                    value={
                      data.overview.metadataCacheSummary.latestFetchedAt
                        ? formatDateTime(data.overview.metadataCacheSummary.latestFetchedAt)
                        : "—"
                    }
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
                      <div
                        key={failure.id}
                        className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone="danger">{taskKindLabel(failure.kind)}</StatusPill>
                          {failure.workspaceId ? (
                            <StatusPill tone="neutral">WS {truncateMiddle(failure.workspaceId)}</StatusPill>
                          ) : null}
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                  Recent Publer-facing tasks
                </p>
                <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                  Upload, scheduling, and sync tasks across the current workspace set.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.recentPublerTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
                >
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
                    <InlineMetric label="Run time" value={task.durationMs ? formatDuration(task.durationMs) : "—"} />
                  </div>
                  <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">{task.progressLabel}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          id="storage"
          title="Storage and cleanup"
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
                <Link
                  href="/dashboard/housekeeping"
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
                >
                  Open housekeeping
                </Link>
              </div>

              <div className="mt-4 rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                {data.latestTempCleanupTask ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        tone={
                          data.latestTempCleanupTask.status === "SUCCEEDED"
                            ? "success"
                            : data.latestTempCleanupTask.status === "FAILED"
                              ? "danger"
                              : "info"
                        }
                      >
                        {String(data.latestTempCleanupTask.status).replace(/_/g, " ")}
                      </StatusPill>
                    </div>
                    <p className="mt-3 text-lg font-bold text-[var(--dashboard-text)]">
                      {data.latestTempCleanupTask.summary}
                    </p>
                    <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                      Updated {formatDateTime(data.latestTempCleanupTask.updatedAt)}
                    </p>
                    {data.latestTempCleanupTask.lastError ? (
                      <p className="mt-3 text-sm text-[#b42318]">{data.latestTempCleanupTask.lastError}</p>
                    ) : null}
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
                        <StatusPill
                          tone={
                            data.latestSyncTask.status === "SUCCEEDED"
                              ? "success"
                              : data.latestSyncTask.status === "FAILED"
                                ? "danger"
                                : "info"
                          }
                        >
                          {String(data.latestSyncTask.status).replace(/_/g, " ")}
                        </StatusPill>
                        {data.latestSyncTask.workspaceId ? (
                          <StatusPill tone="neutral">WS {truncateMiddle(data.latestSyncTask.workspaceId)}</StatusPill>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">{data.latestSyncTask.summary}</p>
                      <p className="mt-2 text-xs text-[var(--dashboard-muted)]">
                        Updated {formatDateTime(data.latestSyncTask.updatedAt)}
                      </p>
                    </>
                  ) : (
                    <EmptyState label="No sync task recorded yet." />
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                  Future rollout notes
                </p>
                <ul className="mt-4 space-y-3 text-sm text-[var(--dashboard-subtle)]">
                  <li>Keep this surface read-only until multi-user support lands.</li>
                  <li>Next expansion should add workspace diagnostics before admin actions.</li>
                  <li>Durable generated asset storage remains the highest-value follow-up outside this dashboard.</li>
                </ul>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[140px] rounded-[32px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 shadow-[var(--dashboard-shadow-sm)]"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">{title}</p>
          <p className="mt-3 max-w-3xl text-sm text-[var(--dashboard-subtle)]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[26px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{note}</p>
    </div>
  );
}

function MiniStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function RuntimeColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{
    instanceId: string;
    displayName: string;
    lastSeenAt: Date;
    ageMs: number;
    expectedMs: number;
    health: string;
    metadata: Record<string, unknown>;
  }>;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">{title}</p>
          <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{items.length} heartbeat entries</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState label={`No ${title.toLowerCase()} heartbeat recorded yet.`} />
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item.instanceId}`}
              className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--dashboard-text)]">{item.displayName}</p>
                  <p className="mt-1 text-xs text-[var(--dashboard-muted)]">{truncateMiddle(item.instanceId, 28)}</p>
                </div>
                <StatusPill tone={item.health === "healthy" ? "success" : item.health === "stale" ? "info" : "danger"}>
                  {item.health}
                </StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <InlineMetric label="Last seen" value={formatDateTime(item.lastSeenAt)} />
                <InlineMetric label="Age" value={formatRelativeMs(item.ageMs)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function CounterPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "danger";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 ${
        tone === "danger"
          ? "bg-[#fef3f2] text-[#b42318]"
          : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label} {value}
    </span>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "neutral" | "info" | "success" | "danger";
  children: React.ReactNode;
}) {
  const className =
    tone === "success"
      ? "border-[#b7ebd1] bg-[#eefbf3] text-[#19764c]"
      : tone === "danger"
        ? "border-[#f1b7b4] bg-[#fef3f2] text-[#b42318]"
        : tone === "info"
          ? "border-[#c7d7ff] bg-[#eef3ff] text-[#2447b2]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
      {children}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-6 text-sm text-[var(--dashboard-muted)]">
      {label}
    </div>
  );
}

function taskKindLabel(kind: BackgroundTaskKind) {
  return kind.toLowerCase().replace(/_/g, " ");
}

function operationLabel(operationName: string) {
  return operationName.replace(/^workflow\./, "").replace(/^dashboard\./, "").replace(/^query\./, "").replace(/[._]+/g, " ");
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatDuration(value: number) {
  if (value < 1000) {
    return `${value}ms`;
  }
  if (value < 60_000) {
    return `${(value / 1000).toFixed(1)}s`;
  }

  return `${(value / 60_000).toFixed(1)}m`;
}

function formatRelativeMs(value: number) {
  if (value < 60_000) {
    return `${Math.round(value / 1000)}s ago`;
  }
  if (value < 60 * 60_000) {
    return `${Math.round(value / 60_000)}m ago`;
  }

  return `${Math.round(value / (60 * 60_000))}h ago`;
}

function truncateMiddle(value: string, maxLength = 16) {
  if (value.length <= maxLength) {
    return value;
  }

  const visible = Math.max(4, Math.floor((maxLength - 1) / 2));
  return `${value.slice(0, visible)}…${value.slice(-visible)}`;
}
