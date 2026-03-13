import { PublicationRecordState, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPublerClient, type PublerPost } from "@/lib/publer/publerClient";
import { getIntegrationSettingsForUserId } from "@/lib/settings/integrationSettings";
import { resolveDomain } from "@/lib/types";

export async function syncPublerPublicationRecordsForUser(
  userId: string,
  options?: { workspaceId?: string },
) {
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
  const posts = await fetchAllRelevantPublerPosts(client);

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
    workspaceId,
    fetched: posts.length,
    created,
    updated,
  };
}

async function fetchAllRelevantPublerPosts(client: ReturnType<typeof createPublerClient>) {
  const seenPostIds = new Set<string>();
  const posts: PublerPost[] = [];
  const maxPages = 50;

  for (let page = 0; page < maxPages; page += 1) {
    const result = await client.getPostsPage({
      states: ["scheduled", "published", "published_posted"],
      page,
      limit: 100,
    });

    for (const post of result.posts) {
      if (seenPostIds.has(post.id)) {
        continue;
      }
      seenPostIds.add(post.id);
      posts.push(post);
    }

    if (result.posts.length === 0) {
      break;
    }

    if (result.totalPages !== null) {
      const reachedLastPage =
        result.page !== null
          ? result.page >= result.totalPages || result.page + 1 >= result.totalPages
          : page + 1 >= result.totalPages;

      if (reachedLastPage) {
        break;
      }
    }
  }

  return posts;
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
