export const templateColorPresets = [
  "plum-sand",
  "sage-cream",
  "cocoa-blush",
  "midnight-gold",
] as const;

export type TemplateColorPreset =
  (typeof templateColorPresets)[number];

export type TemplateRenderProps = {
  title: string;
  subtitle?: string;
  images: string[];
  domain: string;
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
    badge: boolean;
    footer: boolean;
  };
};
