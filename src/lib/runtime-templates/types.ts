export const RUNTIME_TEMPLATE_SCHEMA_VERSION = 1 as const;
export const RUNTIME_TEMPLATE_KIND = "custom-runtime" as const;

export const runtimeTemplateFillTokenValues = [
  "surface.canvas",
  "surface.primary",
  "surface.secondary",
  "surface.accent",
  "surface.overlay",
  "surface.badge",
  "surface.footer",
  "surface.inverse",
] as const;

export const runtimeTemplateTextTokenValues = [
  "text.title",
  "text.subtitle",
  "text.meta",
  "text.inverse",
  "text.number",
  "text.cta",
] as const;

export const runtimeTemplateBorderTokenValues = [
  "border.primary",
  "border.accent",
  "stroke.default",
  "stroke.accent",
] as const;

export const runtimeTemplateShadowTokenValues = [
  "shadow.none",
  "shadow.soft",
  "shadow.strong",
] as const;

export const runtimeTemplateFontTokenValues = [
  "font.title",
  "font.subtitle",
  "font.meta",
  "font.number",
  "font.cta",
  "font.editorial-serif",
  "font.display-serif",
  "font.classic-serif",
  "font.book-serif",
  "font.modern-sans",
  "font.grotesk",
  "font.clean-sans",
  "font.condensed-sans",
  "font.bold-sans",
  "font.rounded-sans",
  "font.script",
  "font.signature",
] as const;

export const runtimeTemplateShapeKindValues = [
  "rect",
  "roundedRect",
  "circle",
  "pill",
  "arch",
  "slantedCard",
] as const;

export const runtimeTemplateTextAlignValues = [
  "left",
  "center",
  "right",
] as const;

export const runtimeTemplateTextTransformValues = [
  "none",
  "uppercase",
  "lowercase",
  "capitalize",
] as const;

export const runtimeTemplateImageFitModeValues = [
  "cover",
  "contain",
] as const;

export const runtimeTemplateOverlayGradientValues = [
  "none",
  "solid",
  "topFade",
  "bottomFade",
  "leftFade",
  "rightFade",
  "radialFade",
] as const;

export const runtimeTemplateSemanticRoleValues = [
  "title",
  "subtitle",
  "itemNumber",
  "domain",
  "cta",
  "imageSlot",
  "backgroundImage",
  "decorative",
] as const;

export const runtimeTemplateTextSemanticRoleValues = [
  "title",
  "subtitle",
  "itemNumber",
  "domain",
  "cta",
  "decorative",
] as const;

export const runtimeTemplateImageSemanticRoleValues = [
  "imageSlot",
  "backgroundImage",
  "decorative",
] as const;

export const runtimeTemplateImageGridLayoutValues = [
  "split-2-vertical",
  "split-2-horizontal",
  "stack-3",
  "grid-4",
  "collage-5",
  "split-6",
  "grid-8",
  "grid-9",
] as const;

export const runtimeTemplatePresetTokenModeValues = [
  "preset-bound",
] as const;

export const runtimeTemplateImagePolicyModeValues = [
  "REQUIRE_EXACT",
  "ALLOW_FEWER_HIDE_UNUSED",
  "ALLOW_FEWER_DUPLICATE_LAST",
  "ALLOW_FEWER_FILL_PLACEHOLDER",
] as const;

export const runtimeTemplateElementTypeValues = [
  "imageFrame",
  "imageGrid",
  "shapeBlock",
  "overlay",
  "divider",
  "titleText",
  "subtitleText",
  "domainText",
  "numberText",
  "ctaText",
  "labelText",
] as const;

export type RuntimeTemplateFillToken = (typeof runtimeTemplateFillTokenValues)[number];
export type RuntimeTemplateTextToken = (typeof runtimeTemplateTextTokenValues)[number];
export type RuntimeTemplateBorderToken = (typeof runtimeTemplateBorderTokenValues)[number];
export type RuntimeTemplateShadowToken = (typeof runtimeTemplateShadowTokenValues)[number];
export type RuntimeTemplateFontToken = (typeof runtimeTemplateFontTokenValues)[number];
export type RuntimeTemplateShapeKind = (typeof runtimeTemplateShapeKindValues)[number];
export type RuntimeTemplateTextAlign = (typeof runtimeTemplateTextAlignValues)[number];
export type RuntimeTemplateTextTransform = (typeof runtimeTemplateTextTransformValues)[number];
export type RuntimeTemplateImageFitMode = (typeof runtimeTemplateImageFitModeValues)[number];
export type RuntimeTemplateOverlayGradient = (typeof runtimeTemplateOverlayGradientValues)[number];
export type RuntimeTemplateSemanticRole = (typeof runtimeTemplateSemanticRoleValues)[number];
export type RuntimeTemplateTextSemanticRole = (typeof runtimeTemplateTextSemanticRoleValues)[number];
export type RuntimeTemplateImageSemanticRole = (typeof runtimeTemplateImageSemanticRoleValues)[number];
export type RuntimeTemplateImageGridLayout = (typeof runtimeTemplateImageGridLayoutValues)[number];
export type RuntimeTemplatePresetTokenMode = (typeof runtimeTemplatePresetTokenModeValues)[number];
export type RuntimeTemplateImagePolicyMode = (typeof runtimeTemplateImagePolicyModeValues)[number];
export type RuntimeTemplateElementType = (typeof runtimeTemplateElementTypeValues)[number];

export type RuntimeTemplateSummary = {
  imageSlotCount: number;
  minSlotsRequired: number;
  imagePolicyMode: RuntimeTemplateImagePolicyMode;
  supportsSubtitle: boolean;
  supportsItemNumber: boolean;
  supportsDomain: boolean;
  supportedBindings: RuntimeTemplateSemanticRole[];
  elementCount: number;
  elementTypes: RuntimeTemplateElementType[];
  allowedPresetIds: string[];
  allowedPresetCategories: string[];
  category: string | null;
  templateCategories: string[];
  headlineStyle: string | null;
  preferredWordCount: number | null;
  preferredMaxChars: number | null;
  preferredMaxLines: number | null;
  numberPlacement: string | null;
  toneTags: string[];
};

export type RuntimeTemplateValidationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
  path?: string;
  bucket?: RuntimeTemplateValidationBucket;
  blocking?: boolean;
};

export type RuntimeTemplateValidationBucket =
  | "structural"
  | "layout"
  | "preset"
  | "stress";

export type RuntimeTemplateContrastCheck = {
  presetId: string;
  role: "title" | "subtitle" | "domain" | "itemNumber" | "cta";
  elementId: string;
  foreground: string;
  background: string | null;
  backgroundSource: "canvas" | "shape" | "overlay" | "image" | "unknown";
  ratio: number | null;
  minimumRatio: number;
  passed: boolean;
};

export type RuntimeTemplateStressCaseResult = {
  id: string;
  label: string;
  passed: boolean;
  blocking: boolean;
  payloadSummary: {
    title: string;
    subtitle: string | null;
    itemNumber: number | null;
    domain: string;
    imageCount: number;
    visualPreset: string | null;
  };
  errors: RuntimeTemplateValidationIssue[];
  warnings: RuntimeTemplateValidationIssue[];
};

export type RuntimeTemplateValidationBucketResult = {
  errors: RuntimeTemplateValidationIssue[];
  warnings: RuntimeTemplateValidationIssue[];
};

export type RuntimeTemplateValidationResult<TDocument = unknown> = {
  ok: boolean;
  document: TDocument | null;
  errors: RuntimeTemplateValidationIssue[];
  warnings: RuntimeTemplateValidationIssue[];
  structural: RuntimeTemplateValidationBucketResult;
  layout: RuntimeTemplateValidationBucketResult;
  preset: RuntimeTemplateValidationBucketResult & {
    contrastChecks: RuntimeTemplateContrastCheck[];
    presetIdsChecked: string[];
  };
  stress: RuntimeTemplateValidationBucketResult & {
    cases: RuntimeTemplateStressCaseResult[];
  };
  generatedAt: string;
  blockingErrorCount: number;
  mode: "schema" | "full";
};
