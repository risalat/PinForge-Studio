import { PublicationRecordState, ScheduleRunItemStatus } from "@prisma/client";
import {
  addDateKeyDays,
  DEFAULT_PUBLISH_TIMEZONE,
  getTimeZoneMinuteOfDay,
  startOfTimeZoneDay,
  toTimeZoneDateKey,
} from "@/lib/jobs/publishTiming";
import { buildCapacityAwareSchedulePreview } from "@/lib/jobs/schedulePreview";
import { prisma } from "@/lib/prisma";
import { getWorkspaceProfileForUserId } from "@/lib/settings/integrationSettings";
import type { PublishQueueDaySummary } from "@/lib/types";

const DEFAULT_DAILY_PUBLISH_TARGET = 20;
const NEXT_AVAILABLE_SCAN_DAYS = 60;

type QueueCapacityModel = {
  targetPerDay: number;
  todayDate: string;
  countsByDate: Map<string, number>;
  occupiedMinutesByDate: Map<string, number[]>;
};

export async function getPublishQueueCapacitySummary(input: {
  userId: string;
  workspaceId?: string;
  days?: number;
  fromDate?: Date;
}) {
  const model = await loadPublishQueueCapacityModel(input);
  return {
    targetPerDay: model.targetPerDay,
    todayDate: model.todayDate,
    todayScheduledCount: model.countsByDate.get(model.todayDate) ?? 0,
    upcomingDays: buildUpcomingQueueDays({
      countsByDate: model.countsByDate,
      targetPerDay: model.targetPerDay,
      fromDate: input.fromDate ?? new Date(),
      days: input.days ?? 7,
      todayDate: model.todayDate,
    }),
    scheduledCountsByDate: Object.fromEntries(model.countsByDate),
    occupiedMinutesByDate: Object.fromEntries(model.occupiedMinutesByDate),
    nextAvailableDate: findNextAvailableDate({
      countsByDate: model.countsByDate,
      targetPerDay: model.targetPerDay,
      fromDate: input.fromDate ?? new Date(),
    }),
  };
}

export async function findNextPublishSlotWithCapacity(input: {
  userId: string;
  workspaceId?: string;
  fromDate: Date;
}) {
  const model = await loadPublishQueueCapacityModel(input);
  const preview = buildCapacityAwareSchedulePreview({
    pinIds: ["__recommended__"],
    firstPublishAt: input.fromDate,
    intervalMinutes: 0,
    jitterMinutes: 0,
    targetPerDay: model.targetPerDay,
    existingScheduledCountsByDate: Object.fromEntries(model.countsByDate),
    existingScheduledMinutesByDate: Object.fromEntries(model.occupiedMinutesByDate),
  });

  return preview[0]?.scheduledFor ?? null;
}

async function loadPublishQueueCapacityModel(input: {
  userId: string;
  workspaceId?: string;
  fromDate?: Date;
}) {
  const workspaceId = input.workspaceId?.trim() ?? "";
  const rangeStart = startOfTimeZoneDay(
    input.fromDate ?? new Date(),
    DEFAULT_PUBLISH_TIMEZONE,
  );
  const profile = await getWorkspaceProfileForUserId(input.userId, workspaceId);
  const targetPerDay =
    profile?.dailyPublishTarget && profile.dailyPublishTarget > 0
      ? profile.dailyPublishTarget
      : DEFAULT_DAILY_PUBLISH_TARGET;

  const [publicationRecords, localScheduledItems] = await Promise.all([
    prisma.publicationRecord.findMany({
      where: {
        userId: input.userId,
        state: PublicationRecordState.SCHEDULED,
        scheduledAt: {
          gte: rangeStart,
        },
        ...(workspaceId ? { providerWorkspaceId: workspaceId } : {}),
      },
      select: {
        generatedPinId: true,
        scheduledAt: true,
      },
    }),
    prisma.scheduleRunItem.findMany({
      where: {
        status: ScheduleRunItemStatus.SCHEDULED,
        scheduledFor: {
          gte: rangeStart,
        },
        generatedPin: {
          job: {
            userId: input.userId,
          },
        },
        ...(workspaceId ? { scheduleRun: { workspaceId } } : {}),
      },
      select: {
        generatedPinId: true,
        scheduledFor: true,
      },
    }),
  ]);

  const countsByDate = new Map<string, number>();
  const occupiedMinutesByDate = new Map<string, number[]>();
  const syncedGeneratedPinIds = new Set(
    publicationRecords
      .map((record) => record.generatedPinId)
      .filter((generatedPinId): generatedPinId is string => Boolean(generatedPinId)),
  );

  for (const record of publicationRecords) {
    if (!record.scheduledAt) {
      continue;
    }
    const dateKey = toTimeZoneDateKey(record.scheduledAt, DEFAULT_PUBLISH_TIMEZONE);
    incrementCount(countsByDate, dateKey);
    recordOccupiedMinute(
      occupiedMinutesByDate,
      dateKey,
      getTimeZoneMinuteOfDay(record.scheduledAt, DEFAULT_PUBLISH_TIMEZONE),
    );
  }

  const dedupedLocalPins = new Map<string, Date>();
  for (const item of localScheduledItems) {
    if (!item.scheduledFor || syncedGeneratedPinIds.has(item.generatedPinId)) {
      continue;
    }

    const current = dedupedLocalPins.get(item.generatedPinId);
    if (!current || item.scheduledFor > current) {
      dedupedLocalPins.set(item.generatedPinId, item.scheduledFor);
    }
  }

  for (const scheduledFor of dedupedLocalPins.values()) {
    const dateKey = toTimeZoneDateKey(scheduledFor, DEFAULT_PUBLISH_TIMEZONE);
    incrementCount(countsByDate, dateKey);
    recordOccupiedMinute(
      occupiedMinutesByDate,
      dateKey,
      getTimeZoneMinuteOfDay(scheduledFor, DEFAULT_PUBLISH_TIMEZONE),
    );
  }

  return {
    targetPerDay,
    todayDate: toTimeZoneDateKey(new Date(), DEFAULT_PUBLISH_TIMEZONE),
    countsByDate,
    occupiedMinutesByDate,
  } satisfies QueueCapacityModel;
}

function buildUpcomingQueueDays(input: {
  countsByDate: Map<string, number>;
  targetPerDay: number;
  fromDate: Date;
  days: number;
  todayDate: string;
}) {
  const results: PublishQueueDaySummary[] = [];
  const startDateKey = toTimeZoneDateKey(input.fromDate, DEFAULT_PUBLISH_TIMEZONE);

  for (let offset = 0; offset < Math.max(1, input.days); offset += 1) {
    const dateKey = addDateKeyDays(startDateKey, offset);
    const scheduledCount = input.countsByDate.get(dateKey) ?? 0;
    results.push({
      date: dateKey,
      scheduledCount,
      remainingCapacity: Math.max(input.targetPerDay - scheduledCount, 0),
      isFull: scheduledCount >= input.targetPerDay,
      isToday: dateKey === input.todayDate,
    });
  }

  return results;
}

function findNextAvailableDate(input: {
  countsByDate: Map<string, number>;
  targetPerDay: number;
  fromDate: Date;
}) {
  const startDateKey = toTimeZoneDateKey(input.fromDate, DEFAULT_PUBLISH_TIMEZONE);

  for (let offset = 0; offset < NEXT_AVAILABLE_SCAN_DAYS; offset += 1) {
    const dateKey = addDateKeyDays(startDateKey, offset);
    const scheduledCount = input.countsByDate.get(dateKey) ?? 0;
    if (scheduledCount < input.targetPerDay) {
      return dateKey;
    }
  }

  return null;
}

function incrementCount(countsByDate: Map<string, number>, dateKey: string) {
  countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
}

function recordOccupiedMinute(
  occupiedMinutesByDate: Map<string, number[]>,
  dateKey: string,
  minuteOfDay: number,
) {
  const current = occupiedMinutesByDate.get(dateKey) ?? [];
  current.push(minuteOfDay);
  occupiedMinutesByDate.set(
    dateKey,
    Array.from(new Set(current)).sort((left, right) => left - right),
  );
}
