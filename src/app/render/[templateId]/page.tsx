import { notFound } from "next/navigation";
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
  }>;
};

export default async function RenderTemplatePage({
  params,
  searchParams,
}: RenderPageProps) {
  const { templateId } = await params;
  const { jobId, planId, versionId, preset, stressCase } = await searchParams;
  const config = getTemplateConfig(templateId);

  if (config) {
    const payload = await getRenderPayload(
      templateId,
      jobId,
      planId,
    );

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#d9d1c7] p-8">
        {renderTemplate(templateId, payload)}
      </main>
    );
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
      : await getRenderPayload(templateId, jobId, planId);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#d9d1c7] p-8">
      {renderRuntimeTemplate(document, payload)}
    </main>
  );
}
