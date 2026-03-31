import { z } from "zod";
import { isSupportedRuntimeColor, normalizeRuntimeColorInput } from "@/lib/runtime-templates/colors";
import { getRuntimeTemplateGridSlotCount } from "@/lib/runtime-templates/imageGridPresets";
import {
  RUNTIME_TEMPLATE_KIND,
  RUNTIME_TEMPLATE_SCHEMA_VERSION,
  runtimeTemplateBorderTokenValues,
  runtimeTemplateFillTokenValues,
  runtimeTemplateFontTokenValues,
  runtimeTemplateImageFitModeValues,
  runtimeTemplateImageGridLayoutValues,
  runtimeTemplateImagePolicyModeValues,
  runtimeTemplateImageSemanticRoleValues,
  runtimeTemplateOverlayGradientValues,
  runtimeTemplatePresetTokenModeValues,
  runtimeTemplateShadowTokenValues,
  runtimeTemplateShapeKindValues,
  runtimeTemplateTextAlignValues,
  runtimeTemplateTextSemanticRoleValues,
  runtimeTemplateTextTokenValues,
  runtimeTemplateTextTransformValues,
} from "@/lib/runtime-templates/types";

const finiteNumber = z.number().finite();
const runtimeColorSchema = z
  .string()
  .trim()
  .refine((value) => isSupportedRuntimeColor(value), {
    message: "Color must be a valid hex, rgb(), or hsl() value.",
  })
  .transform((value) => normalizeRuntimeColorInput(value) ?? value);

const runtimeTemplatePresetElementOverrideFieldValues = [
  "fillToken",
  "borderToken",
  "overlayFillToken",
  "textToken",
  "customFill",
  "customBorderColor",
  "overlayCustomFill",
  "customTextColor",
] as const;

const runtimeTemplatePresetBackgroundOverrideFieldValues = [
  "fillToken",
  "customFill",
] as const;

const layoutRectSchema = z.object({
  x: finiteNumber,
  y: finiteNumber,
  width: finiteNumber.positive(),
  height: finiteNumber.positive(),
  rotation: finiteNumber.min(-20).max(20).default(0),
  zIndex: z.number().int().min(0),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  opacity: finiteNumber.min(0).max(1).default(1),
});

const elementBaseSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1),
  ...layoutRectSchema.shape,
});

const overlayStyleSchema = z.object({
  fillToken: z.enum(runtimeTemplateFillTokenValues).optional(),
  customFill: runtimeColorSchema.optional(),
  gradient: z.enum(runtimeTemplateOverlayGradientValues).default("none"),
  opacity: finiteNumber.min(0).max(1).default(0.18),
});

const textStyleSchema = z
  .object({
    textToken: z.enum(runtimeTemplateTextTokenValues),
    fontToken: z.enum(runtimeTemplateFontTokenValues),
    textAlign: z.enum(runtimeTemplateTextAlignValues).default("center"),
    textTransform: z.enum(runtimeTemplateTextTransformValues).default("none"),
    minFontSize: z.number().int().positive(),
    maxFontSize: z.number().int().positive(),
    maxLines: z.number().int().positive().max(6),
    lineHeight: finiteNumber.min(0.6).max(2.2),
    letterSpacing: finiteNumber.min(-0.3).max(0.6).default(0),
    autoFit: z.boolean().default(true),
    customTextColor: runtimeColorSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.maxFontSize < value.minFontSize) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "maxFontSize must be greater than or equal to minFontSize.",
        path: ["maxFontSize"],
      });
    }
  });

const imageFrameElementSchema = elementBaseSchema.extend({
  type: z.literal("imageFrame"),
  semanticRole: z.enum(runtimeTemplateImageSemanticRoleValues).default("imageSlot"),
  slotIndex: z.number().int().min(0).max(24),
  shapeKind: z.enum(runtimeTemplateShapeKindValues).default("roundedRect"),
  fitMode: z.enum(runtimeTemplateImageFitModeValues).default("cover"),
  styleTokens: z.object({
    fillToken: z.enum(runtimeTemplateFillTokenValues).optional(),
    borderToken: z.enum(runtimeTemplateBorderTokenValues).optional(),
    customFill: runtimeColorSchema.optional(),
    customBorderColor: runtimeColorSchema.optional(),
    shadowToken: z.enum(runtimeTemplateShadowTokenValues).default("shadow.none"),
    borderRadius: z.number().int().min(0).max(999).default(0),
    overlayFillToken: z.enum(runtimeTemplateFillTokenValues).optional(),
    overlayCustomFill: runtimeColorSchema.optional(),
    overlayGradient: z.enum(runtimeTemplateOverlayGradientValues).default("none"),
    overlayOpacity: finiteNumber.min(0).max(1).default(0.18),
  }),
});

const imageGridElementSchema = elementBaseSchema.extend({
  type: z.literal("imageGrid"),
  semanticRole: z.enum(runtimeTemplateImageSemanticRoleValues).default("imageSlot"),
  slotStartIndex: z.number().int().min(0).max(24).default(0),
  layoutPreset: z.enum(runtimeTemplateImageGridLayoutValues).default("grid-4"),
  gap: z.number().int().min(0).max(120).default(12),
  fitMode: z.enum(runtimeTemplateImageFitModeValues).default("cover"),
  styleTokens: z.object({
    fillToken: z.enum(runtimeTemplateFillTokenValues).optional(),
    borderToken: z.enum(runtimeTemplateBorderTokenValues).optional(),
    customFill: runtimeColorSchema.optional(),
    customBorderColor: runtimeColorSchema.optional(),
    shadowToken: z.enum(runtimeTemplateShadowTokenValues).default("shadow.none"),
    borderRadius: z.number().int().min(0).max(999).default(16),
    overlayFillToken: z.enum(runtimeTemplateFillTokenValues).optional(),
    overlayCustomFill: runtimeColorSchema.optional(),
    overlayGradient: z.enum(runtimeTemplateOverlayGradientValues).default("none"),
    overlayOpacity: finiteNumber.min(0).max(1).default(0),
  }),
});

const shapeBlockElementSchema = elementBaseSchema.extend({
  type: z.literal("shapeBlock"),
  semanticRole: z.literal("decorative").default("decorative"),
  shapeKind: z.enum(runtimeTemplateShapeKindValues).default("roundedRect"),
  styleTokens: z.object({
    fillToken: z.enum(runtimeTemplateFillTokenValues),
    borderToken: z.enum(runtimeTemplateBorderTokenValues).optional(),
    customFill: runtimeColorSchema.optional(),
    customBorderColor: runtimeColorSchema.optional(),
    shadowToken: z.enum(runtimeTemplateShadowTokenValues).default("shadow.none"),
    borderRadius: z.number().int().min(0).max(999).default(0),
  }),
});

const overlayElementSchema = elementBaseSchema.extend({
  type: z.literal("overlay"),
  semanticRole: z.literal("decorative").default("decorative"),
  styleTokens: overlayStyleSchema,
});

const dividerElementSchema = elementBaseSchema.extend({
  type: z.literal("divider"),
  semanticRole: z.literal("decorative").default("decorative"),
  styleTokens: z.object({
    borderToken: z.enum(runtimeTemplateBorderTokenValues),
    customBorderColor: runtimeColorSchema.optional(),
  }),
  strokeWidth: finiteNumber.positive().max(20),
});

const titleTextElementSchema = elementBaseSchema.extend({
  type: z.literal("titleText"),
  semanticRole: z.enum(runtimeTemplateTextSemanticRoleValues).default("title"),
  hideWhenEmpty: z.boolean().default(false),
  text: z.string().trim().optional().default(""),
  styleTokens: textStyleSchema,
});

const subtitleTextElementSchema = elementBaseSchema.extend({
  type: z.literal("subtitleText"),
  semanticRole: z.enum(runtimeTemplateTextSemanticRoleValues).default("subtitle"),
  hideWhenEmpty: z.boolean().default(true),
  text: z.string().trim().optional().default(""),
  styleTokens: textStyleSchema,
});

const domainTextElementSchema = elementBaseSchema.extend({
  type: z.literal("domainText"),
  semanticRole: z.enum(runtimeTemplateTextSemanticRoleValues).default("domain"),
  hideWhenEmpty: z.boolean().default(false),
  sanitizeDomain: z.boolean().default(true),
  text: z.string().trim().optional().default(""),
  styleTokens: textStyleSchema,
});

const numberTextElementSchema = elementBaseSchema.extend({
  type: z.literal("numberText"),
  semanticRole: z.enum(runtimeTemplateTextSemanticRoleValues).default("itemNumber"),
  hideWhenEmpty: z.boolean().default(true),
  text: z.string().trim().optional().default(""),
  styleTokens: textStyleSchema,
});

const ctaTextElementSchema = elementBaseSchema.extend({
  type: z.literal("ctaText"),
  semanticRole: z.enum(runtimeTemplateTextSemanticRoleValues).default("cta"),
  text: z.string().trim().min(1).default("Read more"),
  hideWhenEmpty: z.boolean().default(false),
  styleTokens: textStyleSchema,
});

const labelTextElementSchema = elementBaseSchema.extend({
  type: z.literal("labelText"),
  semanticRole: z.enum(runtimeTemplateTextSemanticRoleValues).default("decorative"),
  text: z.string().trim().min(1).default("Label"),
  hideWhenEmpty: z.boolean().default(false),
  styleTokens: textStyleSchema,
});

const runtimeTemplatePresetElementOverrideSchema = z.object({
  fillToken: z.enum(runtimeTemplateFillTokenValues).optional(),
  borderToken: z.enum(runtimeTemplateBorderTokenValues).optional(),
  overlayFillToken: z.enum(runtimeTemplateFillTokenValues).optional(),
  textToken: z.enum(runtimeTemplateTextTokenValues).optional(),
  customFill: runtimeColorSchema.optional(),
  customBorderColor: runtimeColorSchema.optional(),
  overlayCustomFill: runtimeColorSchema.optional(),
  customTextColor: runtimeColorSchema.optional(),
  lockedFields: z.array(z.enum(runtimeTemplatePresetElementOverrideFieldValues)).default([]),
});

const runtimeTemplatePresetBackgroundOverrideSchema = z.object({
  fillToken: z.enum(runtimeTemplateFillTokenValues).optional(),
  customFill: runtimeColorSchema.optional(),
  lockedFields: z.array(z.enum(runtimeTemplatePresetBackgroundOverrideFieldValues)).default([]),
});

const runtimeTemplatePresetOverrideSchema = z.object({
  background: runtimeTemplatePresetBackgroundOverrideSchema.optional(),
  elements: z.record(z.string().trim().min(1), runtimeTemplatePresetElementOverrideSchema).default({}),
});

export const runtimeTemplateElementSchema = z.discriminatedUnion("type", [
  imageFrameElementSchema,
  imageGridElementSchema,
  shapeBlockElementSchema,
  overlayElementSchema,
  dividerElementSchema,
  titleTextElementSchema,
  subtitleTextElementSchema,
  domainTextElementSchema,
  numberTextElementSchema,
  ctaTextElementSchema,
  labelTextElementSchema,
]);

const runtimeTemplateDocumentObjectSchema = z.object({
    schemaVersion: z.literal(RUNTIME_TEMPLATE_SCHEMA_VERSION),
    templateKind: z.literal(RUNTIME_TEMPLATE_KIND),
    canvas: z.object({
      width: z.literal(1080),
      height: z.literal(1920),
      safeInset: z.number().int().min(0).max(200).default(36),
    }),
    metadata: z.object({
      name: z.string().trim().min(1),
      description: z.string().trim().max(500).optional().default(""),
      category: z.string().trim().max(100).optional().default("custom"),
      tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    }),
    capabilities: z.object({
      supportsSubtitle: z.boolean().default(false),
      supportsItemNumber: z.boolean().default(false),
      supportsDomain: z.boolean().default(true),
      imageSlotCount: z.number().int().min(1).max(24),
    }),
    presetPolicy: z.object({
      allowVisualPresetOverride: z.boolean().default(true),
      allowedPresetIds: z.array(z.string().trim().min(1)).default([]),
      allowedPresetCategories: z.array(z.string().trim().min(1)).default([]),
      tokenMode: z.enum(runtimeTemplatePresetTokenModeValues).default("preset-bound"),
    }),
    background: z.object({
      fillToken: z.enum(runtimeTemplateFillTokenValues).default("surface.canvas"),
      customFill: runtimeColorSchema.optional(),
    }),
    presetOverrides: z
      .record(z.string().trim().min(1), runtimeTemplatePresetOverrideSchema)
      .default({}),
    elements: z.array(runtimeTemplateElementSchema).min(1),
    validationRules: z.object({
      imagePolicy: z.object({
        minSlotsRequired: z.number().int().min(1).max(24),
        mode: z.enum(runtimeTemplateImagePolicyModeValues).default("REQUIRE_EXACT"),
      }),
    }),
  });

export const runtimeTemplateDocumentDraftSchema = runtimeTemplateDocumentObjectSchema;

export const runtimeTemplateDocumentSchema = runtimeTemplateDocumentObjectSchema
  .superRefine((value, context) => {
    const elementIds = new Set<string>();
    let maxBoundImageSlot = -1;

    value.elements.forEach((element, index) => {
      if (elementIds.has(element.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate element id '${element.id}'.`,
          path: ["elements", index, "id"],
        });
      }
      elementIds.add(element.id);

      if (element.x + element.width > value.canvas.width || element.y + element.height > value.canvas.height) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Element exceeds the fixed 1080x1920 canvas bounds.",
          path: ["elements", index],
        });
      }

      if (element.type === "imageFrame") {
        maxBoundImageSlot = Math.max(maxBoundImageSlot, element.slotIndex);
      }

      if (element.type === "imageGrid") {
        const slotCount = getRuntimeTemplateGridSlotCount(element.layoutPreset);
        maxBoundImageSlot = Math.max(maxBoundImageSlot, element.slotStartIndex + slotCount - 1);
      }
    });

    if (value.capabilities.imageSlotCount < value.validationRules.imagePolicy.minSlotsRequired) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "imageSlotCount must be greater than or equal to minSlotsRequired.",
        path: ["capabilities", "imageSlotCount"],
      });
    }

    if (maxBoundImageSlot >= value.capabilities.imageSlotCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An image binding exceeds the declared imageSlotCount.",
        path: ["capabilities", "imageSlotCount"],
      });
    }

    if (value.validationRules.imagePolicy.minSlotsRequired - 1 > maxBoundImageSlot) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The declared image slot requirement exceeds the bound image elements.",
        path: ["validationRules", "imagePolicy", "minSlotsRequired"],
      });
    }
  });

export const runtimeTemplateEditorStateSchema = z.object({
  selectedElementId: z.string().trim().min(1).nullable().default(null),
  zoom: z.number().positive().max(4).default(1),
  visualPreset: z.string().trim().min(1).nullable().default(null),
  showSafeArea: z.boolean().default(true),
  showGuides: z.boolean().default(true),
  collapsedPanels: z.array(z.string().trim().min(1)).default([]),
});

export type RuntimeTemplateDocumentInput = z.input<typeof runtimeTemplateDocumentSchema>;
export type RuntimeTemplateDocument = z.output<typeof runtimeTemplateDocumentSchema>;
export type RuntimeTemplateEditorState = z.output<typeof runtimeTemplateEditorStateSchema>;
export type RuntimeTemplateElement = z.output<typeof runtimeTemplateElementSchema>;
