import { GenerationJobStatus } from "@prisma/client";
import {
  DashboardOverviewWorkspace,
  type DashboardOverviewTab,
} from "@/app/dashboard/DashboardOverviewWorkspace";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { filterByAllowedDomains } from "@/lib/dashboard/domainScope";
import {
  buildPostPulseSummary,
  listPostPulseRecordsForUser,
  type PostPulseRecord,
} from "@/lib/dashboard/postPulse";
import {
  listWorkspaceUntrackedSitemapArticles,
  normalizeWorkspaceSitemapFilter,
  type WorkspaceSitemapFilter,
} from "@/lib/dashboard/workspaceSitemaps";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import { getPublishQueueCapacitySummary } from "@/lib/jobs/publishQueueCapacity";
import { prisma } from "@/lib/prisma";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
} from "@/lib/settings/integrationSettings";
import { normalizeArticleUrl } from "@/lib/types";

async function getDashboardData(input?: {
  untrackedQuery?: string;
  untrackedFilter?: WorkspaceSitemapFilter;
  untrackedPage?: number;
}) {
  if (!isDatabaseConfigured()) {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      readyToSchedule: 0,
      postsNeedingFreshPins: 0,
      queueCapacity: null,
      todaysFreshTargets: [],
      queuedFreshTargetCount: 0,
      untrackedSitemapArticles: {
        configured: false,
        sitemapUrls: [],
        totalArticles: 0,
        totalUntracked: 0,
        totalMatching: 0,
        page: 1,
        pageSize: 25,
        totalPages: 1,
        query: "",
        filter: "all" as WorkspaceSitemapFilter,
        articles: [],
        error: null,
      },
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
    const [postPulseRecords, queueCapacity] = await Promise.all([
      listPostPulseRecordsForUser(user.id, {
        workspaceId: activeWorkspaceId,
        allowedDomains,
      }),
      getPublishQueueCapacitySummary({
        userId: user.id,
        workspaceId: activeWorkspaceId,
        days: 7,
      }),
    ]);
    const activeSnoozes = await prisma.freshTargetSnooze.findMany({
      where: {
        userId: user.id,
        workspaceId: activeWorkspaceId,
        snoozedUntil: {
          gt: new Date(),
        },
      },
      select: {
        postId: true,
      },
    });
    const snoozedPostIds = new Set(activeSnoozes.map((item) => item.postId));
    const filteredJobs = filterByAllowedDomains(allJobs, (job) => job.domainSnapshot, allowedDomains);
    const latestWorkflowJobsByPostId = new Map<string, (typeof filteredJobs)[number]>();
    const latestWorkflowJobsByUrlKey = new Map<string, (typeof filteredJobs)[number]>();

    for (const job of filteredJobs) {
      if (!latestWorkflowJobsByPostId.has(job.postId)) {
        latestWorkflowJobsByPostId.set(job.postId, job);
      }

      const normalizedJobUrl = normalizeArticleUrl(job.postUrlSnapshot);
      if (normalizedJobUrl !== "" && !latestWorkflowJobsByUrlKey.has(normalizedJobUrl)) {
        latestWorkflowJobsByUrlKey.set(normalizedJobUrl, job);
      }
    }
    const postsProcessed = new Set(
      filteredJobs
        .map((job) => normalizeArticleUrl(job.postUrlSnapshot))
        .filter((value) => value !== ""),
    ).size;
    const pinsGenerated = filteredJobs.reduce((total, job) => total + job.generatedPins.length, 0);
    const readyToSchedule = filteredJobs.filter(
      (job) => job.status === GenerationJobStatus.READY_TO_SCHEDULE,
    ).length;
    const recentJobs = filteredJobs.slice(0, 8);
    const staleFreshTargets = rankFreshPinTargets(postPulseRecords).filter(
      (record) => !snoozedPostIds.has(record.postId),
    );
    const todaysFreshTargets = staleFreshTargets
      .filter((record) => {
        return !hasNewerWorkflowSinceLastPublication(
          record,
          latestWorkflowJobsByPostId,
          latestWorkflowJobsByUrlKey,
        );
      })
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
        workspaceId: activeWorkspaceId,
      }));
    const queuedFreshTargetCount = staleFreshTargets.filter((record) => {
      return hasNewerWorkflowSinceLastPublication(
        record,
        latestWorkflowJobsByPostId,
        latestWorkflowJobsByUrlKey,
      );
    }).length;
    const activeWorkspaceProfile =
      settings.workspaceProfiles.find((profile) => profile.workspaceId === activeWorkspaceId) ??
      settings.workspaceProfiles.find((profile) => profile.isDefault) ??
      null;
    const trackedUrlKeys = new Set(
      [
        ...postPulseRecords.map((record) => normalizeArticleUrl(record.url)),
        ...filteredJobs.map((job) => normalizeArticleUrl(job.postUrlSnapshot)),
      ].filter((value) => value !== ""),
    );
    const untrackedSitemapArticles = await listWorkspaceUntrackedSitemapArticles({
      sitemapUrls: activeWorkspaceProfile?.sitemapUrls ?? [],
      allowedDomains,
      trackedUrls: Array.from(trackedUrlKeys),
      page: input?.untrackedPage ?? 1,
      pageSize: 25,
      query: input?.untrackedQuery ?? "",
      filter: input?.untrackedFilter ?? "all",
    });

    return {
      postsProcessed,
      pinsGenerated,
      readyToSchedule,
      postsNeedingFreshPins: buildPostPulseSummary(postPulseRecords).needsFreshPins,
      queueCapacity,
      todaysFreshTargets,
      queuedFreshTargetCount,
      untrackedSitemapArticles,
      recentJobs,
      databaseReady: true,
    };
  } catch {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      readyToSchedule: 0,
      postsNeedingFreshPins: 0,
      queueCapacity: null,
      todaysFreshTargets: [],
      queuedFreshTargetCount: 0,
      untrackedSitemapArticles: {
        configured: false,
        sitemapUrls: [],
        totalArticles: 0,
        totalUntracked: 0,
        totalMatching: 0,
        page: 1,
        pageSize: 25,
        totalPages: 1,
        query: input?.untrackedQuery ?? "",
        filter: input?.untrackedFilter ?? "all",
        articles: [],
        error: null,
      },
      recentJobs: [],
      databaseReady: false,
    };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuthenticatedDashboardUser();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedTab = normalizeOverviewTab(firstSearchParam(resolvedSearchParams.tab));
  const untrackedQuery = firstSearchParam(resolvedSearchParams.unpinnedQuery);
  const untrackedFilter = normalizeWorkspaceSitemapFilter(
    firstSearchParam(resolvedSearchParams.unpinnedFilter),
  );
  const untrackedPage = normalizePositiveInt(firstSearchParam(resolvedSearchParams.unpinnedPage), 1);
  const data = await getDashboardData({
    untrackedQuery,
    untrackedFilter,
    untrackedPage,
  });

  return (
    <div className="space-y-5 text-[var(--dashboard-text)]">
      {!data.databaseReady ? (
        <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet.
        </div>
      ) : null}

      {data.databaseReady ? (
        <DashboardOverviewWorkspace data={data} selectedTab={selectedTab} />
      ) : null}
    </div>
  );
}

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

function hasNewerWorkflowSinceLastPublication(
  record: PostPulseRecord,
  jobsByPostId: Map<string, Awaited<ReturnType<typeof listJobsForUser>>[number]>,
  jobsByUrlKey: Map<string, Awaited<ReturnType<typeof listJobsForUser>>[number]>,
) {
  if (!record.lastPublishedAt) {
    return false;
  }

  const normalizedRecordUrl = normalizeArticleUrl(record.url);
  const latestWorkflowJob =
    jobsByPostId.get(record.postId) ??
    (normalizedRecordUrl !== "" ? jobsByUrlKey.get(normalizedRecordUrl) : undefined);

  if (!latestWorkflowJob) {
    return false;
  }

  return latestWorkflowJob.createdAt > record.lastPublishedAt;
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizeOverviewTab(value: string): DashboardOverviewTab {
  if (value === "opportunities" || value === "queue") {
    return value;
  }

  return "priority";
}

function normalizePositiveInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
