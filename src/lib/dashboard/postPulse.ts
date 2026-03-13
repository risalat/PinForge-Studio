import { ScheduleRunItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PostPulseStatus = "fresh" | "needs_fresh_pins" | "never_published" | "no_pins_yet";

export type PostPulseRecord = {
  postId: string;
  title: string;
  url: string;
  domain: string;
  totalJobs: number;
  totalGeneratedPins: number;
  totalScheduledPins: number;
  lastGeneratedAt: Date | null;
  lastScheduledAt: Date | null;
  freshnessStatus: PostPulseStatus;
  freshnessAgeDays: number | null;
  latestJobId: string | null;
};

export async function listPostPulseRecordsForUser(userId: string): Promise<PostPulseRecord[]> {
  const posts = await prisma.post.findMany({
    where: {
      jobs: {
        some: {
          userId,
        },
      },
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
    },
  });

  return posts
    .map((post) => {
      const jobs = post.jobs;
      const generatedPins = jobs.flatMap((job) => job.generatedPins);
      const scheduledItems = generatedPins.flatMap((pin) => pin.scheduleRunItems);
    const lastGeneratedAt =
      generatedPins.reduce<Date | null>(
        (latest, pin) => (!latest || pin.createdAt > latest ? pin.createdAt : latest),
        null,
      ) ?? null;
    const lastScheduledAt =
      scheduledItems.reduce<Date | null>((latest, item) => {
        if (!item.scheduledFor) {
          return latest;
        }
        return !latest || item.scheduledFor > latest ? item.scheduledFor : latest;
      }, null) ?? null;
    const freshnessAgeDays = lastScheduledAt
      ? Math.floor((Date.now() - lastScheduledAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

      return {
        postId: post.id,
        title: post.title,
        url: post.url,
        domain: post.domain,
        totalJobs: jobs.length,
        totalGeneratedPins: generatedPins.length,
        totalScheduledPins: scheduledItems.length,
        lastGeneratedAt,
        lastScheduledAt,
        freshnessStatus: resolveFreshnessStatus({
          totalGeneratedPins: generatedPins.length,
          lastScheduledAt,
        }),
        freshnessAgeDays,
        latestJobId: jobs[0]?.id ?? null,
      };
    })
    .sort((left, right) => {
      const statusWeight = (status: PostPulseStatus) => {
        switch (status) {
          case "needs_fresh_pins":
            return 0;
          case "never_published":
            return 1;
          case "no_pins_yet":
            return 2;
          case "fresh":
          default:
            return 3;
        }
      };

      const statusDelta = statusWeight(left.freshnessStatus) - statusWeight(right.freshnessStatus);
      if (statusDelta !== 0) {
        return statusDelta;
      }

      const leftTimestamp = left.lastScheduledAt?.getTime() ?? left.lastGeneratedAt?.getTime() ?? 0;
      const rightTimestamp = right.lastScheduledAt?.getTime() ?? right.lastGeneratedAt?.getTime() ?? 0;
      return rightTimestamp - leftTimestamp;
    });
}

export function buildPostPulseSummary(records: PostPulseRecord[]) {
  return {
    postsTracked: records.length,
    needsFreshPins: records.filter((record) => record.freshnessStatus === "needs_fresh_pins").length,
    neverPublished: records.filter((record) => record.freshnessStatus === "never_published").length,
    fresh: records.filter((record) => record.freshnessStatus === "fresh").length,
    noPinsYet: records.filter((record) => record.freshnessStatus === "no_pins_yet").length,
  };
}

function resolveFreshnessStatus(input: {
  totalGeneratedPins: number;
  lastScheduledAt: Date | null;
}): PostPulseStatus {
  if (input.totalGeneratedPins === 0) {
    return "no_pins_yet";
  }

  if (!input.lastScheduledAt) {
    return "never_published";
  }

  const ageDays = Math.floor((Date.now() - input.lastScheduledAt.getTime()) / (1000 * 60 * 60 * 24));
  return ageDays >= 30 ? "needs_fresh_pins" : "fresh";
}
