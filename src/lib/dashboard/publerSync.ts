import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPublerClient, type PublerClient, type PublerPost } from "@/lib/publer/publerClient";
import { getIntegrationSettingsForUserId } from "@/lib/settings/integrationSettings";
import { resolveDomain } from "@/lib/types";

const POSTS_PER_PAGE = 50;
const BACKFILL_PAGES_PER_RUN = 1;
const INCREMENTAL_PAGES_PER_RUN = 1;
const FULL_SYNC_STATES = ["scheduled", "published", "published_posted"];
const INCREMENTAL_LOOKBACK_DAYS = 45;
const INCREMENTAL_FUTURE_WINDOW_DAYS = 120;
const WRITE_BATCH_SIZE = 20;

const PUBLICATION_RECORD_STATE = {
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  PUBLISHED_POSTED: "PUBLISHED_POSTED",
  OTHER: "OTHER",
} as const;

const PUBLICATION_SYNC_MODE = {
  BACKFILL: "BACKFILL",
  INCREMENTAL: "INCREMENTAL",
} as const;

type PublicationRecordStateValue =
  (typeof PUBLICATION_RECORD_STATE)[keyof typeof PUBLICATION_RECORD_STATE];

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

  const isBackfill = syncState.mode === PUBLICATION_SYNC_MODE.BACKFILL;
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
  const syncablePosts = posts.filter((post) => post.url.trim() !== "");

  if (syncablePosts.length === 0) {
    return {
      fetched: 0,
      created: 0,
      updated: 0,
    };
  }

  const providerPostIds = syncablePosts.map((post) => post.id);

  const existingRecords = await prisma.publicationRecord.findMany({
    where: {
      userId,
      providerPostId: {
        in: providerPostIds,
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
        in: providerPostIds,
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

  const matchedPostIds = Array.from(
    new Set(
      matchedPins
        .map((item) => item.generatedPin.job.postId)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const matchedPosts = matchedPostIds.length
    ? await prisma.post.findMany({
        where: {
          id: {
            in: matchedPostIds,
          },
        },
        select: {
          id: true,
        },
      })
    : [];
  const matchedPostIdSet = new Set(matchedPosts.map((post) => post.id));

  const unresolvedUrls = Array.from(
    new Set(
      syncablePosts
        .filter((post) => {
          const matchedPin = pinMatchByPostId.get(post.id);
          return !(matchedPin?.postId && matchedPostIdSet.has(matchedPin.postId));
        })
        .map((post) => post.url.trim()),
    ),
  );

  if (unresolvedUrls.length > 0) {
    const existingPosts = await prisma.post.findMany({
      where: {
        url: {
          in: unresolvedUrls,
        },
      },
      select: {
        id: true,
        url: true,
      },
    });
    const existingPostUrls = new Set(existingPosts.map((post) => post.url));
    const missingUrls = unresolvedUrls.filter((url) => !existingPostUrls.has(url));

    if (missingUrls.length > 0) {
      await prisma.post.createMany({
        data: missingUrls.map((url) => {
          const sourcePost = syncablePosts.find((post) => post.url.trim() === url);
          return {
            url,
            domain: resolveDomain({ postUrl: url }),
            title: sourcePost ? getPublicationTitle(sourcePost) : url,
          };
        }),
        skipDuplicates: true,
      });
    }
  }

  const resolvedPostsByUrl = unresolvedUrls.length
    ? await prisma.post.findMany({
        where: {
          url: {
            in: unresolvedUrls,
          },
        },
        select: {
          id: true,
          url: true,
        },
      })
    : [];
  const postIdByUrl = new Map(resolvedPostsByUrl.map((post) => [post.url, post.id]));

  let created = 0;
  let updated = 0;
  const now = new Date();
  const createPayloads: Prisma.PublicationRecordCreateManyInput[] = [];
  const updateOperations: Prisma.PrismaPromise<unknown>[] = [];

  for (const post of syncablePosts) {
    const postUrl = post.url.trim();
    const matchedPin = pinMatchByPostId.get(post.id);
    const resolvedPostId =
      matchedPin?.postId && matchedPostIdSet.has(matchedPin.postId)
        ? matchedPin.postId
        : postIdByUrl.get(postUrl);

    if (!resolvedPostId) {
      continue;
    }

    const normalizedState = normalizePublicationState(post.state);
    const scheduledAt = parseDate(post.scheduledAt);
    const publishedAt = resolveEffectivePublishedAt(post, normalizedState);
    const sharedData = {
      postId: resolvedPostId,
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
      syncedAt: now,
    } satisfies Omit<
      Prisma.PublicationRecordUncheckedCreateInput,
      "id" | "userId" | "providerPostId" | "createdAt" | "updatedAt"
    >;

    if (existingRecordIds.has(post.id)) {
      updateOperations.push(
        prisma.publicationRecord.update({
          where: {
            userId_providerPostId: {
              userId,
              providerPostId: post.id,
            },
          },
          data: sharedData,
        }),
      );
      updated += 1;
    } else {
      createPayloads.push({
        userId,
        providerPostId: post.id,
        ...sharedData,
      });
      created += 1;
    }
  }

  if (createPayloads.length > 0) {
    await prisma.publicationRecord.createMany({
      data: createPayloads,
      skipDuplicates: true,
    });
  }

  for (let index = 0; index < updateOperations.length; index += WRITE_BATCH_SIZE) {
    await prisma.$transaction(updateOperations.slice(index, index + WRITE_BATCH_SIZE));
  }

  return {
    fetched: syncablePosts.length,
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
      mode: PUBLICATION_SYNC_MODE.INCREMENTAL,
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
      return PUBLICATION_RECORD_STATE.SCHEDULED;
    case "published":
      return PUBLICATION_RECORD_STATE.PUBLISHED;
    case "published_posted":
      return PUBLICATION_RECORD_STATE.PUBLISHED_POSTED;
    default:
      return PUBLICATION_RECORD_STATE.OTHER;
  }
}

function resolveEffectivePublishedAt(post: PublerPost, state: PublicationRecordStateValue) {
  const rawPublishedAt =
    parseDate(pickRawString(post.raw, ["published_at", "publishedAt", "posted_at", "postedAt"])) ??
    null;

  if (rawPublishedAt) {
    return rawPublishedAt;
  }

  return state === PUBLICATION_RECORD_STATE.PUBLISHED ||
    state === PUBLICATION_RECORD_STATE.PUBLISHED_POSTED
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
