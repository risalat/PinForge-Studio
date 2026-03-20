import { prisma } from "@/lib/prisma";
import { buildArticleUrlCandidates, normalizeArticleUrl, resolveDomain } from "@/lib/types";

export type CanonicalPostRepairResult = {
  scannedPosts: number;
  canonicalGroupsTouched: number;
  canonicalizedPosts: number;
  deletedDuplicatePosts: number;
  updatedGenerationJobs: number;
  updatedPublicationRecords: number;
};

export async function repairCanonicalPosts(): Promise<CanonicalPostRepairResult> {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      url: true,
      title: true,
      domain: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const groups = new Map<
    string,
    Array<{
      id: string;
      url: string;
      title: string;
      domain: string;
      createdAt: Date;
    }>
  >();

  for (const post of posts) {
    const canonicalUrl = normalizeArticleUrl(post.url);
    if (!canonicalUrl) {
      continue;
    }

    const group = groups.get(canonicalUrl) ?? [];
    group.push(post);
    groups.set(canonicalUrl, group);
  }

  let scannedPosts = 0;
  let canonicalGroupsTouched = 0;
  let deletedDuplicatePosts = 0;
  let updatedGenerationJobs = 0;
  let updatedPublicationRecords = 0;
  let canonicalizedPosts = 0;

  for (const [canonicalUrl, group] of groups.entries()) {
    scannedPosts += group.length;
    const canonicalMatch = group.find((post) => post.url === canonicalUrl) ?? null;
    const keeper = canonicalMatch ?? group[0];
    const duplicateIds = group
      .filter((post) => post.id !== keeper.id)
      .map((post) => post.id);
    const mergedPostIds = [keeper.id, ...duplicateIds];
    const canonicalDomain = resolveDomain({ postUrl: canonicalUrl });
    const nextTitle = selectPostTitle(group, canonicalUrl);
    const keeperNeedsUpdate =
      keeper.url !== canonicalUrl || keeper.domain !== canonicalDomain || keeper.title !== nextTitle;

    if (!keeperNeedsUpdate && duplicateIds.length === 0) {
      continue;
    }

    canonicalGroupsTouched += 1;

    const [jobUpdate, publicationUpdate] = await prisma.$transaction([
      prisma.generationJob.updateMany({
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
      }),
      prisma.publicationRecord.updateMany({
        where: {
          postId: {
            in: mergedPostIds,
          },
        },
        data: {
          postId: keeper.id,
          postUrl: canonicalUrl,
        },
      }),
    ]);

    updatedGenerationJobs += jobUpdate.count;
    updatedPublicationRecords += publicationUpdate.count;

    await prisma.post.update({
      where: {
        id: keeper.id,
      },
      data: {
        url: canonicalUrl,
        title: nextTitle,
        domain: canonicalDomain,
      },
    });
    canonicalizedPosts += 1;

    if (duplicateIds.length > 0) {
      const deleted = await prisma.post.deleteMany({
        where: {
          id: {
            in: duplicateIds,
          },
        },
      });
      deletedDuplicatePosts += deleted.count;
    }
  }

  return {
    scannedPosts,
    canonicalGroupsTouched,
    canonicalizedPosts,
    deletedDuplicatePosts,
    updatedGenerationJobs,
    updatedPublicationRecords,
  };
}

function selectPostTitle(
  group: Array<{
    id: string;
    url: string;
    title: string;
    domain: string;
    createdAt: Date;
  }>,
  canonicalUrl: string,
) {
  const meaningfulTitle = group
    .map((post) => post.title.trim())
    .find((title) => title !== "" && title !== postUrlLike(title) && title !== canonicalUrl);

  return meaningfulTitle || group[0]?.title?.trim() || canonicalUrl;
}

function postUrlLike(value: string) {
  const normalized = normalizeArticleUrl(value);
  if (normalized) {
    return normalized;
  }

  const candidates = buildArticleUrlCandidates(value);
  return candidates[0] ?? value.trim().toLowerCase();
}
