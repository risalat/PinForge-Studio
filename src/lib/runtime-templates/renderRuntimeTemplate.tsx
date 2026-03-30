import { RuntimeTemplateCanvas } from "@/components/runtime-template/RuntimeTemplateCanvas";
import { validateRuntimeTemplateDocument } from "@/lib/runtime-templates/validate";
import type { RuntimeTemplateDocument } from "@/lib/runtime-templates/schema";
import type { TemplateRenderProps } from "@/lib/templates/types";

export function renderRuntimeTemplate(
  documentInput: RuntimeTemplateDocument | unknown,
  payload: TemplateRenderProps,
) {
  const validation = validateRuntimeTemplateDocument(documentInput);

  if (!validation.ok || !validation.document) {
    throw new Error("Invalid runtime template document.");
  }

  return <RuntimeTemplateCanvas document={validation.document} payload={payload} />;
}
