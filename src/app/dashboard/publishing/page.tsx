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

export default async function DashboardPublishingPage() {
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

  const readyToPublish = jobs.filter((job) =>
    ["PINS_GENERATED", "MEDIA_UPLOADED", "TITLES_GENERATED", "DESCRIPTIONS_GENERATED", "READY_TO_SCHEDULE"].includes(job.status),
  );
  const scheduled = jobs.filter((job) => job.scheduleRuns[0]?.status === "COMPLETED");
  const failed = jobs.filter(
    (job) => job.status === "FAILED" || job.scheduleRuns[0]?.status === "FAILED",
  );
  const cycleMetaByJobId = buildCycleMetaByJobId(jobs);
  const publishingRows = [
    ...readyToPublish.map((job) => ({
      id: job.id,
      postId: job.postId,
      title: job.articleTitleSnapshot,
      domain: job.domainSnapshot,
      createdAt: job.createdAt,
      lane: "Ready",
      jobStatus: formatLabel(job.status),
      scheduleStatus: formatLabel(job.scheduleRuns[0]?.status ?? "NOT_STARTED"),
      generatedPins: job.generatedPins.length,
    })),
    ...scheduled.map((job) => ({
      id: job.id,
      postId: job.postId,
      title: job.articleTitleSnapshot,
      domain: job.domainSnapshot,
      createdAt: job.createdAt,
      lane: "Scheduled",
      jobStatus: formatLabel(job.status),
      scheduleStatus: formatLabel(job.scheduleRuns[0]?.status ?? "COMPLETED"),
      generatedPins: job.generatedPins.length,
    })),
    ...failed.map((job) => ({
      id: job.id,
      postId: job.postId,
      title: job.articleTitleSnapshot,
      domain: job.domainSnapshot,
      createdAt: job.createdAt,
      lane: "Failed",
      jobStatus: formatLabel(job.status),
      scheduleStatus: formatLabel(job.scheduleRuns[0]?.status ?? job.status),
      generatedPins: job.generatedPins.length,
    })),
  ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return (
    <div className="space-y-6 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-3">
        <PublishingMetric label="Ready" value={String(readyToPublish.length)} />
        <PublishingMetric label="Scheduled" value={String(scheduled.length)} />
        <PublishingMetric label="Failed" value={String(failed.length)} />
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet. Publishing summaries will appear once the database is connected.
        </div>
      ) : (
        <section className="space-y-4">
          {publishingRows.length === 0 ? (
            <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-sm text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
              No publishing jobs yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full table-fixed">
                  <thead className="bg-[var(--dashboard-panel-alt)]">
                    <tr className="text-left">
                      <PublishingHead className="w-[34%]">Post</PublishingHead>
                      <PublishingHead className="w-[11%]">Domain</PublishingHead>
                      <PublishingHead className="w-[10%]">Created</PublishingHead>
                      <PublishingHead className="w-[8%]">Cycle</PublishingHead>
                      <PublishingHead className="w-[8%]">Pins</PublishingHead>
                      <PublishingHead className="w-[10%]">Lane</PublishingHead>
                      <PublishingHead className="w-[11%]">Job status</PublishingHead>
                      <PublishingHead className="w-[11%]">Schedule</PublishingHead>
                      <PublishingHead className="w-[12%]">Actions</PublishingHead>
                    </tr>
                  </thead>
                  <tbody>
                    {publishingRows.map((job, index) => (
                      <tr
                        key={`${job.id}-${job.lane}`}
                        className={index === publishingRows.length - 1 ? "" : "border-b border-[var(--dashboard-line)]"}
                      >
                        <td className="px-5 py-5 align-top">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-base font-bold text-[var(--dashboard-text)]">
                              {job.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.domain}</p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                            {job.createdAt.toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <CycleCell meta={cycleMetaByJobId.get(job.id)} />
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.generatedPins}</p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <LaneChip label={job.lane} />
                        </td>
                        <td className="px-5 py-5 align-top">
                          <QueueStatus label={job.jobStatus} tone={toneForStatus(job.jobStatus)} />
                        </td>
                        <td className="px-5 py-5 align-top">
                          <QueueStatus label={job.scheduleStatus} tone={toneForStatus(job.scheduleStatus)} />
                        </td>
                        <td className="px-5 py-5 align-top">
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/dashboard/jobs/${job.id}/publish`}
                              className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-center text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                            >
                              Open publishing
                            </Link>
                            <Link
                              href={`/dashboard/jobs/${job.id}`}
                              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-center text-sm font-semibold text-[var(--dashboard-subtle)]"
                            >
                              Open job
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function PublishingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function PublishingHead({ children, className = "" }: { children: string; className?: string }) {
  return (
    <th
      className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)] ${className}`}
    >
      {children}
    </th>
  );
}

function CycleCell({ meta }: { meta: { index: number; total: number; isLatest: boolean } | undefined }) {
  if (!meta) {
    return <p className="text-sm text-[var(--dashboard-subtle)]">1 / 1</p>;
  }

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--dashboard-text)]">
        {meta.index} / {meta.total}
      </p>
      <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">{meta.isLatest ? "Latest" : "Earlier"}</p>
    </div>
  );
}

function buildCycleMetaByJobId(
  jobs: Array<{
    id: string;
    postId: string;
    createdAt: Date;
  }>,
) {
  const grouped = new Map<string, typeof jobs>();

  for (const job of jobs) {
    const existing = grouped.get(job.postId) ?? [];
    existing.push(job);
    grouped.set(job.postId, existing);
  }

  const result = new Map<string, { index: number; total: number; isLatest: boolean }>();

  for (const group of grouped.values()) {
    const ordered = [...group].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    const total = ordered.length;

    ordered.forEach((job, index) => {
      result.set(job.id, {
        index: index + 1,
        total,
        isLatest: index === total - 1,
      });
    });
  }

  return result;
}

function LaneChip({ label }: { label: string }) {
  const className =
    label === "Failed"
      ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
      : label === "Scheduled"
        ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
        : "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]";

  return (
    <span className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}>
      {label}
    </span>
  );
}

function QueueStatus({
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
  const normalized = status.toUpperCase().replaceAll(" ", "_");
  if (["COMPLETED", "SCHEDULED", "MEDIA_UPLOADED", "READY_TO_SCHEDULE"].includes(normalized)) {
    return "good" as const;
  }
  if (normalized === "FAILED") {
    return "bad" as const;
  }
  if (["REVIEWING", "READY_FOR_GENERATION", "PINS_GENERATED", "TITLES_GENERATED", "DESCRIPTIONS_GENERATED", "NOT_STARTED"].includes(normalized)) {
    return "warning" as const;
  }
  return "neutral" as const;
}
