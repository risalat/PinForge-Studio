import { GenerationJobStatus } from "@prisma/client";
import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { filterByAllowedDomains } from "@/lib/dashboard/domainScope";
import {
  buildPostPulseSummary,
  listPostPulseRecordsForUser,
  type PostPulseRecord,
} from "@/lib/dashboard/postPulse";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
} from "@/lib/settings/integrationSettings";

async function getDashboardData() {
  if (!isDatabaseConfigured()) {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      readyToSchedule: 0,
      postsNeedingFreshPins: 0,
      todaysFreshTargets: [],
      queuedFreshTargetCount: 0,
      recentJobs: [],
      databaseReady: false,
    };
  }

  try {
    const user = await getOrCreateDashboardUser();
    const [settings, allJobs] = await Promise.all([
      getIntegrationSettingsSummary(),
      listJobsForUser(user.id),
    ]);
    const activeWorkspaceId = await getDashboardWorkspaceScope(settings.publerWorkspaceId);
    const allowedDomains = await getWorkspaceAllowedDomainsForUserId(user.id, activeWorkspaceId);
    const filteredJobs = filterByAllowedDomains(allJobs, (job) => job.domainSnapshot, allowedDomains);
    const postPulseRecords = await listPostPulseRecordsForUser(user.id, {
      workspaceId: activeWorkspaceId,
      allowedDomains,
    });
    const activeReviewJobs = filteredJobs.filter((job) => reviewQueueStatuses.has(job.status));
    const activeReviewPostIds = new Set(activeReviewJobs.map((job) => job.postId));
    const postsProcessed = new Set(filteredJobs.map((job) => job.postUrlSnapshot)).size;
    const pinsGenerated = filteredJobs.reduce((total, job) => total + job.generatedPins.length, 0);
    const readyToSchedule = filteredJobs.filter(
      (job) => job.status === GenerationJobStatus.READY_TO_SCHEDULE,
    ).length;
    const recentJobs = filteredJobs.slice(0, 8);
    const staleFreshTargets = rankFreshPinTargets(postPulseRecords);
    const todaysFreshTargets = staleFreshTargets
      .filter((record) => !activeReviewPostIds.has(record.postId))
      .slice(0, 10)
      .map((record) => ({
        postId: record.postId,
        title: record.title,
        url: record.url,
        domain: record.domain,
        latestJobId: record.latestJobId,
        lastPublishedAt: record.lastPublishedAt,
        freshnessAgeDays: record.freshnessAgeDays,
        totalJobs: record.totalJobs,
      }));
    const queuedFreshTargetCount = staleFreshTargets.filter((record) => activeReviewPostIds.has(record.postId)).length;

    return {
      postsProcessed,
      pinsGenerated,
      readyToSchedule,
      postsNeedingFreshPins: buildPostPulseSummary(postPulseRecords).needsFreshPins,
      todaysFreshTargets,
      queuedFreshTargetCount,
      recentJobs,
      databaseReady: true,
    };
  } catch {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      readyToSchedule: 0,
      postsNeedingFreshPins: 0,
      todaysFreshTargets: [],
      queuedFreshTargetCount: 0,
      recentJobs: [],
      databaseReady: false,
    };
  }
}

export default async function DashboardPage() {
  await requireAuthenticatedDashboardUser();
  const data = await getDashboardData();
  const latestJob = data.recentJobs[0] ?? null;
  const intakeJobs = data.recentJobs.filter((job) =>
    ["RECEIVED", "REVIEWING", "READY_FOR_GENERATION"].includes(job.status),
  ).length;

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
      {!data.databaseReady ? (
        <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[36px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-md)]">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--dashboard-muted)]">
            Focus today
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
            Intake, generation, and publishing in one workspace.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FocusCard
              href="/dashboard/inbox"
              label="Inbox"
              title="Review new intake"
              detail={`${intakeJobs} recent jobs still need review, planning, or manual generation.`}
            />
            <FocusCard
              href="/dashboard/jobs"
              label="Jobs"
              title="Run active workflows"
              detail={`${data.recentJobs.length} recent jobs are available for review, reruns, and status checks.`}
            />
            <FocusCard
              href="/dashboard/publishing"
              label="Publishing"
              title="Finish uploads and scheduling"
              detail={`${data.readyToSchedule} jobs are already ready to move into media upload or scheduling.`}
            />
          </div>
        </div>

        <div className="rounded-[36px] border border-[var(--dashboard-line)] bg-[linear-gradient(155deg,#0f1b3d_0%,#1249cc_58%,#3cc9ff_100%)] p-6 text-white shadow-[var(--dashboard-shadow-accent)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
            Continue where you left off
          </p>
          {latestJob ? (
            <>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">{latestJob.articleTitleSnapshot}</h2>
              <p className="mt-3 text-sm leading-7 text-white/82">
                {formatLabel(latestJob.status)}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
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
                  Open publish flow
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-7 text-white/82">
              No recent job yet.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        <MetricCard label="Posts processed" value={data.postsProcessed} />
        <MetricCard label="Pins generated" value={data.pinsGenerated} />
        <MetricCard label="Needs fresh pins" value={data.postsNeedingFreshPins} />
        <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[linear-gradient(145deg,#0d5fff_0%,#1e5eff_50%,#2f8fff_100%)] p-6 text-white shadow-[var(--dashboard-shadow-accent)]">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/70">
            Ready to schedule
          </p>
          <p className="mt-4 text-5xl font-black">{data.readyToSchedule}</p>
        </div>
      </section>

      <section className="rounded-[36px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-md)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--dashboard-muted)]">
              Immediate action
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
              Today&apos;s fresh-pin targets
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--dashboard-subtle)]">
              Curated from Post Pulse by oldest last published date. Anything already in the inbox or
              active review queue is excluded so this list stays focused on net-new work.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/post-pulse"
              className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
            >
              Open Post Pulse
            </Link>
            <Link
              href="/dashboard/inbox"
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
            >
              Review queued posts
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-[28px] bg-[linear-gradient(165deg,#11214a_0%,#1e5eff_54%,#71d4ff_100%)] p-5 text-white shadow-[var(--dashboard-shadow-accent)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
              Ready now
            </p>
            <p className="mt-3 text-5xl font-black">{data.todaysFreshTargets.length}</p>
            <p className="mt-3 text-sm leading-6 text-white/82">
              Top stale posts that are not already in today&apos;s active review queue.
            </p>
            <div className="mt-5 rounded-[22px] border border-white/18 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/68">
                Already queued
              </p>
              <p className="mt-2 text-3xl font-black">{data.queuedFreshTargetCount}</p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                Post Pulse candidates skipped because they are already in inbox or review.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]">
            {data.todaysFreshTargets.length === 0 ? (
              <div className="p-6 text-sm text-[var(--dashboard-subtle)]">
                No net-new fresh-pin targets right now. The stale posts are either already in queue or
                Post Pulse does not have any aged-out published posts to surface.
              </div>
            ) : (
              <div className="divide-y divide-[var(--dashboard-line)]">
                {data.todaysFreshTargets.map((target, index) => (
                  <div key={target.postId} className="grid gap-4 px-5 py-5 lg:grid-cols-[72px_minmax(0,1fr)_220px] lg:items-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--dashboard-panel-alt)] text-lg font-black text-[var(--dashboard-accent-strong)]">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                        {target.domain}
                      </p>
                      <p className="mt-2 line-clamp-2 text-lg font-bold text-[var(--dashboard-text)]">
                        {target.title}
                      </p>
                      <p className="mt-2 break-all text-sm text-[var(--dashboard-subtle)]">{target.url}</p>
                    </div>
                    <div className="flex flex-col gap-3 lg:items-end">
                      <div className="text-left lg:text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                          Last published
                        </p>
                        <p className="mt-2 text-base font-bold text-[var(--dashboard-text)]">
                          {target.lastPublishedAt ? formatDate(target.lastPublishedAt) : "Unknown"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                          {target.freshnessAgeDays ?? 0} day{target.freshnessAgeDays === 1 ? "" : "s"} since last pin
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 lg:justify-end">
                        {target.latestJobId ? (
                          <Link
                            href={`/dashboard/jobs/${target.latestJobId}`}
                            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
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
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-md)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--dashboard-muted)]">
              Recent jobs
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
              Latest intake and generation activity
            </h2>
          </div>
          <Link
            href="/dashboard/jobs"
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
          >
            Open jobs board
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-text)]">
          <table className="min-w-full divide-y divide-[var(--dashboard-line)]">
            <thead className="bg-[var(--dashboard-panel-alt)] text-left text-sm uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
              <tr>
                <th className="px-5 py-4">Article</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Images</th>
                <th className="px-5 py-4">Pins</th>
                <th className="px-5 py-4">Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dashboard-line)]">
              {data.recentJobs.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-[var(--dashboard-subtle)]" colSpan={5}>
                    No jobs yet.
                  </td>
                </tr>
              ) : (
                data.recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/jobs/${job.id}`} className="font-semibold underline">
                        {job.articleTitleSnapshot}
                      </Link>
                      <p className="text-sm text-[var(--dashboard-subtle)]">{job.postUrlSnapshot}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold">{formatLabel(job.status)}</td>
                    <td className="px-5 py-4">{job.sourceImages.length}</td>
                    <td className="px-5 py-4">{job.generatedPins.length}</td>
                    <td className="px-5 py-4">
                      {formatLabel(job.scheduleRuns[0]?.status ?? "NOT_STARTED")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const reviewQueueStatuses = new Set<GenerationJobStatus>([
  GenerationJobStatus.RECEIVED,
  GenerationJobStatus.REVIEWING,
  GenerationJobStatus.READY_FOR_GENERATION,
  GenerationJobStatus.FAILED,
]);

function rankFreshPinTargets(records: PostPulseRecord[]) {
  return [...records]
    .filter(
      (record) =>
        record.freshnessStatus === "needs_fresh_pins" &&
        record.lastPublishedAt !== null &&
        typeof record.freshnessAgeDays === "number",
    )
    .sort((left, right) => {
      const ageDelta = (right.freshnessAgeDays ?? 0) - (left.freshnessAgeDays ?? 0);
      if (ageDelta !== 0) {
        return ageDelta;
      }

      return (left.lastPublishedAt?.getTime() ?? 0) - (right.lastPublishedAt?.getTime() ?? 0);
    });
}

function FocusCard({
  href,
  label,
  title,
  detail,
}: {
  href: string;
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5 transition hover:border-[var(--dashboard-accent)] hover:bg-white"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <h3 className="mt-3 text-lg font-bold text-[var(--dashboard-text)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{detail}</p>
    </Link>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p className="mt-4 text-5xl font-black text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
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
