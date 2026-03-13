import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { filterByAllowedDomains } from "@/lib/dashboard/domainScope";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
} from "@/lib/settings/integrationSettings";

const inboxStatuses = new Set(["RECEIVED", "REVIEWING", "READY_FOR_GENERATION", "FAILED"]);

export default async function DashboardInboxPage() {
  const databaseReady = isDatabaseConfigured();
  const user = databaseReady ? await getOrCreateDashboardUser() : null;
  const [allJobs, settings] = user
    ? await Promise.all([
        listJobsForUser(user.id),
        getIntegrationSettingsSummary(),
      ])
    : [[], null];
  const activeWorkspaceId = await getDashboardWorkspaceScope(settings?.publerWorkspaceId || "");
  const allowedDomains = user
    ? await getWorkspaceAllowedDomainsForUserId(user.id, activeWorkspaceId)
    : [];
  const jobs = filterByAllowedDomains(allJobs, (job) => job.domainSnapshot, allowedDomains);
  const inboxJobs = jobs.filter((job) => inboxStatuses.has(job.status));

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-4">
        <InboxMetric
          label="New intake"
          value={String(inboxJobs.filter((job) => job.status === "RECEIVED").length)}
        />
        <InboxMetric
          label="Reviewing"
          value={String(inboxJobs.filter((job) => job.status === "REVIEWING").length)}
        />
        <InboxMetric
          label="Ready to generate"
          value={String(inboxJobs.filter((job) => job.status === "READY_FOR_GENERATION").length)}
        />
        <InboxMetric
          label="Needs attention"
          value={String(inboxJobs.filter((job) => job.status === "FAILED").length)}
        />
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet.
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <div className="space-y-4">
            {inboxJobs.length === 0 ? (
              <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
                No intake jobs currently need review.
              </div>
            ) : (
              inboxJobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="mt-2 block text-xl font-bold text-[var(--dashboard-text)] underline decoration-[var(--dashboard-accent)] underline-offset-4"
                      >
                        {job.articleTitleSnapshot}
                      </Link>
                      <p className="mt-2 break-all text-sm text-[var(--dashboard-subtle)]">{job.postUrlSnapshot}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={formatLabel(job.status)} tone={toneForStatus(job.status)} />
                      <StatusBadge
                        label={`${job.sourceImages.length} images`}
                        tone="neutral"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Review job
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Queue
              </p>
              <h2 className="mt-2 text-xl font-bold">Jobs waiting on review</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <QueueRow label="New intake" value={String(inboxJobs.filter((job) => job.status === "RECEIVED").length)} />
                <QueueRow label="Reviewing" value={String(inboxJobs.filter((job) => job.status === "REVIEWING").length)} />
                <QueueRow label="Ready to generate" value={String(inboxJobs.filter((job) => job.status === "READY_FOR_GENERATION").length)} />
                <QueueRow label="Failed" value={String(inboxJobs.filter((job) => job.status === "FAILED").length)} />
              </div>
            </div>
            <div className="rounded-[28px] bg-[linear-gradient(145deg,#0d5fff_0%,#2c7fff_100%)] p-5 text-white shadow-[var(--dashboard-shadow-accent)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Jobs board</p>
              <h2 className="mt-2 text-xl font-bold">See the full workflow</h2>
              <Link
                href="/dashboard/jobs"
                className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--dashboard-accent)]"
              >
                Open jobs board
              </Link>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}

function InboxMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "good" | "warning" | "bad";
}) {
  const className =
    tone === "good"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : tone === "warning"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : tone === "bad"
          ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]";

  return (
    <span className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}>
      {label}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function toneForStatus(status: string) {
  if (status === "FAILED") {
    return "bad" as const;
  }
  if (status === "READY_FOR_GENERATION") {
    return "good" as const;
  }
  if (status === "RECEIVED" || status === "REVIEWING") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function QueueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-3">
      <span className="font-semibold text-[var(--dashboard-text)]">{label}</span>
      <span className="text-[var(--dashboard-subtle)]">{value}</span>
    </div>
  );
}

