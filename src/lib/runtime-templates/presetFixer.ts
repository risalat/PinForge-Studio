import { runtimeColorToHex } from "@/lib/runtime-templates/colors";
import {
  getRuntimeContrastRatio,
  getRuntimeMinimumContrastRatio,
  resolveRuntimeTextBackground,
} from "@/lib/runtime-templates/contrast";
import type { TemplateVisualPresetId } from "@/lib/templates/types";
import {
  getRuntimeTemplateEffectiveDocument,
  getRuntimeTemplatePresetIds,
  isRuntimeTemplatePresetBackgroundFieldLocked,
  isRuntimeTemplatePresetElementFieldLocked,
  setRuntimeTemplatePresetBackgroundOverride,
  setRuntimeTemplatePresetElementStyleOverride,
} from "@/lib/runtime-templates/presetOverrides";
import type { RuntimeTemplateDocument } from "@/lib/runtime-templates/schema";
import {
  resolveRuntimeTemplateTokens,
  stripAlpha,
} from "@/lib/runtime-templates/tokens";

type RuntimeTextElement = Extract<
  RuntimeTemplateDocument["elements"][number],
  {
    type:
      | "titleText"
      | "subtitleText"
      | "domainText"
      | "numberText"
      | "ctaText";
  }
>;

type CarrierContext = {
  source: "canvas" | "shape" | "overlay" | "image" | "unknown";
  carrierId: string | null;
  textElements: RuntimeTextElement[];
};

type ColorCandidate = {
  color: string;
  weight: number;
  source:
    | "current"
    | "palette"
    | "textToken"
    | "fillToken"
    | "presetFill"
    | "fallback";
};

export function autoFixRuntimeTemplatePresetStyles(
  document: RuntimeTemplateDocument,
  options?: {
    presetIds?: TemplateVisualPresetId[];
  },
) {
  const targetPresetIds = options?.presetIds?.length
    ? options.presetIds
    : getRuntimeTemplatePresetIds(document);

  let nextDocument = document;
  const fixedPresetIds: TemplateVisualPresetId[] = [];

  for (const presetId of targetPresetIds) {
    const updated = autoFixSinglePreset(nextDocument, presetId);
    if (updated !== nextDocument) {
      fixedPresetIds.push(presetId);
      nextDocument = updated;
    }
  }

  return {
    document: nextDocument,
    fixedPresetIds,
  };
}

function autoFixSinglePreset(
  document: RuntimeTemplateDocument,
  presetId: TemplateVisualPresetId,
) {
  let nextDocument = document;
  let effectiveDocument = getRuntimeTemplateEffectiveDocument(nextDocument, presetId);
  const tokens = resolveRuntimeTemplateTokens(presetId);
  const candidateBackgrounds = collectBackgroundCandidates(tokens);
  const groups = groupTextElementsByCarrier(effectiveDocument, presetId);

  for (const group of groups) {
    if (group.source === "image" || group.source === "unknown") {
      continue;
    }

    effectiveDocument = getRuntimeTemplateEffectiveDocument(nextDocument, presetId);
    const freshGroup = regroupCarrier(effectiveDocument, presetId, group);
    const backgroundContext = freshGroup.textElements[0]
      ? resolveRuntimeTextBackground(effectiveDocument, freshGroup.textElements[0], tokens)
      : null;
    const currentBackground = backgroundContext?.background
      ? stripAlpha(backgroundContext.background)
      : null;

    if (!currentBackground) {
      continue;
    }

    const canModifyCarrierBackground = canModifyBackground(nextDocument, presetId, freshGroup);
    const textCandidates = collectForegroundCandidates(tokens, freshGroup.textElements);
    const currentPlan = chooseBestContrastPlan({
      backgroundOptions: [makeCurrentBackgroundCandidate(currentBackground)],
      textElements: freshGroup.textElements,
      candidateTextColors: textCandidates,
    });

    const backgroundOptions =
      freshGroup.source === "image" || !canModifyCarrierBackground || currentPlan?.allPass
        ? [makeCurrentBackgroundCandidate(currentBackground)]
        : buildBackgroundOptions(currentBackground, candidateBackgrounds, canModifyCarrierBackground);

    const bestChoice = chooseBestContrastPlan({
      backgroundOptions,
      textElements: freshGroup.textElements,
      candidateTextColors: textCandidates,
    });

    if (!bestChoice) {
      continue;
    }

    if (
      bestChoice.background !== currentBackground &&
      canModifyCarrierBackground
    ) {
      if (freshGroup.source === "canvas") {
        nextDocument = setRuntimeTemplatePresetBackgroundOverride(
          nextDocument,
          presetId,
          {
            customFill: bestChoice.background,
          },
          {
            unlockFields: ["fillToken"],
          },
        );
      } else if (freshGroup.carrierId) {
        nextDocument = setRuntimeTemplatePresetElementStyleOverride(
          nextDocument,
          presetId,
          freshGroup.carrierId,
          {
            customFill: bestChoice.background,
          },
          {
            unlockFields: ["fillToken"],
          },
        );
      }
    }

    for (const textElement of freshGroup.textElements) {
      const chosenColor = bestChoice.foregrounds[textElement.id];
      if (!chosenColor) {
        continue;
      }

      if (
        isRuntimeTemplatePresetElementFieldLocked(
          nextDocument,
          presetId,
          textElement.id,
          "customTextColor",
        ) ||
        isRuntimeTemplatePresetElementFieldLocked(
          nextDocument,
          presetId,
          textElement.id,
          "textToken",
        )
      ) {
        continue;
      }

      nextDocument = setRuntimeTemplatePresetElementStyleOverride(
        nextDocument,
        presetId,
        textElement.id,
        {
          customTextColor: chosenColor,
        },
        {
          unlockFields: ["textToken"],
        },
      );
    }
  }

  return nextDocument;
}

function groupTextElementsByCarrier(
  document: RuntimeTemplateDocument,
  presetId: TemplateVisualPresetId,
) {
  const tokens = resolveRuntimeTemplateTokens(presetId);
  const textElements = document.elements.filter(
    (element): element is RuntimeTextElement =>
      (element.type === "titleText" ||
        element.type === "subtitleText" ||
        element.type === "domainText" ||
        element.type === "numberText" ||
        element.type === "ctaText") &&
      (element.semanticRole === "title" ||
        element.semanticRole === "subtitle" ||
        element.semanticRole === "domain" ||
        element.semanticRole === "itemNumber" ||
        element.semanticRole === "cta"),
  );

  const groups = new Map<string, CarrierContext>();
  for (const textElement of textElements) {
    const background = resolveRuntimeTextBackground(document, textElement, tokens);
    const key = `${background.source}:${background.carrierId ?? "canvas"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        source: background.source,
        carrierId: background.carrierId,
        textElements: [],
      });
    }
    groups.get(key)?.textElements.push(textElement);
  }

  return [...groups.values()];
}

function regroupCarrier(
  document: RuntimeTemplateDocument,
  presetId: TemplateVisualPresetId,
  group: CarrierContext,
) {
  const latestGroups = groupTextElementsByCarrier(document, presetId);
  return (
    latestGroups.find(
      (entry) =>
        entry.source === group.source && (entry.carrierId ?? null) === (group.carrierId ?? null),
    ) ?? group
  );
}

function canModifyBackground(
  document: RuntimeTemplateDocument,
  presetId: TemplateVisualPresetId,
  group: CarrierContext,
) {
  if (
    group.textElements.some(
      (element) =>
        isRuntimeTemplatePresetElementFieldLocked(
          document,
          presetId,
          element.id,
          "customTextColor",
        ) ||
        isRuntimeTemplatePresetElementFieldLocked(document, presetId, element.id, "textToken"),
    )
  ) {
    return false;
  }

  if (group.source === "canvas") {
    return !isRuntimeTemplatePresetBackgroundFieldLocked(document, presetId, "customFill");
  }
  if (!group.carrierId) {
    return false;
  }
  return !isRuntimeTemplatePresetElementFieldLocked(
    document,
    presetId,
    group.carrierId,
    "customFill",
  );
}

function buildBackgroundOptions(
  currentBackground: string,
  candidates: ColorCandidate[],
  canModify: boolean,
) {
  if (!canModify) {
    return [makeCurrentBackgroundCandidate(currentBackground)];
  }
  return [
    makeCurrentBackgroundCandidate(currentBackground),
    ...candidates.filter((candidate) => candidate.color !== currentBackground),
  ];
}

function chooseBestContrastPlan(input: {
  backgroundOptions: ColorCandidate[];
  textElements: RuntimeTextElement[];
  candidateTextColors: ColorCandidate[];
}) {
  let best:
    | {
        background: string;
        foregrounds: Record<string, string>;
        passCount: number;
        score: number;
        allPass: boolean;
      }
    | null = null;

  for (const backgroundCandidate of input.backgroundOptions) {
    const background = backgroundCandidate.color;
    const foregrounds: Record<string, string> = {};
    let passCount = 0;
    let score = backgroundCandidate.weight;

    for (const element of input.textElements) {
      const minimumRatio = getRuntimeMinimumContrastRatio(element);
      const viableCandidates = input.candidateTextColors
        .map((color) => ({
          color: color.color,
          ratio: getRuntimeContrastRatio(color.color, background),
          score:
            (getRoleAffinity(element, color.color) ? 6 : 0) +
            color.weight +
            getContrastBonus(getRuntimeContrastRatio(color.color, background)) -
            getExtremeColorPenalty(color.color),
        }))
        .sort((left, right) => {
          const leftPass = left.ratio >= minimumRatio ? 1 : 0;
          const rightPass = right.ratio >= minimumRatio ? 1 : 0;
          if (leftPass !== rightPass) {
            return rightPass - leftPass;
          }
          if (left.score !== right.score) {
            return right.score - left.score;
          }
          return right.ratio - left.ratio;
        });
      const chosen = viableCandidates[0];

      if (!chosen) {
        continue;
      }

      foregrounds[element.id] = chosen.color;
      score += chosen.score;
      if (chosen.ratio >= minimumRatio) {
        passCount += 1;
      }
    }

    if (
      !best ||
      passCount > best.passCount ||
      (passCount === best.passCount && score > best.score)
    ) {
      best = {
        background,
        foregrounds,
        passCount,
        score,
        allPass: passCount === input.textElements.length,
      };
    }
  }

  return best;
}

function collectForegroundCandidates(
  tokens: ReturnType<typeof resolveRuntimeTemplateTokens>,
  textElements: RuntimeTextElement[],
) {
  const candidates = new Map<string, ColorCandidate>();
  const seedColors = [
    [tokens.preset.palette.title, 22, "palette"],
    [tokens.preset.palette.subtitle, 18, "palette"],
    [tokens.preset.palette.domain, 18, "palette"],
    [tokens.preset.palette.number, 20, "palette"],
    [tokens.preset.palette.divider, 10, "palette"],
    [tokens.text["text.title"], 16, "textToken"],
    [tokens.text["text.subtitle"], 14, "textToken"],
    [tokens.text["text.meta"], 14, "textToken"],
    [tokens.text["text.number"], 16, "textToken"],
    [tokens.text["text.cta"], 14, "textToken"],
    [tokens.text["text.inverse"], 12, "textToken"],
  ] as const;

  for (const [value, weight, source] of seedColors) {
    addColorCandidate(candidates, value, weight, source);
  }

  for (const element of textElements) {
    const customColor = element.styleTokens.customTextColor;
    if (customColor) {
      addColorCandidate(candidates, customColor, 28, "current");
    }
  }

  return [...candidates.values()];
}

function collectBackgroundCandidates(
  tokens: ReturnType<typeof resolveRuntimeTemplateTokens>,
) {
  const candidates = new Map<string, ColorCandidate>();
  const seedColors = [
    [tokens.preset.palette.canvas, 20, "palette"],
    [tokens.preset.palette.band, 22, "palette"],
    [tokens.preset.palette.footer, 20, "palette"],
    [tokens.fills["surface.canvas"], 18, "fillToken"],
    [tokens.fills["surface.primary"], 18, "fillToken"],
    [tokens.fills["surface.secondary"], 16, "fillToken"],
    [tokens.fills["surface.accent"], 16, "fillToken"],
    [tokens.fills["surface.badge"], 14, "fillToken"],
    [tokens.fills["surface.footer"], 18, "fillToken"],
    [tokens.fills["surface.inverse"], 10, "fillToken"],
  ] as const;

  for (const [value, weight, source] of seedColors) {
    addColorCandidate(candidates, value, weight, source);
  }

  return [...candidates.values()];
}

function addColorCandidate(
  candidates: Map<string, ColorCandidate>,
  value: string,
  weight: number,
  source: ColorCandidate["source"],
) {
  const color = runtimeColorToHex(value) ?? stripAlpha(value);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return;
  }

  const existing = candidates.get(color);
  if (!existing || existing.weight < weight) {
    candidates.set(color, {
      color,
      weight,
      source,
    });
  }
}

function makeCurrentBackgroundCandidate(color: string): ColorCandidate {
  return {
    color,
    weight: 1000,
    source: "current",
  };
}

function getRoleAffinity(element: RuntimeTextElement, color: string) {
  const roleKey =
    element.semanticRole === "title"
      ? "customTextColor"
      : element.semanticRole === "subtitle"
        ? "customTextColor"
        : element.semanticRole === "domain"
          ? "customTextColor"
          : element.semanticRole === "itemNumber"
            ? "customTextColor"
            : "customTextColor";
  return Boolean(element.styleTokens[roleKey]) && stripAlpha(element.styleTokens[roleKey]!) === color;
}

function getContrastBonus(ratio: number) {
  return Math.min(ratio, 9);
}

function getExtremeColorPenalty(color: string) {
  const normalized = stripAlpha(color).toLowerCase();
  if (normalized === "#000000" || normalized === "#ffffff") {
    return 10;
  }
  if (normalized === "#111111" || normalized === "#f5f5f5") {
    return 5;
  }
  return 0;
}
