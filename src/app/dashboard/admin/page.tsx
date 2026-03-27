import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { adminNavigation } from "@/lib/admin/navigation";
import { AdminSection, MetricCard, MiniStatCard } from "@/app/dashboard/admin/AdminUi";

export default async function DashboardAdminOverviewPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <AdminSection
        title="Overview"
        subtitle="Use this page as the control-room entry point, then jump into the focused pages for runtime, workspaces, tasks, performance, Publer, storage, and actions."
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
            note={`${data.overview.activeWorkspaceLocks} active workspace locks`}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MiniStatCard label="Queued" value={String(data.overview.taskStatusCounts.queued)} />
          <MiniStatCard label="Running" value={String(data.overview.taskStatusCounts.running)} />
          <MiniStatCard label="Failed 24h" value={String(data.overview.recentFailedTaskCount)} />
          <MiniStatCard label="Workspaces" value={String(data.workspaceDiagnostics.length)} />
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
            Studio totals
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <MiniStatCard label="Pins today" value={String(data.overview.studioStats.pinsGeneratedToday)} />
            <MiniStatCard label="Pins lifetime" value={String(data.overview.studioStats.pinsGeneratedLifetime)} />
            <MiniStatCard label="Articles today" value={String(data.overview.studioStats.articlesCoveredToday)} />
            <MiniStatCard label="Articles this week" value={String(data.overview.studioStats.articlesCoveredThisWeek)} />
            <MiniStatCard label="Articles this month" value={String(data.overview.studioStats.articlesCoveredThisMonth)} />
            <MiniStatCard label="Articles lifetime" value={String(data.overview.studioStats.articlesCoveredLifetime)} />
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Navigation"
        subtitle="Each admin feature now has its own page instead of living in one long wall of cards."
      >
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {adminNavigation
            .filter((item) => item.href !== "/dashboard/admin")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)] transition hover:border-[var(--dashboard-accent)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                  {item.label}
                </p>
                <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">{item.description}</p>
              </Link>
            ))}
        </div>
      </AdminSection>
    </div>
  );
}
