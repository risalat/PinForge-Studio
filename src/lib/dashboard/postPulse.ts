import { PublicationRecordState, ScheduleRunItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PostPulseStatus =
  | "fresh"
  | "needs_fresh_pins"
  | "scheduled_in_flight"
  | "never_published"
  | "no_pins_yet";

export type PostPulseActivityDotState = "published" | "scheduled" | "other";

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
  lastSyncedAt: Date | null;
  freshnessStatus: PostPulseStatus;
  freshnessAgeDays: number | null;
  latestJobId: string | null;
  recentActivityDots: PostPulseActivityDotState[];
};

export async function listPostPulseRecordsForUser(userId: string): Promise<PostPulseRecord[]> {
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
            some: { userId },
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
        where: { userId },
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

  return posts
    .map((post) => {
      const jobs = post.jobs;
      const generatedPins = jobs.flatMap((job) => job.generatedPins);
      const localScheduledItems = generatedPins.flatMap((pin) => pin.scheduleRunItems);
      const publicationRecords = post.publicationRecords;
      const publishedRecords = publicationRecords.filter((record) => isPublishedState(record.state));
      const scheduledRecords = publicationRecords.filter(
        (record) => record.state === PublicationRecordState.SCHEDULED,
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
      const lastLocalScheduledAt =
        localScheduledItems.reduce<Date | null>((latest, item) => {
          if (!item.scheduledFor) {
            return latest;
          }
          return !latest || item.scheduledFor > latest ? item.scheduledFor : latest;
        }, null) ?? null;
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
        lastPublishedAt: lastPublishedAt ?? lastLocalScheduledAt,
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
    })
    .sort((left, right) => {
      const statusDelta = statusWeight(left.freshnessStatus) - statusWeight(right.freshnessStatus);
      if (statusDelta !== 0) {
        return statusDelta;
      }

      const leftTimestamp = left.lastPublishedAt?.getTime() ?? left.lastGeneratedAt?.getTime() ?? 0;
      const rightTimestamp = right.lastPublishedAt?.getTime() ?? right.lastGeneratedAt?.getTime() ?? 0;
      return rightTimestamp - leftTimestamp;
    });
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

function resolveFreshnessStatus(input: {
  totalGeneratedPins: number;
  publishedCount: number;
  scheduledCount: number;
  lastPublishedAt: Date | null;
}): PostPulseStatus {
  if (input.publishedCount > 0 && input.lastPublishedAt) {
    const ageDays = Math.floor((Date.now() - input.lastPublishedAt.getTime()) / (1000 * 60 * 60 * 24));
    return ageDays >= 30 ? "needs_fresh_pins" : "fresh";
  }

  if (input.scheduledCount > 0) {
    return "scheduled_in_flight";
  }

  if (input.totalGeneratedPins === 0) {
    return "no_pins_yet";
  }

  return "never_published";
}

function isPublishedState(state: PublicationRecordState) {
  return (
    state === PublicationRecordState.PUBLISHED ||
    state === PublicationRecordState.PUBLISHED_POSTED
  );
}

function toActivityDotState(state: PublicationRecordState): PostPulseActivityDotState {
  if (isPublishedState(state)) {
    return "published";
  }
  if (state === PublicationRecordState.SCHEDULED) {
    return "scheduled";
  }
  return "other";
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
