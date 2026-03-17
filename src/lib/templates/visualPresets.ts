import { analyzeImageToneSignals, type ImageToneSignals } from "@/lib/templates/imageAnalysis";
import {
  templateVisualPresets,
  type TemplateRenderProps,
  type TemplateVisualPreset,
  type TemplateVisualPresetCategoryId,
  type TemplateVisualPresetId,
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
      titleMaxLinesWithoutSubtitle: 2,
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
      titleMaxLinesWithoutSubtitle: 2,
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
      titleMaxLinesWithoutSubtitle: 2,
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
      divider: "#ffce6d",
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
      titleMaxLinesWithoutSubtitle: 2,
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
      titleMaxLinesWithoutSubtitle: 2,
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
      titleMaxLinesWithoutSubtitle: 2,
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
      titleMaxLinesWithoutSubtitle: 2,
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
      titleMaxLinesWithoutSubtitle: 2,
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
      titleMaxLinesWithoutSubtitle: 2,
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
  "obsidian-punch": {
    id: "obsidian-punch",
    label: "Obsidian Punch",
    description: "Near-black base with electric warmth for aggressive feed contrast.",
    palette: {
      canvas: "#e7e4dd",
      band: "#23262d",
      footer: "#14161c",
      divider: "#ff7a33",
      title: "#f6ead6",
      subtitle: "#ffb067",
      domain: "#fff7ef",
      number: "#f6ead6",
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
        fontWeight: 700,
        letterSpacing: "0.18em",
        lineHeight: 1.06,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.03em",
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
      titleMaxLinesWithoutSubtitle: 2,
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
    recommendationTags: ["black", "dramatic", "modern", "luxury", "bold"],
  },
  "ink-lime": {
    id: "ink-lime",
    label: "Ink Lime",
    description: "Dark ink with sharp lime contrast for crisp contemporary pins.",
    palette: {
      canvas: "#e8ece6",
      band: "#1d2327",
      footer: "#13191d",
      divider: "#b8ff48",
      title: "#eefad8",
      subtitle: "#d6ff8d",
      domain: "#f7ffe8",
      number: "#eefad8",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.008em",
        lineHeight: 1.18,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 700,
        letterSpacing: "0.17em",
        lineHeight: 1.06,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.03em",
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
      titleMaxLinesWithoutSubtitle: 2,
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
    recommendationTags: ["graphic", "neon", "dark", "modern", "vivid"],
  },
  "jade-paprika": {
    id: "jade-paprika",
    label: "Jade Paprika",
    description: "Dense green with warm paprika accents for punchy earthy pins.",
    palette: {
      canvas: "#edf1e7",
      band: "#eff5ea",
      footer: "#1f6f58",
      divider: "#f16c3d",
      title: "#f6f0e8",
      subtitle: "#ffc18f",
      domain: "#fff8ee",
      number: "#f6f0e8",
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
        lineHeight: 1.06,
        textTransform: "uppercase",
      },
      number: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 700,
        letterSpacing: "-0.03em",
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
      titleBlockHeightWithSubtitle: 200,
      titleBlockHeightWithoutSubtitle: 272,
      titleMinSizeWithSubtitle: 62,
      titleMaxSizeWithSubtitle: 94,
      titleMinSizeWithoutSubtitle: 70,
      titleMaxSizeWithoutSubtitle: 108,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 2,
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
    recommendationTags: ["earthy", "green", "warm", "rich", "organic"],
  },
  "scarlet-cream": {
    id: "scarlet-cream",
    label: "Scarlet Cream",
    description: "Rich scarlet and cream for loud, unmistakable Pinterest contrast.",
    palette: {
      canvas: "#f3e6de",
      band: "#fff7f0",
      footer: "#c22d37",
      divider: "#ffd166",
      title: "#fff5ea",
      subtitle: "#ffe0a1",
      domain: "#fff9ef",
      number: "#fff5ea",
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
        fontWeight: 700,
        letterSpacing: "0.17em",
        lineHeight: 1.06,
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
      titleMaxLinesWithoutSubtitle: 2,
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
    recommendationTags: ["red", "high-contrast", "statement", "warm", "editorial"],
  },
  "teal-flare": {
    id: "teal-flare",
    label: "Teal Flare",
    description: "Cool teal base with mango flare for crisp, modern brightness.",
    palette: {
      canvas: "#ebf1ef",
      band: "#f5fbfa",
      footer: "#0d7b88",
      divider: "#ff9a3d",
      title: "#effdf9",
      subtitle: "#ffd0a0",
      domain: "#fbfffb",
      number: "#effdf9",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
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
        letterSpacing: "-0.03em",
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
      titleMaxLinesWithoutSubtitle: 2,
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
    recommendationTags: ["teal", "graphic", "modern", "fresh", "bright"],
  },
  "sunset-punch": {
    id: "sunset-punch",
    label: "Sunset Punch",
    description: "Sunset orange with pink heat for maximal visual separation in-feed.",
    palette: {
      canvas: "#f6e5da",
      band: "#fff5ef",
      footer: "#f05a24",
      divider: "#ffca5f",
      title: "#fff8ef",
      subtitle: "#ffdba5",
      domain: "#fffaf2",
      number: "#fff8ef",
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
      titleMaxLinesWithoutSubtitle: 2,
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
    recommendationTags: ["orange", "warm", "vibrant", "playful", "feed-first"],
  },
};

export const splitVerticalBoldPresetIds: TemplateVisualPresetId[] = [
  "midnight-gold",
  "terracotta-ink",
  "cobalt-coral",
  "emerald-sun",
  "berry-citrus",
  "obsidian-punch",
  "ink-lime",
  "jade-paprika",
  "scarlet-cream",
  "teal-flare",
  "sunset-punch",
];

export const TEMPLATE_VISUAL_PRESET_CATEGORY_META: Record<
  TemplateVisualPresetCategoryId,
  {
    id: TemplateVisualPresetCategoryId;
    label: string;
    description: string;
  }
> = {
  "editorial-soft": {
    id: "editorial-soft",
    label: "Editorial Soft",
    description: "Refined neutrals and calmer palettes for understated pins.",
  },
  "earthy-warm": {
    id: "earthy-warm",
    label: "Earthy Warm",
    description: "Clay, terracotta, green, and warm tones with more punch.",
  },
  "dark-drama": {
    id: "dark-drama",
    label: "Dark Drama",
    description: "Moody high-contrast palettes for aggressive feed presence.",
  },
  "graphic-pop": {
    id: "graphic-pop",
    label: "Graphic Pop",
    description: "Bold, graphic, clearly differentiated color systems.",
  },
  "fresh-vivid": {
    id: "fresh-vivid",
    label: "Fresh Vivid",
    description: "Bright, high-energy palettes with clean modern contrast.",
  },
};

export const TEMPLATE_VISUAL_PRESET_CATEGORY_MAP: Record<
  TemplateVisualPresetId,
  TemplateVisualPresetCategoryId
> = {
  "plum-sand": "editorial-soft",
  "sage-cream": "editorial-soft",
  "cocoa-blush": "editorial-soft",
  "midnight-gold": "dark-drama",
  "terracotta-ink": "earthy-warm",
  "olive-linen": "editorial-soft",
  "cobalt-coral": "graphic-pop",
  "emerald-sun": "fresh-vivid",
  "berry-citrus": "graphic-pop",
  "obsidian-punch": "dark-drama",
  "ink-lime": "dark-drama",
  "jade-paprika": "earthy-warm",
  "scarlet-cream": "graphic-pop",
  "teal-flare": "fresh-vivid",
  "sunset-punch": "graphic-pop",
};

export function getTemplateVisualPresetCategory(presetId: TemplateVisualPresetId) {
  return TEMPLATE_VISUAL_PRESET_CATEGORY_MAP[presetId];
}

export function getTemplateVisualPresetCategoryMeta(categoryId: TemplateVisualPresetCategoryId) {
  return TEMPLATE_VISUAL_PRESET_CATEGORY_META[categoryId];
}

export function getPresetIdsForCategories(categoryIds?: TemplateVisualPresetCategoryId[]) {
  if (!categoryIds?.length) {
    return [...templateVisualPresets];
  }

  const allowed = new Set(categoryIds);
  return templateVisualPresets.filter((presetId) => allowed.has(TEMPLATE_VISUAL_PRESET_CATEGORY_MAP[presetId]));
}

const TEMPLATE_PRESET_CATEGORY_ALLOWLIST: Record<string, TemplateVisualPresetCategoryId[]> = {
  "split-vertical-title": ["editorial-soft", "earthy-warm", "dark-drama"],
  "split-vertical-title-no-subtitle": ["editorial-soft", "earthy-warm", "dark-drama"],
  "split-vertical-title-number": ["editorial-soft", "earthy-warm", "dark-drama"],
  "single-image-subtitle-title-cta": ["editorial-soft", "earthy-warm", "dark-drama"],
  "single-image-header-title-domain-cta": ["editorial-soft", "earthy-warm", "dark-drama"],
  "single-image-title-footer": ["editorial-soft", "earthy-warm", "dark-drama"],
  "four-image-masonry-hero-number-domain-pill": ["editorial-soft", "earthy-warm", "dark-drama"],
  "four-image-grid-number-title-domain": ["editorial-soft", "earthy-warm", "dark-drama"],
  "four-image-grid-title-footer": ["editorial-soft", "earthy-warm", "dark-drama"],
  "hero-text-triple-split-footer": ["editorial-soft", "earthy-warm", "dark-drama"],
  "six-image-triple-split-slant-hero-footer": ["editorial-soft", "earthy-warm", "dark-drama"],
  "masonry-grid-number-title-footer": ["editorial-soft", "earthy-warm", "dark-drama"],
  "nine-image-grid-overlay-number-footer": ["editorial-soft", "earthy-warm", "dark-drama", "graphic-pop"],
  "hero-two-split-text": ["editorial-soft", "earthy-warm", "dark-drama", "graphic-pop"],
};

export function getPresetIdsForTemplate(
  templateId: string,
  pool?: readonly TemplateVisualPresetId[],
) {
  const allowedCategories = TEMPLATE_PRESET_CATEGORY_ALLOWLIST[templateId];
  const source = pool?.length ? [...pool] : [...templateVisualPresets];
  if (!allowedCategories?.length) {
    return source;
  }

  const allowed = new Set(allowedCategories);
  const filtered = source.filter((presetId) =>
    allowed.has(TEMPLATE_VISUAL_PRESET_CATEGORY_MAP[presetId]),
  );

  return filtered.length > 0 ? filtered : source;
}

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
  allowedPresetIds?: TemplateVisualPresetId[];
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
  allowedPresetIds?: TemplateVisualPresetId[];
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
    allowedPresetIds?: TemplateVisualPresetId[];
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
  const presetCandidates = (input.allowedPresetIds?.length
    ? input.allowedPresetIds
    : (Object.keys(SPLIT_VERTICAL_VISUAL_PRESETS) as TemplateVisualPresetId[]));
  const scores = new Map<TemplateVisualPresetId, number>(
    presetCandidates.map((presetId) => [
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
  addKeywordScore(scores, context, "obsidian-punch", [
    "statement",
    "sleek",
    "luxury",
    "black",
    "modern",
    "editorial",
  ], 2);
  addKeywordScore(scores, context, "ink-lime", [
    "graphic",
    "modern",
    "clean",
    "sharp",
    "contemporary",
  ], 2);
  addKeywordScore(scores, context, "jade-paprika", [
    "green",
    "earthy",
    "organic",
    "wood",
    "natural",
  ], 2);
  addKeywordScore(scores, context, "scarlet-cream", [
    "red",
    "bold",
    "statement",
    "classic",
    "dramatic",
  ], 2);
  addKeywordScore(scores, context, "teal-flare", [
    "teal",
    "aqua",
    "coastal",
    "fresh",
    "crisp",
  ], 2);
  addKeywordScore(scores, context, "sunset-punch", [
    "sunset",
    "orange",
    "warm",
    "bright",
    "playful",
  ], 2);

  if (pixelSignals) {
    if (pixelSignals.brightness < 0.42 || pixelSignals.contrast > 0.24) {
      incrementScore(scores, "midnight-gold", 4);
      incrementScore(scores, "obsidian-punch", 3);
      incrementScore(scores, "ink-lime", 2);
    }

    if (pixelSignals.warmth > 0.06 && pixelSignals.saturation > 0.18) {
      incrementScore(scores, "terracotta-ink", 3);
      incrementScore(scores, "sunset-punch", 2);
      incrementScore(scores, "scarlet-cream", 2);
    }

    if (pixelSignals.warmth < -0.01 && pixelSignals.brightness > 0.48) {
      incrementScore(scores, "sage-cream", 3);
      incrementScore(scores, "teal-flare", 2);
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
      incrementScore(scores, "jade-paprika", 1);
    }

    if (pixelSignals.saturation > 0.24 && pixelSignals.brightness > 0.56) {
      incrementScore(scores, "berry-citrus", 3);
      incrementScore(scores, "emerald-sun", 2);
      incrementScore(scores, "sunset-punch", 2);
      incrementScore(scores, "teal-flare", 2);
    }

    if (
      pixelSignals.saturation > 0.22 &&
      pixelSignals.contrast > 0.18 &&
      pixelSignals.warmth < 0.02
    ) {
      incrementScore(scores, "cobalt-coral", 3);
      incrementScore(scores, "ink-lime", 2);
      incrementScore(scores, "obsidian-punch", 1);
    }

    if (
      pixelSignals.saturation > 0.2 &&
      pixelSignals.brightness > 0.54 &&
      pixelSignals.warmth > 0.04
    ) {
      incrementScore(scores, "emerald-sun", 3);
      incrementScore(scores, "jade-paprika", 2);
      incrementScore(scores, "scarlet-cream", 1);
    }
  }

  const ranked = Array.from(scores.entries()).sort((left, right) => right[1] - left[1]);
  const topScore = ranked[0]?.[1] ?? 0;
  if (topScore <= 0) {
    return fallbackPresetFromText(
      `${input.articleTitle}|${input.pinTitle}|${input.domain}`,
      presetCandidates,
    );
  }

  const topPresets = ranked
    .filter(([, score]) => score === topScore)
    .map(([presetId]) => presetId);

  return topPresets.length === 1
    ? topPresets[0]
    : fallbackPresetFromText(
        `${input.articleTitle}|${input.pinTitle}|${input.domain}|${topPresets.join(",")}`,
        presetCandidates,
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
  if (!scores.has(presetId)) {
    return;
  }
  scores.set(presetId, (scores.get(presetId) ?? 0) + value);
}

function fallbackPresetFromText(
  text: string,
  presetOrder: readonly TemplateVisualPresetId[] = [
    "plum-sand",
    "sage-cream",
    "cocoa-blush",
    "olive-linen",
    "jade-paprika",
    "midnight-gold",
    "cobalt-coral",
    "emerald-sun",
    "berry-citrus",
    "obsidian-punch",
    "ink-lime",
    "scarlet-cream",
    "teal-flare",
    "sunset-punch",
  ],
): TemplateVisualPresetId {
  const hash = [...text].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return presetOrder[hash % presetOrder.length];
}
