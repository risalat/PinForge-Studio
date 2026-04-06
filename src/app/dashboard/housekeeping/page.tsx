import { HousekeepingManager } from "@/app/dashboard/housekeeping/HousekeepingManager";
import { isDatabaseConfigured } from "@/lib/env";

export default function DashboardHousekeepingPage() {
  return (
    <div className="space-y-5 text-[var(--dashboard-text)]">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
          <MetricChip label="Storage audit" value="Ready" />
          <MetricChip label="Temp cleanup" value="Ready" />
          <MetricChip label="Canonical repair" value="Ready" />
        </div>
      </section>

      <HousekeepingManager databaseReady={isDatabaseConfigured()} />
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}
