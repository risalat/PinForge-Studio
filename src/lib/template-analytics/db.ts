import {
  PostPulseFreshnessStatus,
  TemplateLifecycleStatus,
  TemplateSourceKind,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TemplateAnalyticsRecord = {
  templateId: string;
  name: string;
  sourceKind: TemplateSourceKind;
  lifecycleStatus: TemplateLifecycleStatus;
  isVariant: boolean;
  variantFamilyName: string | null;
  activeVersionId: string | null;
  activeVersionNumber: number | null;
  activeVersionBlockingIssues: number;
  versionCount: number;
  draftVersionCount: number;
  finalizedVersionCount: number;
  planCount: number;
  generatedPinCount: number;
  publishedCount: number;
  scheduledCount: number;
  lastGeneratedAt: Date | null;
  lastPublishedAt: Date | null;
  dominantDomain: string | null;
};

export type TemplateAnalyticsSnapshot = {
  summary: {
    trackedTemplates: number;
    trackedVersions: number;
    totalPlans: number;
    totalPins: number;
    totalPublishedPins: number;
    needsFreshPosts: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    detail: string;
    href: string;
    tone: "accent" | "warning" | "neutral";
  }>;
  fragileTemplates: Array<{
    templateId: string;
    name: string;
    reason: string;
    href: string;
  }>;
  overusedTemplates: Array<{
    templateId: string;
    name: string;
    publishedCount: number;
    generatedPinCount: number;
    sharePercent: number;
    href: string;
  }>;
  topContexts: Array<{
    domain: string;
    totalPublishedPins: number;
    topTemplateId: string;
    topTemplateName: string;
    topTemplatePublishedPins: number;
    href: string;
  }>;
};

export type TemplateVersionAnalyticsRecord = {
  versionId: string;
  versionNumber: number;
  lifecycleStatus: TemplateLifecycleStatus;
  planCount: number;
  generatedPinCount: number;
  publishedCount: number;
  scheduledCount: number;
  lastGeneratedAt: Date | null;
  lastPublishedAt: Date | null;
};

export async function getTemplateAnalyticsSnapshotForUser(
  userId: string,
): Promise<TemplateAnalyticsSnapshot> {
  const [templates, needsFreshPosts] = await Promise.all([
    getTemplateAnalyticsTemplateRows(userId),
    prisma.postPulseSnapshot.count({
      where: {
        userId,
        freshnessStatus: PostPulseFreshnessStatus.NEEDS_FRESH_PINS,
      },
    }),
  ]);

  const records = templates.map(toTemplateAnalyticsRecord);
  const totalPublishedPins = records.reduce((sum, template) => sum + template.publishedCount, 0);
  const totalPins = records.reduce((sum, template) => sum + template.generatedPinCount, 0);
  const totalPlans = records.reduce((sum, template) => sum + template.planCount, 0);
  const totalVersions = records.reduce((sum, template) => sum + template.versionCount, 0);

  return {
    summary: {
      trackedTemplates: records.length,
      trackedVersions: totalVersions,
      totalPlans,
      totalPins,
      totalPublishedPins,
      needsFreshPosts,
    },
    recommendations: buildRecommendationHints(records, {
      totalPublishedPins,
      needsFreshPosts,
    }),
    fragileTemplates: buildFragileTemplateViews(records),
    overusedTemplates: buildOverusedTemplateViews(records, totalPublishedPins),
    topContexts: buildTopPerformerContexts(records),
  };
}

export async function getTemplateVersionAnalyticsForUser(input: {
  userId: string;
  templateId: string;
}) {
  const template = await prisma.template.findFirst({
    where: {
      id: input.templateId,
      sourceKind: TemplateSourceKind.CUSTOM,
      createdByUserId: input.userId,
    },
    include: {
      versions: {
        orderBy: {
          versionNumber: "desc",
        },
        select: {
          id: true,
          versionNumber: true,
          lifecycleStatus: true,
        },
      },
      generationPlans: {
        where: {
          job: {
            userId: input.userId,
          },
        },
        select: {
          id: true,
          createdAt: true,
          templateVersionId: true,
        },
      },
      generatedPins: {
        where: {
          job: {
            userId: input.userId,
          },
        },
        select: {
          id: true,
          createdAt: true,
          templateVersionId: true,
          publicationRecords: {
            where: {
              userId: input.userId,
            },
            select: {
              state: true,
              scheduledAt: true,
              publishedAt: true,
            },
          },
        },
      },
    },
  });

  if (!template) {
    return [];
  }

  return template.versions.map((version) => {
    const plans = template.generationPlans.filter(
      (entry) => entry.templateVersionId === version.id,
    );
    const pins = template.generatedPins.filter(
      (entry) => entry.templateVersionId === version.id,
    );
    const publications = pins.flatMap((pin) => pin.publicationRecords);
    const published = publications.filter(isPublishedRecord);
    const scheduled = publications.filter(
      (record) => record.state === "SCHEDULED",
    );

    return {
      versionId: version.id,
      versionNumber: version.versionNumber,
      lifecycleStatus: version.lifecycleStatus,
      planCount: plans.length,
      generatedPinCount: pins.length,
      publishedCount: published.length,
      scheduledCount: scheduled.length,
      lastGeneratedAt: pins.reduce<Date | null>(
        (latest, pin) => (!latest || pin.createdAt > latest ? pin.createdAt : latest),
        null,
      ),
      lastPublishedAt: published.reduce<Date | null>((latest, record) => {
        const candidate = record.publishedAt ?? record.scheduledAt;
        if (!candidate) {
          return latest;
        }
        return !latest || candidate > latest ? candidate : latest;
      }, null),
    } satisfies TemplateVersionAnalyticsRecord;
  });
}

function toTemplateAnalyticsRecord(template: TemplateAnalyticsQueryRecord): TemplateAnalyticsRecord {
  const publications = template.generatedPins.flatMap((pin) => pin.publicationRecords);
  const published = publications.filter(isPublishedRecord);
  const scheduled = publications.filter((record) => record.state === "SCHEDULED");
  const dominantDomain = resolveDominantDomain(
    template.generatedPins.map((pin) => pin.job.post.domain).filter(Boolean),
  );

  return {
    templateId: template.id,
    name: template.name,
    sourceKind: template.sourceKind,
    lifecycleStatus: template.lifecycleStatus,
    isVariant: Boolean(template.variantFamilyId),
    variantFamilyName: template.variantFamily?.name ?? null,
    activeVersionId: template.activeVersion?.id ?? null,
    activeVersionNumber: template.activeVersion?.versionNumber ?? null,
    activeVersionBlockingIssues: getBlockingIssuesFromValidationJson(
      template.activeVersion?.validationJson ?? null,
    ),
    versionCount: template.versions.length,
    draftVersionCount: template.versions.filter(
      (version) => version.lifecycleStatus === TemplateLifecycleStatus.DRAFT,
    ).length,
    finalizedVersionCount: template.versions.filter(
      (version) => version.lifecycleStatus === TemplateLifecycleStatus.FINALIZED,
    ).length,
    planCount: template.generationPlans.length,
    generatedPinCount: template.generatedPins.length,
    publishedCount: published.length,
    scheduledCount: scheduled.length,
    lastGeneratedAt: template.generatedPins.reduce<Date | null>(
      (latest, pin) => (!latest || pin.createdAt > latest ? pin.createdAt : latest),
      null,
    ),
    lastPublishedAt: published.reduce<Date | null>((latest, record) => {
      const candidate = record.publishedAt ?? record.scheduledAt;
      if (!candidate) {
        return latest;
      }
      return !latest || candidate > latest ? candidate : latest;
    }, null),
    dominantDomain,
  };
}

async function getTemplateAnalyticsTemplateRows(userId: string) {
  return prisma.template.findMany({
    where: {
      OR: [
        {
          sourceKind: TemplateSourceKind.CUSTOM,
          createdByUserId: userId,
        },
        {
          generationPlans: {
            some: {
              job: {
                userId,
              },
            },
          },
        },
        {
          generatedPins: {
            some: {
              job: {
                userId,
              },
            },
          },
        },
      ],
    },
    include: {
      activeVersion: {
        select: {
          id: true,
          versionNumber: true,
          validationJson: true,
        },
      },
      variantFamily: {
        select: {
          name: true,
        },
      },
      versions: {
        select: {
          id: true,
          versionNumber: true,
          lifecycleStatus: true,
        },
      },
      generationPlans: {
        where: {
          job: {
            userId,
          },
        },
        select: {
          id: true,
          createdAt: true,
          job: {
            select: {
              post: {
                select: {
                  domain: true,
                },
              },
            },
          },
        },
      },
      generatedPins: {
        where: {
          job: {
            userId,
          },
        },
        select: {
          id: true,
          createdAt: true,
          job: {
            select: {
              post: {
                select: {
                  domain: true,
                },
              },
            },
          },
          publicationRecords: {
            where: {
              userId,
            },
            select: {
              state: true,
              scheduledAt: true,
              publishedAt: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

type TemplateAnalyticsQueryRecord = Awaited<
  ReturnType<typeof getTemplateAnalyticsTemplateRows>
>[number];

function buildFragileTemplateViews(records: TemplateAnalyticsRecord[]) {
  return records
    .filter((record) => {
      const hasDraftChurn = record.draftVersionCount >= 2 && record.finalizedVersionCount === 0;
      const hasBlockingDraft = record.activeVersionBlockingIssues > 0;
      const hasNoOutcome = record.generatedPinCount === 0 && record.publishedCount === 0;
      return (hasDraftChurn || hasBlockingDraft) && hasNoOutcome;
    })
    .sort((left, right) => {
      const leftScore = left.draftVersionCount * 2 + left.activeVersionBlockingIssues;
      const rightScore = right.draftVersionCount * 2 + right.activeVersionBlockingIssues;
      return rightScore - leftScore || left.name.localeCompare(right.name);
    })
    .slice(0, 4)
    .map((record) => ({
      templateId: record.templateId,
      name: record.name,
      reason:
        record.activeVersionBlockingIssues > 0
          ? `${record.activeVersionBlockingIssues} blocking issue(s) on the active draft with no published output yet.`
          : `${record.draftVersionCount} draft versions created with no published output yet.`,
      href: `/dashboard/templates/${record.templateId}/preview`,
    }));
}

function buildOverusedTemplateViews(
  records: TemplateAnalyticsRecord[],
  totalPublishedPins: number,
) {
  if (totalPublishedPins === 0) {
    return [];
  }

  return records
    .map((record) => ({
      ...record,
      sharePercent:
        totalPublishedPins > 0 ? Math.round((record.publishedCount / totalPublishedPins) * 100) : 0,
    }))
    .filter((record) => record.publishedCount >= 2 && record.sharePercent >= 20)
    .sort((left, right) => right.sharePercent - left.sharePercent || right.publishedCount - left.publishedCount)
    .slice(0, 4)
    .map((record) => ({
      templateId: record.templateId,
      name: record.name,
      publishedCount: record.publishedCount,
      generatedPinCount: record.generatedPinCount,
      sharePercent: record.sharePercent,
      href:
        record.sourceKind === TemplateSourceKind.CUSTOM
          ? `/dashboard/templates/${record.templateId}/preview`
          : `/dashboard/library?q=${encodeURIComponent(record.name)}&source=builtin`,
    }));
}

function buildTopPerformerContexts(records: TemplateAnalyticsRecord[]) {
  const domainMap = new Map<
    string,
    {
      totalPublishedPins: number;
      templateCounts: Map<string, { name: string; count: number; href: string }>;
    }
  >();

  for (const record of records) {
    if (!record.dominantDomain || record.publishedCount === 0) {
      continue;
    }

    const domainEntry = domainMap.get(record.dominantDomain) ?? {
      totalPublishedPins: 0,
      templateCounts: new Map<string, { name: string; count: number; href: string }>(),
    };

    domainEntry.totalPublishedPins += record.publishedCount;
    const currentTemplateCount = domainEntry.templateCounts.get(record.templateId) ?? {
      name: record.name,
      count: 0,
      href:
        record.sourceKind === TemplateSourceKind.CUSTOM
          ? `/dashboard/templates/${record.templateId}/preview`
          : `/dashboard/library?q=${encodeURIComponent(record.name)}&source=builtin`,
    };
    currentTemplateCount.count += record.publishedCount;
    domainEntry.templateCounts.set(record.templateId, currentTemplateCount);
    domainMap.set(record.dominantDomain, domainEntry);
  }

  return Array.from(domainMap.entries())
    .map(([domain, entry]) => {
      const topTemplate = Array.from(entry.templateCounts.entries()).sort(
        (left, right) => right[1].count - left[1].count,
      )[0];

      if (!topTemplate) {
        return null;
      }

      return {
        domain,
        totalPublishedPins: entry.totalPublishedPins,
        topTemplateId: topTemplate[0],
        topTemplateName: topTemplate[1].name,
        topTemplatePublishedPins: topTemplate[1].count,
        href: topTemplate[1].href,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => right.totalPublishedPins - left.totalPublishedPins)
    .slice(0, 4);
}

function buildRecommendationHints(
  records: TemplateAnalyticsRecord[],
  input: {
    totalPublishedPins: number;
    needsFreshPosts: number;
  },
) {
  const recommendations: TemplateAnalyticsSnapshot["recommendations"] = [];
  const overused = buildOverusedTemplateViews(records, input.totalPublishedPins)[0] ?? null;
  const fragile = buildFragileTemplateViews(records)[0] ?? null;
  const finalizedUnused = records.filter(
    (record) =>
      record.sourceKind === TemplateSourceKind.CUSTOM &&
      record.lifecycleStatus === TemplateLifecycleStatus.FINALIZED &&
      record.publishedCount === 0 &&
      record.generatedPinCount === 0,
  );
  const draftVsActive = records.find(
    (record) =>
      record.sourceKind === TemplateSourceKind.CUSTOM &&
      record.lifecycleStatus === TemplateLifecycleStatus.DRAFT &&
      record.finalizedVersionCount > 0 &&
      record.publishedCount >= 2,
  );

  if (overused) {
    recommendations.push({
      id: `overused-${overused.templateId}`,
      title: "Rotate an overused template",
      detail: `${overused.name} accounts for ${overused.sharePercent}% of published pins. Create or promote a variant before the feed gets repetitive.`,
      href: overused.href,
      tone: "warning",
    });
  }

  if (input.needsFreshPosts > 0 && finalizedUnused.length > 0) {
    recommendations.push({
      id: "unused-finalized-templates",
      title: "Use unused finalized templates for fresh-pin demand",
      detail: `${input.needsFreshPosts} posts need fresh pins while ${finalizedUnused.length} finalized custom template(s) have never been published.`,
      href: "/dashboard/templates?status=finalized&usage=unused",
      tone: "accent",
    });
  }

  if (fragile) {
    recommendations.push({
      id: `fragile-${fragile.templateId}`,
      title: "Stabilize a fragile template before more editing",
      detail: `${fragile.name} is accumulating churn without published output. Compare versions or simplify the draft before you keep iterating.`,
      href: fragile.href,
      tone: "warning",
    });
  }

  if (draftVsActive) {
    recommendations.push({
      id: `compare-${draftVsActive.templateId}`,
      title: "Compare active draft against the live finalized version",
      detail: `${draftVsActive.name} has a live draft while earlier finalized output is still being used. Compare before finalizing new changes.`,
      href: `/dashboard/templates/${draftVsActive.templateId}/preview`,
      tone: "neutral",
    });
  }

  return recommendations.slice(0, 4);
}

function getBlockingIssuesFromValidationJson(validationJson: unknown) {
  if (!validationJson || typeof validationJson !== "object") {
    return 0;
  }

  const value = validationJson as { blockingErrorCount?: number };
  return typeof value.blockingErrorCount === "number" ? value.blockingErrorCount : 0;
}

function resolveDominantDomain(domains: string[]) {
  const counts = new Map<string, number>();
  for (const domain of domains) {
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function isPublishedRecord(record: { state: string; publishedAt: Date | null; scheduledAt: Date | null }) {
  return (
    record.state === "PUBLISHED" ||
    record.state === "PUBLISHED_POSTED" ||
    record.publishedAt !== null
  );
}
