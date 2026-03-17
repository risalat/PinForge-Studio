import { matchesAllowedDomain } from "@/lib/dashboard/domainScope";
import { normalizeArticleUrl, normalizeDomain } from "@/lib/types";

const SITEMAP_REVALIDATE_SECONDS = 60 * 60 * 6;
const MAX_SITEMAP_DEPTH = 2;
const MAX_NESTED_SITEMAPS = 24;

export type WorkspaceSitemapArticle = {
  url: string;
  normalizedUrl: string;
  domain: string;
  titleGuess: string;
  lastModifiedAt: Date | null;
  sourceSitemapUrl: string;
};

export type WorkspaceSitemapDiscoveryResult = {
  configured: boolean;
  sitemapUrls: string[];
  totalArticles: number;
  totalUntracked: number;
  articles: WorkspaceSitemapArticle[];
  error: string | null;
};

export async function listWorkspaceUntrackedSitemapArticles(input: {
  sitemapUrls: string[];
  allowedDomains: string[];
  trackedUrls: string[];
  limit?: number;
}): Promise<WorkspaceSitemapDiscoveryResult> {
  const sitemapUrls = normalizeSitemapUrls(input.sitemapUrls);
  if (sitemapUrls.length === 0) {
    return {
      configured: false,
      sitemapUrls: [],
      totalArticles: 0,
      totalUntracked: 0,
      articles: [],
      error: null,
    };
  }

  try {
    const visitedSitemaps = new Set<string>();
    const discoveredEntries = (
      await Promise.all(
        sitemapUrls.map((sitemapUrl) =>
          fetchSitemapEntries({
            sitemapUrl,
            depth: 0,
            visitedSitemaps,
          }),
        ),
      )
    ).flat();

    const trackedUrls = new Set(
      input.trackedUrls
        .map((value) => normalizeArticleUrl(value))
        .filter((value) => value !== ""),
    );
    const allowedDomains = input.allowedDomains.map((value) => normalizeDomain(value)).filter(Boolean);
    const uniqueArticles = new Map<string, WorkspaceSitemapArticle>();

    for (const entry of discoveredEntries) {
      const normalizedUrl = normalizeArticleUrl(entry.url);
      if (!normalizedUrl || trackedUrls.has(normalizedUrl)) {
        continue;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(normalizedUrl);
      } catch {
        continue;
      }

      const domain = normalizeDomain(parsedUrl.hostname);
      if (!matchesAllowedDomain(domain, allowedDomains)) {
        continue;
      }

      const existing = uniqueArticles.get(normalizedUrl);
      const nextArticle: WorkspaceSitemapArticle = {
        url: normalizedUrl,
        normalizedUrl,
        domain,
        titleGuess: inferTitleFromArticleUrl(normalizedUrl),
        lastModifiedAt: entry.lastModifiedAt,
        sourceSitemapUrl: entry.sourceSitemapUrl,
      };

      if (!existing) {
        uniqueArticles.set(normalizedUrl, nextArticle);
        continue;
      }

      if ((nextArticle.lastModifiedAt?.getTime() ?? 0) > (existing.lastModifiedAt?.getTime() ?? 0)) {
        uniqueArticles.set(normalizedUrl, nextArticle);
      }
    }

    const articles = Array.from(uniqueArticles.values())
      .sort((left, right) => {
        const recencyDelta =
          (right.lastModifiedAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
          (left.lastModifiedAt?.getTime() ?? Number.NEGATIVE_INFINITY);
        if (recencyDelta !== 0) {
          return recencyDelta;
        }

        return left.url.localeCompare(right.url);
      })
      .slice(0, Math.max(1, input.limit ?? 12));

    return {
      configured: true,
      sitemapUrls,
      totalArticles: discoveredEntries.length,
      totalUntracked: uniqueArticles.size,
      articles,
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      sitemapUrls,
      totalArticles: 0,
      totalUntracked: 0,
      articles: [],
      error: error instanceof Error ? error.message : "Unable to load sitemap articles.",
    };
  }
}

type ParsedSitemapEntry = {
  url: string;
  lastModifiedAt: Date | null;
  sourceSitemapUrl: string;
};

async function fetchSitemapEntries(input: {
  sitemapUrl: string;
  depth: number;
  visitedSitemaps: Set<string>;
}): Promise<ParsedSitemapEntry[]> {
  const normalizedSitemapUrl = normalizeSitemapUrl(input.sitemapUrl);
  if (
    !normalizedSitemapUrl ||
    input.visitedSitemaps.has(normalizedSitemapUrl) ||
    input.visitedSitemaps.size >= MAX_NESTED_SITEMAPS
  ) {
    return [];
  }

  input.visitedSitemaps.add(normalizedSitemapUrl);

  const response = await fetch(normalizedSitemapUrl, {
    next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
    headers: {
      accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load sitemap: ${normalizedSitemapUrl}`);
  }

  const xml = await response.text();
  if (/<sitemapindex\b/i.test(xml) && input.depth < MAX_SITEMAP_DEPTH) {
    const childSitemaps = parseSitemapIndex(xml);
    return (
      await Promise.all(
        childSitemaps.map((childSitemapUrl) =>
          fetchSitemapEntries({
            sitemapUrl: childSitemapUrl,
            depth: input.depth + 1,
            visitedSitemaps: input.visitedSitemaps,
          }),
        ),
      )
    ).flat();
  }

  return parseUrlSet(xml, normalizedSitemapUrl);
}

function parseSitemapIndex(xml: string) {
  return parseBlocks(xml, "sitemap")
    .map((block) => extractTagValue(block, "loc"))
    .map((value) => normalizeSitemapUrl(value))
    .filter((value): value is string => value !== "");
}

function parseUrlSet(xml: string, sourceSitemapUrl: string): ParsedSitemapEntry[] {
  return parseBlocks(xml, "url")
    .map((block) => {
      const url = normalizeArticleUrl(extractTagValue(block, "loc"));
      if (!url) {
        return null;
      }

      const lastmod = extractTagValue(block, "lastmod");
      return {
        url,
        lastModifiedAt: parseSitemapDate(lastmod),
        sourceSitemapUrl,
      } satisfies ParsedSitemapEntry;
    })
    .filter((entry): entry is ParsedSitemapEntry => entry !== null);
}

function parseBlocks(xml: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  return Array.from(xml.matchAll(pattern), (match) => match[1] ?? "");
}

function extractTagValue(xml: string, tagName: string) {
  const pattern = new RegExp(`<(?:[\\w-]+:)?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tagName}>`, "i");
  const value = xml.match(pattern)?.[1] ?? "";
  return decodeXmlEntities(value).trim();
}

function parseSitemapDate(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeSitemapUrls(input: string[]) {
  return Array.from(
    new Set(input.map((value) => normalizeSitemapUrl(value)).filter(Boolean)),
  ) as string[];
}

function normalizeSitemapUrl(value: string) {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return "";
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return "";
  }
}

function inferTitleFromArticleUrl(articleUrl: string) {
  try {
    const parsed = new URL(articleUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? parsed.hostname;
    const cleaned = lastSegment
      .replace(/\.(html?|php)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      return articleUrl;
    }

    return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return articleUrl;
  }
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
