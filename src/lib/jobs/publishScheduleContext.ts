import { PublicationRecordState, ScheduleRunItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PublishScheduleContext } from "@/lib/types";

const MIN_SPACING_DAYS = 25;
const MAX_SPACING_DAYS = 30;

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
          record.state === PublicationRecordState.SCHEDULED &&
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

  return {
    workspaceId,
    latestScheduledAt: toIsoString(latestScheduledAt),
    latestPublishedAt: toIsoString(latestPublishedAt),
    anchorAt: toIsoString(anchorAt),
    anchorSource,
    recommendedFirstPublishAt: toIsoString(anchorAt ? addDays(anchorAt, MIN_SPACING_DAYS) : null),
    recommendedWindowEndAt: toIsoString(anchorAt ? addDays(anchorAt, MAX_SPACING_DAYS) : null),
    hasPendingSchedule: Boolean(latestScheduledAt),
  };
}

function isPublishedState(state: PublicationRecordState) {
  return (
    state === PublicationRecordState.PUBLISHED ||
    state === PublicationRecordState.PUBLISHED_POSTED
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
