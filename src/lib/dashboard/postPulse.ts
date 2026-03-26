import {
  PostPulseFreshnessStatus,
  ScheduleRunItemStatus,
  type Prisma,
} from "@prisma/client";
import { runWithOperationContext, timeAsyncOperation } from "@/lib/observability/operationContext";
import { prisma } from "@/lib/prisma";
import { normalizeDomain } from "@/lib/types";

const PUBLICATION_RECORD_STATE = {
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  PUBLISHED_POSTED: "PUBLISHED_POSTED",
  OTHER: "OTHER",
} as const;

type PublicationRecordStateValue =
  (typeof PUBLICATION_RECORD_STATE)[keyof typeof PUBLICATION_RECORD_STATE];

export type PostPulseStatus =
  | "fresh"
  | "needs_fresh_pins"
  | "scheduled_in_flight"
  | "never_published"
  | "no_pins_yet";

export type PostPulseActivityDotState = "published" | "scheduled" | "other";
export type PostPulseFilter = "all" | PostPulseStatus;
export type PostPulseSort = "priority" | "oldest_published" | "newest_published";

export type PostPulseRecord = {
  postId: string;
  title: string;
  url: string;
  domain: string;
  totalJobs: number;
  totalGeneratedPins: number;
  totalPublerRecords: number;
  publishedCount: number;
  scheduledCount: number;
  lastGeneratedAt: Date | null;
  lastPublishedAt: Date | null;
  lastScheduledAt: Date | null;
  lastSyncedAt: Date | null;
  freshnessStatus: PostPulseStatus;
  freshnessAgeDays: number | null;
  latestJobId: string | null;
  recentActivityDots: PostPulseActivityDotState[];
};

type SourcePostPulseQueryOptions = {
  workspaceId?: string;
  allowedDomains?: string[];
  postIds?: string[];
};

export async function listPostPulseRecordsForUser(
  userId: string,
  options?: { workspaceId?: string; allowedDomains?: string[] },
): Promise<PostPulseRecord[]> {
  return runWithOperationContext(
    {
      action: "dashboard.post_pulse.load",
      userId,
      workspaceId: options?.workspaceId?.trim() || undefined,
    },
    async () =>
      timeAsyncOperation(
        "dashboard.post_pulse.load",
        {
          userId,
          workspaceId: options?.workspaceId?.trim() || null,
          allowedDomainCount: options?.allowedDomains?.length ?? 0,
        },
        async () => {
          const workspaceId = options?.workspaceId?.trim() ?? "";
          const allowedDomains = normalizeAllowedDomains(options?.allowedDomains ?? []);
          const trackedPostIds = await listTrackedPostIdsForUser(userId, workspaceId);

          if (trackedPostIds.length === 0) {
            return [];
          }

          const snapshotRows = await prisma.postPulseSnapshot.findMany({
            where: {
              userId,
              workspaceId,
              postId: { in: trackedPostIds },
            },
            include: {
              post: {
                select: {
                  id: true,
                  title: true,
                  url: true,
                  domain: true,
                },
              },
            },
          });

          let records: PostPulseRecord[];

          if (snapshotRows.length === trackedPostIds.length) {
            records = snapshotRows.map(mapSnapshotRowToRecord);
          } else {
            records = await listPostPulseRecordsForUserFromSourceRaw(userId, {
              workspaceId,
              allowedDomains: [],
            });
            await persistPostPulseSnapshotsForWorkspace(userId, workspaceId, records);
          }

          const filteredRecords =
            allowedDomains.length > 0
              ? records.filter((record) =>
                  allowedDomains.includes(normalizeDomain(record.domain)),
                )
              : records;

          return sortPostPulseRecords(filteredRecords, "priority");
        },
      ),
  );
}

export async function rebuildPostPulseSnapshotsForWorkspace(
  userId: string,
  workspaceId = "",
) {
  const normalizedWorkspaceId = workspaceId.trim();
  const records = await listPostPulseRecordsForUserFromSourceRaw(userId, {
    workspaceId: normalizedWorkspaceId,
    allowedDomains: [],
  });
  await persistPostPulseSnapshotsForWorkspace(userId, normalizedWorkspaceId, records);
  return records;
}

export async function refreshPostPulseSnapshotsForJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    select: {
      userId: true,
      postId: true,
    },
  });

  if (!job) {
    return;
  }

  await refreshPostPulseSnapshotsForPost(job.userId, job.postId);
}

export async function refreshPostPulseSnapshotsForPost(
  userId: string,
  postId: string,
  explicitWorkspaceIds: string[] = [],
) {
  const workspaceIds = await listWorkspaceScopesForPost(userId, postId, explicitWorkspaceIds);

  for (const workspaceId of workspaceIds) {
    const records = await listPostPulseRecordsForUserFromSourceRaw(userId, {
      workspaceId,
      postIds: [postId],
      allowedDomains: [],
    });
    const record = records[0] ?? null;

    if (!record) {
      await prisma.postPulseSnapshot.deleteMany({
        where: {
          userId,
          postId,
          workspaceId,
        },
      });
      continue;
    }

    await upsertPostPulseSnapshot(userId, workspaceId, record);
  }
}

export function buildPostPulseSummary(records: PostPulseRecord[]) {
  return {
    postsTracked: records.length,
    needsFreshPins: records.filter((record) => record.freshnessStatus === "needs_fresh_pins").length,
    scheduledInFlight: records.filter((record) => record.freshnessStatus === "scheduled_in_flight")
      .length,
    neverPublished: records.filter((record) => record.freshnessStatus === "never_published").length,
    fresh: records.filter((record) => record.freshnessStatus === "fresh").length,
    noPinsYet: records.filter((record) => record.freshnessStatus === "no_pins_yet").length,
  };
}

export function filterPostPulseRecords(records: PostPulseRecord[], filter: PostPulseFilter) {
  if (filter === "all") {
    return records;
  }

  return records.filter((record) => record.freshnessStatus === filter);
}

export function sortPostPulseRecords(records: PostPulseRecord[], sort: PostPulseSort) {
  return [...records].sort((left, right) => {
    if (sort === "oldest_published") {
      return compareAscending(
        left.lastPublishedAt?.getTime() ?? Number.POSITIVE_INFINITY,
        right.lastPublishedAt?.getTime() ?? Number.POSITIVE_INFINITY,
      );
    }

    if (sort === "newest_published") {
      return compareDescending(
        left.lastPublishedAt?.getTime() ?? 0,
        right.lastPublishedAt?.getTime() ?? 0,
      );
    }

    const statusDelta = statusWeight(left.freshnessStatus) - statusWeight(right.freshnessStatus);
    if (statusDelta !== 0) {
      return statusDelta;
    }

    const leftTimestamp =
      left.lastScheduledAt?.getTime() ??
      left.lastPublishedAt?.getTime() ??
      left.lastGeneratedAt?.getTime() ??
      0;
    const rightTimestamp =
      right.lastScheduledAt?.getTime() ??
      right.lastPublishedAt?.getTime() ??
      right.lastGeneratedAt?.getTime() ??
      0;
    return compareDescending(leftTimestamp, rightTimestamp);
  });
}

export function normalizePostPulseFilter(value: string | undefined): PostPulseFilter {
  switch (value) {
    case "needs_fresh_pins":
    case "scheduled_in_flight":
    case "fresh":
    case "never_published":
    case "no_pins_yet":
      return value;
    case "all":
    default:
      return "all";
  }
}

export function normalizePostPulseSort(value: string | undefined): PostPulseSort {
  switch (value) {
    case "oldest_published":
    case "newest_published":
      return value;
    case "priority":
    default:
      return "priority";
  }
}

function resolveFreshnessStatus(input: {
  totalGeneratedPins: number;
  publishedCount: number;
  scheduledCount: number;
  lastPublishedAt: Date | null;
}): PostPulseStatus {
  if (input.scheduledCount > 0) {
    return "scheduled_in_flight";
  }

  if (input.publishedCount > 0 && input.lastPublishedAt) {
    const ageDays = Math.floor((Date.now() - input.lastPublishedAt.getTime()) / (1000 * 60 * 60 * 24));
    return ageDays >= 30 ? "needs_fresh_pins" : "fresh";
  }

  if (input.totalGeneratedPins === 0) {
    return "no_pins_yet";
  }

  return "never_published";
}

async function listTrackedPostIdsForUser(userId: string, workspaceId: string) {
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        {
          jobs: {
            some: { userId },
          },
        },
        {
          publicationRecords: {
            some: {
              userId,
              ...(workspaceId ? { providerWorkspaceId: workspaceId } : {}),
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  return posts.map((post) => post.id);
}

async function listPostPulseRecordsForUserFromSourceRaw(
  userId: string,
  options: SourcePostPulseQueryOptions,
): Promise<PostPulseRecord[]> {
  const workspaceId = options.workspaceId?.trim() ?? "";
  const allowedDomains = normalizeAllowedDomains(options.allowedDomains ?? []);
  const postIds = Array.from(new Set((options.postIds ?? []).filter(Boolean)));
  const posts = await prisma.post.findMany({
    where: {
      ...(postIds.length > 0 ? { id: { in: postIds } } : {}),
      OR: [
        {
          jobs: {
            some: { userId },
          },
        },
        {
          publicationRecords: {
            some: {
              userId,
              ...(workspaceId ? { providerWorkspaceId: workspaceId } : {}),
            },
          },
        },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      jobs: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          generatedPins: {
            orderBy: { createdAt: "desc" },
            include: {
              scheduleRunItems: {
                where: {
                  status: ScheduleRunItemStatus.SCHEDULED,
                },
                orderBy: { scheduledFor: "desc" },
                select: {
                  id: true,
                  scheduledFor: true,
                },
              },
            },
          },
        },
      },
      publicationRecords: {
        where: {
          userId,
          ...(workspaceId ? { providerWorkspaceId: workspaceId } : {}),
        },
        orderBy: [
          { publishedAt: "desc" },
          { scheduledAt: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          state: true,
          scheduledAt: true,
          publishedAt: true,
          syncedAt: true,
        },
      },
    },
  });

  const records = posts.map((post) => {
    const jobs = post.jobs;
    const generatedPins = jobs.flatMap((job) => job.generatedPins);
    const localScheduledItems = generatedPins.flatMap((pin) => pin.scheduleRunItems);
    const publicationRecords = post.publicationRecords;
    const publishedRecords = publicationRecords.filter((record) => isPublishedState(record.state));
    const scheduledRecords = publicationRecords.filter(
      (record) => record.state === PUBLICATION_RECORD_STATE.SCHEDULED,
    );
    const effectivePublerRecordCount =
      publicationRecords.length > 0 ? publicationRecords.length : localScheduledItems.length;
    const publishedCount = publishedRecords.length;
    const scheduledCount =
      publicationRecords.length > 0 ? scheduledRecords.length : localScheduledItems.length;
    const lastGeneratedAt =
      generatedPins.reduce<Date | null>(
        (latest, pin) => (!latest || pin.createdAt > latest ? pin.createdAt : latest),
        null,
      ) ?? null;
    const lastPublishedAt =
      publishedRecords.reduce<Date | null>((latest, record) => {
        const candidate = record.publishedAt ?? record.scheduledAt;
        if (!candidate) {
          return latest;
        }
        return !latest || candidate > latest ? candidate : latest;
      }, null) ?? null;
    const lastScheduledAt =
      scheduledRecords.reduce<Date | null>((latest, record) => {
        const candidate = record.scheduledAt;
        if (!candidate) {
          return latest;
        }
        return !latest || candidate > latest ? candidate : latest;
      }, null) ??
      localScheduledItems.reduce<Date | null>((latest, item) => {
        if (!item.scheduledFor) {
          return latest;
        }
        return !latest || item.scheduledFor > latest ? item.scheduledFor : latest;
      }, null) ??
      null;
    const freshnessAnchor = lastPublishedAt ?? null;
    const freshnessAgeDays = freshnessAnchor
      ? Math.floor((Date.now() - freshnessAnchor.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const lastSyncedAt =
      publicationRecords.reduce<Date | null>(
        (latest, record) => (!latest || record.syncedAt > latest ? record.syncedAt : latest),
        null,
      ) ?? null;
    const recentActivityDots =
      publicationRecords.length > 0
        ? publicationRecords.slice(0, 8).map((record) => toActivityDotState(record.state))
        : localScheduledItems.slice(0, 8).map(() => "scheduled" as const);

    return {
      postId: post.id,
      title: post.title,
      url: post.url,
      domain: post.domain,
      totalJobs: jobs.length,
      totalGeneratedPins: generatedPins.length,
      totalPublerRecords: effectivePublerRecordCount,
      publishedCount,
      scheduledCount,
      lastGeneratedAt,
      lastPublishedAt,
      lastScheduledAt,
      lastSyncedAt,
      freshnessStatus: resolveFreshnessStatus({
        totalGeneratedPins: generatedPins.length,
        publishedCount,
        scheduledCount,
        lastPublishedAt,
      }),
      freshnessAgeDays,
      latestJobId: jobs[0]?.id ?? null,
      recentActivityDots,
    };
  });

  const filteredRecords =
    allowedDomains.length > 0
      ? records.filter((record) => allowedDomains.includes(normalizeDomain(record.domain)))
      : records;

  return sortPostPulseRecords(filteredRecords, "priority");
}

async function persistPostPulseSnapshotsForWorkspace(
  userId: string,
  workspaceId: string,
  records: PostPulseRecord[],
) {
  const snapshotOperations: Prisma.PrismaPromise<unknown>[] = records.map((record) =>
    buildSnapshotUpsert(userId, workspaceId, record),
  );
  const livePostIds = records.map((record) => record.postId);

  snapshotOperations.push(
    prisma.postPulseSnapshot.deleteMany({
      where: {
        userId,
        workspaceId,
        ...(livePostIds.length > 0 ? { postId: { notIn: livePostIds } } : {}),
      },
    }),
  );

  await prisma.$transaction(snapshotOperations);
}

async function upsertPostPulseSnapshot(
  userId: string,
  workspaceId: string,
  record: PostPulseRecord,
) {
  await buildSnapshotUpsert(userId, workspaceId, record);
}

function buildSnapshotUpsert(
  userId: string,
  workspaceId: string,
  record: PostPulseRecord,
) {
  return prisma.postPulseSnapshot.upsert({
    where: {
      userId_postId_workspaceId: {
        userId,
        postId: record.postId,
        workspaceId,
      },
    },
    update: {
      latestJobId: record.latestJobId,
      totalJobs: record.totalJobs,
      totalGeneratedPins: record.totalGeneratedPins,
      totalPublerRecords: record.totalPublerRecords,
      publishedCount: record.publishedCount,
      scheduledCount: record.scheduledCount,
      lastGeneratedAt: record.lastGeneratedAt,
      lastPublishedAt: record.lastPublishedAt,
      lastScheduledAt: record.lastScheduledAt,
      lastSyncedAt: record.lastSyncedAt,
      freshnessStatus: mapStatusToSnapshotStatus(record.freshnessStatus),
      freshnessAgeDays: record.freshnessAgeDays,
      recentActivityDotsJson: record.recentActivityDots,
    },
    create: {
      userId,
      postId: record.postId,
      workspaceId,
      latestJobId: record.latestJobId,
      totalJobs: record.totalJobs,
      totalGeneratedPins: record.totalGeneratedPins,
      totalPublerRecords: record.totalPublerRecords,
      publishedCount: record.publishedCount,
      scheduledCount: record.scheduledCount,
      lastGeneratedAt: record.lastGeneratedAt,
      lastPublishedAt: record.lastPublishedAt,
      lastScheduledAt: record.lastScheduledAt,
      lastSyncedAt: record.lastSyncedAt,
      freshnessStatus: mapStatusToSnapshotStatus(record.freshnessStatus),
      freshnessAgeDays: record.freshnessAgeDays,
      recentActivityDotsJson: record.recentActivityDots,
    },
  });
}

function mapSnapshotRowToRecord(
  row: Prisma.PostPulseSnapshotGetPayload<{
    include: {
      post: {
        select: {
          id: true;
          title: true;
          url: true;
          domain: true;
        };
      };
    };
  }>,
): PostPulseRecord {
  return {
    postId: row.post.id,
    title: row.post.title,
    url: row.post.url,
    domain: row.post.domain,
    totalJobs: row.totalJobs,
    totalGeneratedPins: row.totalGeneratedPins,
    totalPublerRecords: row.totalPublerRecords,
    publishedCount: row.publishedCount,
    scheduledCount: row.scheduledCount,
    lastGeneratedAt: row.lastGeneratedAt,
    lastPublishedAt: row.lastPublishedAt,
    lastScheduledAt: row.lastScheduledAt,
    lastSyncedAt: row.lastSyncedAt,
    freshnessStatus: mapSnapshotStatusToStatus(row.freshnessStatus),
    freshnessAgeDays: row.freshnessAgeDays,
    latestJobId: row.latestJobId,
    recentActivityDots: Array.isArray(row.recentActivityDotsJson)
      ? row.recentActivityDotsJson.filter(isActivityDotState)
      : [],
  };
}

async function listWorkspaceScopesForPost(
  userId: string,
  postId: string,
  explicitWorkspaceIds: string[],
) {
  const [profiles, publicationScopes, existingSnapshots] = await Promise.all([
    prisma.workspaceProfile.findMany({
      where: { userId },
      select: { workspaceId: true },
    }),
    prisma.publicationRecord.findMany({
      where: {
        userId,
        postId,
        providerWorkspaceId: {
          not: null,
        },
      },
      select: { providerWorkspaceId: true },
      distinct: ["providerWorkspaceId"],
    }),
    prisma.postPulseSnapshot.findMany({
      where: {
        userId,
        postId,
      },
      select: { workspaceId: true },
    }),
  ]);

  return Array.from(
    new Set([
      "",
      ...explicitWorkspaceIds.map((value) => value.trim()),
      ...profiles.map((profile) => profile.workspaceId.trim()),
      ...publicationScopes.map((record) => record.providerWorkspaceId?.trim() ?? ""),
      ...existingSnapshots.map((snapshot) => snapshot.workspaceId.trim()),
    ]),
  );
}

function mapStatusToSnapshotStatus(status: PostPulseStatus): PostPulseFreshnessStatus {
  switch (status) {
    case "fresh":
      return PostPulseFreshnessStatus.FRESH;
    case "needs_fresh_pins":
      return PostPulseFreshnessStatus.NEEDS_FRESH_PINS;
    case "scheduled_in_flight":
      return PostPulseFreshnessStatus.SCHEDULED_IN_FLIGHT;
    case "never_published":
      return PostPulseFreshnessStatus.NEVER_PUBLISHED;
    case "no_pins_yet":
    default:
      return PostPulseFreshnessStatus.NO_PINS_YET;
  }
}

function mapSnapshotStatusToStatus(status: PostPulseFreshnessStatus): PostPulseStatus {
  switch (status) {
    case PostPulseFreshnessStatus.FRESH:
      return "fresh";
    case PostPulseFreshnessStatus.NEEDS_FRESH_PINS:
      return "needs_fresh_pins";
    case PostPulseFreshnessStatus.SCHEDULED_IN_FLIGHT:
      return "scheduled_in_flight";
    case PostPulseFreshnessStatus.NEVER_PUBLISHED:
      return "never_published";
    case PostPulseFreshnessStatus.NO_PINS_YET:
    default:
      return "no_pins_yet";
  }
}

function isPublishedState(state: PublicationRecordStateValue) {
  return (
    state === PUBLICATION_RECORD_STATE.PUBLISHED ||
    state === PUBLICATION_RECORD_STATE.PUBLISHED_POSTED
  );
}

function toActivityDotState(state: PublicationRecordStateValue): PostPulseActivityDotState {
  if (isPublishedState(state)) {
    return "published";
  }
  if (state === PUBLICATION_RECORD_STATE.SCHEDULED) {
    return "scheduled";
  }
  return "other";
}

function isActivityDotState(value: unknown): value is PostPulseActivityDotState {
  return value === "published" || value === "scheduled" || value === "other";
}

function statusWeight(status: PostPulseStatus) {
  switch (status) {
    case "needs_fresh_pins":
      return 0;
    case "scheduled_in_flight":
      return 1;
    case "never_published":
      return 2;
    case "no_pins_yet":
      return 3;
    case "fresh":
    default:
      return 4;
  }
}

function compareAscending(left: number, right: number) {
  return left - right;
}

function compareDescending(left: number, right: number) {
  return right - left;
}

function normalizeAllowedDomains(input: string[]) {
  return Array.from(new Set(input.map((value) => normalizeDomain(value)).filter(Boolean)));
}
