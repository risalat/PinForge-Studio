import { TemplateSplitVerticalTitle } from "@/templates/TemplateSplitVerticalTitle";
import { TemplateSplitVerticalTitleNoSubtitle } from "@/templates/TemplateSplitVerticalTitleNoSubtitle";
import { TemplateSplitVerticalTitleNumber } from "@/templates/TemplateSplitVerticalTitleNumber";
import { TemplateSingleImageSubtitleTitleCta } from "@/templates/TemplateSingleImageSubtitleTitleCta";
import { TemplateSingleImageHeaderTitleDomainCta } from "@/templates/TemplateSingleImageHeaderTitleDomainCta";
import { TemplateSingleImageTitleFooter } from "@/templates/TemplateSingleImageTitleFooter";
import { TemplateSingleImageOverlayNumberTitleDomain } from "@/templates/TemplateSingleImageOverlayNumberTitleDomain";
import { TemplateFourImageMasonryHeroNumberDomainPill } from "@/templates/TemplateFourImageMasonryHeroNumberDomainPill";
import { TemplateFourImageGridNumberTitle } from "@/templates/TemplateFourImageGridNumberTitle";
import { TemplateFourImageGridNumberTitleDomain } from "@/templates/TemplateFourImageGridNumberTitleDomain";
import { TemplateFourImageGridTitleFooter } from "@/templates/TemplateFourImageGridTitleFooter";
import { TemplateFourImageGridCenterBandTitleDomain } from "@/templates/TemplateFourImageGridCenterBandTitleDomain";
import { TemplateFourImageGridCenterPosterNumberTitle } from "@/templates/TemplateFourImageGridCenterPosterNumberTitle";
import { TemplateFiveImageCenterBandNumberDomain } from "@/templates/TemplateFiveImageCenterBandNumberDomain";
import { TemplateHeroArchSidebarTriptych } from "@/templates/TemplateHeroArchSidebarTriptych";
import { TemplateThreeImageCenterPosterNumberFooter } from "@/templates/TemplateThreeImageCenterPosterNumberFooter";
import { TemplateFourImageSplitBandNumber } from "@/templates/TemplateFourImageSplitBandNumber";
import { TemplateTwoImageSlantBandNumberDomain } from "@/templates/TemplateTwoImageSlantBandNumberDomain";
import { TemplateHeroTextTripleSplitFooter } from "@/templates/TemplateHeroTextTripleSplitFooter";
import { TemplateSixImageTripleSplitSlantHeroFooter } from "@/templates/TemplateSixImageTripleSplitSlantHeroFooter";
import { TemplateNineImageGridOverlayNumberFooter } from "@/templates/TemplateNineImageGridOverlayNumberFooter";
import { TemplateMasonryGridNumberTitleFooter } from "@/templates/TemplateMasonryGridNumberTitleFooter";
import { TemplateHeroTwoSplitText } from "@/templates/TemplateHeroTwoSplitText";
import { TemplateColorPopLadderNumberCard } from "@/templates/TemplateColorPopLadderNumberCard";
import type { JSX } from "react";
import {
  sampleTemplateDataFourImageMasonryHeroNumberDomainPill,
  sampleTemplateDataFourImageGridNumberTitle,
  sampleTemplateDataFourImageGridNumberTitleDomain,
  sampleTemplateDataFourImageGridTitleFooter,
  sampleTemplateDataFourImageGridCenterBandTitleDomain,
  sampleTemplateDataFourImageGridCenterPosterNumberTitle,
  sampleTemplateDataFiveImageCenterBandNumberDomain,
  sampleTemplateDataHeroArchSidebarTriptych,
  sampleTemplateDataThreeImageCenterPosterNumberFooter,
  sampleTemplateDataFourImageSplitBandNumber,
  sampleTemplateDataTwoImageSlantBandNumberDomain,
  sampleTemplateDataHeroTwoSplitText,
  sampleTemplateDataColorPopLadderNumberCard,
  sampleTemplateDataHeroTextTripleSplitFooter,
  sampleTemplateDataMasonryGridNumberTitleFooter,
  sampleTemplateDataNineImageGridOverlayNumberFooter,
  sampleTemplateDataSingleImageHeaderTitleDomainCta,
  sampleTemplateDataSingleImageTitleFooter,
  sampleTemplateDataSingleImageOverlayNumberTitleDomain,
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
  "single-image-header-title-domain-cta": {
    id: "single-image-header-title-domain-cta",
    name: "Single Image Header Title Domain CTA",
    componentKey: "TemplateSingleImageHeaderTitleDomainCta",
    previewPath: "/preview/single-image-header-title-domain-cta",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 1,
    textFields: ["subtitle", "title", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "none",
      footer: false,
    },
  },
  "single-image-title-footer": {
    id: "single-image-title-footer",
    name: "Single Image Title Footer",
    componentKey: "TemplateSingleImageTitleFooter",
    previewPath: "/preview/single-image-title-footer",
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
  "single-image-overlay-number-title-domain": {
    id: "single-image-overlay-number-title-domain",
    name: "Single Image Overlay Number Title Domain",
    componentKey: "TemplateSingleImageOverlayNumberTitleDomain",
    previewPath: "/preview/single-image-overlay-number-title-domain",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 1,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
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
  "four-image-grid-number-title": {
    id: "four-image-grid-number-title",
    name: "Four Image Grid Number Title",
    componentKey: "TemplateFourImageGridNumberTitle",
    previewPath: "/preview/four-image-grid-number-title",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 4,
    textFields: ["title", "itemNumber", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: false,
    },
  },
  "four-image-grid-title-footer": {
    id: "four-image-grid-title-footer",
    name: "Four Image Grid Title Footer",
    componentKey: "TemplateFourImageGridTitleFooter",
    previewPath: "/preview/four-image-grid-title-footer",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 4,
    textFields: ["title", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "none",
      footer: true,
    },
  },
  "four-image-grid-center-band-title-domain": {
    id: "four-image-grid-center-band-title-domain",
    name: "Four Image Grid Center Band Title Domain",
    componentKey: "TemplateFourImageGridCenterBandTitleDomain",
    previewPath: "/preview/four-image-grid-center-band-title-domain",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 4,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "none",
      footer: true,
    },
  },
  "four-image-grid-center-poster-number-title": {
    id: "four-image-grid-center-poster-number-title",
    name: "Four Image Grid Center Poster Number Title",
    componentKey: "TemplateFourImageGridCenterPosterNumberTitle",
    previewPath: "/preview/four-image-grid-center-poster-number-title",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 4,
    textFields: ["title", "itemNumber", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: false,
    },
  },
  "five-image-center-band-number-domain": {
    id: "five-image-center-band-number-domain",
    name: "Five Image Center Band Number Domain",
    componentKey: "TemplateFiveImageCenterBandNumberDomain",
    previewPath: "/preview/five-image-center-band-number-domain",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 5,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: true,
    },
  },
  "hero-arch-sidebar-triptych": {
    id: "hero-arch-sidebar-triptych",
    name: "Hero Arch Sidebar Triptych",
    componentKey: "TemplateHeroArchSidebarTriptych",
    previewPath: "/preview/hero-arch-sidebar-triptych",
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
  "three-image-center-poster-number-footer": {
    id: "three-image-center-poster-number-footer",
    name: "Three Image Center Poster Number Footer",
    componentKey: "TemplateThreeImageCenterPosterNumberFooter",
    previewPath: "/preview/three-image-center-poster-number-footer",
    locked: false,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 3,
    textFields: ["title", "subtitle", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: true,
    },
  },
  "four-image-split-band-number": {
    id: "four-image-split-band-number",
    name: "Four Image Split Band Number",
    componentKey: "TemplateFourImageSplitBandNumber",
    previewPath: "/preview/four-image-split-band-number",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 4,
    textFields: ["title", "itemNumber", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: false,
    },
  },
  "two-image-slant-band-number-domain": {
    id: "two-image-slant-band-number-domain",
    name: "Two Image Slant Band Number Domain",
    componentKey: "TemplateTwoImageSlantBandNumberDomain",
    previewPath: "/preview/two-image-slant-band-number-domain",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 3,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: true,
    },
  },
  "hero-text-triple-split-footer": {
    id: "hero-text-triple-split-footer",
    name: "Hero Text Triple Split Footer",
    componentKey: "TemplateHeroTextTripleSplitFooter",
    previewPath: "/preview/hero-text-triple-split-footer",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 4,
    textFields: ["subtitle", "title", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "none",
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
  "masonry-grid-number-title-footer": {
    id: "masonry-grid-number-title-footer",
    name: "Masonry Grid Number Title Footer",
    componentKey: "TemplateMasonryGridNumberTitleFooter",
    previewPath: "/preview/masonry-grid-number-title-footer",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 8,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: true,
    },
  },
  "hero-two-split-text": {
    id: "hero-two-split-text",
    name: "Hero Two Split Text",
    componentKey: "TemplateHeroTwoSplitText",
    previewPath: "/preview/hero-two-split-text",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 3,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
    features: {
      overlay: true,
      numberTreatment: "hero",
      footer: true,
    },
  },
  "color-pop-ladder-number-card": {
    id: "color-pop-ladder-number-card",
    name: "Color Pop Ladder Number Card",
    componentKey: "TemplateColorPopLadderNumberCard",
    previewPath: "/preview/color-pop-ladder-number-card",
    locked: true,
    canvas: { width: 1080, height: 1920 },
    imageSlotCount: 3,
    textFields: ["title", "itemNumber", "domain", "visualPreset"],
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
  "single-image-header-title-domain-cta": TemplateSingleImageHeaderTitleDomainCta,
  "single-image-title-footer": TemplateSingleImageTitleFooter,
  "single-image-overlay-number-title-domain": TemplateSingleImageOverlayNumberTitleDomain,
  "four-image-masonry-hero-number-domain-pill": TemplateFourImageMasonryHeroNumberDomainPill,
  "four-image-grid-number-title": TemplateFourImageGridNumberTitle,
  "four-image-grid-number-title-domain": TemplateFourImageGridNumberTitleDomain,
  "four-image-grid-title-footer": TemplateFourImageGridTitleFooter,
  "four-image-grid-center-band-title-domain": TemplateFourImageGridCenterBandTitleDomain,
  "four-image-grid-center-poster-number-title": TemplateFourImageGridCenterPosterNumberTitle,
  "five-image-center-band-number-domain": TemplateFiveImageCenterBandNumberDomain,
  "hero-arch-sidebar-triptych": TemplateHeroArchSidebarTriptych,
  "three-image-center-poster-number-footer": TemplateThreeImageCenterPosterNumberFooter,
  "four-image-split-band-number": TemplateFourImageSplitBandNumber,
  "two-image-slant-band-number-domain": TemplateTwoImageSlantBandNumberDomain,
  "hero-text-triple-split-footer": TemplateHeroTextTripleSplitFooter,
  "six-image-triple-split-slant-hero-footer": TemplateSixImageTripleSplitSlantHeroFooter,
  "nine-image-grid-overlay-number-footer": TemplateNineImageGridOverlayNumberFooter,
  "masonry-grid-number-title-footer": TemplateMasonryGridNumberTitleFooter,
  "hero-two-split-text": TemplateHeroTwoSplitText,
  "color-pop-ladder-number-card": TemplateColorPopLadderNumberCard,
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

  if (templateId === "single-image-header-title-domain-cta") {
    return sampleTemplateDataSingleImageHeaderTitleDomainCta;
  }

  if (templateId === "single-image-title-footer") {
    return sampleTemplateDataSingleImageTitleFooter;
  }

  if (templateId === "single-image-overlay-number-title-domain") {
    return sampleTemplateDataSingleImageOverlayNumberTitleDomain;
  }

  if (templateId === "four-image-masonry-hero-number-domain-pill") {
    return sampleTemplateDataFourImageMasonryHeroNumberDomainPill;
  }

  if (templateId === "four-image-grid-number-title-domain") {
    return sampleTemplateDataFourImageGridNumberTitleDomain;
  }

  if (templateId === "four-image-grid-number-title") {
    return sampleTemplateDataFourImageGridNumberTitle;
  }

  if (templateId === "four-image-grid-title-footer") {
    return sampleTemplateDataFourImageGridTitleFooter;
  }

  if (templateId === "four-image-grid-center-band-title-domain") {
    return sampleTemplateDataFourImageGridCenterBandTitleDomain;
  }

  if (templateId === "four-image-grid-center-poster-number-title") {
    return sampleTemplateDataFourImageGridCenterPosterNumberTitle;
  }

  if (templateId === "five-image-center-band-number-domain") {
    return sampleTemplateDataFiveImageCenterBandNumberDomain;
  }

  if (templateId === "hero-arch-sidebar-triptych") {
    return sampleTemplateDataHeroArchSidebarTriptych;
  }

  if (templateId === "three-image-center-poster-number-footer") {
    return sampleTemplateDataThreeImageCenterPosterNumberFooter;
  }

  if (templateId === "four-image-split-band-number") {
    return sampleTemplateDataFourImageSplitBandNumber;
  }

  if (templateId === "two-image-slant-band-number-domain") {
    return sampleTemplateDataTwoImageSlantBandNumberDomain;
  }

  if (templateId === "hero-text-triple-split-footer") {
    return sampleTemplateDataHeroTextTripleSplitFooter;
  }

  if (templateId === "six-image-triple-split-slant-hero-footer") {
    return sampleTemplateDataSixImageTripleSplitSlantHeroFooter;
  }

  if (templateId === "nine-image-grid-overlay-number-footer") {
    return sampleTemplateDataNineImageGridOverlayNumberFooter;
  }

  if (templateId === "masonry-grid-number-title-footer") {
    return sampleTemplateDataMasonryGridNumberTitleFooter;
  }

  if (templateId === "hero-two-split-text") {
    return sampleTemplateDataHeroTwoSplitText;
  }

  if (templateId === "color-pop-ladder-number-card") {
    return sampleTemplateDataColorPopLadderNumberCard;
  }

  return sampleTemplateDataWithSubtitle;
}
