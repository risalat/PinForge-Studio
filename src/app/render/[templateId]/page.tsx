import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ResponsiveCanvasPreview } from "@/components/ResponsiveCanvasPreview";
import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getRuntimeTemplateForRender } from "@/lib/runtime-templates/db";
import { buildRuntimeTemplatePreviewPayload } from "@/lib/runtime-templates/previewPayload";
import { renderRuntimeTemplate } from "@/lib/runtime-templates/renderRuntimeTemplate";
import { getRenderPayload } from "@/lib/templates/getRenderPayload";
import { getTemplateConfig, renderTemplate } from "@/lib/templates/registry";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import { runtimeTemplateDocumentSchema } from "@/lib/runtime-templates/schema";
import { templateVisualPresets, type TemplateVisualPresetId } from "@/lib/templates/types";

type RenderPageProps = {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    jobId?: string;
    planId?: string;
    versionId?: string;
    preset?: string;
    stressCase?: string;
    embed?: string;
  }>;
};

export default async function RenderTemplatePage({
  params,
  searchParams,
}: RenderPageProps) {
  const { templateId } = await params;
  const { jobId, planId, versionId, preset, stressCase, embed } = await searchParams;
  const config = getTemplateConfig(templateId);
  const embedMode = embed === "1";

  const renderInShell = (content: ReactNode) => {
    if (!embedMode) {
      return <main className="flex min-h-screen items-center justify-center bg-[#d9d1c7] p-8">{content}</main>;
    }

    return (
      <main className="flex h-screen items-center justify-center overflow-hidden bg-[#d9d1c7] p-3">
        <div
          className="h-full overflow-hidden"
          style={{
            width: "min(calc((100vh - 24px) * 0.5625), calc(100vw - 24px))",
          }}
        >
          <ResponsiveCanvasPreview
            canvasWidth={1080}
            canvasHeight={1920}
            maxViewportHeightRatio={0.9875}
            className="h-full w-full"
          >
            {content}
          </ResponsiveCanvasPreview>
        </div>
      </main>
    );
  };

  if (config) {
    const payload = await getRenderPayload(
      templateId,
      jobId,
      planId,
      {
        presetOverride: preset ?? null,
      },
    );
    const rendered = renderTemplate(templateId, payload);

    return renderInShell(rendered);
  }

  if (!isDatabaseConfigured()) {
    notFound();
  }

  const resolvedVersionId =
    versionId ??
    (planId
      ? (
          await prisma.generationPlan.findUnique({
            where: { id: planId },
            select: { templateVersionId: true },
          })
        )?.templateVersionId ??
        null
      : null);

  const runtimeTemplate = await getRuntimeTemplateForRender({
    templateId,
    versionId: resolvedVersionId,
  });
  if (!runtimeTemplate?.version) {
    notFound();
  }

  const activePreset: TemplateVisualPresetId = templateVisualPresets.includes(
    preset as TemplateVisualPresetId,
  )
    ? (preset as TemplateVisualPresetId)
    : (getSampleRuntimeTemplateRenderProps().visualPreset ?? "teal-flare");
  const document = runtimeTemplateDocumentSchema.parse(runtimeTemplate.version.schemaJson);
  const payload =
    !jobId && !planId
      ? buildRuntimeTemplatePreviewPayload({
          document,
          editorStateJson: runtimeTemplate.version.editorStateJson,
          presetId: activePreset,
          stressCaseId: stressCase ?? null,
        }).payload
      : await getRenderPayload(templateId, jobId, planId, {
          presetOverride: preset ?? null,
        });

  return renderInShell(renderRuntimeTemplate(document, payload));
}
