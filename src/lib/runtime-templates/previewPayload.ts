import { getRuntimeTemplateStressCaseDefinitions } from "@/lib/runtime-templates/stressTest";
import type { RuntimeTemplateDocument } from "@/lib/runtime-templates/schema";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import type { TemplateRenderProps, TemplateVisualPresetId } from "@/lib/templates/types";

type PreviewContentState = {
  title?: string;
  subtitle?: string;
  itemNumber?: number;
  domain?: string;
  ctaText?: string;
};

export function buildRuntimeTemplatePreviewPayload(input: {
  document: RuntimeTemplateDocument;
  editorStateJson?: unknown;
  presetId: TemplateVisualPresetId;
  stressCaseId?: string | null;
}): {
  payload: TemplateRenderProps;
  stressCaseLabel: string | null;
} {
  const stressCaseId = input.stressCaseId?.trim() || null;
  const previewContent = extractPreviewContent(input.editorStateJson);

  if (stressCaseId) {
    const stressCase =
      getRuntimeTemplateStressCaseDefinitions().find((entry) => entry.id === stressCaseId) ?? null;

    if (stressCase) {
      return {
        payload: {
          ...stressCase.payload,
          visualPreset: input.presetId,
        } satisfies TemplateRenderProps,
        stressCaseLabel: stressCase.label,
      };
    }
  }

  return {
    payload: getSampleRuntimeTemplateRenderProps({
      visualPreset: input.presetId,
      title: previewContent?.title,
      subtitle: previewContent?.subtitle,
      itemNumber: previewContent?.itemNumber,
      domain: previewContent?.domain,
      ctaText: previewContent?.ctaText,
    }),
    stressCaseLabel: null,
  };
}

function extractPreviewContent(editorStateJson: unknown): PreviewContentState | null {
  if (!editorStateJson || typeof editorStateJson !== "object") {
    return null;
  }

  const previewContent = (editorStateJson as { previewContent?: PreviewContentState }).previewContent;
  if (!previewContent || typeof previewContent !== "object") {
    return null;
  }

  return previewContent;
}
