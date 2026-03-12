import { TemplateSplitVerticalTitle } from "@/templates/TemplateSplitVerticalTitle";
import { TemplateSplitVerticalTitleNoSubtitle } from "@/templates/TemplateSplitVerticalTitleNoSubtitle";
import type { JSX } from "react";
import {
  sampleTemplateDataNoSubtitle,
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
};

const TEMPLATE_COMPONENTS: Record<
  string,
  (props: TemplateRenderProps) => JSX.Element
> = {
  "split-vertical-title": TemplateSplitVerticalTitle,
  "split-vertical-title-no-subtitle": TemplateSplitVerticalTitleNoSubtitle,
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

  return sampleTemplateDataWithSubtitle;
}
