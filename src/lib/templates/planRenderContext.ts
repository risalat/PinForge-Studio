import { templateVisualPresets, type TemplateVisualPresetId } from "@/lib/templates/types";

export type PlanRenderContext = {
  title?: string;
  subtitle?: string;
  titleLocked?: boolean;
  subtitleLocked?: boolean;
  itemNumber?: number;
  visualPreset?: TemplateVisualPresetId;
  colorPreset?: string;
  presetRecommendationStatus?: "pending" | "recommended" | "failed" | "manual";
  presetRecommendationSource?: "text_context" | "image_aware" | "manual";
  presetRecommendedAt?: string;
  presetRecommendationError?: string;
  presetAutoRecommended?: boolean;
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
  if (isPresetRecommendationStatus(input.presetRecommendationStatus)) {
    next.presetRecommendationStatus = input.presetRecommendationStatus;
  }
  if (isPresetRecommendationSource(input.presetRecommendationSource)) {
    next.presetRecommendationSource = input.presetRecommendationSource;
  }
  if (typeof input.presetRecommendedAt === "string" && input.presetRecommendedAt.trim()) {
    next.presetRecommendedAt = input.presetRecommendedAt;
  }
  if (typeof input.presetRecommendationError === "string" && input.presetRecommendationError.trim()) {
    next.presetRecommendationError = input.presetRecommendationError.trim();
  }
  if (typeof input.presetAutoRecommended === "boolean") {
    next.presetAutoRecommended = input.presetAutoRecommended;
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

function isPresetRecommendationStatus(
  value: unknown,
): value is NonNullable<PlanRenderContext["presetRecommendationStatus"]> {
  return (
    value === "pending" ||
    value === "recommended" ||
    value === "failed" ||
    value === "manual"
  );
}

function isPresetRecommendationSource(
  value: unknown,
): value is NonNullable<PlanRenderContext["presetRecommendationSource"]> {
  return value === "text_context" || value === "image_aware" || value === "manual";
}
