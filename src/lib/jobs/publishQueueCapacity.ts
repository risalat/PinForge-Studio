import { PublicationRecordState, ScheduleRunItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getWorkspaceProfileForUserId } from "@/lib/settings/integrationSettings";
import type { PublishQueueDaySummary } from "@/lib/types";

const DEFAULT_DAILY_PUBLISH_TARGET = 20;
const NEXT_AVAILABLE_SCAN_DAYS = 60;

type QueueCapacityModel = {
  targetPerDay: number;
  todayDate: string;
  countsByDate: Map<string, number>;
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
    nextAvailableDate: findNextAvailableDate({
      countsByDate: model.countsByDate,
      targetPerDay: model.targetPerDay,
      fromDate: input.fromDate ?? new Date(),
    }),
  };
}

export async function findNextPublishDateWithCapacity(input: {
  userId: string;
  workspaceId?: string;
  fromDate: Date;
}) {
  const model = await loadPublishQueueCapacityModel(input);
  return findNextAvailableDate({
    countsByDate: model.countsByDate,
    targetPerDay: model.targetPerDay,
    fromDate: input.fromDate,
  });
}

async function loadPublishQueueCapacityModel(input: {
  userId: string;
  workspaceId?: string;
  fromDate?: Date;
}) {
  const workspaceId = input.workspaceId?.trim() ?? "";
  const rangeStart = startOfUtcDay(input.fromDate ?? new Date());
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
  const syncedGeneratedPinIds = new Set(
    publicationRecords
      .map((record) => record.generatedPinId)
      .filter((generatedPinId): generatedPinId is string => Boolean(generatedPinId)),
  );

  for (const record of publicationRecords) {
    if (!record.scheduledAt) {
      continue;
    }
    incrementCount(countsByDate, toUtcDateKey(record.scheduledAt));
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
    incrementCount(countsByDate, toUtcDateKey(scheduledFor));
  }

  return {
    targetPerDay,
    todayDate: toUtcDateKey(new Date()),
    countsByDate,
  } satisfies QueueCapacityModel;
}

function buildUpcomingQueueDays(input: {
  countsByDate: Map<string, number>;
  targetPerDay: number;
  fromDate: Date;
  days: number;
  todayDate: string;
}) {
  const start = startOfUtcDay(input.fromDate);
  const results: PublishQueueDaySummary[] = [];

  for (let offset = 0; offset < Math.max(1, input.days); offset += 1) {
    const currentDate = addUtcDays(start, offset);
    const dateKey = toUtcDateKey(currentDate);
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
  const start = startOfUtcDay(input.fromDate);

  for (let offset = 0; offset < NEXT_AVAILABLE_SCAN_DAYS; offset += 1) {
    const dateKey = toUtcDateKey(addUtcDays(start, offset));
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

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

export function toUtcDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}
