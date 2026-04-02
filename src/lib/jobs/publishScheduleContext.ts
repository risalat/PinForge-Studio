import { ScheduleRunItemStatus } from "@prisma/client";
import {
  addDays,
  createUtcDateForTimeZone,
  DEFAULT_PUBLISH_TIMEZONE,
  getTimeZoneDateParts,
  MIN_URL_SPACING_DAYS,
  toTimeZoneDateKey,
} from "@/lib/jobs/publishTiming";
import { findNextPublishSlotWithCapacity, getPublishQueueCapacitySummary } from "@/lib/jobs/publishQueueCapacity";
import { prisma } from "@/lib/prisma";
import type { PublishScheduleContext } from "@/lib/types";

const MAX_SPACING_DAYS = 30;
const DEFAULT_PUBLISH_HOUR = 9;
const DEFAULT_PUBLISH_MINUTE = 0;
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
  const spacingRecommendedFirstPublishAt = anchorAt
    ? addDays(anchorAt, MIN_URL_SPACING_DAYS)
    : null;
  const spacingAnchor =
    spacingRecommendedFirstPublishAt && spacingRecommendedFirstPublishAt > now
      ? spacingRecommendedFirstPublishAt
      : null;
  const recommendationBase = latestScheduledAt
    ? spacingAnchor ?? now
    : resolvePreferredPublishAnchor(spacingAnchor ?? now);
  const queueCapacity = await getPublishQueueCapacitySummary({
    userId: input.userId,
    workspaceId,
    fromDate: recommendationBase,
    days: 10,
  });
  const nextAvailableSlot = await findNextPublishSlotWithCapacity({
    userId: input.userId,
    workspaceId,
    fromDate: recommendationBase,
  });
  const queueAwareSuggestedFirstPublishAt = nextAvailableSlot ?? spacingRecommendedFirstPublishAt;
  const recommendationBaseDateKey = toUtcDateKey(recommendationBase);
  const nextAvailableDateKey = nextAvailableSlot ? toUtcDateKey(nextAvailableSlot) : null;
  const queueSuggestionReason =
    nextAvailableDateKey &&
    nextAvailableDateKey !== recommendationBaseDateKey
      ? `${formatDateKey(recommendationBaseDateKey)} has no safe publish slot in the current window.`
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
    scheduledCountsByDate: queueCapacity.scheduledCountsByDate,
    occupiedMinutesByDate: queueCapacity.occupiedMinutesByDate,
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

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

const toUtcDateKey = toTimeZoneDateKey;

function formatDateKey(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function resolvePreferredPublishAnchor(fromDate: Date) {
  const zonedDateParts = getTimeZoneDateParts(fromDate, DEFAULT_PUBLISH_TIMEZONE);
  const sameDayAnchor = createUtcDateForTimeZone({
    ...zonedDateParts,
    hour: DEFAULT_PUBLISH_HOUR,
    minute: DEFAULT_PUBLISH_MINUTE,
    second: 0,
    millisecond: 0,
    timeZone: DEFAULT_PUBLISH_TIMEZONE,
  });

  if (sameDayAnchor > fromDate) {
    return sameDayAnchor;
  }

  const nextDay = addDays(sameDayAnchor, 1);
  const nextDayParts = getTimeZoneDateParts(nextDay, DEFAULT_PUBLISH_TIMEZONE);
  return createUtcDateForTimeZone({
    ...nextDayParts,
    hour: DEFAULT_PUBLISH_HOUR,
    minute: DEFAULT_PUBLISH_MINUTE,
    second: 0,
    millisecond: 0,
    timeZone: DEFAULT_PUBLISH_TIMEZONE,
  });
}

