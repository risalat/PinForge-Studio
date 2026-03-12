import type { CSSProperties } from "react";

export const templateVisualPresets = [
  "plum-sand",
  "sage-cream",
  "cocoa-blush",
  "midnight-gold",
  "terracotta-ink",
  "olive-linen",
  "cobalt-coral",
  "emerald-sun",
  "berry-citrus",
] as const;

export type TemplateVisualPresetId = (typeof templateVisualPresets)[number];
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
