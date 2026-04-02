import { ZodError } from "zod";
import { getPresetIdsForCategories } from "@/lib/templates/visualPresets";
import type { TemplateVisualPresetId } from "@/lib/templates/types";
import {
  resolveRuntimeTemplateTokens,
  resolveRuntimeTextColor,
  stripAlpha,
} from "@/lib/runtime-templates/tokens";
import {
  getRuntimeContrastRatio,
  getRuntimeMinimumContrastRatio,
  resolveRuntimeTextBackground,
} from "@/lib/runtime-templates/contrast";
import { getRuntimeTemplateEffectiveDocument } from "@/lib/runtime-templates/presetOverrides";
import {
  runtimeTemplateDocumentSchema,
  type RuntimeTemplateDocument,
} from "@/lib/runtime-templates/schema.zod";
import { getRuntimeTemplateGridSlotCount } from "@/lib/runtime-templates/imageGridPresets";
import { buildRuntimeTemplateStressCases } from "@/lib/runtime-templates/stressTest";
import { doesValidationIgnoreRuleMatchIssue } from "@/lib/runtime-templates/validationIgnores";
import type {
  RuntimeTemplateContrastCheck,
  RuntimeTemplateElementType,
  RuntimeTemplateSummary,
  RuntimeTemplateValidationBucketResult,
  RuntimeTemplateValidationIssue,
  RuntimeTemplateValidationResult,
} from "@/lib/runtime-templates/types";

type RuntimeValidationOptions = {
  mode?: "schema" | "full";
  presetIds?: TemplateVisualPresetId[];
};

type RuntimeTextElement = Extract<
  RuntimeTemplateDocument["elements"][number],
  {
    type:
      | "titleText"
      | "subtitleText"
      | "domainText"
      | "numberText"
      | "ctaText"
      | "labelText";
  }
>;

type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function validateRuntimeTemplateDocument(
  input: unknown,
  options?: RuntimeValidationOptions,
): RuntimeTemplateValidationResult<RuntimeTemplateDocument> {
  const mode = options?.mode ?? "schema";
  const generatedAt = new Date().toISOString();
  const parsed = runtimeTemplateDocumentSchema.safeParse(input);

  if (!parsed.success) {
    const structuralErrors = flattenZodIssues(parsed.error);
    return createValidationResult({
      ok: false,
      document: null,
      structural: {
        errors: structuralErrors,
        warnings: [],
      },
      layout: emptyBucket(),
      preset: {
        ...emptyBucket(),
        contrastChecks: [],
        presetIdsChecked: [],
      },
      stress: {
        ...emptyBucket(),
        cases: [],
      },
      generatedAt,
      mode,
    });
  }

  const document = parsed.data;
  const structural = {
    errors: [] as RuntimeTemplateValidationIssue[],
    warnings: [] as RuntimeTemplateValidationIssue[],
  };
  const layout = applyValidationIgnoresToBucket(
    buildLayoutValidation(document),
    document.validationRules.ignoredIssues,
  );
  const presetBase =
    mode === "full"
      ? buildPresetValidation(document, options?.presetIds)
      : {
          ...emptyBucket(),
          contrastChecks: [] as RuntimeTemplateContrastCheck[],
          presetIdsChecked: [] as string[],
        };
  const preset = {
    ...applyValidationIgnoresToBucket(presetBase, document.validationRules.ignoredIssues),
    contrastChecks: presetBase.contrastChecks,
    presetIdsChecked: presetBase.presetIdsChecked,
  };
  const stressBase =
    mode === "full"
      ? buildStressValidation(document)
      : {
          ...emptyBucket(),
          cases: [],
        };
  const stress = {
    ...applyValidationIgnoresToBucket(stressBase, document.validationRules.ignoredIssues),
    cases: applyValidationIgnoresToStressCases(
      stressBase.cases,
      document.validationRules.ignoredIssues,
    ),
  };

  return createValidationResult({
    ok:
      structural.errors.length === 0 &&
      layout.errors.length === 0 &&
      preset.errors.length === 0 &&
      stress.errors.length === 0,
    document,
    structural,
    layout,
    preset,
    stress,
    generatedAt,
    mode,
  });
}

export function summarizeRuntimeTemplateDocument(
  document: RuntimeTemplateDocument,
): RuntimeTemplateSummary {
  const titleElement = findPrimaryTextRole(document, "title");
  const numberElement = findPrimaryTextRole(document, "itemNumber");
  const supportedBindings = Array.from(
    new Set(
      document.elements.map((element) => element.semanticRole),
    ),
  );
  const preferredMaxLines =
    titleElement?.styleTokens.maxLines && titleElement.styleTokens.maxLines > 0
      ? titleElement.styleTokens.maxLines
      : null;
  const category = document.metadata.category.trim() || null;
  const templateCategories = Array.from(
    new Set(
      [category, ...document.metadata.tags]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim()),
    ),
  );

  return {
    imageSlotCount: document.capabilities.imageSlotCount,
    minSlotsRequired: document.validationRules.imagePolicy.minSlotsRequired,
    imagePolicyMode: document.validationRules.imagePolicy.mode,
    supportsSubtitle: document.capabilities.supportsSubtitle,
    supportsItemNumber: document.capabilities.supportsItemNumber,
    supportsDomain: document.capabilities.supportsDomain,
    supportedBindings,
    elementCount: document.elements.length,
    elementTypes: Array.from(new Set(document.elements.map((element) => element.type))) as RuntimeTemplateElementType[],
    allowedPresetIds: [...document.presetPolicy.allowedPresetIds],
    allowedPresetCategories: [...document.presetPolicy.allowedPresetCategories],
    category,
    templateCategories,
    headlineStyle: document.capabilities.supportsItemNumber
      ? "number-led"
      : document.capabilities.supportsSubtitle
        ? "title-subtitle"
        : "title-only",
    preferredWordCount: inferPreferredWordCount(preferredMaxLines),
    preferredMaxChars: inferPreferredMaxChars(preferredMaxLines),
    preferredMaxLines,
    numberPlacement: numberElement ? "separate" : "none",
    toneTags: [...document.metadata.tags],
  };
}

function inferPreferredWordCount(preferredMaxLines: number | null) {
  if (!preferredMaxLines) {
    return null;
  }

  if (preferredMaxLines <= 1) {
    return 3;
  }

  if (preferredMaxLines === 2) {
    return 5;
  }

  if (preferredMaxLines === 3) {
    return 7;
  }

  if (preferredMaxLines === 4) {
    return 9;
  }

  return 11;
}

function inferPreferredMaxChars(preferredMaxLines: number | null) {
  if (!preferredMaxLines) {
    return null;
  }

  if (preferredMaxLines <= 1) {
    return 24;
  }

  if (preferredMaxLines === 2) {
    return 38;
  }

  if (preferredMaxLines === 3) {
    return 56;
  }

  if (preferredMaxLines === 4) {
    return 72;
  }

  return 88;
}

function buildLayoutValidation(
  document: RuntimeTemplateDocument,
): RuntimeTemplateValidationBucketResult {
  const errors: RuntimeTemplateValidationIssue[] = [];
  const warnings: RuntimeTemplateValidationIssue[] = [];
  const titleElement = findPrimaryTextRole(document, "title");
  const subtitleElement = findPrimaryTextRole(document, "subtitle");
  const domainElement = findPrimaryTextRole(document, "domain");
  const numberElement = findPrimaryTextRole(document, "itemNumber");
  const imageElements = document.elements.filter(
    (element) => element.type === "imageFrame" || element.type === "imageGrid",
  );
  const coveredSlotCount = getCoveredImageSlotCount(document);

  if (!titleElement) {
    warnings.push(issue("warning", "missing_primary_title", "No title element is currently bound in this template.", "elements", "layout"));
  }

  if (imageElements.length === 0) {
    warnings.push(issue("warning", "missing_image_binding", "No image-bound elements are currently present in this template.", "elements", "layout"));
  }

  if (document.capabilities.supportsDomain && !domainElement) {
    warnings.push(issue("warning", "missing_primary_domain", "supportsDomain is enabled but no domain element is currently bound.", "elements", "layout"));
  }

  if (document.capabilities.imageSlotCount > coveredSlotCount) {
    warnings.push(
      issue(
        "warning",
        "unused_declared_image_slots",
        "Declared imageSlotCount is higher than the image slots actually covered by elements.",
        "capabilities.imageSlotCount",
        "layout",
      ),
    );
  }

  if (document.capabilities.imageSlotCount >= 6) {
    warnings.push(
      issue(
        "warning",
        "high_image_slot_count",
        "High image-slot counts are harder to satisfy in typical generation jobs.",
        "capabilities.imageSlotCount",
        "layout",
      ),
    );
  }

  if (titleElement && titleElement.width < 420) {
    warnings.push(
      issue(
        "warning",
        "title_area_narrow",
        "Title area is relatively narrow and may stress long headlines.",
        `elements.${titleElement.id}`,
        "layout",
      ),
    );
  }

  if (subtitleElement && subtitleElement.height < 42) {
    warnings.push(
      issue(
        "warning",
        "subtitle_area_shallow",
        "Subtitle area is shallow and may hide useful supporting copy.",
        `elements.${subtitleElement.id}`,
        "layout",
      ),
    );
  }

  if (domainElement && domainElement.width < 240) {
    warnings.push(
      issue(
        "warning",
        "domain_area_narrow",
        "Domain field is narrow and may clip longer domains.",
        `elements.${domainElement.id}`,
        "layout",
      ),
    );
  }

  if (numberElement && numberElement.width < 96) {
    warnings.push(
      issue(
        "warning",
        "number_area_narrow",
        "Number binding area is narrow and may make multi-digit counts hard to read.",
        `elements.${numberElement.id}`,
        "layout",
      ),
    );
  }

  document.elements.forEach((element) => {
    if (
      (element.type === "titleText" ||
        element.type === "subtitleText" ||
        element.type === "domainText" ||
        element.type === "numberText") &&
      element.styleTokens.maxLines >= 4 &&
      element.height < 120
    ) {
      warnings.push(
        issue(
          "warning",
          "text_box_height_risk",
          "This text box allows many lines but has limited height for predictable autofit.",
          `elements.${element.id}`,
          "layout",
        ),
      );
    }

    if (element.type === "imageGrid") {
      const slotCount = getRuntimeTemplateGridSlotCount(element.layoutPreset);
      if (slotCount >= 6 && element.width < 420) {
        warnings.push(
          issue(
            "warning",
            "dense_grid_compact",
            "Dense image grids need wider bounds to remain useful with real images.",
            `elements.${element.id}`,
            "layout",
          ),
        );
      }
    }
  });

  const safeInset = document.canvas.safeInset;
  [titleElement, subtitleElement, domainElement, numberElement]
    .filter((element): element is RuntimeTextElement => Boolean(element))
    .forEach((element) => {
      const rect = toRect(element);
      if (
        rect.left < safeInset ||
        rect.top < safeInset ||
        rect.right > document.canvas.width - safeInset ||
        rect.bottom > document.canvas.height - safeInset
      ) {
        warnings.push(
          issue(
            "warning",
            "safe_area_tension",
            `${getRoleLabel(element)} is crowding the canvas safe area.`,
            `elements.${element.id}`,
            "layout",
          ),
        );
      }
    });

  checkTextOverlap(titleElement, subtitleElement, errors, "title_subtitle_overlap");
  checkTextOverlap(titleElement, domainElement, errors, "title_domain_overlap");
  checkTextOverlap(subtitleElement, domainElement, errors, "subtitle_domain_overlap");

  return {
    errors,
    warnings,
  };
}

function buildPresetValidation(
  document: RuntimeTemplateDocument,
  presetIds?: TemplateVisualPresetId[],
) {
  const errors: RuntimeTemplateValidationIssue[] = [];
  const warnings: RuntimeTemplateValidationIssue[] = [];
  const resolvedPresetIds = resolvePresetIds(document, presetIds);
  const contrastChecks: RuntimeTemplateContrastCheck[] = [];

  if (resolvedPresetIds.length === 0) {
    errors.push(
      issue(
        "error",
        "no_presets_resolved",
        "No visual presets could be resolved for runtime-template validation.",
        "presetPolicy",
        "preset",
      ),
    );
    return {
      errors,
      warnings,
      contrastChecks,
      presetIdsChecked: [],
    };
  }

  resolvedPresetIds.forEach((presetId) => {
    const tokens = resolveRuntimeTemplateTokens(presetId);
    const effectiveDocument = getRuntimeTemplateEffectiveDocument(document, presetId);
    const effectiveTextElements = effectiveDocument.elements.filter(isCriticalTextElement);

    effectiveTextElements.forEach((element) => {
      const background = resolveRuntimeTextBackground(effectiveDocument, element, tokens);
      const foreground = resolveRuntimeTextColor(
        tokens,
        element.styleTokens.textToken,
        element.styleTokens.customTextColor,
      );
      const minimumRatio = getRuntimeMinimumContrastRatio(element);
      const ratio =
        background.background === null
          ? null
          : getRuntimeContrastRatio(stripAlpha(foreground), stripAlpha(background.background));
      const passed = ratio !== null ? ratio >= minimumRatio : false;
      contrastChecks.push({
        presetId,
        role: normalizeCriticalRole(element.semanticRole),
        elementId: element.id,
        foreground: stripAlpha(foreground),
        background: background.background ? stripAlpha(background.background) : null,
        backgroundSource: background.source,
        ratio,
        minimumRatio,
        passed,
      });

      if (background.source === "image") {
        warnings.push(
          issue(
            "warning",
            "contrast_background_unknown",
            `${getRoleLabel(element)} sits directly over image content for preset '${presetId}', so contrast cannot be guaranteed.`,
            `elements.${element.id}`,
            "preset",
            {
              presetId,
            },
          ),
        );
        return;
      }

      if (ratio !== null && ratio < minimumRatio) {
        errors.push(
          issue(
            "error",
            "contrast_too_low",
            `${getRoleLabel(element)} fails contrast for preset '${presetId}' (${ratio.toFixed(2)} < ${minimumRatio.toFixed(1)}).`,
            `elements.${element.id}`,
            "preset",
            {
              presetId,
            },
          ),
        );
      }
    });
  });

  return {
    errors,
    warnings,
    contrastChecks,
    presetIdsChecked: resolvedPresetIds,
  };
}

function buildStressValidation(
  document: RuntimeTemplateDocument,
) {
  const cases = buildRuntimeTemplateStressCases(document);
  return {
    errors: cases.flatMap((testCase) => testCase.errors),
    warnings: cases.flatMap((testCase) => testCase.warnings),
    cases,
  };
}

function createValidationResult(input: {
  ok: boolean;
  document: RuntimeTemplateDocument | null;
  structural: RuntimeTemplateValidationBucketResult;
  layout: RuntimeTemplateValidationBucketResult;
  preset: RuntimeTemplateValidationBucketResult & {
    contrastChecks: RuntimeTemplateContrastCheck[];
    presetIdsChecked: string[];
  };
  stress: RuntimeTemplateValidationBucketResult & {
    cases: ReturnType<typeof buildRuntimeTemplateStressCases>;
  };
  generatedAt: string;
  mode: "schema" | "full";
}): RuntimeTemplateValidationResult<RuntimeTemplateDocument> {
  const errors = [
    ...input.structural.errors,
    ...input.layout.errors,
    ...input.preset.errors,
    ...input.stress.errors,
  ];
  const warnings = [
    ...input.structural.warnings,
    ...input.layout.warnings,
    ...input.preset.warnings,
    ...input.stress.warnings,
  ];

  return {
    ok: input.ok && errors.length === 0,
    document: input.document,
    errors,
    warnings,
    structural: input.structural,
    layout: input.layout,
    preset: input.preset,
    stress: input.stress,
    generatedAt: input.generatedAt,
    blockingErrorCount: errors.filter((entry) => entry.blocking !== false).length,
    mode: input.mode,
  };
}

function flattenZodIssues(error: ZodError): RuntimeTemplateValidationIssue[] {
  return error.issues.map((entry) =>
    issue(
      "error",
      entry.code,
      entry.message,
      entry.path.length > 0 ? entry.path.join(".") : undefined,
      "structural",
    ),
  );
}

function resolvePresetIds(
  document: RuntimeTemplateDocument,
  explicitPresetIds?: TemplateVisualPresetId[],
) {
  if (explicitPresetIds?.length) {
    return [...explicitPresetIds];
  }
  if (document.presetPolicy.allowedPresetIds.length > 0) {
    return [...document.presetPolicy.allowedPresetIds] as TemplateVisualPresetId[];
  }
  return getPresetIdsForCategories(
    document.presetPolicy.allowedPresetCategories as Parameters<typeof getPresetIdsForCategories>[0],
  );
}

function findPrimaryTextRole(
  document: RuntimeTemplateDocument,
  role: RuntimeTextElement["semanticRole"],
) {
  return document.elements.find(
    (element): element is RuntimeTextElement =>
      (element.type === "titleText" ||
        element.type === "subtitleText" ||
        element.type === "domainText" ||
        element.type === "numberText" ||
        element.type === "ctaText" ||
        element.type === "labelText") &&
      element.semanticRole === role,
  ) ?? null;
}

function getCoveredImageSlotCount(document: RuntimeTemplateDocument) {
  return document.elements.reduce((maximum, element) => {
    if (element.type === "imageFrame") {
      return Math.max(maximum, element.slotIndex + 1);
    }
    if (element.type === "imageGrid") {
      return Math.max(
        maximum,
        element.slotStartIndex + getRuntimeTemplateGridSlotCount(element.layoutPreset),
      );
    }
    return maximum;
  }, 0);
}

function checkTextOverlap(
  first: RuntimeTextElement | null,
  second: RuntimeTextElement | null,
  errors: RuntimeTemplateValidationIssue[],
  code: string,
) {
  if (!first || !second) {
    return;
  }
  const overlap = rectIntersectionArea(toRect(first), toRect(second));
  if (overlap > 0) {
    errors.push(
      issue(
        "error",
        code,
        `${getRoleLabel(first)} overlaps ${getRoleLabel(second)} in a blocking way.`,
        `elements.${first.id}`,
        "layout",
      ),
    );
  }
}

function toRect(element: Pick<RuntimeTemplateDocument["elements"][number], "x" | "y" | "width" | "height">): Rect {
  return {
    left: element.x,
    top: element.y,
    right: element.x + element.width,
    bottom: element.y + element.height,
  };
}

function rectIntersectionArea(first: Rect, second: Rect) {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  return width * height;
}

function isCriticalTextElement(
  element: RuntimeTemplateDocument["elements"][number],
): element is RuntimeTextElement {
  return (
    (element.type === "titleText" ||
      element.type === "subtitleText" ||
      element.type === "domainText" ||
      element.type === "numberText" ||
      element.type === "ctaText") &&
    (element.semanticRole === "title" ||
      element.semanticRole === "subtitle" ||
      element.semanticRole === "domain" ||
      element.semanticRole === "itemNumber" ||
      element.semanticRole === "cta")
  );
}

function getRoleLabel(element: RuntimeTextElement) {
  if (element.semanticRole === "title") {
    return "Primary title";
  }
  if (element.semanticRole === "subtitle") {
    return "Primary subtitle";
  }
  if (element.semanticRole === "domain") {
    return "Primary domain";
  }
  if (element.semanticRole === "itemNumber") {
    return "Primary item number";
  }
  if (element.semanticRole === "cta") {
    return "CTA";
  }
  return element.name;
}

function normalizeCriticalRole(role: RuntimeTextElement["semanticRole"]) {
  if (role === "itemNumber") {
    return "itemNumber" as const;
  }
  if (role === "subtitle") {
    return "subtitle" as const;
  }
  if (role === "domain") {
    return "domain" as const;
  }
  if (role === "cta") {
    return "cta" as const;
  }
  return "title" as const;
}

function issue(
  level: "error" | "warning",
  code: string,
  message: string,
  path: string | undefined,
  bucket: RuntimeTemplateValidationIssue["bucket"],
  context?: RuntimeTemplateValidationIssue["context"],
): RuntimeTemplateValidationIssue {
  return {
    level,
    code,
    message,
    path,
    bucket,
    blocking: level === "error",
    context,
  };
}

function applyValidationIgnoresToBucket<TBucket extends RuntimeTemplateValidationBucketResult>(
  bucket: TBucket,
  ignoredIssues: RuntimeTemplateDocument["validationRules"]["ignoredIssues"],
): TBucket {
  return {
    ...bucket,
    errors: bucket.errors.filter(
      (issue) =>
        !ignoredIssues.some((ignoredIssue) =>
          doesValidationIgnoreRuleMatchIssue(ignoredIssue, issue),
        ),
    ),
    warnings: bucket.warnings.filter(
      (issue) =>
        !ignoredIssues.some((ignoredIssue) =>
          doesValidationIgnoreRuleMatchIssue(ignoredIssue, issue),
        ),
    ),
  };
}

function applyValidationIgnoresToStressCases(
  cases: ReturnType<typeof buildRuntimeTemplateStressCases>,
  ignoredIssues: RuntimeTemplateDocument["validationRules"]["ignoredIssues"],
) {
  return cases.map((testCase) => {
    const errors = testCase.errors.filter(
      (issue) =>
        !ignoredIssues.some((ignoredIssue) =>
          doesValidationIgnoreRuleMatchIssue(ignoredIssue, issue),
        ),
    );
    const warnings = testCase.warnings.filter(
      (issue) =>
        !ignoredIssues.some((ignoredIssue) =>
          doesValidationIgnoreRuleMatchIssue(ignoredIssue, issue),
        ),
    );

    return {
      ...testCase,
      errors,
      warnings,
      passed: errors.length === 0,
      blocking: errors.length > 0,
    };
  });
}

function emptyBucket(): RuntimeTemplateValidationBucketResult {
  return {
    errors: [],
    warnings: [],
  };
}
