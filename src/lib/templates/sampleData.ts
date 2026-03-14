import type { TemplateRenderProps } from "@/lib/templates/types";

export const sampleTemplateDataWithSubtitle: TemplateRenderProps = {
  title: "12 Winter Reading Nooks",
  subtitle: "Feels Like Pure Magic",
  images: ["/sample-images/1.jpg", "/sample-images/2.jpg"],
  domain: "pinforge.tenreclabs.com",
  visualPreset: "plum-sand",
};

export const sampleTemplateDataNoSubtitle: TemplateRenderProps = {
  title: "12 Winter Reading Nooks",
  images: ["/sample-images/3.jpg", "/sample-images/4.jpg"],
  domain: "pinforge.tenreclabs.com",
  visualPreset: "sage-cream",
};

export const sampleTemplateDataNumber: TemplateRenderProps = {
  title: "Lake House Exterior Ideas With Timeless Appeal",
  images: ["/sample-images/5..jpg", "/sample-images/6.jpg"],
  domain: "mightypaint.com",
  itemNumber: 15,
  visualPreset: "midnight-gold",
};

export const sampleTemplateDataSingleImageSubtitleTitleCta: TemplateRenderProps = {
  title: "13 Whimsigoth Paint Colors",
  subtitle: "Nocturne Blue by Sherwin-Williams",
  images: ["/sample-images/6.jpg"],
  domain: "mightypaint.com",
  visualPreset: "midnight-gold",
};

export const sampleTemplateDataFourImageMasonryHeroNumberDomainPill: TemplateRenderProps = {
  title: "Accent Wall Bedroom Ideas",
  images: [
    "/sample-images/1.jpg",
    "/sample-images/2.jpg",
    "/sample-images/3.jpg",
    "/sample-images/4.jpg",
  ],
  domain: "mightypaint.com",
  itemNumber: 15,
  visualPreset: "emerald-sun",
};

export const sampleTemplateDataSixImageTripleSplitSlantHeroFooter: TemplateRenderProps = {
  title: "Gorgeous Lakehouse Exterior Ideas",
  subtitle: "That Wow from Every Angle",
  images: [
    "/sample-images/1.jpg",
    "/sample-images/2.jpg",
    "/sample-images/3.jpg",
    "/sample-images/4.jpg",
    "/sample-images/5..jpg",
    "/sample-images/6.jpg",
  ],
  domain: "mightypaint.com",
  itemNumber: 15,
  visualPreset: "terracotta-ink",
};

export const sampleTemplateDataNineImageGridOverlayNumberFooter: TemplateRenderProps = {
  title: "Mailbox Decor Ideas",
  subtitle: "That Totally Transform Your Front Yard",
  images: [
    "/sample-images/1.jpg",
    "/sample-images/2.jpg",
    "/sample-images/3.jpg",
    "/sample-images/4.jpg",
    "/sample-images/5..jpg",
    "/sample-images/6.jpg",
    "/sample-images/7.jpg",
    "/sample-images/8.jpg",
    "/sample-images/9.jpg",
  ],
  domain: "mightypaint.com",
  itemNumber: 25,
  visualPreset: "cobalt-coral",
};
