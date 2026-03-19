"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SnoozeFreshTargetButton } from "@/app/dashboard/SnoozeFreshTargetButton";
import type { WorkspaceSitemapFilter } from "@/lib/dashboard/workspaceSitemaps";
import type { WorkflowJobListItem } from "@/lib/jobs/generatePins";

export type DashboardOverviewTab = "priority" | "opportunities" | "queue";

type QueueCapacitySummary = {
  todayScheduledCount: number;
  targetPerDay: number;
  todayDate: string;
  nextAvailableDate: string | null;
  upcomingDays: Array<{
    date: string;
    scheduledCount: number;
    remainingCapacity: number;
    isFull: boolean;
    isToday: boolean;
  }>;
} | null;

type DashboardOverviewData = {
  postsProcessed: number;
  pinsGenerated: number;
  readyToSchedule: number;
  postsNeedingFreshPins: number;
  queueCapacity: QueueCapacitySummary;
  todaysFreshTargets: Array<{
    postId: string;
    title: string;
    url: string;
    domain: string;
    latestJobId: string | null;
    lastPublishedAt: Date | null;
    freshnessAgeDays: number | null;
    totalJobs: number;
    workspaceId: string;
  }>;
  queuedFreshTargetCount: number;
  untrackedSitemapArticles: {
    configured: boolean;
    sitemapUrls: string[];
    totalArticles: number;
    totalUntracked: number;
    totalMatching: number;
    page: number;
    pageSize: number;
    totalPages: number;
    query: string;
    filter: WorkspaceSitemapFilter;
    articles: Array<{
      normalizedUrl: string;
      titleGuess: string;
      url: string;
      domain: string;
      lastModifiedAt: Date | null;
    }>;
    error: string | null;
  };
  recentJobs: WorkflowJobListItem[];
  databaseReady: boolean;
};

export function DashboardOverviewWorkspace({
  data,
  selectedTab,
}: {
  data: DashboardOverviewData;
  selectedTab: DashboardOverviewTab;
}) {
  const [activeTab, setActiveTab] = useState<DashboardOverviewTab>(selectedTab);
  const latestJob = data.recentJobs[0] ?? null;
  const intakeJobs = data.recentJobs.filter((job) =>
    ["RECEIVED", "REVIEWING", "READY_FOR_GENERATION"].includes(job.status),
  ).length;
  const activeWorkflowJobs = data.recentJobs.filter((job) =>
    [
      "RECEIVED",
      "REVIEWING",
      "READY_FOR_GENERATION",
      "PINS_GENERATED",
      "MEDIA_UPLOADED",
      "TITLES_GENERATED",
      "DESCRIPTIONS_GENERATED",
      "READY_TO_SCHEDULE",
      "FAILED",
    ].includes(job.status),
  );
  const readyQueueJobs = activeWorkflowJobs.filter((job) =>
    [
      "PINS_GENERATED",
      "MEDIA_UPLOADED",
      "TITLES_GENERATED",
      "DESCRIPTIONS_GENERATED",
      "READY_TO_SCHEDULE",
    ].includes(job.status),
  );
  const queuePreviewDays = data.queueCapacity?.upcomingDays.slice(0, 6) ?? [];
  const queueStatusLabel = data.queueCapacity
    ? `${data.queueCapacity.todayScheduledCount}/${data.queueCapacity.targetPerDay} today`
    : "Unavailable";
  const queueTargetPerDay = data.queueCapacity?.targetPerDay ?? 0;
  const nextOpenLabel = data.queueCapacity?.nextAvailableDate
    ? formatQueueDate(data.queueCapacity.nextAvailableDate)
    : "Full window";

  useEffect(() => {
    setActiveTab(selectedTab);
  }, [selectedTab]);

  function handleTabChange(nextTab: DashboardOverviewTab) {
    setActiveTab(nextTab);

    if (typeof window === "undefined") {
      return;
    }

    const href = buildOverviewHref({
      tab: nextTab,
      query: data.untrackedSitemapArticles.query,
      filter: data.untrackedSitemapArticles.filter,
      page: data.untrackedSitemapArticles.page,
    });

    window.history.replaceState(null, "", href);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <section className="rounded-[34px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-md)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--dashboard-muted)]">
                Workspace command
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
                Run the Pinterest pipeline
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <MetricInline label="Processed" value={data.postsProcessed} />
              <MetricInline label="Pins" value={data.pinsGenerated} />
              <MetricInline label="Needs fresh" value={data.postsNeedingFreshPins} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <ActionCard
              href="/dashboard/inbox"
              label="Inbox"
              value={intakeJobs}
              title="Review intake"
              detail="Needs review"
            />
            <ActionCard
              href="/dashboard/jobs"
              label="Jobs"
              value={activeWorkflowJobs.length}
              title="Run workflows"
              detail="Active now"
            />
            <ActionCard
              href="/dashboard/publishing"
              label="Publishing"
              value={data.readyToSchedule}
              title="Schedule pins"
              detail="Ready now"
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-3 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex flex-wrap gap-2">
            <OverviewTabLink
              active={activeTab === "priority"}
              onSelect={() => handleTabChange("priority")}
            >
              Priority
            </OverviewTabLink>
            <OverviewTabLink
              active={activeTab === "opportunities"}
              onSelect={() => handleTabChange("opportunities")}
            >
              Opportunities
            </OverviewTabLink>
            <OverviewTabLink
              active={activeTab === "queue"}
              onSelect={() => handleTabChange("queue")}
            >
              Queue
            </OverviewTabLink>
          </div>
        </section>

        {activeTab === "priority" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
            <section className="overflow-hidden rounded-[34px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-md)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dashboard-line)] px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
                    Today&apos;s fresh-pin targets
                  </p>
                  <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
                    Top stale opportunities
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <MetricInline label="Ready" value={data.todaysFreshTargets.length} />
                  <MetricInline label="Queued" value={data.queuedFreshTargetCount} />
                  <Link
                    href="/dashboard/post-pulse"
                    className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                  >
                    Post Pulse
                  </Link>
                </div>
              </div>
              {data.todaysFreshTargets.length === 0 ? (
                <div className="px-5 py-6 text-sm text-[var(--dashboard-subtle)]">
                  No fresh-pin targets right now.
                </div>
              ) : (
                <div className="divide-y divide-[var(--dashboard-line)]">
                  {data.todaysFreshTargets.slice(0, 6).map((target, index) => (
                    <div
                      key={target.postId}
                      className="grid gap-4 px-5 py-4 lg:grid-cols-[54px_minmax(0,1fr)_210px] lg:items-center"
                    >
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--dashboard-panel-alt)] text-base font-black text-[var(--dashboard-accent-strong)]">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                          {target.domain}
                        </p>
                        <p className="mt-1 line-clamp-2 text-base font-bold text-[var(--dashboard-text)]">
                          {target.title}
                        </p>
                        <p className="mt-1 truncate text-sm text-[var(--dashboard-subtle)]">{target.url}</p>
                      </div>
                      <div className="flex flex-col gap-2 lg:items-end">
                        <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                          {target.freshnessAgeDays ?? 0}d since last pin
                        </p>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <SnoozeFreshTargetButton
                            postId={target.postId}
                            workspaceId={target.workspaceId}
                          />
                          {target.latestJobId ? (
                            <Link
                              href={`/dashboard/jobs/${target.latestJobId}`}
                              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                            >
                              Latest cycle
                            </Link>
                          ) : null}
                          <Link
                            href={target.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                          >
                            Open article
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
                  Priority snapshot
                </p>
                <div className="mt-4 space-y-3">
                  <CompactStat label="Ready to schedule" value={data.readyToSchedule} />
                  <CompactStat label="Needs fresh pins" value={data.postsNeedingFreshPins} />
                  <CompactStat label="Active workflows" value={activeWorkflowJobs.length} />
                </div>
              </div>
              <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
                    Queue pressure
                  </p>
                  <Link
                    href="/dashboard/publishing"
                    className="text-sm font-semibold text-[var(--dashboard-accent-strong)]"
                  >
                    Open
                  </Link>
                </div>
                <p className="mt-3 text-3xl font-black text-[var(--dashboard-text)]">
                  {queueStatusLabel}
                </p>
                <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                  Next open: {nextOpenLabel}
                </p>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "opportunities" ? (
          <section className="overflow-hidden rounded-[34px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-md)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dashboard-line)] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
                  Articles never pinned yet
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
                  Workspace opportunities
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <MetricInline label="Untracked" value={data.untrackedSitemapArticles.totalUntracked} />
                <MetricInline label="Matching" value={data.untrackedSitemapArticles.totalMatching} />
                <Link
                  href="/dashboard/integrations"
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                >
                  Sitemaps
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-b-[34px] border-t border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]">
              <form className="grid gap-3 border-b border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-5 py-4 lg:grid-cols-[minmax(0,1fr)_220px_160px]">
                <input type="hidden" name="tab" value="opportunities" />
                <input
                  type="search"
                  name="unpinnedQuery"
                  defaultValue={data.untrackedSitemapArticles.query}
                  placeholder="Search title, URL, or domain"
                  className="w-full rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 text-sm outline-none"
                />
                <select
                  name="unpinnedFilter"
                  defaultValue={data.untrackedSitemapArticles.filter}
                  className="w-full rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 text-sm outline-none"
                >
                  <option value="all">All articles</option>
                  <option value="recent_90d">Recent 90 days</option>
                  <option value="missing_lastmod">Missing lastmod</option>
                </select>
                <div className="flex gap-3">
                  <input type="hidden" name="unpinnedPage" value="1" />
                  <button
                    type="submit"
                    className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                  >
                    Apply
                  </button>
                  <Link
                    href={buildOverviewHref({ tab: "opportunities" })}
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                  >
                    Reset
                  </Link>
                </div>
              </form>
              {!data.untrackedSitemapArticles.configured ? (
                <div className="px-5 py-6 text-sm text-[var(--dashboard-subtle)]">
                  No sitemap URLs configured for this workspace.
                </div>
              ) : data.untrackedSitemapArticles.error ? (
                <div className="px-5 py-6 text-sm text-[var(--dashboard-danger-ink)]">
                  {data.untrackedSitemapArticles.error}
                </div>
              ) : data.untrackedSitemapArticles.articles.length === 0 ? (
                <div className="px-5 py-6 text-sm text-[var(--dashboard-subtle)]">
                  No untracked articles match this view.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[minmax(0,1.3fr)_140px_140px_170px] gap-4 bg-[var(--dashboard-panel-alt)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                    <span>Article</span>
                    <span>Domain</span>
                    <span>Lastmod</span>
                    <span className="text-right">Action</span>
                  </div>
                  <div className="max-h-[720px] divide-y divide-[var(--dashboard-line)] overflow-y-auto">
                    {data.untrackedSitemapArticles.articles.map((article) => (
                      <div
                        key={article.normalizedUrl}
                        className="grid grid-cols-[minmax(0,1.3fr)_140px_140px_170px] items-center gap-4 px-5 py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--dashboard-text)]">{article.titleGuess}</p>
                          <p className="mt-1 truncate text-sm text-[var(--dashboard-subtle)]">{article.url}</p>
                        </div>
                        <p className="text-sm text-[var(--dashboard-subtle)]">{article.domain}</p>
                        <p className="text-sm text-[var(--dashboard-subtle)]">
                          {article.lastModifiedAt ? formatDate(article.lastModifiedAt) : "Unknown"}
                        </p>
                        <div className="flex justify-end">
                          <Link
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                          >
                            Open article
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.untrackedSitemapArticles.totalPages > 1 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dashboard-line)] px-5 py-4">
                      <p className="text-sm text-[var(--dashboard-subtle)]">
                        Page {data.untrackedSitemapArticles.page} of {data.untrackedSitemapArticles.totalPages}
                      </p>
                      <div className="flex gap-3">
                        <PaginationLink
                          page={data.untrackedSitemapArticles.page - 1}
                          disabled={data.untrackedSitemapArticles.page <= 1}
                          query={data.untrackedSitemapArticles.query}
                          filter={data.untrackedSitemapArticles.filter}
                        >
                          Previous
                        </PaginationLink>
                        <PaginationLink
                          page={data.untrackedSitemapArticles.page + 1}
                          disabled={data.untrackedSitemapArticles.page >= data.untrackedSitemapArticles.totalPages}
                          query={data.untrackedSitemapArticles.query}
                          filter={data.untrackedSitemapArticles.filter}
                        >
                          Next
                        </PaginationLink>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "queue" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="overflow-hidden rounded-[34px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-md)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dashboard-line)] px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
                    Queue coverage
                  </p>
                  <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
                    Publishing capacity
                  </h3>
                </div>
                <Link
                  href="/dashboard/publishing"
                  className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                >
                  Open publishing
                </Link>
              </div>
              {data.queueCapacity ? (
                <>
                  <div className="grid gap-4 border-b border-[var(--dashboard-line)] px-5 py-4 md:grid-cols-3">
                    <QueueSummaryCard
                      label="Today"
                      value={`${data.queueCapacity.todayScheduledCount}/${queueTargetPerDay}`}
                      detail={formatQueueDate(data.queueCapacity.todayDate)}
                    />
                    <QueueSummaryCard
                      label="Next open"
                      value={nextOpenLabel}
                      detail="Next day with room"
                    />
                    <QueueSummaryCard
                      label="Target"
                      value={String(queueTargetPerDay)}
                      detail="Pins per day"
                    />
                  </div>
                  <div className="divide-y divide-[var(--dashboard-line)]">
                    {queuePreviewDays.map((day) => (
                      <div
                        key={day.date}
                        className="grid grid-cols-[170px_120px_120px_minmax(0,1fr)] items-center gap-4 px-5 py-4 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-[var(--dashboard-text)]">
                            {formatQueueDate(day.date)}
                          </p>
                          {day.isToday ? (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                              Today
                            </p>
                          ) : null}
                        </div>
                        <span className="font-semibold text-[var(--dashboard-text)]">
                          {day.scheduledCount} / {queueTargetPerDay}
                        </span>
                        <span className="text-[var(--dashboard-subtle)]">{day.remainingCapacity}</span>
                        <QueueLoadChip
                          label={day.isFull ? "Full" : day.remainingCapacity <= 3 ? "Near full" : "Open"}
                          tone={day.isFull ? "full" : day.remainingCapacity <= 3 ? "warning" : "open"}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-5 py-6 text-sm text-[var(--dashboard-subtle)]">
                  Queue capacity summary is unavailable right now.
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-[34px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-md)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--dashboard-line)] px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
                    Ready queue
                  </p>
                  <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
                    Jobs to schedule
                  </h3>
                </div>
                <p className="text-sm font-semibold text-[var(--dashboard-subtle)]">
                  {data.readyToSchedule}
                </p>
              </div>
              <div className="divide-y divide-[var(--dashboard-line)]">
                {readyQueueJobs.slice(0, 6).map((job) => (
                  <div key={job.id} className="px-5 py-4">
                    <Link
                      href={`/dashboard/jobs/${job.id}/publish`}
                      className="line-clamp-2 font-semibold text-[var(--dashboard-text)] underline decoration-[var(--dashboard-accent)] underline-offset-4"
                    >
                      {job.articleTitleSnapshot}
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm text-[var(--dashboard-subtle)]">
                      <span>{formatLabel(job.status)}</span>
                      <span>{job.generatedPins.length} pins</span>
                    </div>
                  </div>
                ))}
                {readyQueueJobs.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-[var(--dashboard-subtle)]">
                    No jobs are waiting for scheduling.
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <aside className="space-y-5">
        <div className="rounded-[34px] border border-[var(--dashboard-line)] bg-[linear-gradient(155deg,#0f1b3d_0%,#1249cc_58%,#3cc9ff_100%)] p-5 text-white shadow-[var(--dashboard-shadow-accent)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
            Continue latest
          </p>
          {latestJob ? (
            <>
              <h3 className="mt-3 line-clamp-3 text-2xl font-black tracking-[-0.04em]">
                {latestJob.articleTitleSnapshot}
              </h3>
              <p className="mt-2 text-sm text-white/82">{formatLabel(latestJob.status)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/jobs/${latestJob.id}`}
                  className="rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open job
                </Link>
                <Link
                  href={`/dashboard/jobs/${latestJob.id}/publish`}
                  className="rounded-full border border-white/25 bg-white/6 px-4 py-2 text-sm font-semibold text-white"
                >
                  Publish
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/82">No recent job yet.</p>
          )}
        </div>

        <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
            Queue pressure
          </p>
          <p className="mt-3 text-3xl font-black text-[var(--dashboard-text)]">{queueStatusLabel}</p>
          <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">Next open: {nextOpenLabel}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {queuePreviewDays.slice(0, 4).map((day) => (
              <span
                key={day.date}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
              >
                {formatQueueDate(day.date)} {day.scheduledCount}/{data.queueCapacity?.targetPerDay ?? 0}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
            Workspace pulse
          </p>
          <div className="mt-4 space-y-3">
            <CompactStat label="Fresh targets ready" value={data.todaysFreshTargets.length} />
            <CompactStat label="Queued fresh targets" value={data.queuedFreshTargetCount} />
            <CompactStat label="Active workflows" value={activeWorkflowJobs.length} />
          </div>
        </div>
      </aside>
    </section>
  );
}

function ActionCard({
  href,
  label,
  value,
  title,
  detail,
}: {
  href: string;
  label: string;
  value: number;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5 transition hover:border-[var(--dashboard-accent)] hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
          {label}
        </p>
        <span className="text-2xl font-black text-[var(--dashboard-text)]">{value}</span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-[var(--dashboard-text)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">{detail}</p>
    </Link>
  );
}

function OverviewTabLink({
  active,
  onSelect,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
        active
          ? "dashboard-accent-action bg-[var(--dashboard-accent)] text-white shadow-[var(--dashboard-shadow-accent)]"
          : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function MetricInline({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3">
      <span className="text-sm font-semibold text-[var(--dashboard-subtle)]">{label}</span>
      <span className="text-xl font-black text-[var(--dashboard-text)]">{value}</span>
    </div>
  );
}

function QueueSummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[var(--dashboard-text)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">{detail}</p>
    </div>
  );
}

function QueueLoadChip({
  label,
  tone,
}: {
  label: string;
  tone: "open" | "warning" | "full";
}) {
  const className =
    tone === "full"
      ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
      : tone === "warning"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}
    >
      {label}
    </span>
  );
}

function PaginationLink({
  page,
  disabled,
  query,
  filter,
  children,
}: {
  page: number;
  disabled: boolean;
  query: string;
  filter: WorkspaceSitemapFilter;
  children: string;
}) {
  const href = buildOverviewHref({
    tab: "opportunities",
    page,
    query,
    filter,
  });

  if (disabled) {
    return (
      <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-muted)] opacity-60">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
    >
      {children}
    </Link>
  );
}

function buildOverviewHref(input: {
  tab: DashboardOverviewTab;
  page?: number;
  query?: string;
  filter?: WorkspaceSitemapFilter;
}) {
  const params = new URLSearchParams();
  if (input.tab !== "priority") {
    params.set("tab", input.tab);
  }
  if (input.query?.trim()) {
    params.set("unpinnedQuery", input.query.trim());
  }
  if (input.filter && input.filter !== "all") {
    params.set("unpinnedFilter", input.filter);
  }
  if (input.page && input.page > 1) {
    params.set("unpinnedPage", String(input.page));
  }

  const queryString = params.toString();
  return queryString ? `/dashboard?${queryString}` : "/dashboard";
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatQueueDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
