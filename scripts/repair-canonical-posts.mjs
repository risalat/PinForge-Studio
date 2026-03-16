import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
});

async function main() {
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

  const groups = new Map();
  for (const post of posts) {
    const canonicalUrl = normalizeArticleUrl(post.url);
    if (!canonicalUrl) {
      continue;
    }

    const existing = groups.get(canonicalUrl) ?? [];
    existing.push(post);
    groups.set(canonicalUrl, existing);
  }

  let scanned = 0;
  let groupsTouched = 0;
  let postsDeleted = 0;
  let jobsUpdated = 0;
  let publicationRecordsUpdated = 0;
  let canonicalizedPosts = 0;

  for (const [canonicalUrl, group] of groups.entries()) {
    scanned += group.length;
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

    groupsTouched += 1;

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

    jobsUpdated += jobUpdate.count;
    publicationRecordsUpdated += publicationUpdate.count;

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
      postsDeleted += deleted.count;
    }
  }

  console.log(
    JSON.stringify(
      {
        scannedPosts: scanned,
        canonicalGroupsTouched: groupsTouched,
        canonicalizedPosts,
        deletedDuplicatePosts: postsDeleted,
        updatedGenerationJobs: jobsUpdated,
        updatedPublicationRecords: publicationRecordsUpdated,
      },
      null,
      2,
    ),
  );
}

function selectPostTitle(group, canonicalUrl) {
  const meaningfulTitle = group
    .map((post) => post.title.trim())
    .find((title) => title !== "" && title !== postUrlLike(title) && title !== canonicalUrl);

  return meaningfulTitle || group[0]?.title?.trim() || canonicalUrl;
}

function postUrlLike(value) {
  return normalizeArticleUrl(value);
}

function resolveDomain(input) {
  if (input.domain && input.domain.trim() !== "") {
    return input.domain.trim();
  }

  try {
    return new URL(normalizeArticleUrl(input.postUrl)).hostname;
  } catch {
    return "pinforge.tenreclabs.com";
  }
}

function normalizeArticleUrl(input) {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
    const searchParams = new URLSearchParams(parsed.search);

    for (const key of Array.from(searchParams.keys())) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.startsWith("utm_") ||
        normalizedKey === "fbclid" ||
        normalizedKey === "gclid" ||
        normalizedKey === "mc_cid" ||
        normalizedKey === "mc_eid"
      ) {
        searchParams.delete(key);
      }
    }

    searchParams.sort();
    const search = searchParams.toString();
    const port =
      parsed.port && !isDefaultPort(protocol, parsed.port) ? `:${parsed.port}` : "";

    return `${protocol}//${hostname}${port}${pathname}${search ? `?${search}` : ""}`;
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase();
  }
}

function isDefaultPort(protocol, port) {
  return (protocol === "https:" && port === "443") || (protocol === "http:" && port === "80");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
