import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import {
  getEffectivePublerAllowedDomainsForUserId,
  getIntegrationSettingsSummary,
} from "@/lib/settings/integrationSettings";
import {
  buildPostPulseSummary,
  filterPostPulseRecords,
  listPostPulseRecordsForUser,
  normalizePostPulseFilter,
  normalizePostPulseSort,
  sortPostPulseRecords,
  type PostPulseActivityDotState,
  type PostPulseFilter,
  type PostPulseSort,
  type PostPulseStatus,
} from "@/lib/dashboard/postPulse";
import { PostPulseWorkspaceControls } from "@/app/dashboard/post-pulse/PostPulseWorkspaceControls";

export default async function DashboardPostPulsePage({
  searchParams,
}: {
  searchParams?: Promise<{ workspaceId?: string; filter?: string; sort?: string }>;
}) {
  const databaseReady = isDatabaseConfigured();
  const user = databaseReady ? await getOrCreateDashboardUser() : null;
  const resolvedSearchParams = (await searchParams) ?? {};
  const settings = user ? await getIntegrationSettingsSummary() : null;
  const selectedWorkspaceId =
    resolvedSearchParams.workspaceId?.trim() || settings?.publerWorkspaceId || "";
  const allowedDomains = user ? await getEffectivePublerAllowedDomainsForUserId(user.id) : [];
  const selectedFilter = normalizePostPulseFilter(resolvedSearchParams.filter);
  const selectedSort = normalizePostPulseSort(resolvedSearchParams.sort);
  const baseRecords = user
    ? await listPostPulseRecordsForUser(user.id, {
        workspaceId: selectedWorkspaceId,
        allowedDomains,
      })
    : [];
  const summary = buildPostPulseSummary(baseRecords);
  const records = sortPostPulseRecords(
    filterPostPulseRecords(baseRecords, selectedFilter),
    selectedSort,
  );
  const latestSyncAt =
    baseRecords.reduce<Date | null>(
      (latest, record) =>
        !record.lastSyncedAt || (latest && latest > record.lastSyncedAt)
          ? latest
          : record.lastSyncedAt,
      null,
    ) ?? null;

  return (
    <div className="space-y-6 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Posts tracked" value={String(summary.postsTracked)} />
        <MetricCard
          label="Needs fresh pins"
          value={String(summary.needsFreshPins)}
          tone="warning"
        />
        <MetricCard
          label="In progress"
          value={String(summary.scheduledInFlight)}
          tone="info"
        />
        <MetricCard label="Fresh" value={String(summary.fresh)} tone="success" />
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet. Post Pulse will appear once the database is connected.
        </div>
      ) : (
        <section className="rounded-[32px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-md)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Post Tracker
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                Publishing freshness by article
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-[var(--dashboard-subtle)]">
                Publer is the source of truth here. Posts stay in progress while any scheduled pins remain in queue. Once the queue is clear, the latest published pin decides whether the post is still fresh or needs new pins.
              </p>
              <p className="mt-2 text-sm text-[var(--dashboard-muted)]">
                {latestSyncAt
                  ? `Last Publer sync ${formatRelativeTime(latestSyncAt)}`
                  : "No Publer sync yet. Sync to import scheduled and published pins."}
              </p>
              <p className="mt-2 text-sm text-[var(--dashboard-muted)]">
                {selectedWorkspaceId
                  ? "The table is currently scoped to the selected Publer workspace."
                  : "Choose a Publer workspace to sync and review activity for that workspace."}
              </p>
              {allowedDomains.length > 0 ? (
                <p className="mt-2 text-sm text-[var(--dashboard-muted)]">
                  Showing first-party domains only: {allowedDomains.join(", ")}.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="rounded-2xl border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-3 text-sm text-[var(--dashboard-warning-ink)]">
                {summary.needsFreshPins} post{summary.needsFreshPins === 1 ? "" : "s"} currently need fresh pins.
              </div>
              <PostPulseWorkspaceControls
                initialWorkspaceId={selectedWorkspaceId}
                initialFilter={selectedFilter}
                initialSort={selectedSort}
              />
            </div>
          </div>

          {records.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-sm text-[var(--dashboard-subtle)]">
              No tracked posts yet. Sync Publer activity or generate pins in Studio to start building post-level history.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]">
              <table className="min-w-full table-fixed divide-y divide-[var(--dashboard-line)] text-sm">
                <thead className="bg-[var(--dashboard-panel-alt)] text-left uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                  <tr>
                    <th className="w-[34%] px-5 py-4">Post</th>
                    <th className="w-[9%] px-5 py-4">Generated</th>
                    <th className="w-[16%] px-5 py-4">Publer activity</th>
                    <th className="w-[20%] px-5 py-4">Latest activity</th>
                    <th className="w-[12%] px-5 py-4">Freshness</th>
                    <th className="w-[9%] px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--dashboard-line)]">
                  {records.map((record) => (
                    <tr key={record.postId}>
                      <td className="px-5 py-4 align-top">
                        <p
                          className="font-semibold text-[var(--dashboard-text)]"
                          style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                          }}
                        >
                          {record.title}
                        </p>
                        <p className="mt-1 break-all text-[var(--dashboard-subtle)]">{record.url}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                          {record.domain} · {record.totalJobs} job{record.totalJobs === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top font-semibold">
                        {record.totalGeneratedPins}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-[var(--dashboard-text)]">
                          {record.publishedCount} published · {record.scheduledCount} scheduled
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {record.recentActivityDots.length > 0 ? (
                            record.recentActivityDots.map((state, index) => (
                              <ActivityDot key={`${record.postId}-${index}`} state={state} />
                            ))
                          ) : (
                            <span className="text-[var(--dashboard-muted)]">No Publer activity yet</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-[var(--dashboard-text)]">
                          {record.lastPublishedAt
                            ? `Published ${formatDate(record.lastPublishedAt)}`
                            : "No published pin yet"}
                        </p>
                        <p className="mt-1 text-[var(--dashboard-subtle)]">
                          {record.lastPublishedAt
                            ? record.freshnessAgeDays === null
                              ? "Latest live pin date unavailable"
                              : `${record.freshnessAgeDays} day${record.freshnessAgeDays === 1 ? "" : "s"} ago`
                            : "No live publish yet"}
                        </p>
                        <p className="mt-2 text-[var(--dashboard-subtle)]">
                          {record.lastScheduledAt
                            ? `Scheduled ${formatDate(record.lastScheduledAt)}`
                            : record.scheduledCount > 0
                              ? "Scheduled date unavailable"
                              : "No pending schedule"}
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
                                className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
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
                            <span className="text-[var(--dashboard-muted)]">No Studio job yet</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  tone?: "neutral" | "warning" | "success" | "info";
}) {
  const className =
    tone === "warning"
      ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
      : tone === "success"
        ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
        : tone === "info"
          ? "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] text-[var(--dashboard-accent-strong)]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-[var(--dashboard-text)]";

  return (
    <div className={`rounded-[28px] border p-5 shadow-[var(--dashboard-shadow-sm)] ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: PostPulseStatus }) {
  const className =
    status === "fresh"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : status === "needs_fresh_pins"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : status === "scheduled_in_flight"
          ? "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] text-[var(--dashboard-accent-strong)]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}>
      {formatStatus(status)}
    </span>
  );
}

function ActivityDot({ state }: { state: PostPulseActivityDotState }) {
  const className =
    state === "published"
      ? "bg-[var(--dashboard-success)]"
      : state === "scheduled"
        ? "dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)]"
        : "bg-[var(--dashboard-line-strong,#cfd5e3)]";

  return <span className={`h-2.5 w-2.5 rounded-full ${className}`} />;
}

function formatStatus(value: PostPulseStatus) {
  switch (value) {
    case "needs_fresh_pins":
      return "Needs fresh pins";
    case "scheduled_in_flight":
      return "In progress";
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

function formatRelativeTime(value: Date) {
  const days = Math.floor((Date.now() - value.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) {
    return "today";
  }
  if (days === 1) {
    return "1 day ago";
  }
  return `${days} days ago`;
}

