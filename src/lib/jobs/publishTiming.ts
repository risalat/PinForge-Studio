export const DEFAULT_PUBLISH_TIMEZONE = "America/New_York";
export const DEFAULT_PUBLISH_WINDOW_START_MINUTE = 9 * 60;
export const DEFAULT_PUBLISH_WINDOW_END_MINUTE = 22 * 60;
export const MIN_SCHEDULE_INTERVAL_MINUTES = 1;
export const MIN_URL_SPACING_DAYS = 15;
export const MIN_URL_SPACING_MINUTES = MIN_URL_SPACING_DAYS * 24 * 60;

export function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addDateKeyDays(dateKey: string, days: number) {
  const parts = parseDateKey(dateKey);
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatDateKey({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
}

export function toTimeZoneDateKey(
  value: Date,
  timeZone = DEFAULT_PUBLISH_TIMEZONE,
) {
  const parts = getTimeZoneDateParts(value, timeZone);
  return formatDateKey(parts);
}

export function getTimeZoneMinuteOfDay(
  value: Date,
  timeZone = DEFAULT_PUBLISH_TIMEZONE,
) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(value);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function startOfTimeZoneDay(
  value: Date,
  timeZone = DEFAULT_PUBLISH_TIMEZONE,
) {
  const parts = getTimeZoneDateParts(value, timeZone);
  return createUtcDateForTimeZone({
    ...parts,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    timeZone,
  });
}

export function mergeTimeZoneDateKeyWithMinuteOffset(
  dateKey: string,
  minuteOffset: number,
  timeZone = DEFAULT_PUBLISH_TIMEZONE,
) {
  const parts = parseDateKey(dateKey);
  const safeMinuteOffset = Math.max(0, Math.min(23 * 60 + 59, Math.round(minuteOffset)));
  const hour = Math.floor(safeMinuteOffset / 60);
  const minute = safeMinuteOffset % 60;

  return createUtcDateForTimeZone({
    ...parts,
    hour,
    minute,
    second: 0,
    millisecond: 0,
    timeZone,
  });
}

export function parseDateTimeInputInTimeZone(
  value: string,
  timeZone = DEFAULT_PUBLISH_TIMEZONE,
) {
  const match = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "0"] = match;
  return createUtcDateForTimeZone({
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: 0,
    timeZone,
  });
}

export function formatDateTimeInputInTimeZone(
  value: Date | string,
  timeZone = DEFAULT_PUBLISH_TIMEZONE,
) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const dateParts = getTimeZoneDateParts(date, timeZone);
  const minuteOfDay = getTimeZoneMinuteOfDay(date, timeZone);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;

  return `${formatDateKey(dateParts)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function getTimeZoneDateParts(
  value: Date,
  timeZone = DEFAULT_PUBLISH_TIMEZONE,
) {
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

export function createUtcDateForTimeZone(input: {
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

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map((part) => Number(part));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    throw new Error("Invalid publish date key.");
  }

  return { year, month, day };
}

function formatDateKey(input: { year: number; month: number; day: number }) {
  return `${String(input.year).padStart(4, "0")}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`;
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
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 0);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const second = Number(parts.find((part) => part.type === "second")?.value ?? 0);

  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  return asUtc - value.getTime();
}
