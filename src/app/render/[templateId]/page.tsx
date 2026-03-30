import { notFound } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getRuntimeTemplateForRender } from "@/lib/runtime-templates/db";
import { renderRuntimeTemplate } from "@/lib/runtime-templates/renderRuntimeTemplate";
import { getRenderPayload } from "@/lib/templates/getRenderPayload";
import { getTemplateConfig, renderTemplate } from "@/lib/templates/registry";

type RenderPageProps = {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    jobId?: string;
    planId?: string;
    versionId?: string;
  }>;
};

export default async function RenderTemplatePage({
  params,
  searchParams,
}: RenderPageProps) {
  const { templateId } = await params;
  const { jobId, planId, versionId } = await searchParams;
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

  const payload = await getRenderPayload(templateId, jobId, planId);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#d9d1c7] p-8">
      {renderRuntimeTemplate(runtimeTemplate.version.schemaJson, payload)}
    </main>
  );
}
