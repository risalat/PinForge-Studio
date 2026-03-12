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
