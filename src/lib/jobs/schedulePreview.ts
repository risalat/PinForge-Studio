export type SchedulePreviewItem = {
  pinId: string;
  index: number;
  scheduledFor: Date;
  jitterOffsetMinutes: number;
};

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
