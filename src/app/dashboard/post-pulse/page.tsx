import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
} from "@/lib/settings/integrationSettings";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import {
  buildPostPulseSummary,
  filterPostPulseRecords,
  listPostPulseRecordsForUser,
  normalizePostPulseFilter,
  normalizePostPulseSort,
  sortPostPulseRecords,
  type PostPulseActivityDotState,
  type PostPulseStatus,
} from "@/lib/dashboard/postPulse";
import { PostPulseWorkspaceControls } from "@/app/dashboard/post-pulse/PostPulseWorkspaceControls";
import { PostPulseFreshPinsButton } from "@/app/dashboard/post-pulse/PostPulseFreshPinsButton";

export default async function DashboardPostPulsePage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; sort?: string }>;
}) {
  const databaseReady = isDatabaseConfigured();
  const user = databaseReady ? await getOrCreateDashboardUser() : null;
  const resolvedSearchParams = (await searchParams) ?? {};
  const settings = user ? await getIntegrationSettingsSummary() : null;
  const selectedWorkspaceId = await getDashboardWorkspaceScope(settings?.publerWorkspaceId || "");
  const allowedDomains = user
    ? await getWorkspaceAllowedDomainsForUserId(user.id, selectedWorkspaceId)
    : [];
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
    <div className="space-y-5 text-[var(--dashboard-text)]">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
          <SummaryChip label="Tracked" value={summary.postsTracked} />
          <SummaryChip label="Needs fresh pins" value={summary.needsFreshPins} tone="warning" />
          <SummaryChip label="In progress" value={summary.scheduledInFlight} tone="info" />
          <SummaryChip label="Fresh" value={summary.fresh} tone="success" />
        </div>
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet.
        </div>
      ) : (
        <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-[var(--dashboard-panel-alt)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold">Publishing freshness by article</h2>
              <span className="rounded-full border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-warning-ink)]">
                {summary.needsFreshPins} need fresh pins
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                {latestSyncAt ? `Last sync ${formatRelativeTime(latestSyncAt)}` : "No sync yet"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PostPulseWorkspaceControls
                workspaceId={selectedWorkspaceId}
                initialFilter={selectedFilter}
                initialSort={selectedSort}
              />
            </div>
          </div>

          {records.length === 0 ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-sm text-[var(--dashboard-subtle)]">
              No tracked posts yet.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]">
              <table className="min-w-full table-fixed divide-y divide-[var(--dashboard-line)] text-sm">
                <thead className="bg-[var(--dashboard-panel-strong)] text-left uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                  <tr>
                    <th className="w-[34%] px-4 py-3 text-[11px]">Post</th>
                    <th className="w-[9%] px-4 py-3 text-[11px]">Generated</th>
                    <th className="w-[16%] px-4 py-3 text-[11px]">Publer activity</th>
                    <th className="w-[20%] px-4 py-3 text-[11px]">Latest activity</th>
                    <th className="w-[12%] px-4 py-3 text-[11px]">Freshness</th>
                    <th className="w-[9%] px-4 py-3 text-[11px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--dashboard-line)]">
                  {records.map((record) => (
                    <tr key={record.postId}>
                      <td className="px-4 py-4 align-top">
                        <a
                          href={toExternalHref(record.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="block transition hover:text-[var(--dashboard-accent-strong)]"
                        >
                          <p
                            className="text-sm font-semibold text-[var(--dashboard-text)] underline decoration-transparent underline-offset-4 transition hover:decoration-current"
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden",
                            }}
                          >
                            {record.title}
                          </p>
                        </a>
                        <p className="mt-1 line-clamp-1 break-all text-xs text-[var(--dashboard-subtle)]">
                          {record.url}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                          {record.domain} / {record.totalJobs} job{record.totalJobs === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top font-semibold">
                        {record.totalGeneratedPins}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-[var(--dashboard-text)]">
                          {record.publishedCount} published / {record.scheduledCount} scheduled
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
                      <td className="px-4 py-4 align-top">
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
                      <td className="px-4 py-4 align-top">
                        <StatusPill status={record.freshnessStatus} />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {record.freshnessStatus === "needs_fresh_pins" && record.latestJobId ? (
                            <>
                              <PostPulseFreshPinsButton postId={record.postId} />
                              <Link
                                href={`/dashboard/jobs/${record.latestJobId}`}
                                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                              >
                                Open latest job
                              </Link>
                            </>
                          ) : record.latestJobId ? (
                            <>
                              <Link
                                href={`/dashboard/jobs/${record.latestJobId}`}
                                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
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

function SummaryChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
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
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</span>
      <span className="text-sm font-black">{value}</span>
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
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function ActivityDot({ state }: { state: PostPulseActivityDotState }) {
  const className =
    state === "published"
      ? "bg-[var(--dashboard-success)]"
      : state === "scheduled"
        ? "dashboard-accent-action bg-[var(--dashboard-accent)]"
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

function toExternalHref(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}
