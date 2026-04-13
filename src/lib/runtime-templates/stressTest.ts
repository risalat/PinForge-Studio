import {
  resolveRuntimeImage,
  resolveRuntimeImageGrid,
  resolveRuntimeTextBinding,
} from "@/lib/runtime-templates/bindings";
import type { RuntimeTemplateDocument, RuntimeTemplateElement } from "@/lib/runtime-templates/schema";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import type {
  RuntimeTemplateStressCaseResult,
  RuntimeTemplateValidationIssue,
} from "@/lib/runtime-templates/types";
import type { TemplateRenderProps } from "@/lib/templates/types";

type RuntimeTextElement = Extract<
  RuntimeTemplateElement,
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

const TEXT_ROLE_LABELS: Partial<Record<RuntimeTextElement["semanticRole"], string>> = {
  title: "title",
  subtitle: "subtitle",
  itemNumber: "item number",
  domain: "domain",
  cta: "CTA",
};

export function buildRuntimeTemplateStressCases(
  document: RuntimeTemplateDocument,
): RuntimeTemplateStressCaseResult[] {
  return getRuntimeTemplateStressCaseDefinitions().map((testCase) =>
    evaluateStressCase(document, testCase.id, testCase.label, testCase.payload),
  );
}

export function getRuntimeTemplateStressCaseDefinitions() {
  const base = getSampleRuntimeTemplateRenderProps();

  return [
    {
      id: "short-title",
      label: "Short title",
      payload: {
        ...base,
        title: "Patio Ideas",
      },
    },
    {
      id: "long-title",
      label: "Long title",
      payload: {
        ...base,
        title: "27 Small Front Porch Decorating Ideas That Still Feel Warm, Layered, And Expensive",
      },
    },
    {
      id: "title-with-number",
      label: "Title already contains a number",
      payload: {
        ...base,
        title: "21 Accent Wall Ideas That Wake Up A Plain Room",
      },
    },
    {
      id: "missing-subtitle",
      label: "Missing subtitle",
      payload: {
        ...base,
        subtitle: "",
      },
    },
    {
      id: "long-domain",
      label: "Very long domain",
      payload: {
        ...base,
        domain: "www.theverylongeditorialhomestylingexample.com",
      },
    },
    {
      id: "one-digit-number",
      label: "One-digit item number",
      payload: {
        ...base,
        itemNumber: 7,
      },
    },
    {
      id: "two-digit-number",
      label: "Two-digit item number",
      payload: {
        ...base,
        itemNumber: 24,
      },
    },
    {
      id: "low-image-count",
      label: "Low image count fallback",
      payload: {
        ...base,
        images: base.images.slice(0, 1),
      },
    },
  ] satisfies Array<{
    id: string;
    label: string;
    payload: TemplateRenderProps;
  }>;
}

function evaluateStressCase(
  document: RuntimeTemplateDocument,
  id: string,
  label: string,
  payload: TemplateRenderProps,
): RuntimeTemplateStressCaseResult {
  const errors: RuntimeTemplateValidationIssue[] = [];
  const warnings: RuntimeTemplateValidationIssue[] = [];

  const textElements = document.elements.filter((element): element is RuntimeTextElement =>
    element.type === "titleText" ||
    element.type === "subtitleText" ||
    element.type === "domainText" ||
    element.type === "numberText" ||
    element.type === "ctaText" ||
    element.type === "labelText",
  );

  textElements.forEach((element) => {
    const resolved = resolveRuntimeTextBinding({ payload, element });
    const trimmed = resolved.trim();

    if (!trimmed && !element.hideWhenEmpty && element.semanticRole !== "decorative") {
      errors.push(
        makeIssue(
          "error",
          "stress_text_missing",
          `${getTextRoleLabel(element)} resolved empty in the "${label}" stress case.`,
          `elements.${element.id}`,
          {
            stressCaseId: id,
            stressCaseLabel: label,
          },
        ),
      );
      return;
    }

    if (!trimmed) {
      return;
    }

    const fitResult = estimateTextFit(element, trimmed);
    if (fitResult === "error") {
      errors.push(
        makeIssue(
          "error",
          "stress_text_overflow",
          `${getTextRoleLabel(element)} is likely to overflow in the "${label}" stress case.`,
          `elements.${element.id}`,
          {
            stressCaseId: id,
            stressCaseLabel: label,
          },
        ),
      );
    } else if (fitResult === "warning") {
      warnings.push(
        makeIssue(
          "warning",
          "stress_text_tight",
          `${getTextRoleLabel(element)} is tight in the "${label}" stress case and may autofit aggressively.`,
          `elements.${element.id}`,
          {
            stressCaseId: id,
            stressCaseLabel: label,
          },
        ),
      );
    }

    if (
      id === "title-with-number" &&
      element.semanticRole === "title" &&
      payload.itemNumber !== null &&
      payload.itemNumber !== undefined &&
      new RegExp(`\\b${payload.itemNumber}\\b`).test(trimmed)
    ) {
      warnings.push(
        makeIssue(
          "warning",
          "title_number_collision",
          "Title already includes a number while the template also binds a separate item number.",
          `elements.${element.id}`,
          {
            stressCaseId: id,
            stressCaseLabel: label,
          },
        ),
      );
    }
  });

  const imageElements = document.elements.filter(
    (element) => element.type === "imageFrame" || element.type === "imageGrid",
  );
  imageElements.forEach((element) => {
    if (element.type === "imageFrame") {
      const image = resolveRuntimeImage({
        document,
        payload,
        slotIndex: element.slotIndex,
      });
      if (!image) {
        const issue = makeIssue(
          document.validationRules.imagePolicy.mode === "REQUIRE_EXACT" ? "error" : "warning",
          "stress_image_slot_unresolved",
          `Image slot ${element.slotIndex + 1} cannot be satisfied in the "${label}" stress case.`,
          `elements.${element.id}`,
          {
            stressCaseId: id,
            stressCaseLabel: label,
          },
        );
        (issue.level === "error" ? errors : warnings).push(issue);
      }
      return;
    }

    const gridImages = resolveRuntimeImageGrid({
      document,
      payload,
      element,
    });
    const missingCount = gridImages.filter((src) => !src).length;
    if (missingCount > 0) {
      const issue = makeIssue(
        document.validationRules.imagePolicy.mode === "REQUIRE_EXACT" ? "error" : "warning",
        "stress_image_grid_unresolved",
        `${missingCount} image grid slots cannot be satisfied in the "${label}" stress case.`,
        `elements.${element.id}`,
        {
          stressCaseId: id,
          stressCaseLabel: label,
        },
      );
      (issue.level === "error" ? errors : warnings).push(issue);
    }
  });

  return {
    id,
    label,
    passed: errors.length === 0,
    blocking: errors.length > 0,
    payloadSummary: {
      title: payload.title,
      subtitle: payload.subtitle || null,
      itemNumber: payload.itemNumber ?? null,
      domain: payload.domain,
      imageCount: payload.images.length,
      visualPreset: payload.visualPreset ?? payload.colorPreset ?? null,
    },
    errors,
    warnings,
  };
}

function estimateTextFit(element: RuntimeTextElement, text: string) {
  const safeText = normalizeTextForFit(text, element.styleTokens.textTransform);
  const lineHeight = element.styleTokens.lineHeight;
  const minFontSize = element.styleTokens.minFontSize;
  const maxLines = element.styleTokens.maxLines;
  const avgWidthFactor = getAverageCharacterWidthFactor(element);
  const charWidth = minFontSize * avgWidthFactor;
  const lineCapacity = Math.max(1, Math.floor(element.width / Math.max(charWidth, 1)));
  const estimatedLines = Math.max(1, Math.ceil(safeText.length / Math.max(1, lineCapacity * 0.92)));
  const verticalCapacity = Math.max(
    1,
    Math.floor(element.height / Math.max(minFontSize * lineHeight, 1)),
  );
  const allowedLines = Math.max(1, Math.min(maxLines, verticalCapacity));

  if (estimatedLines > allowedLines) {
    return "error" as const;
  }

  if (estimatedLines >= allowedLines || safeText.length > lineCapacity * allowedLines * 0.84) {
    return "warning" as const;
  }

  return "pass" as const;
}

function normalizeTextForFit(text: string, transform: RuntimeTextElement["styleTokens"]["textTransform"]) {
  if (transform === "uppercase") {
    return text.toUpperCase();
  }
  if (transform === "lowercase") {
    return text.toLowerCase();
  }
  if (transform === "capitalize") {
    return text.replace(/\b\w/g, (character) => character.toUpperCase());
  }
  return text;
}

function getAverageCharacterWidthFactor(element: RuntimeTextElement) {
  if (element.semanticRole === "itemNumber") {
    return 0.62;
  }
  if (element.semanticRole === "title") {
    return 0.54;
  }
  if (element.semanticRole === "subtitle") {
    return 0.58;
  }
  if (element.semanticRole === "domain" || element.semanticRole === "cta") {
    return 0.57;
  }
  return 0.55;
}

function getTextRoleLabel(element: RuntimeTextElement) {
  return TEXT_ROLE_LABELS[element.semanticRole] ?? element.name ?? element.type;
}

function makeIssue(
  level: "error" | "warning",
  code: string,
  message: string,
  path?: string,
  context?: RuntimeTemplateValidationIssue["context"],
): RuntimeTemplateValidationIssue {
  return {
    level,
    code,
    message,
    path,
    bucket: "stress",
    blocking: level === "error",
    context,
  };
}
