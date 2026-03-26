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
  "lavender-mist": {
    id: "lavender-mist",
    label: "Lavender Mist",
    description: "Soft lavender and parchment with enough plum depth to keep text readable.",
    palette: {
      canvas: "#ece7f2",
      band: "#f8f4fb",
      footer: "#d8cfe3",
      divider: "#8d6fa4",
      title: "#5f4876",
      subtitle: "#78618d",
      domain: "#564169",
      number: "#5f4876",
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
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.012em",
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
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["pastel", "lavender", "airy", "soft", "romantic"],
  },
  "powder-blue-clay": {
    id: "powder-blue-clay",
    label: "Powder Blue Clay",
    description: "Powder blue with warm clay accents for calm pins that still carry structure.",
    palette: {
      canvas: "#e7edf1",
      band: "#f8fbfc",
      footer: "#dbe4ea",
      divider: "#bf8c72",
      title: "#4d6880",
      subtitle: "#8a6a59",
      domain: "#4d6274",
      number: "#4d6880",
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
        fontWeight: 500,
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
        fontFamily: FONT_STACKS.serif,
        fontWeight: 600,
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
      titleMaxSizeWithSubtitle: 90,
      titleMinSizeWithoutSubtitle: 68,
      titleMaxSizeWithoutSubtitle: 104,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 2,
      titleTopGapWithSubtitle: 26,
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 184,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 120,
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["pastel", "blue", "calm", "coastal", "soft"],
  },
  "peach-cloud": {
    id: "peach-cloud",
    label: "Peach Cloud",
    description: "Peach and cream with a dusty coral accent that stays legible instead of sugary.",
    palette: {
      canvas: "#f3e3da",
      band: "#fff7f2",
      footer: "#ead7cd",
      divider: "#d68a6b",
      title: "#9d5d42",
      subtitle: "#b87457",
      domain: "#7d5644",
      number: "#9d5d42",
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
        letterSpacing: "0.05em",
        lineHeight: 1.05,
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
    recommendationTags: ["pastel", "peach", "warm", "soft", "sunlit"],
  },
  "mint-macaroon": {
    id: "mint-macaroon",
    label: "Mint Macaroon",
    description: "Muted mint with biscuit neutrals and deeper green type for clean pastel contrast.",
    palette: {
      canvas: "#e4eee8",
      band: "#f7fbf8",
      footer: "#d7e3db",
      divider: "#93a68f",
      title: "#4f6452",
      subtitle: "#6c7d6a",
      domain: "#4a5b4b",
      number: "#4f6452",
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
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 184,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 120,
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["pastel", "mint", "fresh", "soft", "clean"],
  },
  "rosewater-satin": {
    id: "rosewater-satin",
    label: "Rosewater Satin",
    description: "Polished blush and rose tones with elegant berry contrast.",
    palette: {
      canvas: "#f3e3e8",
      band: "#fff6f8",
      footer: "#ead5dc",
      divider: "#c96f89",
      title: "#8f3454",
      subtitle: "#a25976",
      domain: "#734154",
      number: "#8f3454",
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
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.012em",
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
      dividerWidth: 186,
      dividerHeight: 3,
      dividerGapTop: 18,
      footerHeight: 118,
      footerPaddingX: 52,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["pink", "blush", "rose", "feminine", "romantic"],
  },
  "ballet-slipper": {
    id: "ballet-slipper",
    label: "Ballet Slipper",
    description: "Quiet blush neutrals with soft mauve typography for delicate pins.",
    palette: {
      canvas: "#f6ecef",
      band: "#fff7f8",
      footer: "#eadbdf",
      divider: "#b87e8d",
      title: "#7f5565",
      subtitle: "#96707e",
      domain: "#6b4f5b",
      number: "#7f5565",
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
      titleMinSizeWithSubtitle: 60,
      titleMaxSizeWithSubtitle: 90,
      titleMinSizeWithoutSubtitle: 68,
      titleMaxSizeWithoutSubtitle: 104,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 2,
      titleTopGapWithSubtitle: 26,
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 176,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 118,
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["soft pink", "ballet", "delicate", "pastel", "feminine"],
  },
  "orchid-ink": {
    id: "orchid-ink",
    label: "Orchid Ink",
    description: "Orchid and lilac tones sharpened with rich plum typography.",
    palette: {
      canvas: "#eee4f1",
      band: "#faf4fb",
      footer: "#e0d0e7",
      divider: "#b15fc4",
      title: "#7b2f8f",
      subtitle: "#955aa8",
      domain: "#642d74",
      number: "#7b2f8f",
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
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.012em",
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
      dividerWidth: 184,
      dividerHeight: 3,
      dividerGapTop: 18,
      footerHeight: 118,
      footerPaddingX: 52,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["orchid", "lilac", "purple", "feminine", "glam"],
  },
  "peony-punch": {
    id: "peony-punch",
    label: "Peony Punch",
    description: "Peony pink and cream with a brighter feed-first punch.",
    palette: {
      canvas: "#f7d5e1",
      band: "#e25591",
      footer: "#992853",
      divider: "#ffd9e7",
      title: "#fff8fb",
      subtitle: "#ffe7f0",
      domain: "#fff5f8",
      number: "#92224f",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.008em",
        lineHeight: 1.16,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 600,
        letterSpacing: "0.12em",
        lineHeight: 1.04,
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
        letterSpacing: "0.05em",
        lineHeight: 1.04,
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
      subtitleMinSize: 26,
      subtitleMaxSize: 36,
      subtitleMaxLines: 1,
      dividerWidth: 188,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 118,
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["peony", "pink", "bright", "bold", "feminine"],
  },
  "cherry-cream": {
    id: "cherry-cream",
    label: "Cherry Cream",
    description: "Cherry-red pink contrast lifted by warm cream panels and footers.",
    palette: {
      canvas: "#f6d7df",
      band: "#d94e73",
      footer: "#8a1f3f",
      divider: "#ffd8e1",
      title: "#fff8fa",
      subtitle: "#ffe8ee",
      domain: "#fff4f7",
      number: "#8a1f3f",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.008em",
        lineHeight: 1.16,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 600,
        letterSpacing: "0.12em",
        lineHeight: 1.04,
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
        letterSpacing: "0.05em",
        lineHeight: 1.04,
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
      subtitleMinSize: 26,
      subtitleMaxSize: 36,
      subtitleMaxLines: 1,
      dividerWidth: 186,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 118,
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["cherry", "red", "pink", "valentine", "statement"],
  },
  "magenta-glow": {
    id: "magenta-glow",
    label: "Magenta Glow",
    description: "Bright magenta energy with enough depth to stay readable on feed.",
    palette: {
      canvas: "#f6d7e6",
      band: "#e968ae",
      footer: "#a62973",
      divider: "#ffd7ea",
      title: "#fff7fb",
      subtitle: "#ffe4f2",
      domain: "#fff5fb",
      number: "#7d1a53",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.008em",
        lineHeight: 1.16,
      },
      subtitle: {
        fontFamily: FONT_STACKS.sans,
        fontWeight: 600,
        letterSpacing: "0.12em",
        lineHeight: 1.04,
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
        letterSpacing: "0.05em",
        lineHeight: 1.04,
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
      subtitleMinSize: 26,
      subtitleMaxSize: 36,
      subtitleMaxLines: 1,
      dividerWidth: 188,
      dividerHeight: 3,
      dividerGapTop: 16,
      footerHeight: 118,
      footerPaddingX: 50,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["magenta", "vivid", "glam", "bright", "popping"],
  },
  "peach-rose": {
    id: "peach-rose",
    label: "Peach Rose",
    description: "Peach and warm rose pastels with strong coral-brown readability.",
    palette: {
      canvas: "#fde5df",
      band: "#fff5f1",
      footer: "#f7d0c6",
      divider: "#ff8a66",
      title: "#c65a42",
      subtitle: "#df8469",
      domain: "#974937",
      number: "#c65a42",
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
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.012em",
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
      dividerWidth: 184,
      dividerHeight: 3,
      dividerGapTop: 18,
      footerHeight: 118,
      footerPaddingX: 52,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["peach", "rose", "warm", "sunlit", "feminine"],
  },
  "petal-latte": {
    id: "petal-latte",
    label: "Petal Latte",
    description: "Muted rose-beige tones for warmer feminine looks without losing restraint.",
    palette: {
      canvas: "#f3e0df",
      band: "#fff5f3",
      footer: "#e8cdca",
      divider: "#c8878a",
      title: "#8e4a53",
      subtitle: "#a5676c",
      domain: "#72464a",
      number: "#8e4a53",
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
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.012em",
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
      titleMaxSizeWithSubtitle: 90,
      titleMinSizeWithoutSubtitle: 68,
      titleMaxSizeWithoutSubtitle: 104,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 2,
      titleTopGapWithSubtitle: 26,
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 184,
      dividerHeight: 3,
      dividerGapTop: 18,
      footerHeight: 118,
      footerPaddingX: 52,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["petal", "rose beige", "soft", "bridal", "romantic"],
  },
  "raspberry-truffle": {
    id: "raspberry-truffle",
    label: "Raspberry Truffle",
    description: "Raspberry berry tones with deeper truffle contrast for luxe feminine pins.",
    palette: {
      canvas: "#ecd5de",
      band: "#cf6d95",
      footer: "#7a2c4c",
      divider: "#f7d8e4",
      title: "#fff7fa",
      subtitle: "#ffe7ef",
      domain: "#fff4f8",
      number: "#7f2343",
    },
    typography: {
      title: {
        fontFamily: FONT_STACKS.display,
        fontWeight: 600,
        letterSpacing: "-0.008em",
        lineHeight: 1.16,
      },
      subtitle: {
        fontFamily: FONT_STACKS.serif,
        fontWeight: 600,
        letterSpacing: "0.03em",
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
    recommendationTags: ["berry", "raspberry", "luxe", "rich", "feminine"],
  },
  "butter-blush": {
    id: "butter-blush",
    label: "Butter Blush",
    description: "Buttercream warmth with blush accents for cheerful feminine contrast.",
    palette: {
      canvas: "#f6ebd9",
      band: "#fff8ea",
      footer: "#edd8b9",
      divider: "#f2b7c8",
      title: "#9d5471",
      subtitle: "#b57a92",
      domain: "#7b4b5e",
      number: "#9d5471",
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
        fontFamily: FONT_STACKS.editorial,
        fontWeight: 700,
        letterSpacing: "-0.012em",
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
      titleMaxSizeWithSubtitle: 90,
      titleMinSizeWithoutSubtitle: 68,
      titleMaxSizeWithoutSubtitle: 104,
      titleMaxLinesWithSubtitle: 2,
      titleMaxLinesWithoutSubtitle: 2,
      titleTopGapWithSubtitle: 26,
      subtitleMinSize: 26,
      subtitleMaxSize: 34,
      subtitleMaxLines: 1,
      dividerWidth: 176,
      dividerHeight: 3,
      dividerGapTop: 18,
      footerHeight: 118,
      footerPaddingX: 52,
      footerMinSize: 24,
      footerMaxSize: 32,
    },
    recommendationTags: ["butter yellow", "blush", "cheerful", "bright", "soft"],
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
  "peony-punch",
  "cherry-cream",
  "magenta-glow",
  "raspberry-truffle",
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

export const splitVerticalFemininePresetIds: TemplateVisualPresetId[] = [
  "plum-sand",
  "cocoa-blush",
  "lavender-mist",
  "peach-cloud",
  "mint-macaroon",
  "rosewater-satin",
  "ballet-slipper",
  "orchid-ink",
  "peony-punch",
  "cherry-cream",
  "magenta-glow",
  "peach-rose",
  "petal-latte",
  "raspberry-truffle",
  "butter-blush",
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
  "pastel-soft": {
    id: "pastel-soft",
    label: "Pastel Soft",
    description: "Airy blush, lavender, peach, and mint palettes with soft feminine appeal.",
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
  "feminine-bold": {
    id: "feminine-bold",
    label: "Feminine Bold",
    description: "Pink, magenta, berry, and cherry palettes designed to pop on feed.",
  },
};

export const TEMPLATE_VISUAL_PRESET_CATEGORY_MAP: Record<
  TemplateVisualPresetId,
  TemplateVisualPresetCategoryId
> = {
  "plum-sand": "pastel-soft",
  "sage-cream": "editorial-soft",
  "cocoa-blush": "pastel-soft",
  "lavender-mist": "pastel-soft",
  "powder-blue-clay": "pastel-soft",
  "peach-cloud": "pastel-soft",
  "mint-macaroon": "pastel-soft",
  "rosewater-satin": "pastel-soft",
  "ballet-slipper": "pastel-soft",
  "orchid-ink": "pastel-soft",
  "peony-punch": "feminine-bold",
  "cherry-cream": "feminine-bold",
  "magenta-glow": "feminine-bold",
  "peach-rose": "pastel-soft",
  "petal-latte": "pastel-soft",
  "raspberry-truffle": "feminine-bold",
  "butter-blush": "pastel-soft",
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
  "split-vertical-title": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama"],
  "split-vertical-title-no-subtitle": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama"],
  "split-vertical-title-number": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama"],
  "single-image-subtitle-title-cta": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama"],
  "single-image-header-title-domain-cta": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama"],
  "single-image-title-footer": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama"],
  "single-image-overlay-number-title-domain": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "graphic-pop", "feminine-bold"],
  "four-image-masonry-hero-number-domain-pill": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "feminine-bold"],
  "four-image-grid-number-title": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "feminine-bold"],
  "four-image-grid-number-title-domain": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "feminine-bold"],
  "four-image-grid-title-footer": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "feminine-bold"],
  "five-image-center-band-number-domain": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "graphic-pop", "feminine-bold"],
  "hero-arch-sidebar-triptych": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "graphic-pop", "fresh-vivid", "feminine-bold"],
  "three-image-center-poster-number-footer": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "graphic-pop", "feminine-bold"],
  "two-image-slant-band-number-domain": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "graphic-pop", "feminine-bold"],
  "hero-text-triple-split-footer": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "feminine-bold"],
  "six-image-triple-split-slant-hero-footer": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "feminine-bold"],
  "masonry-grid-number-title-footer": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "feminine-bold"],
  "nine-image-grid-overlay-number-footer": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "graphic-pop", "feminine-bold"],
  "hero-two-split-text": ["editorial-soft", "pastel-soft", "earthy-warm", "dark-drama", "graphic-pop", "feminine-bold"],
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
  addKeywordScore(scores, context, "lavender-mist", [
    "lavender",
    "lilac",
    "purple",
    "romantic",
    "delicate",
    "pastel",
  ], 2);
  addKeywordScore(scores, context, "powder-blue-clay", [
    "powder blue",
    "blue",
    "airy",
    "soft",
    "coastal",
    "pastel",
  ], 2);
  addKeywordScore(scores, context, "peach-cloud", [
    "peach",
    "apricot",
    "warm",
    "soft",
    "sunlit",
    "pastel",
  ], 2);
  addKeywordScore(scores, context, "mint-macaroon", [
    "mint",
    "sage",
    "fresh",
    "green",
    "clean",
    "pastel",
  ], 2);
  addKeywordScore(scores, context, "rosewater-satin", [
    "pink",
    "rose",
    "blush",
    "romantic",
    "feminine",
    "bridal",
  ], 2);
  addKeywordScore(scores, context, "ballet-slipper", [
    "soft pink",
    "ballet",
    "delicate",
    "gentle",
    "nursery",
    "feminine",
  ], 2);
  addKeywordScore(scores, context, "orchid-ink", [
    "orchid",
    "lilac",
    "violet",
    "purple",
    "glam",
    "beauty",
  ], 2);
  addKeywordScore(scores, context, "peony-punch", [
    "peony",
    "bright pink",
    "pink",
    "vibrant",
    "girly",
    "playful",
  ], 2);
  addKeywordScore(scores, context, "cherry-cream", [
    "cherry",
    "red",
    "valentine",
    "romance",
    "statement",
    "feminine",
  ], 2);
  addKeywordScore(scores, context, "magenta-glow", [
    "magenta",
    "fuchsia",
    "hot pink",
    "bold",
    "glam",
    "popping",
  ], 2);
  addKeywordScore(scores, context, "peach-rose", [
    "peach",
    "rose",
    "sunlit",
    "warm",
    "soft",
    "feminine",
  ], 2);
  addKeywordScore(scores, context, "petal-latte", [
    "petal",
    "bridal",
    "latte",
    "muted",
    "romantic",
    "soft",
  ], 2);
  addKeywordScore(scores, context, "raspberry-truffle", [
    "berry",
    "raspberry",
    "luxe",
    "rich",
    "moody",
    "feminine",
  ], 2);
  addKeywordScore(scores, context, "butter-blush", [
    "butter",
    "yellow",
    "blush",
    "happy",
    "cheerful",
    "pastel",
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
      incrementScore(scores, "peach-cloud", 2);
      incrementScore(scores, "jade-paprika", 1);
    }

    if (
      pixelSignals.saturation < 0.16 &&
      pixelSignals.brightness > 0.7 &&
      pixelSignals.contrast < 0.18
    ) {
      incrementScore(scores, "lavender-mist", 2);
      incrementScore(scores, "powder-blue-clay", 2);
      incrementScore(scores, "mint-macaroon", 2);
      incrementScore(scores, "rosewater-satin", 2);
      incrementScore(scores, "ballet-slipper", 2);
      incrementScore(scores, "peach-rose", 2);
      incrementScore(scores, "petal-latte", 1);
      incrementScore(scores, "butter-blush", 1);
    }

    if (pixelSignals.saturation > 0.24 && pixelSignals.brightness > 0.56) {
      incrementScore(scores, "berry-citrus", 3);
      incrementScore(scores, "emerald-sun", 2);
      incrementScore(scores, "sunset-punch", 2);
      incrementScore(scores, "teal-flare", 2);
      incrementScore(scores, "peony-punch", 2);
      incrementScore(scores, "magenta-glow", 2);
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
      incrementScore(scores, "cherry-cream", 1);
      incrementScore(scores, "butter-blush", 2);
      incrementScore(scores, "peach-rose", 2);
    }

    if (
      pixelSignals.saturation > 0.18 &&
      pixelSignals.brightness > 0.5 &&
      pixelSignals.warmth > -0.02 &&
      pixelSignals.warmth < 0.08
    ) {
      incrementScore(scores, "orchid-ink", 2);
      incrementScore(scores, "raspberry-truffle", 2);
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
    "lavender-mist",
    "powder-blue-clay",
    "peach-cloud",
    "mint-macaroon",
    "rosewater-satin",
    "ballet-slipper",
    "orchid-ink",
    "peony-punch",
    "cherry-cream",
    "magenta-glow",
    "peach-rose",
    "petal-latte",
    "raspberry-truffle",
    "butter-blush",
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
