import { z } from "zod";
import { runtimeTemplateElementSchema } from "@/lib/runtime-templates/schema.zod";
import type { RuntimeTemplateElement } from "@/lib/runtime-templates/schema";

export const templateBlockContentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  bounds: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  elements: z.array(runtimeTemplateElementSchema).min(1),
});

export type TemplateBlockContent = z.output<typeof templateBlockContentSchema>;

export type TemplateBlockSummary = {
  elementCount: number;
  imageSlotCount: number;
  elementTypes: RuntimeTemplateElement["type"][];
  textRoles: string[];
};
