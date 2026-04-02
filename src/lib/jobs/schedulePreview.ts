import {
  addDateKeyDays,
  DEFAULT_PUBLISH_TIMEZONE,
  DEFAULT_PUBLISH_WINDOW_END_MINUTE,
  DEFAULT_PUBLISH_WINDOW_START_MINUTE,
  getTimeZoneMinuteOfDay,
  mergeTimeZoneDateKeyWithMinuteOffset,
  MIN_URL_SPACING_MINUTES,
  toTimeZoneDateKey,
} from "@/lib/jobs/publishTiming";

export type SchedulePreviewItem = {
  pinId: string;
  index: number;
  scheduledFor: Date;
  jitterOffsetMinutes: number;
};

const MIN_INTRADAY_GAP_MINUTES = 45;
const MIN_SLOT_CONFLICT_MINUTES = 30;
const MAX_DAY_SCAN = 365;

export function buildSchedulePreview(input: {
  pinIds: string[];
  firstPublishAt: Date | string;
  intervalMinutes: number;
  jitterMinutes: number;
}) {
  const firstPublishAt = toDate(input.firstPublishAt);
  const effectiveIntervalMinutes = Math.max(
    MIN_URL_SPACING_MINUTES,
    Math.round(input.intervalMinutes),
  );
  const effectiveJitterMinutes = Math.max(0, Math.round(input.jitterMinutes));

  return input.pinIds.map((pinId, index) => {
    const base =
      index === 0
        ? firstPublishAt
        : new Date(firstPublishAt.getTime() + index * effectiveIntervalMinutes * 60 * 1000);
    const jitterOffsetMinutes = computeDeterministicJitterMinutes(
      `${pinId}:${index}:${firstPublishAt.toISOString()}`,
      effectiveJitterMinutes,
    );

    return {
      pinId,
      index,
      scheduledFor: new Date(base.getTime() + jitterOffsetMinutes * 60 * 1000),
      jitterOffsetMinutes,
    } satisfies SchedulePreviewItem;
  });
}

export function buildCapacityAwareSchedulePreview(input: {
  pinIds: string[];
  firstPublishAt: Date | string;
  minimumFirstPublishAt?: Date | string | null;
  intervalMinutes: number;
  jitterMinutes: number;
  targetPerDay: number;
  existingScheduledCountsByDate: Record<string, number>;
  existingScheduledMinutesByDate?: Record<string, number[]>;
}) {
  const firstPublishAt = toDate(input.firstPublishAt);
  const minimumFirstPublishAt = input.minimumFirstPublishAt
    ? toDate(input.minimumFirstPublishAt)
    : null;
  const effectiveIntervalMinutes = Math.max(
    MIN_URL_SPACING_MINUTES,
    Math.round(input.intervalMinutes),
  );
  const effectiveJitterMinutes = Math.max(0, Math.round(input.jitterMinutes));
  const countsByDate = new Map<string, number>(
    Object.entries(input.existingScheduledCountsByDate).map(([date, count]) => [date, count]),
  );
  const occupiedMinutesByDate = new Map<string, number[]>(
    Object.entries(input.existingScheduledMinutesByDate ?? {}).map(([date, minutes]) => [
      date,
      normalizeMinuteOffsets(minutes),
    ]),
  );
  const targetPerDay = Math.max(input.targetPerDay, 1);
  let previousScheduledFor: Date | null = null;

  return input.pinIds.map((pinId, index) => {
    const baseAt =
      index === 0
        ? maxDate(firstPublishAt, minimumFirstPublishAt)
        : new Date(
            (previousScheduledFor ?? firstPublishAt).getTime() +
              effectiveIntervalMinutes * 60 * 1000,
          );
    const earliestAllowedAt = baseAt;
    const baseMinuteOfDay = clampMinuteToPublishWindow(
      getTimeZoneMinuteOfDay(baseAt, DEFAULT_PUBLISH_TIMEZONE),
    );
    const jitterOffsetMinutes = computeDeterministicJitterMinutes(
      `${pinId}:${index}:${baseAt.toISOString()}`,
      effectiveJitterMinutes,
    );
    const candidateTimes = buildCandidateTimes({
      baseAt,
      earliestAllowedAt,
      jitterOffsetMinutes,
    });

    let scheduledFor: Date | null = null;
    let latestTriedDateKey = toTimeZoneDateKey(baseAt, DEFAULT_PUBLISH_TIMEZONE);

    for (const candidateAt of candidateTimes) {
      const candidateDateKey = toTimeZoneDateKey(candidateAt, DEFAULT_PUBLISH_TIMEZONE);
      latestTriedDateKey =
        candidateDateKey > latestTriedDateKey ? candidateDateKey : latestTriedDateKey;
      scheduledFor = tryScheduleOnDate({
        dateKey: candidateDateKey,
        targetMinuteOfDay: clampMinuteToPublishWindow(
          getTimeZoneMinuteOfDay(candidateAt, DEFAULT_PUBLISH_TIMEZONE),
        ),
        earliestAllowedAt,
        targetPerDay,
        countsByDate,
        occupiedMinutesByDate,
      });
      if (scheduledFor) {
        break;
      }
    }

    if (!scheduledFor) {
      let currentDateKey = addDateKeyDays(latestTriedDateKey, 1);
      for (let offset = 0; offset < MAX_DAY_SCAN; offset += 1) {
        scheduledFor = tryScheduleOnDate({
          dateKey: currentDateKey,
          targetMinuteOfDay: baseMinuteOfDay,
          earliestAllowedAt,
          targetPerDay,
          countsByDate,
          occupiedMinutesByDate,
        });
        if (scheduledFor) {
          break;
        }
        currentDateKey = addDateKeyDays(currentDateKey, 1);
      }
    }

    if (!scheduledFor) {
      throw new Error("Unable to find a publish slot inside the allowed window.");
    }

    previousScheduledFor = scheduledFor;

    return {
      pinId,
      index,
      scheduledFor,
      jitterOffsetMinutes,
    } satisfies SchedulePreviewItem;
  });
}

function buildCandidateTimes(input: {
  baseAt: Date;
  earliestAllowedAt: Date;
  jitterOffsetMinutes: number;
}) {
  const candidates = [input.baseAt];
  const jitterMagnitudeMinutes = Math.abs(input.jitterOffsetMinutes);

  if (jitterMagnitudeMinutes > 0) {
    candidates.push(
      new Date(input.baseAt.getTime() + jitterMagnitudeMinutes * 60 * 1000),
      new Date(input.baseAt.getTime() - jitterMagnitudeMinutes * 60 * 1000),
    );
  }

  const seen = new Set<string>();
  return candidates.filter((candidateAt) => {
    if (candidateAt < input.earliestAllowedAt) {
      return false;
    }

    const key = candidateAt.toISOString();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function tryScheduleOnDate(input: {
  dateKey: string;
  targetMinuteOfDay: number;
  earliestAllowedAt: Date;
  targetPerDay: number;
  countsByDate: Map<string, number>;
  occupiedMinutesByDate: Map<string, number[]>;
}) {
  const existingCount = input.countsByDate.get(input.dateKey) ?? 0;
  if (existingCount >= input.targetPerDay) {
    return null;
  }

  const occupiedMinutes = input.occupiedMinutesByDate.get(input.dateKey) ?? [];
  const slotMinutes = buildDailySlotMinutes(input.targetPerDay);
  const earliestDateKey = toTimeZoneDateKey(input.earliestAllowedAt, DEFAULT_PUBLISH_TIMEZONE);
  const rawEarliestMinuteOfDay =
    input.dateKey === earliestDateKey
      ? getTimeZoneMinuteOfDay(input.earliestAllowedAt, DEFAULT_PUBLISH_TIMEZONE)
      : DEFAULT_PUBLISH_WINDOW_START_MINUTE;
  if (rawEarliestMinuteOfDay > DEFAULT_PUBLISH_WINDOW_END_MINUTE) {
    return null;
  }
  const earliestMinuteOfDay = Math.max(
    DEFAULT_PUBLISH_WINDOW_START_MINUTE,
    rawEarliestMinuteOfDay,
  );

  const availableSlots = slotMinutes
    .filter((minute) => minute >= earliestMinuteOfDay)
    .sort((left, right) => {
      const leftDistance = Math.abs(left - input.targetMinuteOfDay);
      const rightDistance = Math.abs(right - input.targetMinuteOfDay);
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }
      return left - right;
    });

  if (availableSlots.length === 0) {
    return null;
  }

  const slotGapMinutes = computeIntradayGapMinutes(input.targetPerDay);
  const conflictWindowMinutes = Math.max(
    MIN_SLOT_CONFLICT_MINUTES,
    Math.floor(slotGapMinutes / 2),
  );

  for (const slotMinute of availableSlots) {
    const conflicts = occupiedMinutes.some(
      (occupiedMinute) => Math.abs(occupiedMinute - slotMinute) < conflictWindowMinutes,
    );
    if (conflicts) {
      continue;
    }

    input.countsByDate.set(input.dateKey, existingCount + 1);
    const nextOccupiedMinutes = [...occupiedMinutes, slotMinute];
    input.occupiedMinutesByDate.set(
      input.dateKey,
      normalizeMinuteOffsets(nextOccupiedMinutes),
    );

    return mergeTimeZoneDateKeyWithMinuteOffset(
      input.dateKey,
      slotMinute,
      DEFAULT_PUBLISH_TIMEZONE,
    );
  }

  return null;
}

function buildDailySlotMinutes(targetPerDay: number) {
  const effectiveTarget = Math.max(targetPerDay, 1);
  if (effectiveTarget === 1) {
    return [DEFAULT_PUBLISH_WINDOW_START_MINUTE];
  }

  const windowSpanMinutes =
    DEFAULT_PUBLISH_WINDOW_END_MINUTE - DEFAULT_PUBLISH_WINDOW_START_MINUTE;

  return Array.from({ length: effectiveTarget }, (_, index) =>
    Math.round(
      DEFAULT_PUBLISH_WINDOW_START_MINUTE +
        (windowSpanMinutes * index) / Math.max(effectiveTarget - 1, 1),
    ),
  );
}

function computeDeterministicJitterMinutes(seed: string, maxMinutes: number) {
  if (maxMinutes <= 0) {
    return 0;
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return (hash % (maxMinutes * 2 + 1)) - maxMinutes;
}

function computeIntradayGapMinutes(targetPerDay: number) {
  const effectiveTarget = Math.max(targetPerDay, 1);
  if (effectiveTarget === 1) {
    return DEFAULT_PUBLISH_WINDOW_END_MINUTE - DEFAULT_PUBLISH_WINDOW_START_MINUTE;
  }

  return Math.max(
    MIN_INTRADAY_GAP_MINUTES,
    Math.floor(
      (DEFAULT_PUBLISH_WINDOW_END_MINUTE - DEFAULT_PUBLISH_WINDOW_START_MINUTE) /
        Math.max(effectiveTarget - 1, 1),
    ),
  );
}

function normalizeMinuteOffsets(minutes: number[]) {
  return Array.from(
    new Set(
      minutes
        .map((minute) => Math.max(0, Math.min(23 * 60 + 59, Math.round(minute))))
        .filter((minute) => Number.isFinite(minute)),
    ),
  ).sort((left, right) => left - right);
}

function clampMinuteToPublishWindow(minute: number) {
  return Math.max(
    DEFAULT_PUBLISH_WINDOW_START_MINUTE,
    Math.min(DEFAULT_PUBLISH_WINDOW_END_MINUTE, Math.round(minute)),
  );
}

function toDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error("Provide a valid first publish datetime.");
  }

  return date;
}

function maxDate(primary: Date, secondary: Date | null) {
  if (!secondary) {
    return primary;
  }
  return primary > secondary ? primary : secondary;
}
