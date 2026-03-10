import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSampleTemplateProps } from "@/lib/templates/registry";
import { templateColorPresets, type TemplateRenderProps } from "@/lib/templates/types";

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

    return {
      title: job.articleTitleSnapshot,
      subtitle: undefined,
      domain: job.domainSnapshot,
      colorPreset: toColorPreset(undefined, templateId),
      images: imageUrls.length > 0 ? imageUrls : getSampleTemplateProps(templateId).images,
    };
  } catch {
    return getSampleTemplateProps(templateId);
  }
}

function toColorPreset(value: unknown, templateId: string) {
  if (
    typeof value === "string" &&
    templateColorPresets.includes(value as (typeof templateColorPresets)[number])
  ) {
    return value as (typeof templateColorPresets)[number];
  }

  return getSampleTemplateProps(templateId).colorPreset;
}
