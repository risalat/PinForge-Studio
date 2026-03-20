import type { CSSProperties } from "react";

export const templateVisualPresets = [
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
  "midnight-gold",
  "terracotta-ink",
  "olive-linen",
  "cobalt-coral",
  "emerald-sun",
  "berry-citrus",
  "obsidian-punch",
  "ink-lime",
  "jade-paprika",
  "scarlet-cream",
  "teal-flare",
  "sunset-punch",
] as const;

export const templateVisualPresetCategories = [
  "editorial-soft",
  "pastel-soft",
  "earthy-warm",
  "dark-drama",
  "graphic-pop",
  "fresh-vivid",
  "feminine-bold",
] as const;

export type TemplateVisualPresetId = (typeof templateVisualPresets)[number];
export type TemplateVisualPresetCategoryId = (typeof templateVisualPresetCategories)[number];
export type TemplateColorPreset = TemplateVisualPresetId;
export type TemplateNumberTreatment = "none" | "badge" | "hero";

export type TemplateTextRoleStyle = {
  fontFamily: string;
  fontWeight: number;
  letterSpacing: string;
  lineHeight: number;
  textTransform?: CSSProperties["textTransform"];
  fontStyle?: CSSProperties["fontStyle"];
};

export type TemplateVisualPreset = {
  id: TemplateVisualPresetId;
  label: string;
  description: string;
  palette: {
    canvas: string;
    band: string;
    footer: string;
    divider: string;
    title: string;
    subtitle: string;
    domain: string;
    number: string;
  };
  typography: {
    title: TemplateTextRoleStyle;
    subtitle: TemplateTextRoleStyle;
    number: TemplateTextRoleStyle;
    domain: TemplateTextRoleStyle;
  };
  layout: {
    bandPaddingX: number;
    bandHeightWithSubtitle: number;
    bandHeightWithoutSubtitle: number;
    titleBlockHeightWithSubtitle: number;
    titleBlockHeightWithoutSubtitle: number;
    titleMinSizeWithSubtitle: number;
    titleMaxSizeWithSubtitle: number;
    titleMinSizeWithoutSubtitle: number;
    titleMaxSizeWithoutSubtitle: number;
    titleMaxLinesWithSubtitle: number;
    titleMaxLinesWithoutSubtitle: number;
    titleTopGapWithSubtitle: number;
    subtitleMinSize: number;
    subtitleMaxSize: number;
    subtitleMaxLines: number;
    dividerWidth: number;
    dividerHeight: number;
    dividerGapTop: number;
    footerHeight: number;
    footerPaddingX: number;
    footerMinSize: number;
    footerMaxSize: number;
  };
  recommendationTags: string[];
};

export type TemplateRenderProps = {
  title: string;
  subtitle?: string;
  itemNumber?: number;
  images: string[];
  domain: string;
  titleLocked?: boolean;
  subtitleLocked?: boolean;
  visualPreset?: TemplateVisualPresetId;
  colorPreset?: TemplateColorPreset;
};

export type TemplateConfig = {
  id: string;
  name: string;
  componentKey: string;
  previewPath?: string;
  locked?: boolean;
  canvas: {
    width: number;
    height: number;
  };
  imageSlotCount: number;
  textFields: string[];
  features: {
    overlay: boolean;
    numberTreatment: TemplateNumberTreatment;
    footer: boolean;
  };
};

export const templateColorPresets = templateVisualPresets;
