import { ScheduleRunItemStatus } from "@prisma/client";
import { findNextPublishDateWithCapacity, getPublishQueueCapacitySummary } from "@/lib/jobs/publishQueueCapacity";
import { prisma } from "@/lib/prisma";
import type { PublishScheduleContext } from "@/lib/types";

const MIN_SPACING_DAYS = 25;
const MAX_SPACING_DAYS = 30;
const DEFAULT_PUBLISH_TIMEZONE = "America/New_York";
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
  const spacingRecommendedFirstPublishAt = anchorAt ? addDays(anchorAt, MIN_SPACING_DAYS) : null;
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

function getTimeZoneDateParts(value: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(value);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? 0),
    month: Number(parts.find((part) => part.type === "month")?.value ?? 0),
    day: Number(parts.find((part) => part.type === "day")?.value ?? 0),
  };
}

function createUtcDateForTimeZone(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  timeZone: string;
}) {
  const utcGuess = new Date(
    Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute,
      input.second,
      input.millisecond,
    ),
  );
  const offset = getTimeZoneOffset(utcGuess, input.timeZone);
  return new Date(utcGuess.getTime() - offset);
}

function getTimeZoneOffset(value: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(value);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 1);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 1);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const second = Number(parts.find((part) => part.type === "second")?.value ?? 0);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  return asUtc - value.getTime();
}
