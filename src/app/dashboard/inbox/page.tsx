import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";

const inboxStatuses = new Set(["RECEIVED", "REVIEWING", "READY_FOR_GENERATION", "FAILED"]);

export default async function DashboardInboxPage() {
  const databaseReady = isDatabaseConfigured();
  const user = databaseReady ? await getOrCreateDashboardUser() : null;
  const jobs = user ? await listJobsForUser(user.id) : [];
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
          `DATABASE_URL` is not configured yet. Inbox jobs will appear after the database is connected.
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
                Review sequence
              </p>
              <h2 className="mt-2 text-xl font-bold">Move jobs cleanly into generation</h2>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--dashboard-subtle)]">
                <li>1. Open new intake jobs and confirm the best source images.</li>
                <li>2. Save keywords, tone hints, and preferred visuals before planning.</li>
                <li>3. Create assisted or manual plans, then generate pins when they are ready.</li>
                <li>4. Hand off generated pins to the publishing queue for upload and scheduling.</li>
              </ol>
            </div>
            <div className="rounded-[28px] bg-[linear-gradient(145deg,#0d5fff_0%,#2c7fff_100%)] p-5 text-white shadow-[var(--dashboard-shadow-accent)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Jobs board</p>
              <h2 className="mt-2 text-xl font-bold">Need broader workflow context?</h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Switch to the full jobs workspace to compare review work with generated and published jobs.
              </p>
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

