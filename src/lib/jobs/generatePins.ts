import { GenerationJobStatus, Prisma } from "@prisma/client";
import {
  generatePinDescription,
  generatePinTitle,
  type GeneratePinDescriptionRequest,
  type GeneratePinTitleRequest,
  type ImageContextInput,
  type PinCopy,
  type PinTitleOption,
} from "@/lib/ai";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  createPublerClient,
  extractPostIdsFromJobRaw,
  extractScheduleOutcomesFromJobRaw,
  isFailureStatus,
  uploadMediaWithQueueHandling,
  waitForPublerJobCompletion,
} from "@/lib/publer/publerClient";
import { renderPin } from "@/lib/renderer/renderPin";
import { getIntegrationSettings } from "@/lib/settings/integrationSettings";
import { TEMPLATE_CONFIGS } from "@/lib/templates/registry";
import type { GenerateImageInput, GenerateRequestPayload } from "@/lib/types";
import { resolveDomain } from "@/lib/types";

export type GeneratePinsInput = GenerateRequestPayload;

const DEFAULT_TEMPLATE_IDS = ["split-vertical-title-no-subtitle"];

export async function generatePins(input: GeneratePinsInput) {
  const domain = resolveDomain(input);

  const post = await prisma.post.upsert({
    where: { url: input.postUrl },
    update: {
      title: input.title,
      domain,
    },
    create: {
      url: input.postUrl,
      title: input.title,
      domain,
    },
  });

  const job = await prisma.generationJob.create({
    data: {
      postId: post.id,
      status: GenerationJobStatus.PENDING,
      requestedTemplates: DEFAULT_TEMPLATE_IDS,
      sourceImages: input.images as unknown as Prisma.InputJsonValue,
    },
  });

  try {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: GenerationJobStatus.PROCESSING },
    });

    const integrationSettings = await getIntegrationSettings();
    const titlePayload = buildAITitleRequest(input);
    const titleDrafts = await generatePinTitle(titlePayload, {
      provider: integrationSettings.aiProvider,
      apiKey: integrationSettings.aiApiKey,
      model: integrationSettings.aiModel,
      customEndpoint: integrationSettings.aiCustomEndpoint,
    });
    const descriptionDrafts = await generatePinDescription(
      buildAIDescriptionRequest(input, titleDrafts),
      {
        provider: integrationSettings.aiProvider,
        apiKey: integrationSettings.aiApiKey,
        model: integrationSettings.aiModel,
        customEndpoint: integrationSettings.aiCustomEndpoint,
      },
    );
    const generatedCopy = mergePinCopies(titleDrafts, descriptionDrafts);

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        generatedCopy: generatedCopy as unknown as Prisma.InputJsonValue,
      },
    });

    const canAutoScheduleToPubler =
      integrationSettings.publerApiKey.trim() !== "" &&
      integrationSettings.publerWorkspaceId.trim() !== "" &&
      integrationSettings.publerAccountId.trim() !== "" &&
      integrationSettings.publerBoardId.trim() !== "";
    const publerClient = canAutoScheduleToPubler
      ? createPublerClient({
          apiKey: integrationSettings.publerApiKey,
          workspaceId: integrationSettings.publerWorkspaceId,
        })
      : null;
    const generatedPins = [];

    for (const templateId of DEFAULT_TEMPLATE_IDS) {
      const config = TEMPLATE_CONFIGS[templateId];

      await prisma.template.upsert({
        where: { id: templateId },
        update: {
          name: config.name,
          componentKey: config.componentKey,
          configJson: config,
          isActive: true,
        },
        create: {
          id: config.id,
          name: config.name,
          componentKey: config.componentKey,
          configJson: config,
          isActive: true,
        },
      });

      for (let copyIndex = 0; copyIndex < generatedCopy.length; copyIndex += 1) {
        const copy = generatedCopy[copyIndex];
        const exportObject = await renderPin({
          jobId: job.id,
          templateId,
          copyIndex,
        });
        let scheduledAt: string | undefined;
        let scheduledPostId: string | undefined;

        if (publerClient) {
          const mediaUrl = buildStorageAssetUrl(exportObject.key);
          const mediaJob = await uploadMediaWithQueueHandling({
            client: publerClient,
            imageUrl: mediaUrl,
            options: {
              inLibrary: true,
              directUpload: true,
              name: copy.title,
              caption: copy.description,
              source: input.postUrl,
            },
          });
          const mediaSnapshot = await waitForPublerJobCompletion({
            client: publerClient,
            jobId: mediaJob.jobId,
          });

          if (mediaSnapshot.state !== "completed" || !mediaSnapshot.mediaId) {
            throw new Error(
              mediaSnapshot.error ?? "Publer media upload finished without a media ID.",
            );
          }

          scheduledAt = new Date(Date.now() + (copyIndex + 1) * 24 * 60 * 60 * 1000).toISOString();
          const scheduleJob = await publerClient.schedulePost(
            buildPublerPinterestPost({
              postUrl: input.postUrl,
              copy,
              mediaId: mediaSnapshot.mediaId,
              scheduledAt,
              settings: integrationSettings,
            }),
          );
          const scheduleSnapshot = await waitForPublerJobCompletion({
            client: publerClient,
            jobId: scheduleJob.jobId,
          });

          if (scheduleSnapshot.state !== "completed") {
            throw new Error(scheduleSnapshot.error ?? "Publer schedule job failed.");
          }

          const outcome = extractScheduleOutcome(scheduleSnapshot.raw);
          if (outcome?.error || isFailureStatus(outcome?.status)) {
            throw new Error(outcome?.error ?? "Publer schedule outcome reported failure.");
          }

          scheduledPostId = outcome?.postId;
        }

        const pin = await prisma.generatedPin.create({
          data: {
            jobId: job.id,
            templateId,
            title: copy.title,
            description: copy.description,
            exportPath: exportObject.absolutePath ?? exportObject.key,
            publerPostId: scheduledPostId,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          },
        });

        generatedPins.push(pin);
      }
    }

    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: GenerationJobStatus.COMPLETED },
    });

    return {
      jobId: job.id,
      postId: post.id,
      pins: generatedPins,
    };
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: GenerationJobStatus.FAILED },
    });

    throw error;
  }
}

function buildAITitleRequest(input: GeneratePinsInput): GeneratePinTitleRequest {
  return {
    article_title: input.title,
    destination_url: input.postUrl,
    global_keywords: input.globalKeywords,
    title_style: input.titleStyle ?? "balanced",
    tone_hint: input.toneHint,
    list_count_hint: input.listCountHint,
    variation_count: input.titleVariationCount ?? 3,
    images: input.images.map(toImageContextInput),
  };
}

function buildAIDescriptionRequest(
  input: GeneratePinsInput,
  titles: PinTitleOption[],
): GeneratePinDescriptionRequest {
  return {
    article_title: input.title,
    destination_url: input.postUrl,
    chosen_titles: titles.map((item) => item.title),
    global_keywords: input.globalKeywords,
    tone_hint: input.toneHint,
  };
}

function toImageContextInput(image: GenerateImageInput): ImageContextInput {
  return {
    image_url: image.url,
    alt: image.alt,
    caption: image.caption,
    nearest_heading: image.nearestHeading,
    section_heading_path: image.sectionHeadingPath,
    surrounding_text_snippet: image.surroundingTextSnippet,
  };
}

function mergePinCopies(titleDrafts: PinTitleOption[], descriptionDrafts: PinCopy[]): PinCopy[] {
  return titleDrafts.map((titleDraft, index) => {
    const descriptionDraft = descriptionDrafts[index];

    return {
      title: titleDraft.title,
      description: descriptionDraft?.description ?? "",
      alt_text: descriptionDraft?.alt_text,
      keywords_used: descriptionDraft?.keywords_used,
    };
  });
}

function buildStorageAssetUrl(storageKey: string) {
  const encodedKey = storageKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return new URL(`/api/storage/${encodedKey}`, env.appUrl).toString();
}

function buildPublerPinterestPost(input: {
  postUrl: string;
  copy: PinCopy;
  mediaId: string;
  scheduledAt: string;
  settings: Awaited<ReturnType<typeof getIntegrationSettings>>;
}) {
  if (!input.settings.publerAccountId.trim()) {
    throw new Error("Select a Publer Pinterest account in dashboard settings before scheduling.");
  }

  if (!input.settings.publerBoardId.trim()) {
    throw new Error("Select a Publer Pinterest board in dashboard settings before scheduling.");
  }

  const mediaItem: Record<string, unknown> = {
    id: input.mediaId,
  };

  if (input.copy.alt_text && input.copy.alt_text.trim() !== "") {
    mediaItem.alt_text = input.copy.alt_text.trim();
  }

  return {
    networks: {
      pinterest: {
        type: "photo",
        title: input.copy.title,
        text: input.copy.description,
        url: input.postUrl,
        media: [mediaItem],
      },
    },
    accounts: [
      {
        id: input.settings.publerAccountId,
        scheduled_at: input.scheduledAt,
        album_id: input.settings.publerBoardId,
      },
    ],
  };
}

function extractScheduleOutcome(raw: Record<string, unknown>) {
  const outcomes = extractScheduleOutcomesFromJobRaw(raw);
  if (outcomes.length > 0) {
    return outcomes[0];
  }

  const postIds = extractPostIdsFromJobRaw(raw);
  if (postIds.length > 0) {
    return {
      postId: postIds[0],
    };
  }

  return undefined;
}
