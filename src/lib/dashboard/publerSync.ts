import { Prisma, PublicationRecordState, PublicationSyncMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPublerClient, type PublerClient, type PublerPost } from "@/lib/publer/publerClient";
import { getIntegrationSettingsForUserId } from "@/lib/settings/integrationSettings";
import { resolveDomain } from "@/lib/types";

const POSTS_PER_PAGE = 100;
const BACKFILL_PAGES_PER_RUN = 3;
const INCREMENTAL_PAGES_PER_RUN = 2;
const FULL_SYNC_STATES = ["scheduled", "published", "published_posted"];
const INCREMENTAL_LOOKBACK_DAYS = 45;
const INCREMENTAL_FUTURE_WINDOW_DAYS = 120;

export type PublerSyncResult = {
  workspaceId: string;
  fetched: number;
  created: number;
  updated: number;
  pagesProcessed: number;
  hasMore: boolean;
  mode: "backfill" | "incremental";
  nextPage: number | null;
  windowFrom: string | null;
  windowTo: string | null;
};

export async function syncPublerPublicationRecordsForUser(
  userId: string,
  options?: { workspaceId?: string },
): Promise<PublerSyncResult> {
  const settings = await getIntegrationSettingsForUserId(userId);
  if (!settings.publerApiKey.trim()) {
    throw new Error("Save a Publer API key before syncing post activity.");
  }

  const workspaceId = options?.workspaceId?.trim() || settings.publerWorkspaceId.trim();
  if (!workspaceId) {
    throw new Error("Select a Publer workspace before syncing post activity.");
  }

  const client = createPublerClient({
    apiKey: settings.publerApiKey,
    workspaceId,
  });

  const syncState = await prisma.publicationSyncState.upsert({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    update: {},
    create: {
      userId,
      workspaceId,
    },
  });

  const isBackfill = syncState.mode === PublicationSyncMode.BACKFILL;
  const startPage = syncState.nextPage;
  const pageBudget = isBackfill ? BACKFILL_PAGES_PER_RUN : INCREMENTAL_PAGES_PER_RUN;
  const incrementalWindow = isBackfill
    ? null
    : buildIncrementalWindow(syncState.lastCompletedAt);

  let fetched = 0;
  let created = 0;
  let updated = 0;
  let pagesProcessed = 0;
  let hasMore = false;
  let nextPage: number | null = null;

  try {
    for (let offset = 0; offset < pageBudget; offset += 1) {
      const pageNumber = startPage + offset;
      const result = await client.getPostsPage({
        states: FULL_SYNC_STATES,
        page: pageNumber,
        limit: POSTS_PER_PAGE,
        from: incrementalWindow?.from ?? undefined,
        to: incrementalWindow?.to ?? undefined,
      });

      pagesProcessed += 1;

      if (result.posts.length === 0) {
        if (isBackfill) {
          await markBackfillCompleted(userId, workspaceId);
        } else {
          await markIncrementalCompleted(userId, workspaceId);
        }
        hasMore = false;
        nextPage = null;
        break;
      }

      const pageOutcome = await upsertPublerPostsForUser({
        userId,
        workspaceId,
        posts: result.posts,
      });
      fetched += pageOutcome.fetched;
      created += pageOutcome.created;
      updated += pageOutcome.updated;

      const reachedLastPage = didReachLastPage(result, pageNumber);
      if (isBackfill && reachedLastPage) {
        await markBackfillCompleted(userId, workspaceId);
        hasMore = false;
        nextPage = null;
        break;
      }

      if (!isBackfill && reachedLastPage) {
        await markIncrementalCompleted(userId, workspaceId);
        hasMore = false;
        nextPage = null;
        break;
      }

      const processedFullBudget = offset + 1 >= pageBudget;
      if (processedFullBudget) {
        hasMore = true;
        nextPage = pageNumber + 1;
        await prisma.publicationSyncState.update({
          where: {
            userId_workspaceId: {
              userId,
              workspaceId,
            },
          },
          data: {
            nextPage,
            lastRunAt: new Date(),
            lastError: null,
          },
        });
        break;
      }
    }

    if (!isBackfill) {
      hasMore = false;
      nextPage = null;
    }

    return {
      workspaceId,
      fetched,
      created,
      updated,
      pagesProcessed,
      hasMore,
      mode: isBackfill ? "backfill" : "incremental",
      nextPage,
      windowFrom: incrementalWindow?.from.toISOString() ?? null,
      windowTo: incrementalWindow?.to.toISOString() ?? null,
    };
  } catch (error) {
    await prisma.publicationSyncState.update({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      data: {
        lastRunAt: new Date(),
        lastError: error instanceof Error ? error.message : "Unknown Publer sync error.",
      },
    });
    throw error;
  }
}

async function upsertPublerPostsForUser(input: {
  userId: string;
  workspaceId: string;
  posts: PublerPost[];
}) {
  const { userId, workspaceId, posts } = input;

  const existingRecords = await prisma.publicationRecord.findMany({
    where: {
      userId,
      providerPostId: {
        in: posts.map((post) => post.id),
      },
    },
    select: {
      providerPostId: true,
    },
  });
  const existingRecordIds = new Set(existingRecords.map((record) => record.providerPostId));

  const matchedPins = await prisma.scheduleRunItem.findMany({
    where: {
      publerPostId: {
        in: posts.map((post) => post.id),
      },
      generatedPin: {
        job: {
          userId,
        },
      },
    },
    select: {
      publerPostId: true,
      generatedPinId: true,
      generatedPin: {
        select: {
          job: {
            select: {
              postId: true,
            },
          },
        },
      },
    },
  });

  const pinMatchByPostId = new Map(
    matchedPins
      .filter((item): item is typeof item & { publerPostId: string } => Boolean(item.publerPostId))
      .map((item) => [
        item.publerPostId,
        {
          generatedPinId: item.generatedPinId,
          postId: item.generatedPin.job.postId,
        },
      ]),
  );

  let created = 0;
  let updated = 0;

  for (const post of posts) {
    const postUrl = post.url.trim();
    if (!postUrl) {
      continue;
    }

    const matchedPin = pinMatchByPostId.get(post.id);
    const trackedPost =
      matchedPin?.postId
        ? await prisma.post.findUnique({
            where: { id: matchedPin.postId },
            select: { id: true },
          })
        : null;

    const upsertedPost =
      trackedPost ??
      (await prisma.post.upsert({
        where: {
          url: postUrl,
        },
        update: {
          domain: resolveDomain({ postUrl }),
        },
        create: {
          url: postUrl,
          domain: resolveDomain({ postUrl }),
          title: getPublicationTitle(post),
        },
        select: {
          id: true,
        },
      }));

    const normalizedState = normalizePublicationState(post.state);
    const scheduledAt = parseDate(post.scheduledAt);
    const publishedAt = resolveEffectivePublishedAt(post, normalizedState);

    await prisma.publicationRecord.upsert({
      where: {
        userId_providerPostId: {
          userId,
          providerPostId: post.id,
        },
      },
      update: {
        postId: upsertedPost.id,
        generatedPinId: matchedPin?.generatedPinId ?? null,
        providerWorkspaceId: workspaceId,
        providerPostLink: post.postLink ?? null,
        providerAccountId: post.accountId ?? null,
        providerBoardId: post.boardId ?? null,
        state: normalizedState,
        rawState: post.state.trim().toLowerCase(),
        postUrl,
        scheduledAt,
        publishedAt,
        rawPayload: post.raw as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
      create: {
        userId,
        postId: upsertedPost.id,
        generatedPinId: matchedPin?.generatedPinId ?? null,
        providerPostId: post.id,
        providerWorkspaceId: workspaceId,
        providerPostLink: post.postLink ?? null,
        providerAccountId: post.accountId ?? null,
        providerBoardId: post.boardId ?? null,
        state: normalizedState,
        rawState: post.state.trim().toLowerCase(),
        postUrl,
        scheduledAt,
        publishedAt,
        rawPayload: post.raw as Prisma.InputJsonValue,
      },
    });

    if (existingRecordIds.has(post.id)) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return {
    fetched: posts.length,
    created,
    updated,
  };
}

async function markBackfillCompleted(userId: string, workspaceId: string) {
  await prisma.publicationSyncState.update({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    data: {
      mode: PublicationSyncMode.INCREMENTAL,
      nextPage: 0,
      lastCompletedAt: new Date(),
      lastRunAt: new Date(),
      lastError: null,
    },
  });
}

async function markIncrementalCompleted(userId: string, workspaceId: string) {
  await prisma.publicationSyncState.update({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    data: {
      nextPage: 0,
      lastCompletedAt: new Date(),
      lastRunAt: new Date(),
      lastError: null,
    },
  });
}

function buildIncrementalWindow(lastCompletedAt: Date | null) {
  const now = new Date();
  const anchor = lastCompletedAt ?? now;
  const from = startOfDay(addDays(anchor, -INCREMENTAL_LOOKBACK_DAYS));
  const to = endOfDay(addDays(now, INCREMENTAL_FUTURE_WINDOW_DAYS));

  return {
    from,
    to,
  };
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function didReachLastPage(
  result: Awaited<ReturnType<PublerClient["getPostsPage"]>>,
  requestedPage: number,
) {
  if (result.totalPages === null) {
    return false;
  }

  if (result.page !== null) {
    return result.page >= result.totalPages || result.page + 1 >= result.totalPages;
  }

  return requestedPage + 1 >= result.totalPages;
}

function normalizePublicationState(value: string) {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "scheduled":
      return PublicationRecordState.SCHEDULED;
    case "published":
      return PublicationRecordState.PUBLISHED;
    case "published_posted":
      return PublicationRecordState.PUBLISHED_POSTED;
    default:
      return PublicationRecordState.OTHER;
  }
}

function resolveEffectivePublishedAt(post: PublerPost, state: PublicationRecordState) {
  const rawPublishedAt =
    parseDate(pickRawString(post.raw, ["published_at", "publishedAt", "posted_at", "postedAt"])) ??
    null;

  if (rawPublishedAt) {
    return rawPublishedAt;
  }

  return state === PublicationRecordState.PUBLISHED ||
    state === PublicationRecordState.PUBLISHED_POSTED
    ? parseDate(post.scheduledAt)
    : null;
}

function parseDate(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pickRawString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function getPublicationTitle(post: PublerPost) {
  const title =
    pickRawString(post.raw, ["article_title", "articleTitle", "source_title", "sourceTitle"]) ??
    pickRawString(post.raw, ["title", "name", "text"]) ??
    post.url;

  return title.trim();
}
