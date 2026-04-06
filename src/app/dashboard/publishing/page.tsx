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
import { DashboardPublishingTableControls } from "@/app/dashboard/publishing/DashboardPublishingTableControls";

type PublishingSearchParams = {
  query?: string | string[];
  lane?: string | string[];
  sort?: string | string[];
};

export default async function DashboardPublishingPage({
  searchParams,
}: {
  searchParams?: Promise<PublishingSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedQuery = firstSearchParam(resolvedSearchParams.query).trim();
  const selectedLane = normalizePublishingLaneFilter(firstSearchParam(resolvedSearchParams.lane));
  const selectedSort = normalizePublishingSort(firstSearchParam(resolvedSearchParams.sort));
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
  const allPublishingRows = [
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
  ];
  const publishingRows = sortPublishingRows(
    filterPublishingRows(allPublishingRows, {
      query: selectedQuery,
      lane: selectedLane,
    }),
    selectedSort,
  );

  return (
    <div className="space-y-5 text-[var(--dashboard-text)]">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
          <SummaryChip label="Ready" value={readyToPublish.length} />
          <SummaryChip label="Scheduled" value={scheduled.length} />
          <SummaryChip label="Failed" value={failed.length} />
        </div>
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet. Publishing summaries will appear once the database is connected.
        </div>
      ) : (
        <section className="space-y-4">
          {publishingRows.length === 0 ? (
            <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-sm text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
              {allPublishingRows.length === 0 ? "No publishing jobs yet." : "No publishing jobs match the current filters."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
              <div className="border-b border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-4 py-3">
                <DashboardPublishingTableControls
                  initialQuery={selectedQuery}
                  initialLane={selectedLane}
                  initialSort={selectedSort}
                  totalCount={allPublishingRows.length}
                  filteredCount={publishingRows.length}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full table-fixed">
                  <thead className="bg-[var(--dashboard-panel-strong)]">
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
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-bold text-[var(--dashboard-text)]">
                              {job.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.domain}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                            {job.createdAt.toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <CycleCell meta={cycleMetaByJobId.get(job.id)} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.generatedPins}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <LaneChip label={job.lane} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <QueueStatus label={job.jobStatus} tone={toneForStatus(job.jobStatus)} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <QueueStatus label={job.scheduleStatus} tone={toneForStatus(job.scheduleStatus)} />
                        </td>
                        <td className="px-4 py-4 align-top">
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

type PublishingLaneFilter = "all" | "ready" | "scheduled" | "failed";
type PublishingSort = "newest" | "oldest" | "title" | "pins_desc";

function filterPublishingRows<
  T extends {
    title: string;
    domain: string;
    lane: string;
    jobStatus: string;
    scheduleStatus: string;
  },
>(rows: T[], input: { query: string; lane: PublishingLaneFilter }) {
  const query = input.query.toLowerCase();
  return rows.filter((row) => {
    const matchesQuery =
      query === "" ||
      row.title.toLowerCase().includes(query) ||
      row.domain.toLowerCase().includes(query) ||
      row.jobStatus.toLowerCase().includes(query) ||
      row.scheduleStatus.toLowerCase().includes(query);
    const matchesLane = input.lane === "all" ? true : row.lane.toLowerCase() === input.lane;
    return matchesQuery && matchesLane;
  });
}

function sortPublishingRows<
  T extends {
    title: string;
    createdAt: Date;
    generatedPins: number;
  },
>(rows: T[], sort: PublishingSort) {
  const next = [...rows];
  next.sort((left, right) => {
    if (sort === "oldest") {
      return left.createdAt.getTime() - right.createdAt.getTime();
    }
    if (sort === "title") {
      return left.title.localeCompare(right.title);
    }
    if (sort === "pins_desc") {
      return right.generatedPins - left.generatedPins || right.createdAt.getTime() - left.createdAt.getTime();
    }
    return right.createdAt.getTime() - left.createdAt.getTime();
  });
  return next;
}

function normalizePublishingLaneFilter(value: string): PublishingLaneFilter {
  if (value === "ready" || value === "scheduled" || value === "failed") {
    return value;
  }
  return "all";
}

function normalizePublishingSort(value: string): PublishingSort {
  if (value === "oldest" || value === "title" || value === "pins_desc") {
    return value;
  }
  return "newest";
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-text)]">
      {label}: {value}
    </span>
  );
}

function PublishingHead({ children, className = "" }: { children: string; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)] ${className}`}
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
    <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${className}`}>
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
    <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${className}`}>
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
