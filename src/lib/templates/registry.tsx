import { TemplateSplitVerticalTitle } from "@/templates/TemplateSplitVerticalTitle";
import { TemplateSplitVerticalTitleNoSubtitle } from "@/templates/TemplateSplitVerticalTitleNoSubtitle";
import { TemplateSplitVerticalTitleNumber } from "@/templates/TemplateSplitVerticalTitleNumber";
import { TemplateSingleImageSubtitleTitleCta } from "@/templates/TemplateSingleImageSubtitleTitleCta";
import { TemplateFourImageMasonryHeroNumberDomainPill } from "@/templates/TemplateFourImageMasonryHeroNumberDomainPill";
import type { JSX } from "react";
import {
  sampleTemplateDataFourImageMasonryHeroNumberDomainPill,
  sampleTemplateDataNumber,
  sampleTemplateDataNoSubtitle,
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

  return sampleTemplateDataWithSubtitle;
}
