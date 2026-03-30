import type { TemplateRenderProps } from "@/lib/templates/types";

export const sampleRuntimeTemplateRenderProps: TemplateRenderProps = {
  title: "24 Cozy Reading Room Ideas To Copy",
  subtitle: "Warm Layers And Better Lighting",
  itemNumber: 24,
  domain: "mightypaint.com",
  images: [
    "/sample-images/7.jpg",
    "/sample-images/8.jpg",
    "/sample-images/1.jpg",
    "/sample-images/2.jpg",
  ],
  visualPreset: "teal-flare",
};

export function getSampleRuntimeTemplateRenderProps(): TemplateRenderProps {
  return {
    ...sampleRuntimeTemplateRenderProps,
    images: [...sampleRuntimeTemplateRenderProps.images],
  };
}
