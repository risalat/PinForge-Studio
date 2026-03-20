import { templateVisualPresets, type TemplateVisualPresetId } from "@/lib/templates/types";

export type PlanRenderContext = {
  title?: string;
  subtitle?: string;
  titleLocked?: boolean;
  subtitleLocked?: boolean;
  itemNumber?: number;
  visualPreset?: TemplateVisualPresetId;
  colorPreset?: string;
};

export function parsePlanRenderContext(value: string | null | undefined): PlanRenderContext {
  if (!value?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as PlanRenderContext;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function serializePlanRenderContext(input: PlanRenderContext) {
  const next: PlanRenderContext = {};

  if (input.title?.trim()) {
    next.title = input.title.trim();
  }
  if (input.subtitle?.trim()) {
    next.subtitle = input.subtitle.trim();
  }
  if (input.titleLocked) {
    next.titleLocked = true;
  }
  if (input.subtitleLocked) {
    next.subtitleLocked = true;
  }
  if (typeof input.itemNumber === "number" && Number.isFinite(input.itemNumber) && input.itemNumber > 0) {
    next.itemNumber = Math.floor(input.itemNumber);
  }
  if (isVisualPreset(input.visualPreset)) {
    next.visualPreset = input.visualPreset;
  }

  return JSON.stringify(next);
}

export function toPlanVisualPreset(value: unknown): TemplateVisualPresetId | undefined {
  return isVisualPreset(value) ? value : undefined;
}

function isVisualPreset(value: unknown): value is TemplateVisualPresetId {
  return (
    typeof value === "string" &&
    templateVisualPresets.includes(value as TemplateVisualPresetId)
  );
}
