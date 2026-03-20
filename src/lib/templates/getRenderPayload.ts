import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parsePlanRenderContext } from "@/lib/templates/planRenderContext";
import { getSampleTemplateProps } from "@/lib/templates/registry";
import { templateVisualPresets, type TemplateRenderProps } from "@/lib/templates/types";

export async function getRenderPayload(
  templateId: string,
  jobId?: string,
  planId?: string,
): Promise<TemplateRenderProps> {
  if (!jobId || !isDatabaseConfigured()) {
    return getSampleTemplateProps(templateId);
  }

  try {
    const [job, selectedPlan] = await Promise.all([
      prisma.generationJob.findUnique({
        where: { id: jobId },
      }),
      planId
        ? prisma.generationPlan.findUnique({
            where: { id: planId },
            include: {
              imageAssignments: {
                orderBy: { slotIndex: "asc" },
                include: {
                  sourceImage: true,
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    if (!job) {
      return getSampleTemplateProps(templateId);
    }

    const imageUrls = selectedPlan
      ? selectedPlan.imageAssignments
          .map((assignment) => assignment.sourceImage.url)
          .filter((value) => value.trim() !== "")
      : [];
    const renderContext = parsePlanRenderContext(selectedPlan?.notes);

    return {
      title: renderContext.title?.trim() || job.articleTitleSnapshot,
      subtitle: renderContext.subtitle?.trim() || undefined,
      titleLocked: renderContext.titleLocked ?? false,
      subtitleLocked: renderContext.subtitleLocked ?? false,
      itemNumber:
        typeof renderContext.itemNumber === "number"
          ? renderContext.itemNumber
          : job.listCountHint ?? undefined,
      domain: job.domainSnapshot,
      visualPreset: toVisualPreset(
        renderContext.visualPreset ?? renderContext.colorPreset,
        templateId,
      ),
      images: imageUrls.length > 0 ? imageUrls : getSampleTemplateProps(templateId).images,
    };
  } catch {
    return getSampleTemplateProps(templateId);
  }
}

function toVisualPreset(value: unknown, templateId: string) {
  if (
    typeof value === "string" &&
    templateVisualPresets.includes(value as (typeof templateVisualPresets)[number])
  ) {
    return value as (typeof templateVisualPresets)[number];
  }

  return getSampleTemplateProps(templateId).visualPreset;
}
