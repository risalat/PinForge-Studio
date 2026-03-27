import { getAdminDashboardData } from "@/lib/admin/dashboard";
import {
  AdminSection,
  InlineMetric,
  StatusPill,
  formatDateTime,
  formatDuration,
  operationLabel,
} from "@/app/dashboard/admin/AdminUi";

export default async function DashboardAdminPerformancePage() {
  const data = await getAdminDashboardData();

  return (
    <AdminSection
      title="Performance"
      subtitle="Persisted timing metrics from the workflow instrumentation, ready for trend views later."
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
                  {metric.latestDurationMs ? formatDuration(metric.latestDurationMs) : "-"}
                </p>
                <p className="mt-1 text-xs text-[var(--dashboard-muted)]">
                  Latest{metric.latestOccurredAt ? ` | ${formatDateTime(metric.latestOccurredAt)}` : ""}
                </p>
              </div>
              <StatusPill tone={metric.runs24h > 0 ? "info" : "neutral"}>{metric.runs24h} runs / 24h</StatusPill>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InlineMetric label="Avg 24h" value={metric.avg24hMs ? formatDuration(metric.avg24hMs) : "-"} />
              <InlineMetric label="P95 7d" value={metric.p95Last7dMs ? formatDuration(metric.p95Last7dMs) : "-"} />
            </div>
          </div>
        ))}
      </div>
    </AdminSection>
  );
}
