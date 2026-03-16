export type SchedulePreviewItem = {
  pinId: string;
  index: number;
  scheduledFor: Date;
  jitterOffsetMinutes: number;
};

const MIN_INTRADAY_GAP_MINUTES = 45;
const SPREAD_WINDOW_MINUTES = 12 * 60;

export function buildSchedulePreview(input: {
  pinIds: string[];
  firstPublishAt: Date | string;
  intervalMinutes: number;
  jitterMinutes: number;
}) {
  const firstPublishAt = toDate(input.firstPublishAt);

  return input.pinIds.map((pinId, index) => {
    const base = new Date(firstPublishAt.getTime() + index * input.intervalMinutes * 60 * 1000);
    const jitterOffsetMinutes = computeDeterministicJitterMinutes(
      `${pinId}:${index}:${firstPublishAt.toISOString()}`,
      input.jitterMinutes,
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
  intervalMinutes: number;
  jitterMinutes: number;
  targetPerDay: number;
  existingScheduledCountsByDate: Record<string, number>;
}) {
  const naivePreview = buildSchedulePreview(input);
  const countsByDate = new Map<string, number>(
    Object.entries(input.existingScheduledCountsByDate).map(([date, count]) => [date, count]),
  );
  const preferredMinuteOfDay = getUtcMinuteOfDay(toDate(input.firstPublishAt));
  const slotGapMinutes = computeIntradayGapMinutes(input.targetPerDay);

  return naivePreview.map((item) => {
    let targetDate = startOfUtcDay(item.scheduledFor);
    let dateKey = toUtcDateKey(targetDate);

    while ((countsByDate.get(dateKey) ?? 0) >= input.targetPerDay) {
      targetDate = addUtcDays(targetDate, 1);
      dateKey = toUtcDateKey(targetDate);
    }

    const daySlotIndex = countsByDate.get(dateKey) ?? 0;
    countsByDate.set(dateKey, daySlotIndex + 1);

    return {
      ...item,
      scheduledFor: mergeUtcDateWithMinuteOffset(
        targetDate,
        preferredMinuteOfDay + daySlotIndex * slotGapMinutes,
      ),
    } satisfies SchedulePreviewItem;
  });
}

function computeDeterministicJitterMinutes(seed: string, maxMinutes: number) {
  if (maxMinutes <= 0) {
    return 0;
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % (maxMinutes + 1);
}

function toDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error("Provide a valid first publish datetime.");
  }

  return date;
}

function computeIntradayGapMinutes(targetPerDay: number) {
  const effectiveTarget = Math.max(targetPerDay, 1);
  return Math.max(MIN_INTRADAY_GAP_MINUTES, Math.floor(SPREAD_WINDOW_MINUTES / effectiveTarget));
}

function getUtcMinuteOfDay(value: Date) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function toUtcDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mergeUtcDateWithMinuteOffset(date: Date, minuteOffset: number) {
  const safeMinuteOffset = Math.max(0, Math.min(23 * 60 + 59, minuteOffset));
  const hours = Math.floor(safeMinuteOffset / 60);
  const minutes = safeMinuteOffset % 60;

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
      0,
      0,
    ),
  );
}
