import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { filterByAllowedDomains } from "@/lib/dashboard/domainScope";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import { getEffectivePublerAllowedDomainsForUserId } from "@/lib/settings/integrationSettings";

export default async function DashboardJobsPage() {
  await requireAuthenticatedDashboardUser();
  const databaseReady = isDatabaseConfigured();
  const user = databaseReady ? await getOrCreateDashboardUser() : null;
  const [allJobs, allowedDomains] = user
    ? await Promise.all([
        listJobsForUser(user.id),
        getEffectivePublerAllowedDomainsForUserId(user.id),
      ])
    : [[], []];
  const jobs = filterByAllowedDomains(allJobs, (job) => job.domainSnapshot, allowedDomains);

  const totals = {
    total: jobs.length,
    review: jobs.filter((job) =>
      ["RECEIVED", "REVIEWING", "READY_FOR_GENERATION"].includes(job.status),
    ).length,
    generated: jobs.filter((job) =>
      ["PINS_GENERATED", "MEDIA_UPLOADED", "TITLES_GENERATED", "READY_TO_SCHEDULE", "COMPLETED", "FAILED"].includes(
        job.status,
      ),
    ).length,
    scheduled: jobs.filter((job) => job.scheduleRuns[0]?.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
        {!databaseReady ? (
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
            `DATABASE_URL` is not configured yet. Jobs will appear after the database is connected
            and migrated.
          </div>
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-4">
              <SummaryCard label="Total jobs" value={String(totals.total)} />
              <SummaryCard label="In review" value={String(totals.review)} />
              <SummaryCard label="Pins generated" value={String(totals.generated)} />
              <SummaryCard label="Scheduled runs" value={String(totals.scheduled)} />
            </section>

            <section className="space-y-4">
              {jobs.length === 0 ? (
                <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-sm text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
                  No intake jobs yet.
                </div>
              ) : (
                jobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="text-xl font-bold text-[var(--dashboard-text)] underline decoration-[var(--dashboard-accent)] underline-offset-4"
                        >
                          {job.articleTitleSnapshot}
                        </Link>
                        <p className="mt-2 break-all text-sm text-[var(--dashboard-subtle)]">{job.postUrlSnapshot}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                          Created {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusChip label={formatLabel(job.status)} tone={toneForStatus(job.status)} />
                        <StatusChip
                          label={formatLabel(job.scheduleRuns[0]?.status ?? "NOT_STARTED")}
                          tone={toneForStatus(job.scheduleRuns[0]?.status ?? "NOT_STARTED")}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <InfoTile label="Domain" value={job.domainSnapshot} />
                      <InfoTile label="Source images" value={String(job.sourceImages.length)} />
                      <InfoTile label="Generated pins" value={String(job.generatedPins.length)} />
                      <InfoTile
                        label="Schedule"
                        value={formatLabel(job.scheduleRuns[0]?.status ?? "Not started")}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                      >
                        Open job
                      </Link>
                      {job.generatedPins.length > 0 ? (
                        <Link
                          href={`/dashboard/jobs/${job.id}/publish`}
                          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                        >
                          Open publishing
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--dashboard-panel-alt)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "neutral" | "good" | "warning" | "bad" }) {
  const className =
    tone === "good"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : tone === "warning"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : tone === "bad"
          ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]";

  return (
    <span className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
      {label}
    </span>
  );
}

function toneForStatus(status: string) {
  if (["COMPLETED", "SCHEDULED", "MEDIA_UPLOADED", "READY_TO_SCHEDULE"].includes(status)) {
    return "good" as const;
  }
  if (status === "FAILED") {
    return "bad" as const;
  }
  if (["REVIEWING", "READY_FOR_GENERATION", "PINS_GENERATED", "TITLES_GENERATED", "DESCRIPTIONS_GENERATED", "SUBMITTING"].includes(status)) {
    return "warning" as const;
  }
  return "neutral" as const;
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

