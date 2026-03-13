import { HousekeepingManager } from "@/app/dashboard/housekeeping/HousekeepingManager";
import { isDatabaseConfigured } from "@/lib/env";

export default function DashboardHousekeepingPage() {
  return (
    <div className="space-y-6 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard label="Storage audit" value="Ready" />
        <MetricCard label="Temp cleanup" value="Ready" />
        <MetricCard label="Mode" value="Manual" />
      </section>

      <HousekeepingManager databaseReady={isDatabaseConfigured()} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}
