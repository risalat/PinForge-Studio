import { TemplateSplitVerticalTitle } from "@/templates/TemplateSplitVerticalTitle";
import { TemplateSplitVerticalTitleNoSubtitle } from "@/templates/TemplateSplitVerticalTitleNoSubtitle";
import { TemplateSplitVerticalTitleNumber } from "@/templates/TemplateSplitVerticalTitleNumber";
import { TemplateSingleImageSubtitleTitleCta } from "@/templates/TemplateSingleImageSubtitleTitleCta";
import { TemplateFourImageMasonryHeroNumberDomainPill } from "@/templates/TemplateFourImageMasonryHeroNumberDomainPill";
import { TemplateFourImageGridNumberTitleDomain } from "@/templates/TemplateFourImageGridNumberTitleDomain";
import { TemplateSixImageTripleSplitSlantHeroFooter } from "@/templates/TemplateSixImageTripleSplitSlantHeroFooter";
import { TemplateNineImageGridOverlayNumberFooter } from "@/templates/TemplateNineImageGridOverlayNumberFooter";
import type { JSX } from "react";
import {
  sampleTemplateDataFourImageMasonryHeroNumberDomainPill,
  sampleTemplateDataFourImageGridNumberTitleDomain,
  sampleTemplateDataNineImageGridOverlayNumberFooter,
  sampleTemplateDataNumber,
  sampleTemplateDataNoSubtitle,
  sampleTemplateDataSixImageTripleSplitSlantHeroFooter,
  sampleTemplateDataSingleImageSubtitleTitleCta,
  sampleTemplateDataWithSubtitle,
} from "@/lib/templates/sampleData";
import type { TemplateConfig, TemplateRenderProps } from "@/lib/templates/types";

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  "split-vertical-title": {
    id: "split-vertical-title",
    name: "Split Vertical Title With Subtitle",
    componentKey: "TemplateSplitVerticalTitle",
    previewPath: "/preview/split-vertical-title",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 2,
    textFields: ["subtitle", "title", "domain", "visualPreset"],
    features: {
      overlay: false,
      numberTreatment: "none",
      footer: true,
    },
  },
  "split-vertical-title-no-subtitle": {
    id: "split-vertical-title-no-subtitle",
    name: "Split Vertical Title No Subtitle",
    componentKey: "TemplateSplitVerticalTitleNoSubtitle",
    previewPath: "/preview/split-vertical-title-no-subtitle",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 2,
    textFields: ["title", "domain", "visualPreset"],
    features: {
      overlay: false,
      numberTreatment: "none",
      footer: true,
    },
  },
  "split-vertical-title-number": {
    id: "split-vertical-title-number",
    name: "Split Vertical Title Hero Number",
    componentKey: "TemplateSplitVerticalTitleNumber",
    previewPath: "/preview/split-vertical-title-number",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 2,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: false,
      numberTreatment: "hero",
      footer: true,
    },
  },
  "single-image-subtitle-title-cta": {
    id: "single-image-subtitle-title-cta",
    name: "Single Image Subtitle Title CTA",
    componentKey: "TemplateSingleImageSubtitleTitleCta",
    previewPath: "/preview/single-image-subtitle-title-cta",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 1,
    textFields: ["subtitle", "title", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "none",
      footer: true,
    },
  },
  "four-image-masonry-hero-number-domain-pill": {
    id: "four-image-masonry-hero-number-domain-pill",
    name: "Four Image Number Title Sitename",
    componentKey: "TemplateFourImageMasonryHeroNumberDomainPill",
    previewPath: "/preview/four-image-masonry-hero-number-domain-pill",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 4,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: false,
    },
  },
  "four-image-grid-number-title-domain": {
    id: "four-image-grid-number-title-domain",
    name: "Four Image Grid Number Title Domain",
    componentKey: "TemplateFourImageGridNumberTitleDomain",
    previewPath: "/preview/four-image-grid-number-title-domain",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 4,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: true,
    },
  },
  "six-image-triple-split-slant-hero-footer": {
    id: "six-image-triple-split-slant-hero-footer",
    name: "Six Image Triple Split Slant Hero Footer",
    componentKey: "TemplateSixImageTripleSplitSlantHeroFooter",
    previewPath: "/preview/six-image-triple-split-slant-hero-footer",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 6,
    textFields: ["title", "subtitle", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: true,
    },
  },
  "nine-image-grid-overlay-number-footer": {
    id: "nine-image-grid-overlay-number-footer",
    name: "Nine Image Grid Overlay Number Footer",
    componentKey: "TemplateNineImageGridOverlayNumberFooter",
    previewPath: "/preview/nine-image-grid-overlay-number-footer",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 9,
    textFields: ["title", "subtitle", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: true,
    },
  },
};

const TEMPLATE_COMPONENTS: Record<
  string,
  (props: TemplateRenderProps) => JSX.Element
> = {
  "split-vertical-title": TemplateSplitVerticalTitle,
  "split-vertical-title-no-subtitle": TemplateSplitVerticalTitleNoSubtitle,
  "split-vertical-title-number": TemplateSplitVerticalTitleNumber,
  "single-image-subtitle-title-cta": TemplateSingleImageSubtitleTitleCta,
  "four-image-masonry-hero-number-domain-pill": TemplateFourImageMasonryHeroNumberDomainPill,
  "four-image-grid-number-title-domain": TemplateFourImageGridNumberTitleDomain,
  "six-image-triple-split-slant-hero-footer": TemplateSixImageTripleSplitSlantHeroFooter,
  "nine-image-grid-overlay-number-footer": TemplateNineImageGridOverlayNumberFooter,
};

export function getTemplateConfig(templateId: string) {
  return TEMPLATE_CONFIGS[templateId] ?? null;
}

export function renderTemplate(templateId: string, props: TemplateRenderProps) {
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId];

  if (!TemplateComponent) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  return <TemplateComponent {...props} />;
}

export function getSampleTemplateProps(templateId: string) {
  if (templateId === "split-vertical-title") {
    return sampleTemplateDataWithSubtitle;
  }

  if (templateId === "split-vertical-title-no-subtitle") {
    return sampleTemplateDataNoSubtitle;
  }

  if (templateId === "split-vertical-title-number") {
    return sampleTemplateDataNumber;
  }

  if (templateId === "single-image-subtitle-title-cta") {
    return sampleTemplateDataSingleImageSubtitleTitleCta;
  }

  if (templateId === "four-image-masonry-hero-number-domain-pill") {
    return sampleTemplateDataFourImageMasonryHeroNumberDomainPill;
  }

  if (templateId === "four-image-grid-number-title-domain") {
    return sampleTemplateDataFourImageGridNumberTitleDomain;
  }

  if (templateId === "six-image-triple-split-slant-hero-footer") {
    return sampleTemplateDataSixImageTripleSplitSlantHeroFooter;
  }

  if (templateId === "nine-image-grid-overlay-number-footer") {
    return sampleTemplateDataNineImageGridOverlayNumberFooter;
  }

  return sampleTemplateDataWithSubtitle;
}
