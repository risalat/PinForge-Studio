import type { RuntimeTemplateDocument, RuntimeTemplateElement } from "@/lib/runtime-templates/schema";
import {
  resolveRuntimeFillColor,
  resolveRuntimeTemplateTokens,
  resolveRuntimeTextColor,
  stripAlpha,
} from "@/lib/runtime-templates/tokens";

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

export function resolveRuntimeTextBackground(
  document: RuntimeTemplateDocument,
  textElement: RuntimeTextElement,
  tokens: ReturnType<typeof resolveRuntimeTemplateTokens>,
) {
  const targetRect = toRect(textElement);
  const candidates = [...document.elements]
    .filter((element) => element.visible && element.zIndex < textElement.zIndex)
    .sort((left, right) => right.zIndex - left.zIndex);

  for (const candidate of candidates) {
    if (rectIntersectionArea(targetRect, toRect(candidate)) <= 0) {
      continue;
    }

    if (candidate.type === "shapeBlock") {
      return {
        background:
          resolveRuntimeFillColor(
            tokens,
            candidate.styleTokens.fillToken,
            candidate.styleTokens.customFill,
          ) ?? null,
        source: "shape" as const,
        carrierId: candidate.id,
      };
    }

    if (candidate.type === "overlay") {
      return {
        background:
          resolveRuntimeFillColor(
            tokens,
            candidate.styleTokens.fillToken,
            candidate.styleTokens.customFill,
          ) ?? tokens.fills["surface.overlay"],
        source: "overlay" as const,
        carrierId: candidate.id,
      };
    }

    if (candidate.type === "imageFrame" || candidate.type === "imageGrid") {
      return {
        background: null,
        source: "image" as const,
        carrierId: candidate.id,
      };
    }
  }

  return {
    background:
      resolveRuntimeFillColor(
        tokens,
        document.background.fillToken,
        document.background.customFill,
      ) ?? tokens.fills[document.background.fillToken],
    source: "canvas" as const,
    carrierId: null,
  };
}

export function getRuntimeContrastRatio(foregroundHex: string, backgroundHex: string) {
  const foreground = getRelativeLuminance(foregroundHex);
  const background = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getRuntimeMinimumContrastRatio(
  element: Pick<RuntimeTextElement, "semanticRole">,
) {
  if (element.semanticRole === "title") {
    return 4.5;
  }
  if (element.semanticRole === "subtitle" || element.semanticRole === "domain") {
    return 4.3;
  }
  if (element.semanticRole === "itemNumber") {
    return 4;
  }
  return 4.1;
}

export function getRuntimeResolvedTextColor(
  document: RuntimeTemplateDocument,
  presetId: Parameters<typeof resolveRuntimeTemplateTokens>[0],
  element: RuntimeTextElement,
) {
  const tokens = resolveRuntimeTemplateTokens(presetId);
  return stripAlpha(
    resolveRuntimeTextColor(
      tokens,
      element.styleTokens.textToken,
      element.styleTokens.customTextColor,
    ),
  );
}

function getRelativeLuminance(hex: string) {
  const normalized = stripAlpha(hex).replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((index) => normalized.slice(index, index + 2))
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toRect(element: Pick<RuntimeTemplateElement, "x" | "y" | "width" | "height">) {
  return {
    left: element.x,
    top: element.y,
    right: element.x + element.width,
    bottom: element.y + element.height,
  };
}

function rectIntersectionArea(
  left: ReturnType<typeof toRect>,
  right: ReturnType<typeof toRect>,
) {
  const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
  return width * height;
}
