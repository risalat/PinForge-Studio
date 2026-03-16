import { prisma } from "@/lib/prisma";
import { buildArticleUrlCandidates, normalizeArticleUrl, resolveDomain } from "@/lib/types";

export async function resolveCanonicalPost(input: {
  url: string;
  title?: string | null;
  domain?: string | null;
  replaceTitle?: boolean;
}) {
  const canonicalUrl = normalizeArticleUrl(input.url);
  if (!canonicalUrl) {
    throw new Error("Article URL is required.");
  }

  const candidateUrls = buildArticleUrlCandidates(input.url);
  const preferredTitle = input.title?.trim() || null;
  const canonicalDomain = resolveDomain({
    postUrl: canonicalUrl,
    domain: input.domain ?? undefined,
  });

  const matchingPosts = await prisma.post.findMany({
    where: {
      url: {
        in: candidateUrls,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      url: true,
      title: true,
      domain: true,
      createdAt: true,
    },
  });

  if (matchingPosts.length === 0) {
    return prisma.post.create({
      data: {
        url: canonicalUrl,
        title: preferredTitle || canonicalUrl,
        domain: canonicalDomain,
      },
    });
  }

  const canonicalMatch = matchingPosts.find((post) => post.url === canonicalUrl) ?? null;
  const keeper = canonicalMatch ?? matchingPosts[0];
  const duplicateIds = matchingPosts
    .filter((post) => post.id !== keeper.id)
    .map((post) => post.id);
  const mergedPostIds = [keeper.id, ...duplicateIds];
  const nextTitle = selectPostTitle({
    currentTitle: keeper.title,
    preferredTitle,
    canonicalUrl,
    replaceTitle: input.replaceTitle ?? false,
  });

  await prisma.$transaction(async (tx) => {
    if (mergedPostIds.length > 0) {
      await tx.generationJob.updateMany({
        where: {
          postId: {
            in: mergedPostIds,
          },
        },
        data: {
          postId: keeper.id,
          postUrlSnapshot: canonicalUrl,
          domainSnapshot: canonicalDomain,
        },
      });

      await tx.publicationRecord.updateMany({
        where: {
          postId: {
            in: mergedPostIds,
          },
        },
        data: {
          postId: keeper.id,
          postUrl: canonicalUrl,
        },
      });
    }

    if (duplicateIds.length > 0) {
      await tx.post.deleteMany({
        where: {
          id: {
            in: duplicateIds,
          },
        },
      });
    }

    await tx.post.update({
      where: { id: keeper.id },
      data: {
        url: canonicalUrl,
        title: nextTitle,
        domain: canonicalDomain,
      },
    });
  });

  return prisma.post.findUniqueOrThrow({
    where: {
      id: keeper.id,
    },
  });
}

function selectPostTitle(input: {
  currentTitle: string;
  preferredTitle: string | null;
  canonicalUrl: string;
  replaceTitle: boolean;
}) {
  if (input.replaceTitle && input.preferredTitle) {
    return input.preferredTitle;
  }

  const currentTitle = input.currentTitle.trim();
  if (currentTitle && currentTitle !== input.canonicalUrl) {
    return currentTitle;
  }

  return input.preferredTitle || currentTitle || input.canonicalUrl;
}
