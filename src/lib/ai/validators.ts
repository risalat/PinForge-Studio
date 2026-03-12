import { z } from "zod";

const HASHTAG_PATTERN = /(^|\s)#\w+/;

export const EditablePinTitleSchema = z
  .string()
  .trim()
  .max(100, "Title must be 100 characters or less.")
  .refine((value) => !HASHTAG_PATTERN.test(value), "Hashtags are not allowed in titles.");

export const EditablePinDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or less.")
  .refine(
    (value) => !HASHTAG_PATTERN.test(value),
    "Hashtags are not allowed in descriptions.",
  );

export const EditablePinSubtitleSchema = z
  .string()
  .trim()
  .max(40, "Subtitle must be 40 characters or less.")
  .refine((value) => wordCount(value) <= 5, "Subtitle must be 5 words or less.")
  .refine((value) => !HASHTAG_PATTERN.test(value), "Hashtags are not allowed in subtitles.");

export const PinTitleOptionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(100, "Title must be 100 characters or less."),
});

export const RenderCopyOptionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(100, "Title must be 100 characters or less."),
  subtitle: EditablePinSubtitleSchema.optional(),
});

export const PinCopySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(100, "Title must be 100 characters or less."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(500, "Description must be 500 characters or less."),
  alt_text: z.string().trim().max(200).optional(),
  keywords_used: z.array(z.string().trim().min(1)).max(10).optional(),
});

export const PinCopyBatchSchema = z
  .array(PinCopySchema)
  .min(1, "At least one pin copy item is required.")
  .superRefine((items, context) => {
    items.forEach((item, index) => {
      if (HASHTAG_PATTERN.test(item.title) || HASHTAG_PATTERN.test(item.description)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: "Hashtags are not allowed in titles or descriptions.",
        });
      }
    });
  });

export const PinTitleBatchSchema = z
  .array(PinTitleOptionSchema)
  .min(1, "At least one pin title is required.")
  .superRefine((items, context) => {
    items.forEach((item, index) => {
      if (HASHTAG_PATTERN.test(item.title)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: "Hashtags are not allowed in titles.",
        });
      }
    });
  });

export const RenderCopyBatchSchema = z
  .array(RenderCopyOptionSchema)
  .min(1, "At least one render copy item is required.")
  .superRefine((items, context) => {
    items.forEach((item, index) => {
      if (HASHTAG_PATTERN.test(item.title) || (item.subtitle && HASHTAG_PATTERN.test(item.subtitle))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: "Hashtags are not allowed in title or subtitle fields.",
        });
      }
    });
  });

export type PinTitleOption = z.infer<typeof PinTitleOptionSchema>;
export type RenderCopyOption = z.infer<typeof RenderCopyOptionSchema>;
export type PinCopy = z.infer<typeof PinCopySchema>;

export function validatePinTitleBatch(value: unknown): PinTitleOption[] {
  return PinTitleBatchSchema.parse(value);
}

export function validatePinCopyBatch(value: unknown): PinCopy[] {
  return PinCopyBatchSchema.parse(value);
}

export function validateRenderCopyBatch(value: unknown): RenderCopyOption[] {
  return RenderCopyBatchSchema.parse(value);
}

function wordCount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).filter(Boolean).length;
}
