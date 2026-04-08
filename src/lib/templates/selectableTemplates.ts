import {
  TemplateLifecycleStatus,
  TemplateRendererKind,
  TemplateSourceKind,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runtimeTemplateDocumentSchema, type RuntimeTemplateDocument } from "@/lib/runtime-templates/schema";
import type { RuntimeTemplateSummary } from "@/lib/runtime-templates/types";
import { summarizeRuntimeTemplateDocument } from "@/lib/runtime-templates/validate";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import { getSampleTemplateProps, TEMPLATE_CONFIGS } from "@/lib/templates/registry";
import {
  buildTemplateGroupingMetadata,
  getTemplateUserGroupsForTemplateForUser,
  listTemplateUserGroupsByTemplateIdForUser,
  resolveTemplateUserGroupsFromAssignments,
  type TemplateUserGroupSummary,
} from "@/lib/templates/templateGroupMetadata";
import {
  getPresetIdsForCategories,
  getPresetIdsForTemplate,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import {
  templateVisualPresets,
  type TemplateNumberTreatment,
  type TemplateRenderProps,
  type TemplateVisualPresetCategoryId,
  type TemplateVisualPresetId,
} from "@/lib/templates/types";

export type TemplateSelectionRef = {
  templateId: string;
  templateVersionId?: string | null;
};

export type SelectableTemplateCandidate = {
  id: string;
  templateId: string;
  templateVersionId: string | null;
  selectionKey: string;
  name: string;
  slug: string | null;
  description: string | null;
  sourceKind: TemplateSourceKind;
  rendererKind: TemplateRendererKind;
  lifecycleStatus: TemplateLifecycleStatus;
  locked: boolean;
  canvas: {
    width: number;
    height: number;
  };
  imageSlotCount: number;
  minImageSlotsRequired: number;
  imagePolicyMode:
    | "REQUIRE_EXACT"
    | "ALLOW_FEWER_HIDE_UNUSED"
    | "ALLOW_FEWER_DUPLICATE_LAST"
    | "ALLOW_FEWER_FILL_PLACEHOLDER";
  supportsSubtitle: boolean;
  supportsItemNumber: boolean;
  supportsDomain: boolean;
  supportedBindings: string[];
  allowedPresetIds: TemplateVisualPresetId[];
  allowedPresetCategories: TemplateVisualPresetCategoryId[];
  templateCategories: string[];
  systemCategories: string[];
  userGroups: TemplateUserGroupSummary[];
  userGroupIds: string[];
  numberTreatment: TemplateNumberTreatment;
  previewPath: string;
  renderPath: string;
  thumbnailPath: string | null;
  updatedAt: Date;
  versionNumber: number | null;
  sampleProps: TemplateRenderProps;
  runtimeSchemaJson?: Prisma.JsonValue | null;
  copyHints: {
    headlineStyle: string | null;
    preferredWordCount: number | null;
    preferredMaxChars: number | null;
    preferredMaxLines: number | null;
    numberPlacement: string | null;
    toneTags: string[];
  };
};

type RuntimeTemplateListRecord = Awaited<ReturnType<typeof listRuntimeTemplatesForUser>>[number];

export function buildTemplateSelectionKey(input: TemplateSelectionRef) {
  return input.templateVersionId?.trim()
    ? `${input.templateId}:${input.templateVersionId.trim()}`
    : input.templateId;
}

export function getBuiltInTemplateLibraryEntries() {
  return Object.values(TEMPLATE_CONFIGS).map((config) => ({
    ...config,
    previewPath: config.previewPath ?? `/preview/${config.id}`,
    locked: config.locked ?? false,
    sampleProps: getSampleTemplateProps(config.id),
  }));
}

export function getTemplateLibraryEntries() {
  return getBuiltInTemplateLibraryEntries();
}

export function getBuiltInSelectableTemplateCandidates(input?: {
  userGroupsByTemplateId?: Map<string, TemplateUserGroupSummary[]>;
}): SelectableTemplateCandidate[] {
  return getBuiltInTemplateLibraryEntries().map((template) => {
    const allowedPresetIds = getPresetIdsForTemplate(template.id);
    const allowedPresetCategories = Array.from(
      new Set(allowedPresetIds.map((presetId) => getTemplateVisualPresetCategory(presetId))),
    );
    const templateCategories = getBuiltInTemplateCategories(template);
    const groupingMetadata = buildTemplateGroupingMetadata({
      systemCategories: templateCategories,
      userGroups: input?.userGroupsByTemplateId?.get(template.id) ?? [],
    });

    return {
      id: template.id,
      templateId: template.id,
      templateVersionId: null,
      selectionKey: buildTemplateSelectionKey({ templateId: template.id }),
      name: template.name,
      slug: template.id,
      description: null,
      sourceKind: TemplateSourceKind.BUILTIN,
      rendererKind: TemplateRendererKind.BUILTIN_COMPONENT,
      lifecycleStatus: TemplateLifecycleStatus.FINALIZED,
      locked: Boolean(template.locked),
      canvas: template.canvas,
      imageSlotCount: template.imageSlotCount,
      minImageSlotsRequired: 1,
      imagePolicyMode: "ALLOW_FEWER_DUPLICATE_LAST",
      supportsSubtitle: template.textFields.includes("subtitle"),
      supportsItemNumber: template.textFields.includes("itemNumber"),
      supportsDomain: template.textFields.includes("domain"),
      supportedBindings: buildBuiltInSupportedBindings(template),
      allowedPresetIds,
      allowedPresetCategories,
      templateCategories,
      ...groupingMetadata,
      numberTreatment: template.features.numberTreatment,
      previewPath: template.previewPath ?? `/preview/${template.id}`,
      renderPath: `/render/${template.id}`,
      thumbnailPath: null,
      updatedAt: new Date(0),
      versionNumber: null,
      sampleProps: template.sampleProps,
      copyHints: getBuiltInTemplateCopyHints(template.id, template.features.numberTreatment),
    };
  });
}

export async function getBuiltInSelectableTemplateCandidatesForUser(userId: string) {
  const userGroupsByTemplateId = await listTemplateUserGroupsByTemplateIdForUser(userId);
  return getBuiltInSelectableTemplateCandidates({
    userGroupsByTemplateId,
  });
}

export async function listFinalizedCustomTemplateCandidatesForUser(userId: string) {
  const templates = await listRuntimeTemplatesForUser(userId);
  const candidates = templates
    .map((template) => toRuntimeSelectableTemplateCandidate(template))
    .filter(
      (
        candidate,
      ): candidate is NonNullable<
        ReturnType<typeof toRuntimeSelectableTemplateCandidate>
      > => Boolean(candidate),
    );

  return candidates.filter(
    (candidate) => candidate.lifecycleStatus === TemplateLifecycleStatus.FINALIZED,
  );
}

export async function listSelectableTemplateCandidatesForUser(userId: string) {
  const [builtIns, customFinalized] = await Promise.all([
    getBuiltInSelectableTemplateCandidatesForUser(userId),
    listFinalizedCustomTemplateCandidatesForUser(userId),
  ]);

  return [...builtIns, ...customFinalized].sort((left, right) =>
    left.sourceKind === right.sourceKind
      ? left.name.localeCompare(right.name)
      : left.sourceKind === TemplateSourceKind.BUILTIN
        ? -1
        : 1,
  );
}

export async function resolveSelectableTemplateCandidateForUser(
  userId: string,
  input: TemplateSelectionRef,
) {
  const builtIn = getBuiltInSelectableTemplateCandidates().find(
    (candidate) =>
      candidate.templateId === input.templateId &&
      candidate.templateVersionId === null,
  );
  if (builtIn) {
    const userGroups = await getTemplateUserGroupsForTemplateForUser({
      userId,
      templateId: input.templateId,
    });

    return {
      ...builtIn,
      ...buildTemplateGroupingMetadata({
        systemCategories: builtIn.templateCategories,
        userGroups,
      }),
    };
  }

  const runtimeTemplate = await prisma.template.findFirst({
    where: {
      id: input.templateId,
      sourceKind: TemplateSourceKind.CUSTOM,
      rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
      createdByUserId: userId,
      isActive: true,
      lifecycleStatus: {
        not: TemplateLifecycleStatus.ARCHIVED,
      },
    },
    include: {
      activeVersion: true,
      templateGroupAssignments: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              slug: true,
              sortOrder: true,
            },
          },
        },
      },
      versions: input.templateVersionId?.trim()
        ? {
            where: {
              id: input.templateVersionId.trim(),
            },
            take: 1,
          }
        : false,
    },
  });

  if (!runtimeTemplate) {
    return null;
  }

  const selectedVersion =
    input.templateVersionId?.trim() && Array.isArray(runtimeTemplate.versions)
      ? runtimeTemplate.versions[0] ?? runtimeTemplate.activeVersion
      : runtimeTemplate.activeVersion;

  if (!selectedVersion) {
    return null;
  }

  const candidate = toRuntimeSelectableTemplateCandidate({
    ...runtimeTemplate,
    activeVersion: selectedVersion,
  });

  if (!candidate) {
    return null;
  }

  if (candidate.lifecycleStatus !== TemplateLifecycleStatus.FINALIZED || !candidate.locked) {
    return null;
  }

  return candidate;
}

function buildBuiltInSupportedBindings(template: ReturnType<typeof getBuiltInTemplateLibraryEntries>[number]) {
  const bindings = new Set<string>(["title", "imageSlot"]);

  if (template.textFields.includes("subtitle")) {
    bindings.add("subtitle");
  }

  if (template.textFields.includes("domain")) {
    bindings.add("domain");
  }

  if (template.textFields.includes("itemNumber")) {
    bindings.add("itemNumber");
  }

  return Array.from(bindings);
}

function getBuiltInTemplateCopyHints(
  templateId: string,
  numberTreatment: TemplateNumberTreatment,
) {
  const titleRule = getBuiltInArtworkRule(templateId);

  return {
    headlineStyle: numberTreatment === "hero" ? "number-led" : "title-only",
    preferredWordCount: titleRule.maxWords,
    preferredMaxChars: titleRule.maxChars,
    preferredMaxLines: titleRule.maxLines,
    numberPlacement: numberTreatment === "none" ? "none" : "separate",
    toneTags: [],
  };
}

export function getBuiltInTemplateCategories(
  template: ReturnType<typeof getBuiltInTemplateLibraryEntries>[number],
) {
  const categories = new Set<string>();

  if (template.features.numberTreatment !== "none") {
    categories.add("listicle");
    categories.add("roundup");
  } else {
    categories.add("feature");
  }

  if (template.textFields.includes("subtitle")) {
    categories.add("guide");
    categories.add("editorial");
  }

  if (template.imageSlotCount >= 4) {
    categories.add("gallery");
    categories.add("ideas");
  }

  if (template.imageSlotCount === 1) {
    categories.add("feature");
  }

  if (template.textFields.includes("domain") && template.features.footer) {
    categories.add("blog");
  }

  return Array.from(categories);
}

function getBuiltInArtworkRule(templateId: string) {
  switch (templateId) {
    case "nine-image-grid-overlay-number-footer":
      return { maxWords: 4, maxChars: 28, maxLines: 1 };
    case "hero-two-split-text":
      return { maxWords: 5, maxChars: 36, maxLines: 3 };
    case "color-pop-ladder-number-card":
      return { maxWords: 4, maxChars: 30, maxLines: 3 };
    case "hero-scrapbook-tape-tag":
      return { maxWords: 6, maxChars: 34, maxLines: 3 };
    case "hero-arch-sidebar-triptych":
      return { maxWords: 5, maxChars: 30, maxLines: 5 };
    case "three-image-center-poster-number-footer":
      return { maxWords: 5, maxChars: 34, maxLines: 4 };
    case "single-image-overlay-number-title-domain":
      return { maxWords: 5, maxChars: 38, maxLines: 2 };
    case "split-vertical-title-number":
      return { maxWords: 5, maxChars: 34, maxLines: 2 };
    case "four-image-split-band-number":
      return { maxWords: 3, maxChars: 24, maxLines: 2 };
    case "four-image-grid-number-title":
      return { maxWords: 3, maxChars: 28, maxLines: 3 };
    case "two-image-slant-band-number-domain":
      return { maxWords: 6, maxChars: 34, maxLines: 3 };
    case "five-image-center-band-number-domain":
      return { maxWords: 6, maxChars: 36, maxLines: 3 };
    case "four-image-grid-center-band-title-domain":
      return { maxWords: 5, maxChars: 34, maxLines: 3 };
    default:
      return { maxWords: 7, maxChars: 52, maxLines: 3 };
  }
}

async function listRuntimeTemplatesForUser(userId: string) {
  return prisma.template.findMany({
    where: {
      sourceKind: TemplateSourceKind.CUSTOM,
      createdByUserId: userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      activeVersion: {
        select: {
          id: true,
          versionNumber: true,
          lifecycleStatus: true,
          isActive: true,
          isLocked: true,
          schemaJson: true,
          summaryJson: true,
          validationJson: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      templateGroupAssignments: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              slug: true,
              sortOrder: true,
            },
          },
        },
      },
      versions: {
        select: {
          id: true,
          versionNumber: true,
          lifecycleStatus: true,
          isActive: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          versionNumber: "desc",
        },
      },
    },
  });
}

function toRuntimeSelectableTemplateCandidate(template: RuntimeTemplateListRecord) {
  const activeVersion = template.activeVersion;
  if (!activeVersion?.schemaJson) {
    return null;
  }

  const document = parseRuntimeTemplateDocument(activeVersion.schemaJson);
  if (!document) {
    return null;
  }

  const summary = parseRuntimeTemplateSummary(activeVersion.summaryJson, document);
  const allowedPresetIds = resolveRuntimeAllowedPresetIds(document);
  const allowedPresetCategories = resolveRuntimeAllowedPresetCategories(document, allowedPresetIds);
  const groupingMetadata = buildTemplateGroupingMetadata({
    systemCategories: summary.templateCategories ?? [],
    userGroups: resolveTemplateUserGroupsFromAssignments(template.templateGroupAssignments),
  });

  return {
    id: template.id,
    templateId: template.id,
    templateVersionId: activeVersion.id,
    selectionKey: buildTemplateSelectionKey({
      templateId: template.id,
      templateVersionId: activeVersion.id,
    }),
    name: template.name,
    slug: template.slug,
    description: template.description,
    sourceKind: template.sourceKind,
    rendererKind: template.rendererKind,
    lifecycleStatus: template.lifecycleStatus,
    locked: Boolean(activeVersion.isLocked),
    canvas: {
      width: template.canvasWidth,
      height: template.canvasHeight,
    },
    imageSlotCount: summary.imageSlotCount,
    minImageSlotsRequired: summary.minSlotsRequired,
    imagePolicyMode: summary.imagePolicyMode,
    supportsSubtitle: summary.supportsSubtitle,
    supportsItemNumber: summary.supportsItemNumber,
    supportsDomain: summary.supportsDomain,
    supportedBindings: summary.supportedBindings,
    allowedPresetIds,
    allowedPresetCategories,
    templateCategories: summary.templateCategories ?? [],
    ...groupingMetadata,
    numberTreatment: summary.supportsItemNumber ? "hero" : "none",
    previewPath: `/dashboard/templates/${template.id}/preview?versionId=${activeVersion.id}`,
    renderPath: `/render/${template.id}?versionId=${activeVersion.id}`,
    thumbnailPath: template.thumbnailPath ?? null,
    updatedAt: template.updatedAt,
    versionNumber: activeVersion.versionNumber,
    sampleProps: {
      ...getSampleRuntimeTemplateRenderProps(),
      visualPreset:
        allowedPresetIds[0] ?? getSampleRuntimeTemplateRenderProps().visualPreset,
    },
    runtimeSchemaJson: activeVersion.schemaJson,
    copyHints: {
      headlineStyle: summary.headlineStyle ?? null,
      preferredWordCount: summary.preferredWordCount ?? null,
      preferredMaxChars: summary.preferredMaxChars ?? null,
      preferredMaxLines: summary.preferredMaxLines ?? null,
      numberPlacement: summary.numberPlacement ?? null,
      toneTags: summary.toneTags ?? [],
    },
  };
}

function parseRuntimeTemplateDocument(schemaJson: Prisma.JsonValue | null) {
  const parsed = runtimeTemplateDocumentSchema.safeParse(schemaJson);
  return parsed.success ? parsed.data : null;
}

function parseRuntimeTemplateSummary(
  summaryJson: Prisma.JsonValue | null,
  document: RuntimeTemplateDocument,
) {
  if (summaryJson && typeof summaryJson === "object" && !Array.isArray(summaryJson)) {
    const record = summaryJson as Record<string, unknown>;
    if (
      typeof record.imageSlotCount === "number" &&
      typeof record.supportsSubtitle === "boolean" &&
      typeof record.supportsItemNumber === "boolean" &&
      typeof record.supportsDomain === "boolean"
    ) {
      return {
        ...summarizeRuntimeTemplateDocument(document),
        ...record,
        supportedBindings: Array.isArray(record.supportedBindings)
          ? record.supportedBindings.filter(
              (value): value is string => typeof value === "string",
            )
          : summarizeRuntimeTemplateDocument(document).supportedBindings,
        templateCategories: Array.isArray(record.templateCategories)
          ? record.templateCategories.filter((value): value is string => typeof value === "string")
          : summarizeRuntimeTemplateDocument(document).templateCategories,
        category:
          typeof record.category === "string" && record.category.trim().length > 0
            ? record.category.trim()
            : summarizeRuntimeTemplateDocument(document).category,
        toneTags: Array.isArray(record.toneTags)
          ? record.toneTags.filter((value): value is string => typeof value === "string")
          : summarizeRuntimeTemplateDocument(document).toneTags,
      } as RuntimeTemplateSummary;
    }
  }

  return summarizeRuntimeTemplateDocument(document);
}

function resolveRuntimeAllowedPresetIds(document: RuntimeTemplateDocument) {
  const allowedPresetIds = document.presetPolicy.allowedPresetIds.filter((presetId) =>
    templateVisualPresets.includes(presetId as TemplateVisualPresetId),
  ) as TemplateVisualPresetId[];

  if (allowedPresetIds.length > 0) {
    return allowedPresetIds;
  }

  const categoryPresetIds = getPresetIdsForCategories(
    document.presetPolicy.allowedPresetCategories as TemplateVisualPresetCategoryId[],
  );
  return categoryPresetIds.length > 0 ? categoryPresetIds : [...templateVisualPresets];
}

function resolveRuntimeAllowedPresetCategories(
  document: RuntimeTemplateDocument,
  allowedPresetIds: TemplateVisualPresetId[],
) {
  if (document.presetPolicy.allowedPresetCategories.length > 0) {
    return document.presetPolicy.allowedPresetCategories.filter((categoryId) =>
      Array.from(new Set(allowedPresetIds.map((presetId) => getTemplateVisualPresetCategory(presetId)))).includes(
        categoryId as TemplateVisualPresetCategoryId,
      ),
    ) as TemplateVisualPresetCategoryId[];
  }

  return Array.from(
    new Set(allowedPresetIds.map((presetId) => getTemplateVisualPresetCategory(presetId))),
  );
}
