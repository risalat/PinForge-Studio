import { analyzeImageToneSignals, type ImageToneSignals } from "@/lib/templates/imageAnalysis";
import type {
  TemplateRenderProps,
  TemplateVisualPreset,
  TemplateVisualPresetId,
} from "@/lib/templates/types";

const FONT_STACKS = {
  display: "var(--font-cormorant-garamond), serif",
  editorial: "var(--font-libre-baskerville), serif",
  serif: "var(--font-lora), serif",
  sans: "var(--font-space-grotesk), sans-serif",
} as const;

export const SPLIT_VERTICAL_VISUAL_PRESETS: Record<
  TemplateVisualPresetId,
  TemplateVisualPreset
> = {
  "plum-sand": {
    id: "plum-sand",
    label: "Plum Sand",
    description: "Muted luxury with a soft editorial footer.",
    palette: {
      canvas: "#e5dbd2",
      band: "#e9dfd6",
      footer: "#dccfc2",
      divider: "#c88657",
      title: "#9f5829",
      subtitle: "#7c5949",
      domain: "#6a4b3c",
      number: "#9f5829",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.012em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 500,
        letterSpacing: "0.18em",
        lineHeight: 1.05,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.015em",
        lineHeight: 1.02,
      },
    },
    layout: {
      bandPaddingX: 92,
      bandHeightWithSubtitle: 430,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 198,
      titleBlockHeightWithoutSubtitle: 272,
      titleMinSizeWithSubtitle: 60,
      titleMaxSizeWithSubtitle: 92,
      titleMinSizeWithoutSubtitle: 68,
      titleMaxSizeWithoutSubtitle: 108,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 26,
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 190,
      dividerHeight: 3,
      dividerGapTop: 18,
      footerHeight: 120,
      footerPaddingX: 52,
      footerMinSize: 26,
      footerMaxSize: 36,
    },
    recommendationTags: ["luxe", "soft", "romantic", "feminine", "cozy"],
  },
  "sage-cream": {
    id: "sage-cream",
    label: "Sage Cream",
    description: "Airy, botanical contrast with grounded footer tone.",
    palette: {
      canvas: "#dde0d5",
      band: "#eef0e8",
      footer: "#d9ddd1",
      divider: "#8fa37d",
      title: "#4f5d47",
      subtitle: "#5f6b58",
      domain: "#4d5947",
      number: "#4f5d47",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.012em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 500,
        letterSpacing: "0.16em",
        lineHeight: 1.05,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.serif,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: 1.02,
      },
    },
    layout: {
      bandPaddingX: 92,
      bandHeightWithSubtitle: 430,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 198,
      titleBlockHeightWithoutSubtitle: 272,
      titleMinSizeWithSubtitle: 62,
      titleMaxSizeWithSubtitle: 90,
      titleMinSizeWithoutSubtitle: 70,
      titleMaxSizeWithoutSubtitle: 106,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 26,
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 180,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 120,
      footerPaddingX: 50,
      footerMinSize: 26,
      footerMaxSize: 34,
    },
    recommendationTags: ["nature", "fresh", "organic", "earthy", "botanical"],
  },
  "cocoa-blush": {
    id: "cocoa-blush",
    label: "Cocoa Blush",
    description: "Warm editorial contrast with polished softness.",
    palette: {
      canvas: "#e8ddd7",
      band: "#f1e7df",
      footer: "#dbcac0",
      divider: "#d09973",
      title: "#9b5b35",
      subtitle: "#7c5d4d",
      domain: "#68473a",
      number: "#9b5b35",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.012em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.serif,
        fontWeight: 600,
        letterSpacing: "0.04em",
        lineHeight: 1.06,
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 500,
        letterSpacing: "0.05em",
        lineHeight: 1.05,
      },
    },
    layout: {
      bandPaddingX: 92,
      bandHeightWithSubtitle: 432,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 198,
      titleBlockHeightWithoutSubtitle: 270,
      titleMinSizeWithSubtitle: 60,
      titleMaxSizeWithSubtitle: 92,
      titleMinSizeWithoutSubtitle: 68,
      titleMaxSizeWithoutSubtitle: 106,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 24,
      subtitleMinSize: 28,
      subtitleMaxSize: 38,
      subtitleMaxLines: 1,
      dividerWidth: 188,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 118,
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["warm", "cozy", "soft", "terracotta", "rust"],
  },
  "midnight-gold": {
    id: "midnight-gold",
    label: "Midnight Gold",
    description: "High-contrast dramatic treatment for darker or luxe imagery.",
    palette: {
      canvas: "#d7d5d0",
      band: "#23262d",
      footer: "#1a1d23",
      divider: "#a58042",
      title: "#f3e4bc",
      subtitle: "#d8bd87",
      domain: "#f3e4bc",
      number: "#f3e4bc",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.012em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 500,
        letterSpacing: "0.18em",
        lineHeight: 1.05,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        lineHeight: 1.02,
      },
    },
    layout: {
      bandPaddingX: 90,
      bandHeightWithSubtitle: 432,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 196,
      titleBlockHeightWithoutSubtitle: 272,
      titleMinSizeWithSubtitle: 60,
      titleMaxSizeWithSubtitle: 90,
      titleMinSizeWithoutSubtitle: 68,
      titleMaxSizeWithoutSubtitle: 106,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 26,
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 180,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 120,
      footerPaddingX: 52,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["dark", "dramatic", "moody", "luxury", "glam"],
  },
  "terracotta-ink": {
    id: "terracotta-ink",
    label: "Terracotta Ink",
    description: "Earthy warmth with strong contrast and a bold footer.",
    palette: {
      canvas: "#e9ddd4",
      band: "#f5ede6",
      footer: "#6d4938",
      divider: "#b36b43",
      title: "#7d4326",
      subtitle: "#8a5b44",
      domain: "#f6ede6",
      number: "#7d4326",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 600,
        letterSpacing: "0.16em",
        lineHeight: 1.05,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 600,
        letterSpacing: "0.08em",
        lineHeight: 1.04,
        textTransform: "uppercase",
      },
    },
    layout: {
      bandPaddingX: 92,
      bandHeightWithSubtitle: 434,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 198,
      titleBlockHeightWithoutSubtitle: 272,
      titleMinSizeWithSubtitle: 62,
      titleMaxSizeWithSubtitle: 92,
      titleMinSizeWithoutSubtitle: 70,
      titleMaxSizeWithoutSubtitle: 108,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 24,
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 190,
      dividerHeight: 3,
      dividerGapTop: 18,
      footerHeight: 124,
      footerPaddingX: 56,
      footerMinSize: 24,
      footerMaxSize: 30,
    },
    recommendationTags: ["earthy", "boho", "warm", "clay", "rust"],
  },
  "olive-linen": {
    id: "olive-linen",
    label: "Olive Linen",
    description: "Neutral editorial look for airy interiors and calm imagery.",
    palette: {
      canvas: "#e6e0d6",
      band: "#f4f1ea",
      footer: "#d7d1c6",
      divider: "#8a8b6f",
      title: "#4e5142",
      subtitle: "#676a56",
      domain: "#505445",
      number: "#4e5142",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.012em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.serif,
        fontWeight: 600,
        letterSpacing: "0.06em",
        lineHeight: 1.05,
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.012em",
        lineHeight: 1.02,
      },
    },
    layout: {
      bandPaddingX: 94,
      bandHeightWithSubtitle: 432,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 198,
      titleBlockHeightWithoutSubtitle: 270,
      titleMinSizeWithSubtitle: 60,
      titleMaxSizeWithSubtitle: 90,
      titleMinSizeWithoutSubtitle: 68,
      titleMaxSizeWithoutSubtitle: 104,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 24,
      subtitleMinSize: 28,
      subtitleMaxSize: 36,
      subtitleMaxLines: 1,
      dividerWidth: 184,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 120,
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["neutral", "linen", "minimal", "scandinavian", "airy"],
  },
  "cobalt-coral": {
    id: "cobalt-coral",
    label: "Cobalt Coral",
    description: "High-contrast blue and coral editorial treatment for bolder Pinterest presence.",
    palette: {
      canvas: "#efe9e4",
      band: "#fff7f2",
      footer: "#1f45d8",
      divider: "#ff6c5b",
      title: "#2041bf",
      subtitle: "#d05b45",
      domain: "#fff8f3",
      number: "#2041bf",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.008em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 700,
        letterSpacing: "0.17em",
        lineHeight: 1.08,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 700,
        letterSpacing: "0.08em",
        lineHeight: 1.04,
        textTransform: "uppercase",
      },
    },
    layout: {
      bandPaddingX: 92,
      bandHeightWithSubtitle: 432,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 198,
      titleBlockHeightWithoutSubtitle: 272,
      titleMinSizeWithSubtitle: 62,
      titleMaxSizeWithSubtitle: 94,
      titleMinSizeWithoutSubtitle: 70,
      titleMaxSizeWithoutSubtitle: 108,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 22,
      subtitleMinSize: 28,
      subtitleMaxSize: 36,
      subtitleMaxLines: 1,
      dividerWidth: 186,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 122,
      footerPaddingX: 54,
      footerMinSize: 24,
      footerMaxSize: 30,
    },
    recommendationTags: ["vibrant", "bold", "blue", "graphic", "high-contrast"],
  },
  "emerald-sun": {
    id: "emerald-sun",
    label: "Emerald Sun",
    description: "Bright green-gold contrast for fresh, vivid, sunlit interiors.",
    palette: {
      canvas: "#eef4e6",
      band: "#fffdf5",
      footer: "#0f8b61",
      divider: "#f2a21d",
      title: "#087a53",
      subtitle: "#dc8f11",
      domain: "#fffef5",
      number: "#087a53",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.006em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 700,
        letterSpacing: "0.16em",
        lineHeight: 1.08,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 700,
        letterSpacing: "0.08em",
        lineHeight: 1.04,
        textTransform: "uppercase",
      },
    },
    layout: {
      bandPaddingX: 94,
      bandHeightWithSubtitle: 434,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 204,
      titleBlockHeightWithoutSubtitle: 272,
      titleMinSizeWithSubtitle: 64,
      titleMaxSizeWithSubtitle: 96,
      titleMinSizeWithoutSubtitle: 70,
      titleMaxSizeWithoutSubtitle: 108,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 22,
      subtitleMinSize: 30,
      subtitleMaxSize: 40,
      subtitleMaxLines: 1,
      dividerWidth: 188,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 122,
      footerPaddingX: 54,
      footerMinSize: 24,
      footerMaxSize: 30,
    },
    recommendationTags: ["vibrant", "green", "sunlit", "fresh", "colorful"],
  },
  "berry-citrus": {
    id: "berry-citrus",
    label: "Berry Citrus",
    description: "Playful berry and citrus contrast for colorful, standout feed performance.",
    palette: {
      canvas: "#f0ddd7",
      band: "#fff3ee",
      footer: "#af245c",
      divider: "#ff9f43",
      title: "#a52657",
      subtitle: "#d77226",
      domain: "#fff8f0",
      number: "#a52657",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.008em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 700,
        letterSpacing: "0.16em",
        lineHeight: 1.08,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      },
      domain: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 700,
        letterSpacing: "0.08em",
        lineHeight: 1.04,
        textTransform: "uppercase",
      },
    },
    layout: {
      bandPaddingX: 92,
      bandHeightWithSubtitle: 434,
      bandHeightWithoutSubtitle: 368,
      titleBlockHeightWithSubtitle: 198,
      titleBlockHeightWithoutSubtitle: 272,
      titleMinSizeWithSubtitle: 62,
      titleMaxSizeWithSubtitle: 94,
      titleMinSizeWithoutSubtitle: 70,
      titleMaxSizeWithoutSubtitle: 108,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 3,
      titleTopGapWithSubtitle: 22,
      subtitleMinSize: 28,
      subtitleMaxSize: 36,
      subtitleMaxLines: 1,
      dividerWidth: 188,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 122,
      footerPaddingX: 54,
      footerMinSize: 24,
      footerMaxSize: 30,
    },
    recommendationTags: ["vibrant", "playful", "berry", "citrus", "maximalist"],
  },
};

export function getSplitVerticalVisualPreset(
  presetId?: TemplateRenderProps["visualPreset"] | TemplateRenderProps["colorPreset"],
) {
  return SPLIT_VERTICAL_VISUAL_PRESETS[presetId ?? "plum-sand"] ?? SPLIT_VERTICAL_VISUAL_PRESETS["plum-sand"];
}

export function recommendSplitVerticalVisualPreset(input: {
  articleTitle: string;
  pinTitle: string;
  subtitle?: string;
  domain: string;
  imageSignals: Array<{
    alt: string | null;
    caption: string | null;
    nearestHeading: string | null;
    sectionHeadingPath: string[];
    surroundingTextSnippet: string | null;
  }>;
}) {
  return recommendPresetFromContext(input);
}

export async function recommendSplitVerticalVisualPresetWithImageAwareness(input: {
  articleTitle: string;
  pinTitle: string;
  subtitle?: string;
  domain: string;
  imageSignals: Array<{
    url?: string;
    alt: string | null;
    caption: string | null;
    nearestHeading: string | null;
    sectionHeadingPath: string[];
    surroundingTextSnippet: string | null;
  }>;
}) {
  const pixelSignals = await analyzeImageToneSignals(
    input.imageSignals.map((signal) => signal.url ?? "").filter((value) => value.trim() !== ""),
  );

  return recommendPresetFromContext(input, pixelSignals);
}

function recommendPresetFromContext(
  input: {
    articleTitle: string;
    pinTitle: string;
    subtitle?: string;
    domain: string;
    imageSignals: Array<{
      alt: string | null;
      caption: string | null;
      nearestHeading: string | null;
      sectionHeadingPath: string[];
      surroundingTextSnippet: string | null;
    }>;
  },
  pixelSignals?: ImageToneSignals | null,
) {
  const context = [
    input.articleTitle,
    input.pinTitle,
    input.subtitle,
    input.domain,
    ...input.imageSignals.flatMap((signal) => [
      signal.alt,
      signal.caption,
      signal.nearestHeading,
      signal.surroundingTextSnippet,
      ...signal.sectionHeadingPath,
    ]),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .toLowerCase();
  const scores = new Map<TemplateVisualPresetId, number>(
    Object.keys(SPLIT_VERTICAL_VISUAL_PRESETS).map((presetId) => [
      presetId as TemplateVisualPresetId,
      0,
    ]),
  );

  addKeywordScore(scores, context, "midnight-gold", [
    "dark",
    "moody",
    "midnight",
    "dramatic",
    "luxury",
    "glam",
    "statement",
  ], 3);
  addKeywordScore(scores, context, "terracotta-ink", [
    "earthy",
    "clay",
    "terracotta",
    "rust",
    "boho",
    "warm",
    "wood",
  ], 2);
  addKeywordScore(scores, context, "sage-cream", [
    "sage",
    "green",
    "botanical",
    "nature",
    "plant",
    "organic",
  ], 2);
  addKeywordScore(scores, context, "olive-linen", [
    "neutral",
    "linen",
    "beige",
    "minimal",
    "airy",
    "scandinavian",
    "calm",
    "soft",
  ], 2);
  addKeywordScore(scores, context, "cocoa-blush", [
    "cozy",
    "blush",
    "romantic",
    "feminine",
    "gentle",
  ], 2);
  addKeywordScore(scores, context, "cobalt-coral", [
    "blue",
    "coastal",
    "cobalt",
    "navy",
    "graphic",
    "contrast",
  ], 2);
  addKeywordScore(scores, context, "emerald-sun", [
    "vibrant",
    "sunlit",
    "fresh",
    "bright",
    "green",
    "glow",
  ], 2);
  addKeywordScore(scores, context, "berry-citrus", [
    "colorful",
    "bold",
    "playful",
    "eclectic",
    "maximalist",
    "happy",
  ], 2);

  if (pixelSignals) {
    if (pixelSignals.brightness < 0.42 || pixelSignals.contrast > 0.24) {
      incrementScore(scores, "midnight-gold", 4);
    }

    if (pixelSignals.warmth > 0.06 && pixelSignals.saturation > 0.18) {
      incrementScore(scores, "terracotta-ink", 3);
    }

    if (pixelSignals.warmth < -0.01 && pixelSignals.brightness > 0.48) {
      incrementScore(scores, "sage-cream", 3);
    }

    if (pixelSignals.saturation < 0.14 && pixelSignals.brightness > 0.62) {
      incrementScore(scores, "olive-linen", 3);
    }

    if (
      pixelSignals.warmth > 0.02 &&
      pixelSignals.brightness > 0.58 &&
      pixelSignals.saturation < 0.2
    ) {
      incrementScore(scores, "cocoa-blush", 2);
    }

    if (pixelSignals.saturation > 0.24 && pixelSignals.brightness > 0.56) {
      incrementScore(scores, "berry-citrus", 3);
      incrementScore(scores, "emerald-sun", 2);
    }

    if (
      pixelSignals.saturation > 0.22 &&
      pixelSignals.contrast > 0.18 &&
      pixelSignals.warmth < 0.02
    ) {
      incrementScore(scores, "cobalt-coral", 3);
    }

    if (
      pixelSignals.saturation > 0.2 &&
      pixelSignals.brightness > 0.54 &&
      pixelSignals.warmth > 0.04
    ) {
      incrementScore(scores, "emerald-sun", 3);
    }
  }

  const ranked = Array.from(scores.entries()).sort((left, right) => right[1] - left[1]);
  const topScore = ranked[0]?.[1] ?? 0;
  if (topScore <= 0) {
    return fallbackPresetFromText(`${input.articleTitle}|${input.pinTitle}|${input.domain}`);
  }

  const topPresets = ranked
    .filter(([, score]) => score === topScore)
    .map(([presetId]) => presetId);

  return topPresets.length === 1
    ? topPresets[0]
    : fallbackPresetFromText(
        `${input.articleTitle}|${input.pinTitle}|${input.domain}|${topPresets.join(",")}`,
      );
}

function addKeywordScore(
  scores: Map<TemplateVisualPresetId, number>,
  context: string,
  presetId: TemplateVisualPresetId,
  terms: string[],
  weight: number,
) {
  const hits = terms.filter((term) => context.includes(term)).length;
  if (hits > 0) {
    incrementScore(scores, presetId, hits * weight);
  }
}

function incrementScore(
  scores: Map<TemplateVisualPresetId, number>,
  presetId: TemplateVisualPresetId,
  value: number,
) {
  scores.set(presetId, (scores.get(presetId) ?? 0) + value);
}

function fallbackPresetFromText(text: string): TemplateVisualPresetId {
  const presetOrder: TemplateVisualPresetId[] = [
    "plum-sand",
    "sage-cream",
    "cocoa-blush",
    "olive-linen",
    "cobalt-coral",
    "emerald-sun",
    "berry-citrus",
  ];
  const hash = [...text].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return presetOrder[hash % presetOrder.length];
}
