import { ScheduleRunItemStatus } from "@prisma/client";
import { findNextPublishDateWithCapacity, getPublishQueueCapacitySummary } from "@/lib/jobs/publishQueueCapacity";
import { prisma } from "@/lib/prisma";
import type { PublishScheduleContext } from "@/lib/types";

const MIN_SPACING_DAYS = 25;
const MAX_SPACING_DAYS = 30;
const PUBLICATION_RECORD_STATE = {
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  PUBLISHED_POSTED: "PUBLISHED_POSTED",
  OTHER: "OTHER",
} as const;

type PublicationRecordStateValue =
  (typeof PUBLICATION_RECORD_STATE)[keyof typeof PUBLICATION_RECORD_STATE];

export async function getPublishScheduleContextForPost(input: {
  userId: string;
  postId: string;
  workspaceId?: string;
}): Promise<PublishScheduleContext> {
  const workspaceId = input.workspaceId?.trim() ?? "";
  const now = new Date();

  const [publicationRecords, localScheduledItems] = await Promise.all([
    prisma.publicationRecord.findMany({
      where: {
        userId: input.userId,
        postId: input.postId,
        ...(workspaceId ? { providerWorkspaceId: workspaceId } : {}),
      },
      select: {
        state: true,
        scheduledAt: true,
        publishedAt: true,
      },
    }),
    prisma.scheduleRunItem.findMany({
      where: {
        status: ScheduleRunItemStatus.SCHEDULED,
        generatedPin: {
          job: {
            userId: input.userId,
            postId: input.postId,
          },
        },
        ...(workspaceId ? { scheduleRun: { workspaceId } } : {}),
      },
      select: {
        scheduledFor: true,
      },
    }),
  ]);

  const latestScheduledAt = maxDate([
    ...publicationRecords
      .filter(
        (record) =>
          record.state === PUBLICATION_RECORD_STATE.SCHEDULED &&
          record.scheduledAt &&
          record.scheduledAt >= now,
      )
      .map((record) => record.scheduledAt as Date),
    ...localScheduledItems
      .map((item) => item.scheduledFor)
      .filter((scheduledFor): scheduledFor is Date => Boolean(scheduledFor && scheduledFor >= now)),
  ]);

  const latestPublishedAt = maxDate(
    publicationRecords
      .filter((record) => isPublishedState(record.state))
      .map((record) => record.publishedAt ?? record.scheduledAt)
      .filter((value): value is Date => Boolean(value)),
  );

  const anchorAt = latestScheduledAt ?? latestPublishedAt;
  const anchorSource = latestScheduledAt
    ? "scheduled"
    : latestPublishedAt
      ? "published"
      : "none";
  const spacingRecommendedFirstPublishAt = anchorAt ? addDays(anchorAt, MIN_SPACING_DAYS) : null;
  const recommendationBase = spacingRecommendedFirstPublishAt ?? now;
  const queueCapacity = await getPublishQueueCapacitySummary({
    userId: input.userId,
    workspaceId,
    fromDate: recommendationBase,
    days: 10,
  });
  const nextAvailableDate = await findNextPublishDateWithCapacity({
    userId: input.userId,
    workspaceId,
    fromDate: recommendationBase,
  });
  const queueAwareSuggestedFirstPublishAt = nextAvailableDate
    ? mergeDateWithTime(nextAvailableDate, recommendationBase)
    : spacingRecommendedFirstPublishAt;
  const recommendationBaseDateKey = toUtcDateKey(recommendationBase);
  const queueSuggestionReason =
    nextAvailableDate &&
    nextAvailableDate !== recommendationBaseDateKey
      ? `${formatDateKey(recommendationBaseDateKey)} is already at the daily target.`
      : null;

  return {
    workspaceId,
    latestScheduledAt: toIsoString(latestScheduledAt),
    latestPublishedAt: toIsoString(latestPublishedAt),
    anchorAt: toIsoString(anchorAt),
    anchorSource,
    recommendedFirstPublishAt: toIsoString(queueAwareSuggestedFirstPublishAt),
    spacingRecommendedFirstPublishAt: toIsoString(spacingRecommendedFirstPublishAt),
    recommendedWindowEndAt: toIsoString(anchorAt ? addDays(anchorAt, MAX_SPACING_DAYS) : null),
    dailyPublishTarget: queueCapacity.targetPerDay,
    todayScheduledCount: queueCapacity.todayScheduledCount,
    upcomingQueueDays: queueCapacity.upcomingDays,
    queueAwareSuggestedFirstPublishAt: toIsoString(queueAwareSuggestedFirstPublishAt),
    queueSuggestionReason,
    hasPendingSchedule: Boolean(latestScheduledAt),
  };
}

function isPublishedState(state: PublicationRecordStateValue) {
  return (
    state === PUBLICATION_RECORD_STATE.PUBLISHED ||
    state === PUBLICATION_RECORD_STATE.PUBLISHED_POSTED
  );
}

function maxDate(values: Date[]) {
  return values.reduce<Date | null>(
    (latest, current) => (!latest || current > latest ? current : latest),
    null,
  );
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function mergeDateWithTime(dateKey: string, timeSource: Date) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      timeSource.getUTCHours(),
      timeSource.getUTCMinutes(),
      timeSource.getUTCSeconds(),
      timeSource.getUTCMilliseconds(),
    ),
  );
}

function toUtcDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDateKey(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
