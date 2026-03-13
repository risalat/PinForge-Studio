import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { buildPostPulseSummary, listPostPulseRecordsForUser } from "@/lib/dashboard/postPulse";

export default async function DashboardPostPulsePage() {
  const databaseReady = isDatabaseConfigured();
  const user = databaseReady ? await getOrCreateDashboardUser() : null;
  const records = user ? await listPostPulseRecordsForUser(user.id) : [];
  const summary = buildPostPulseSummary(records);

  return (
    <div className="space-y-6 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Posts tracked" value={String(summary.postsTracked)} />
        <MetricCard label="Needs fresh pins" value={String(summary.needsFreshPins)} tone="warning" />
        <MetricCard label="Fresh" value={String(summary.fresh)} tone="success" />
        <MetricCard label="Never published" value={String(summary.neverPublished)} />
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet. Post Pulse will appear once the database is connected.
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          No tracked posts yet. As jobs are created and pins are scheduled, this workspace will show post-level freshness.
        </div>
      ) : (
        <section className="rounded-[32px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-md)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Post Tracker
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Publishing freshness by article</h2>
              <p className="mt-2 max-w-3xl text-sm text-[var(--dashboard-subtle)]">
                Version 1 uses a simple rule: if the last successfully scheduled pin is older than 30 days, the post needs fresh pins.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-3 text-sm text-[var(--dashboard-warning-ink)]">
              {summary.needsFreshPins} post{summary.needsFreshPins === 1 ? "" : "s"} currently need fresh pins.
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]">
            <table className="min-w-full divide-y divide-[var(--dashboard-line)] text-sm">
              <thead className="bg-[var(--dashboard-panel-alt)] text-left uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                <tr>
                  <th className="px-5 py-4">Post</th>
                  <th className="px-5 py-4">Generated</th>
                  <th className="px-5 py-4">Scheduled</th>
                  <th className="px-5 py-4">Last pin</th>
                  <th className="px-5 py-4">Freshness</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--dashboard-line)]">
                {records.map((record) => (
                  <tr key={record.postId}>
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-[var(--dashboard-text)]">{record.title}</p>
                      <p className="mt-1 break-all text-[var(--dashboard-subtle)]">{record.url}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                        {record.domain} • {record.totalJobs} job{record.totalJobs === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top font-semibold">{record.totalGeneratedPins}</td>
                    <td className="px-5 py-4 align-top font-semibold">{record.totalScheduledPins}</td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-[var(--dashboard-text)]">
                        {record.lastScheduledAt ? formatDate(record.lastScheduledAt) : "No successful scheduled pin"}
                      </p>
                      <p className="mt-1 text-[var(--dashboard-subtle)]">
                        {record.lastScheduledAt
                          ? `${record.freshnessAgeDays ?? 0} day${record.freshnessAgeDays === 1 ? "" : "s"} ago`
                          : record.totalGeneratedPins > 0
                            ? "Generated, but never scheduled"
                            : "No generated pins yet"}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <StatusPill status={record.freshnessStatus} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        {record.latestJobId ? (
                          <>
                            <Link
                              href={`/dashboard/jobs/${record.latestJobId}`}
                              className="rounded-full bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
                            >
                              Open latest job
                            </Link>
                            <Link
                              href={`/dashboard/jobs/${record.latestJobId}/publish`}
                              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                            >
                              Publish flow
                            </Link>
                          </>
                        ) : (
                          <span className="text-[var(--dashboard-muted)]">No job available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "success";
}) {
  const className =
    tone === "warning"
      ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
      : tone === "success"
        ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
        : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-[var(--dashboard-text)]";

  return (
    <div className={`rounded-[28px] border p-5 shadow-[var(--dashboard-shadow-sm)] ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "fresh" | "needs_fresh_pins" | "never_published" | "no_pins_yet" }) {
  const className =
    status === "fresh"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : status === "needs_fresh_pins"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}>
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(value: "fresh" | "needs_fresh_pins" | "never_published" | "no_pins_yet") {
  switch (value) {
    case "needs_fresh_pins":
      return "Needs fresh pins";
    case "never_published":
      return "Never published";
    case "no_pins_yet":
      return "No pins yet";
    case "fresh":
    default:
      return "Fresh";
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}
