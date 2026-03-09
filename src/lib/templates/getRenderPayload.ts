import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSampleTemplateProps } from "@/lib/templates/registry";
import { templateColorPresets, type TemplateRenderProps } from "@/lib/templates/types";

export async function getRenderPayload(
  templateId: string,
  jobId?: string,
  copyIndex = 0,
): Promise<TemplateRenderProps> {
  if (!jobId || !isDatabaseConfigured()) {
    return getSampleTemplateProps(templateId);
  }

  try {
    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
      include: {
        post: true,
      },
    });

    if (!job) {
      return getSampleTemplateProps(templateId);
    }

    const sourceImages = Array.isArray(job.sourceImages) ? job.sourceImages : [];
    const generatedCopy = Array.isArray(job.generatedCopy) ? job.generatedCopy : [];
    const selectedCopy =
      generatedCopy[copyIndex] && typeof generatedCopy[copyIndex] === "object"
        ? (generatedCopy[copyIndex] as Record<string, unknown>)
        : null;

    return {
      title:
        typeof selectedCopy?.title === "string" && selectedCopy.title.trim() !== ""
          ? selectedCopy.title
          : job.post.title,
      subtitle:
        typeof selectedCopy?.subtitle === "string" && selectedCopy.subtitle.trim() !== ""
          ? selectedCopy.subtitle
          : undefined,
      domain: job.post.domain,
      colorPreset: toColorPreset(selectedCopy?.colorPreset, templateId),
      images: toImageUrls(sourceImages, templateId),
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

function toImageUrls(sourceImages: unknown[], templateId: string) {
  const imageUrls = sourceImages
    .map((image) => {
      if (typeof image === "string") {
        return image;
      }
      if (typeof image === "object" && image !== null) {
        const candidate = (image as Record<string, unknown>).url;
        if (typeof candidate === "string" && candidate.trim() !== "") {
          return candidate;
        }
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));

  return imageUrls.length > 0 ? imageUrls : getSampleTemplateProps(templateId).images;
}
