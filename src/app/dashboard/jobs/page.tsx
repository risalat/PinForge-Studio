import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { filterByAllowedDomains } from "@/lib/dashboard/domainScope";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
} from "@/lib/settings/integrationSettings";
import { DashboardJobsTableControls } from "@/app/dashboard/jobs/DashboardJobsTableControls";

type JobsSearchParams = {
  query?: string | string[];
  status?: string | string[];
  sort?: string | string[];
};

export default async function DashboardJobsPage({
  searchParams,
}: {
  searchParams?: Promise<JobsSearchParams>;
}) {
  await requireAuthenticatedDashboardUser();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedQuery = firstSearchParam(resolvedSearchParams.query).trim();
  const selectedStatus = normalizeJobStatusFilter(firstSearchParam(resolvedSearchParams.status));
  const selectedSort = normalizeJobSort(firstSearchParam(resolvedSearchParams.sort));
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
  const allScopedJobs = filterByAllowedDomains(allJobs, (job) => job.domainSnapshot, allowedDomains);
  const jobs = sortJobs(
    filterJobs(allScopedJobs, {
      query: selectedQuery,
      status: selectedStatus,
    }),
    selectedSort,
  );
  const cycleMetaByJobId = buildCycleMetaByJobId(allScopedJobs);

  const totals = {
    total: allScopedJobs.length,
    review: allScopedJobs.filter((job) =>
      ["RECEIVED", "REVIEWING", "READY_FOR_GENERATION"].includes(job.status),
    ).length,
    generated: allScopedJobs.filter((job) =>
      ["PINS_GENERATED", "MEDIA_UPLOADED", "TITLES_GENERATED", "READY_TO_SCHEDULE", "COMPLETED", "FAILED"].includes(
        job.status,
      ),
    ).length,
    scheduled: allScopedJobs.filter((job) => job.scheduleRuns[0]?.status === "COMPLETED").length,
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
                  {allScopedJobs.length === 0 ? "No intake jobs yet." : "No jobs match the current filters."}
                </div>
              ) : (
                <div className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
                  <div className="border-b border-[var(--dashboard-line)] px-5 py-4">
                    <DashboardJobsTableControls
                      initialQuery={selectedQuery}
                      initialStatus={selectedStatus}
                      initialSort={selectedSort}
                      totalCount={allScopedJobs.length}
                      filteredCount={jobs.length}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[1080px] w-full table-fixed">
                      <thead className="bg-[var(--dashboard-panel-alt)]">
                        <tr className="text-left">
                          <TableHead className="w-[34%]">Post</TableHead>
                          <TableHead className="w-[11%]">Domain</TableHead>
                        <TableHead className="w-[12%]">Created</TableHead>
                        <TableHead className="w-[8%]">Cycle</TableHead>
                        <TableHead className="w-[8%]">Images</TableHead>
                        <TableHead className="w-[8%]">Pins</TableHead>
                        <TableHead className="w-[10%]">Job status</TableHead>
                        <TableHead className="w-[10%]">Schedule</TableHead>
                        <TableHead className="w-[14%]">Actions</TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job, index) => (
                          <tr
                            key={job.id}
                            className={index === jobs.length - 1 ? "" : "border-b border-[var(--dashboard-line)]"}
                          >
                            <td className="px-5 py-5 align-top">
                              <div className="min-w-0">
                                <Link
                                  href={`/dashboard/jobs/${job.id}`}
                                  className="line-clamp-2 text-lg font-bold text-[var(--dashboard-text)] underline decoration-[var(--dashboard-accent)] underline-offset-4"
                                >
                                  {job.articleTitleSnapshot}
                                </Link>
                                <p className="mt-2 break-all text-sm text-[var(--dashboard-subtle)]">
                                  {job.postUrlSnapshot}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-5 align-top">
                              <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.domainSnapshot}</p>
                            </td>
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">
                            {new Date(job.createdAt).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <CycleCell meta={cycleMetaByJobId.get(job.id)} />
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                            {job.sourceImages.length}
                              </p>
                            </td>
                            <td className="px-5 py-5 align-top">
                              <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                                {job.generatedPins.length}
                              </p>
                            </td>
                            <td className="px-5 py-5 align-top">
                              <StatusChip label={formatLabel(job.status)} tone={toneForStatus(job.status)} />
                            </td>
                            <td className="px-5 py-5 align-top">
                              <StatusChip
                                label={formatLabel(job.scheduleRuns[0]?.status ?? "NOT_STARTED")}
                                tone={toneForStatus(job.scheduleRuns[0]?.status ?? "NOT_STARTED")}
                              />
                            </td>
                            <td className="px-5 py-5 align-top">
                              <div className="flex flex-col gap-2">
                                <Link
                                  href={`/dashboard/jobs/${job.id}`}
                                  className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-center text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                                >
                                  Open job
                                </Link>
                                {job.generatedPins.length > 0 ? (
                                  <Link
                                    href={`/dashboard/jobs/${job.id}/publish`}
                                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-center text-sm font-semibold text-[var(--dashboard-subtle)]"
                                  >
                                    Open publishing
                                  </Link>
                                ) : null}
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

type JobStatusFilter = "all" | "in_review" | "generated" | "scheduled" | "failed" | "completed";
type JobSort = "newest" | "oldest" | "title" | "pins_desc";

function filterJobs<
  T extends {
    articleTitleSnapshot: string;
    postUrlSnapshot: string;
    domainSnapshot: string;
    status: string;
    scheduleRuns: Array<{ status: string }>;
  },
>(jobs: T[], input: { query: string; status: JobStatusFilter }) {
  const query = input.query.toLowerCase();
  return jobs.filter((job) => {
    const matchesQuery =
      query === "" ||
      job.articleTitleSnapshot.toLowerCase().includes(query) ||
      job.postUrlSnapshot.toLowerCase().includes(query) ||
      job.domainSnapshot.toLowerCase().includes(query);

    const scheduleStatus = job.scheduleRuns[0]?.status ?? "NOT_STARTED";
    const matchesStatus =
      input.status === "all"
        ? true
        : input.status === "in_review"
          ? ["RECEIVED", "REVIEWING", "READY_FOR_GENERATION"].includes(job.status)
          : input.status === "generated"
            ? ["PINS_GENERATED", "MEDIA_UPLOADED", "TITLES_GENERATED", "DESCRIPTIONS_GENERATED", "READY_TO_SCHEDULE"].includes(job.status)
            : input.status === "scheduled"
              ? scheduleStatus === "COMPLETED"
              : input.status === "failed"
                ? job.status === "FAILED" || scheduleStatus === "FAILED"
                : job.status === "COMPLETED";

    return matchesQuery && matchesStatus;
  });
}

function sortJobs<
  T extends {
    articleTitleSnapshot: string;
    createdAt: Date;
    generatedPins: Array<unknown>;
  },
>(jobs: T[], sort: JobSort) {
  const next = [...jobs];
  next.sort((left, right) => {
    if (sort === "oldest") {
      return left.createdAt.getTime() - right.createdAt.getTime();
    }
    if (sort === "title") {
      return left.articleTitleSnapshot.localeCompare(right.articleTitleSnapshot);
    }
    if (sort === "pins_desc") {
      return right.generatedPins.length - left.generatedPins.length || right.createdAt.getTime() - left.createdAt.getTime();
    }
    return right.createdAt.getTime() - left.createdAt.getTime();
  });
  return next;
}

function normalizeJobStatusFilter(value: string): JobStatusFilter {
  if (value === "in_review" || value === "generated" || value === "scheduled" || value === "failed" || value === "completed") {
    return value;
  }
  return "all";
}

function normalizeJobSort(value: string): JobSort {
  if (value === "oldest" || value === "title" || value === "pins_desc") {
    return value;
  }
  return "newest";
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
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

function TableHead({ children, className = "" }: { children: string; className?: string }) {
  return (
    <th
      className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)] ${className}`}
    >
      {children}
    </th>
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

