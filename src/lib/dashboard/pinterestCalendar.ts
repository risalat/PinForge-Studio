export type PinterestCalendarEventType = "single" | "seasonal";

export type PinterestCalendarEvent = {
  slug: string;
  name: string;
  type: PinterestCalendarEventType;
  eventStartAt: string;
  eventEndAt: string;
  assetPackageDueAt: string;
  firstPinAt: string;
  pinEndsAt: string;
};

export type DashboardCalendarNotification = {
  id: string;
  title: string;
  message: string;
  tone: "info" | "progress" | "success" | "error";
  stageLabel: "Asset due" | "Start now" | "Active" | "Stop now" | "Upcoming";
  href: string;
  ctaLabel: string;
  sortOrder: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const pinterestCalendarEvents: PinterestCalendarEvent[] = [
  { slug: "easter-2026", name: "Easter", type: "single", eventStartAt: "2026-04-05", eventEndAt: "2026-04-05", assetPackageDueAt: "2026-02-01", firstPinAt: "2026-02-08", pinEndsAt: "2026-04-05" },
  { slug: "spring-cleaning-home-organization-2026", name: "Spring cleaning & home organization", type: "seasonal", eventStartAt: "2026-04-10", eventEndAt: "2026-05-31", assetPackageDueAt: "2026-02-06", firstPinAt: "2026-02-13", pinEndsAt: "2026-05-31" },
  { slug: "tax-day-us-2026", name: "Tax Day (US)", type: "single", eventStartAt: "2026-04-15", eventEndAt: "2026-04-15", assetPackageDueAt: "2026-02-11", firstPinAt: "2026-02-18", pinEndsAt: "2026-04-15" },
  { slug: "earth-day-2026", name: "Earth Day", type: "single", eventStartAt: "2026-04-22", eventEndAt: "2026-04-22", assetPackageDueAt: "2026-02-18", firstPinAt: "2026-02-25", pinEndsAt: "2026-04-22" },
  { slug: "cinco-de-mayo-2026", name: "Cinco de Mayo", type: "single", eventStartAt: "2026-05-05", eventEndAt: "2026-05-05", assetPackageDueAt: "2026-03-03", firstPinAt: "2026-03-10", pinEndsAt: "2026-05-05" },
  { slug: "mothers-day-2026", name: "Mother’s Day", type: "single", eventStartAt: "2026-05-10", eventEndAt: "2026-05-10", assetPackageDueAt: "2026-03-08", firstPinAt: "2026-03-15", pinEndsAt: "2026-05-10" },
  { slug: "patio-season-outdoor-living-2026", name: "Patio season & outdoor living", type: "seasonal", eventStartAt: "2026-05-15", eventEndAt: "2026-08-31", assetPackageDueAt: "2026-03-13", firstPinAt: "2026-03-20", pinEndsAt: "2026-08-31" },
  { slug: "memorial-day-us-2026", name: "Memorial Day (US)", type: "single", eventStartAt: "2026-05-25", eventEndAt: "2026-05-25", assetPackageDueAt: "2026-03-23", firstPinAt: "2026-03-30", pinEndsAt: "2026-05-25" },
  { slug: "graduation-season-2026", name: "Graduation season", type: "seasonal", eventStartAt: "2026-06-01", eventEndAt: "2026-06-30", assetPackageDueAt: "2026-03-30", firstPinAt: "2026-04-06", pinEndsAt: "2026-06-30" },
  { slug: "wedding-season-2026", name: "Wedding season", type: "seasonal", eventStartAt: "2026-06-15", eventEndAt: "2026-09-15", assetPackageDueAt: "2026-04-13", firstPinAt: "2026-04-20", pinEndsAt: "2026-09-15" },
  { slug: "pride-month-2026", name: "Pride Month", type: "seasonal", eventStartAt: "2026-06-15", eventEndAt: "2026-06-30", assetPackageDueAt: "2026-04-13", firstPinAt: "2026-04-20", pinEndsAt: "2026-06-30" },
  { slug: "juneteenth-2026", name: "Juneteenth", type: "single", eventStartAt: "2026-06-19", eventEndAt: "2026-06-19", assetPackageDueAt: "2026-04-17", firstPinAt: "2026-04-24", pinEndsAt: "2026-06-19" },
  { slug: "bbq-grilling-season-2026", name: "BBQ & grilling season", type: "seasonal", eventStartAt: "2026-06-20", eventEndAt: "2026-09-07", assetPackageDueAt: "2026-04-18", firstPinAt: "2026-04-25", pinEndsAt: "2026-09-07" },
  { slug: "fathers-day-2026", name: "Father’s Day", type: "single", eventStartAt: "2026-06-21", eventEndAt: "2026-06-21", assetPackageDueAt: "2026-04-19", firstPinAt: "2026-04-26", pinEndsAt: "2026-06-21" },
  { slug: "independence-day-us-2026", name: "Independence Day (US)", type: "single", eventStartAt: "2026-07-04", eventEndAt: "2026-07-04", assetPackageDueAt: "2026-05-02", firstPinAt: "2026-05-09", pinEndsAt: "2026-07-04" },
  { slug: "amazon-prime-day-2026", name: "Amazon Prime Day (approx.)", type: "single", eventStartAt: "2026-07-15", eventEndAt: "2026-07-15", assetPackageDueAt: "2026-05-13", firstPinAt: "2026-05-20", pinEndsAt: "2026-07-15" },
  { slug: "summer-travel-peak-2026", name: "Summer travel peak", type: "seasonal", eventStartAt: "2026-07-15", eventEndAt: "2026-08-31", assetPackageDueAt: "2026-05-13", firstPinAt: "2026-05-20", pinEndsAt: "2026-08-31" },
  { slug: "back-to-school-shopping-supplies-2026", name: "Back-to-school shopping & supplies", type: "seasonal", eventStartAt: "2026-08-05", eventEndAt: "2026-09-15", assetPackageDueAt: "2026-06-03", firstPinAt: "2026-06-10", pinEndsAt: "2026-09-15" },
  { slug: "back-to-school-college-2026", name: "Back to School / College", type: "seasonal", eventStartAt: "2026-08-15", eventEndAt: "2026-09-30", assetPackageDueAt: "2026-06-13", firstPinAt: "2026-06-20", pinEndsAt: "2026-09-30" },
  { slug: "labor-day-us-2026", name: "Labor Day (US)", type: "single", eventStartAt: "2026-09-07", eventEndAt: "2026-09-07", assetPackageDueAt: "2026-07-06", firstPinAt: "2026-07-13", pinEndsAt: "2026-09-07" },
  { slug: "fall-decor-cozy-season-2026", name: "Fall decor & cozy season", type: "seasonal", eventStartAt: "2026-09-15", eventEndAt: "2026-11-01", assetPackageDueAt: "2026-07-14", firstPinAt: "2026-07-21", pinEndsAt: "2026-11-01" },
  { slug: "halloween-2026", name: "Halloween", type: "single", eventStartAt: "2026-10-31", eventEndAt: "2026-10-31", assetPackageDueAt: "2026-08-29", firstPinAt: "2026-09-05", pinEndsAt: "2026-10-31" },
  { slug: "daylight-saving-time-end-us-2026", name: "Daylight Saving Time end (US)", type: "single", eventStartAt: "2026-11-01", eventEndAt: "2026-11-01", assetPackageDueAt: "2026-08-30", firstPinAt: "2026-09-06", pinEndsAt: "2026-11-01" },
  { slug: "diwali-2026", name: "Diwali", type: "single", eventStartAt: "2026-11-08", eventEndAt: "2026-11-08", assetPackageDueAt: "2026-09-06", firstPinAt: "2026-09-13", pinEndsAt: "2026-11-08" },
  { slug: "holiday-gifting-season-2026", name: "Holiday gifting season (overall)", type: "seasonal", eventStartAt: "2026-11-20", eventEndAt: "2026-12-24", assetPackageDueAt: "2026-09-18", firstPinAt: "2026-09-25", pinEndsAt: "2026-12-24" },
  { slug: "thanksgiving-2026", name: "Thanksgiving", type: "single", eventStartAt: "2026-11-26", eventEndAt: "2026-11-26", assetPackageDueAt: "2026-09-24", firstPinAt: "2026-10-01", pinEndsAt: "2026-11-26" },
  { slug: "black-friday-2026", name: "Black Friday", type: "single", eventStartAt: "2026-11-27", eventEndAt: "2026-11-27", assetPackageDueAt: "2026-09-25", firstPinAt: "2026-10-02", pinEndsAt: "2026-11-27" },
  { slug: "cyber-monday-2026", name: "Cyber Monday", type: "single", eventStartAt: "2026-11-30", eventEndAt: "2026-11-30", assetPackageDueAt: "2026-09-28", firstPinAt: "2026-10-05", pinEndsAt: "2026-11-30" },
  { slug: "giving-tuesday-2026", name: "Giving Tuesday", type: "single", eventStartAt: "2026-12-01", eventEndAt: "2026-12-01", assetPackageDueAt: "2026-09-29", firstPinAt: "2026-10-06", pinEndsAt: "2026-12-01" },
  { slug: "hanukkah-2026", name: "Hanukkah (first day)", type: "single", eventStartAt: "2026-12-05", eventEndAt: "2026-12-05", assetPackageDueAt: "2026-10-03", firstPinAt: "2026-10-10", pinEndsAt: "2026-12-05" },
  { slug: "holiday-parties-entertaining-2026", name: "Holiday parties & entertaining", type: "seasonal", eventStartAt: "2026-12-10", eventEndAt: "2026-12-31", assetPackageDueAt: "2026-10-08", firstPinAt: "2026-10-15", pinEndsAt: "2026-12-31" },
  { slug: "christmas-2026", name: "Christmas", type: "single", eventStartAt: "2026-12-25", eventEndAt: "2026-12-25", assetPackageDueAt: "2026-10-23", firstPinAt: "2026-10-30", pinEndsAt: "2026-12-25" },
  { slug: "new-years-eve-2026", name: "New Year’s Eve", type: "single", eventStartAt: "2026-12-31", eventEndAt: "2026-12-31", assetPackageDueAt: "2026-10-29", firstPinAt: "2026-11-05", pinEndsAt: "2026-12-31" },
  { slug: "new-years-day-2027", name: "New Year’s Day", type: "single", eventStartAt: "2027-01-01", eventEndAt: "2027-01-01", assetPackageDueAt: "2026-10-30", firstPinAt: "2026-11-06", pinEndsAt: "2027-01-01" },
  { slug: "self-care-wellness-reset-2027", name: "Self-care & wellness reset", type: "seasonal", eventStartAt: "2027-01-10", eventEndAt: "2027-02-28", assetPackageDueAt: "2026-11-08", firstPinAt: "2026-11-15", pinEndsAt: "2027-02-28" },
  { slug: "mlk-day-2027", name: "Martin Luther King Jr. Day", type: "single", eventStartAt: "2027-01-18", eventEndAt: "2027-01-18", assetPackageDueAt: "2026-11-16", firstPinAt: "2026-11-23", pinEndsAt: "2027-01-18" },
  { slug: "lunar-new-year-2027", name: "Lunar New Year", type: "single", eventStartAt: "2027-02-06", eventEndAt: "2027-02-06", assetPackageDueAt: "2026-12-05", firstPinAt: "2026-12-12", pinEndsAt: "2027-02-06" },
  { slug: "ramadan-begins-2027", name: "Ramadan begins", type: "single", eventStartAt: "2027-02-08", eventEndAt: "2027-02-08", assetPackageDueAt: "2026-12-07", firstPinAt: "2026-12-14", pinEndsAt: "2027-02-08" },
  { slug: "mardi-gras-2027", name: "Mardi Gras / Shrove Tuesday", type: "single", eventStartAt: "2027-02-09", eventEndAt: "2027-02-09", assetPackageDueAt: "2026-12-08", firstPinAt: "2026-12-15", pinEndsAt: "2027-02-09" },
  { slug: "ash-wednesday-2027", name: "Ash Wednesday", type: "single", eventStartAt: "2027-02-10", eventEndAt: "2027-02-10", assetPackageDueAt: "2026-12-09", firstPinAt: "2026-12-16", pinEndsAt: "2027-02-10" },
  { slug: "super-bowl-2027", name: "Super Bowl / The Big Game", type: "single", eventStartAt: "2027-02-14", eventEndAt: "2027-02-14", assetPackageDueAt: "2026-12-13", firstPinAt: "2026-12-20", pinEndsAt: "2027-02-14" },
  { slug: "valentines-day-2027", name: "Valentine’s Day", type: "single", eventStartAt: "2027-02-14", eventEndAt: "2027-02-14", assetPackageDueAt: "2026-12-13", firstPinAt: "2026-12-20", pinEndsAt: "2027-02-14" },
  { slug: "black-history-month-us-2027", name: "Black History Month (US)", type: "seasonal", eventStartAt: "2027-02-15", eventEndAt: "2027-02-28", assetPackageDueAt: "2026-12-14", firstPinAt: "2026-12-21", pinEndsAt: "2027-02-28" },
  { slug: "presidents-day-us-2027", name: "Presidents’ Day (US)", type: "single", eventStartAt: "2027-02-15", eventEndAt: "2027-02-15", assetPackageDueAt: "2026-12-14", firstPinAt: "2026-12-21", pinEndsAt: "2027-02-15" },
  { slug: "eid-al-fitr-2027", name: "Eid al-Fitr", type: "single", eventStartAt: "2027-03-09", eventEndAt: "2027-03-09", assetPackageDueAt: "2027-01-05", firstPinAt: "2027-01-12", pinEndsAt: "2027-03-09" },
  { slug: "spring-break-season-2027", name: "Spring Break season", type: "seasonal", eventStartAt: "2027-03-15", eventEndAt: "2027-04-15", assetPackageDueAt: "2027-01-11", firstPinAt: "2027-01-18", pinEndsAt: "2027-04-15" },
  { slug: "st-patricks-day-2027", name: "St. Patrick’s Day", type: "single", eventStartAt: "2027-03-17", eventEndAt: "2027-03-17", assetPackageDueAt: "2027-01-13", firstPinAt: "2027-01-20", pinEndsAt: "2027-03-17" },
  { slug: "easter-2027", name: "Easter", type: "single", eventStartAt: "2027-03-28", eventEndAt: "2027-03-28", assetPackageDueAt: "2027-01-24", firstPinAt: "2027-01-31", pinEndsAt: "2027-03-28" },
];

export function listPinterestCalendarNotifications(referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const notifications = pinterestCalendarEvents
    .map((event) => buildCalendarNotification(event, today))
    .filter((notification): notification is DashboardCalendarNotification => notification !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title));

  return notifications.slice(0, 16);
}

function buildCalendarNotification(
  event: PinterestCalendarEvent,
  today: Date,
): DashboardCalendarNotification | null {
  const assetDueAt = parseCalendarDate(event.assetPackageDueAt);
  const firstPinAt = parseCalendarDate(event.firstPinAt);
  const pinEndsAt = parseCalendarDate(event.pinEndsAt);
  const daysUntilAssetDue = diffInDays(assetDueAt, today);
  const daysUntilFirstPin = diffInDays(firstPinAt, today);
  const daysUntilEnd = diffInDays(pinEndsAt, today);

  if (daysUntilEnd < -2) {
    return null;
  }

  if (daysUntilAssetDue >= 0 && daysUntilAssetDue <= 7) {
    return {
      id: `asset-${event.slug}`,
      title: `${event.name}: asset package due ${daysUntilAssetDue === 0 ? "today" : "soon"}`,
      message: `Assets are due ${formatNotificationDate(assetDueAt)}. Pinning starts ${formatNotificationDate(firstPinAt)}.`,
      tone: daysUntilAssetDue === 0 ? "error" : "info",
      stageLabel: "Asset due",
      href: "/dashboard/inbox",
      ctaLabel: "Open inbox",
      sortOrder: daysUntilAssetDue === 0 ? 0 : 10 + daysUntilAssetDue,
    };
  }

  if (daysUntilFirstPin >= 0 && daysUntilFirstPin <= 7) {
    return {
      id: `start-${event.slug}`,
      title: `${event.name}: start pinning ${daysUntilFirstPin === 0 ? "today" : "this week"}`,
      message:
        daysUntilFirstPin === 0
          ? `Pinning starts today and runs through ${formatNotificationDate(pinEndsAt)}.`
          : `Pinning starts ${formatNotificationDate(firstPinAt)} and runs through ${formatNotificationDate(pinEndsAt)}.`,
      tone: daysUntilFirstPin === 0 ? "progress" : "info",
      stageLabel: "Start now",
      href: "/dashboard/post-pulse",
      ctaLabel: "Open Post Pulse",
      sortOrder: daysUntilFirstPin === 0 ? 1 : 20 + daysUntilFirstPin,
    };
  }

  if (daysUntilFirstPin < 0 && daysUntilEnd >= 0) {
    return {
      id: `active-${event.slug}`,
      title: `${event.name}: keep pinning`,
      message:
        daysUntilEnd === 0
          ? `Final day to pin this campaign. Stop after today.`
          : `Pinning is active now. Continue through ${formatNotificationDate(pinEndsAt)}.`,
      tone: daysUntilEnd <= 3 ? "progress" : "success",
      stageLabel: daysUntilEnd <= 3 ? "Stop now" : "Active",
      href: "/dashboard/publishing",
      ctaLabel: "Open queue",
      sortOrder: daysUntilEnd <= 3 ? 2 + Math.max(0, daysUntilEnd) : 40 + Math.max(0, 30 - daysUntilEnd),
    };
  }

  if (daysUntilEnd < 0 && daysUntilEnd >= -2) {
    return {
      id: `stop-${event.slug}`,
      title: `${event.name}: stop pinning`,
      message: `The pinning window ended ${formatNotificationDate(pinEndsAt)}. Move focus to the next campaign.`,
      tone: "error",
      stageLabel: "Stop now",
      href: "/dashboard",
      ctaLabel: "Open overview",
      sortOrder: 3,
    };
  }

  return null;
}

function parseCalendarDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function startOfDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function diffInDays(target: Date, from: Date) {
  return Math.round((target.getTime() - from.getTime()) / DAY_MS);
}

function formatNotificationDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}
