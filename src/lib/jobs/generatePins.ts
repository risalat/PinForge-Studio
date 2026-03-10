import {
  GenerationJobStatus,
  GenerationPlanMode,
  GenerationPlanStatus,
  MediaUploadStatus,
  PinCopyFieldStatus,
  Prisma,
  ScheduleRunItemStatus,
  ScheduleRunStatus,
} from "@prisma/client";
import {
  generatePinDescription,
  generatePinTitle,
  type GeneratePinDescriptionRequest,
  type GeneratePinTitleRequest,
  type PinCopy as AIPinCopy,
  type PinTitleOption,
} from "@/lib/ai";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  PublerClient,
  createPublerClient,
  extractPostIdsFromJobRaw,
  extractScheduleOutcomesFromJobRaw,
  isFailureStatus,
  uploadMediaWithQueueHandling,
  waitForPublerJobCompletion,
} from "@/lib/publer/publerClient";
import { buildSchedulePreview } from "@/lib/jobs/schedulePreview";
import { renderPin } from "@/lib/renderer/renderPin";
import { getIntegrationSettingsForUserId } from "@/lib/settings/integrationSettings";
import { buildStorageAssetUrl } from "@/lib/storage/assetUrl";
import { getTemplateConfig, TEMPLATE_CONFIGS } from "@/lib/templates/registry";
import type { GenerateRequestPayload } from "@/lib/types";
import { resolveDomain } from "@/lib/types";

export type GeneratePinsInput = GenerateRequestPayload;

const jobListInclude = {
  sourceImages: true,
  generatedPins: true,
  scheduleRuns: {
    orderBy: { createdAt: "desc" },
    take: 1,
    include: {
      items: true,
    },
  },
} satisfies Prisma.GenerationJobInclude;

const jobDetailInclude = {
  post: true,
  sourceImages: {
    orderBy: { sortOrder: "asc" },
  },
  generationPlans: {
    orderBy: { sortOrder: "asc" },
    include: {
      template: true,
      imageAssignments: {
        orderBy: { slotIndex: "asc" },
        include: {
          sourceImage: true,
        },
      },
      generatedPins: {
        include: {
          pinCopy: true,
          publerMedia: true,
        },
      },
    },
  },
  generatedPins: {
    orderBy: { createdAt: "asc" },
    include: {
      template: true,
      plan: {
        include: {
          imageAssignments: {
            orderBy: { slotIndex: "asc" },
            include: {
              sourceImage: true,
            },
          },
        },
      },
      pinCopy: true,
      publerMedia: true,
      scheduleRunItems: {
        orderBy: { createdAt: "desc" },
        include: {
          scheduleRun: true,
        },
      },
    },
  },
  milestones: {
    orderBy: { createdAt: "asc" },
  },
  scheduleRuns: {
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          generatedPin: {
            include: {
              pinCopy: true,
              publerMedia: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.GenerationJobInclude;

export type WorkflowJobListItem = Prisma.GenerationJobGetPayload<{
  include: typeof jobListInclude;
}>;

export type WorkflowJob = Prisma.GenerationJobGetPayload<{
  include: typeof jobDetailInclude;
}>;

export type WorkflowStepResult = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  message: string;
  failures: Array<{
    pinId: string;
    reason: string;
  }>;
  scheduleRunId?: string;
};

export async function createIntakeJob(input: {
  userId: string;
  payload: GenerateRequestPayload;
}) {
  const domain = resolveDomain(input.payload);

  const post = await prisma.post.upsert({
    where: { url: input.payload.postUrl },
    update: {
      title: input.payload.title,
      domain,
    },
    create: {
      url: input.payload.postUrl,
      title: input.payload.title,
      domain,
    },
  });

  const job = await prisma.generationJob.create({
    data: {
      userId: input.userId,
      postId: post.id,
      postUrlSnapshot: input.payload.postUrl,
      articleTitleSnapshot: input.payload.title,
      domainSnapshot: domain,
      status: GenerationJobStatus.RECEIVED,
      globalKeywords: normalizeKeywords(input.payload.globalKeywords),
      titleStyle: input.payload.titleStyle,
      toneHint: input.payload.toneHint?.trim() || null,
      listCountHint: input.payload.listCountHint,
      titleVariationCount: input.payload.titleVariationCount,
      sourceImages: {
        create: input.payload.images.map((image, index) => ({
          url: image.url,
          alt: image.alt?.trim() || null,
          caption: image.caption?.trim() || null,
          nearestHeading: image.nearestHeading?.trim() || null,
          sectionHeadingPath: image.sectionHeadingPath ?? [],
          surroundingTextSnippet: image.surroundingTextSnippet?.trim() || null,
          sortOrder: index,
          isSelected: true,
          isPreferred: index === 0,
        })),
      },
    },
    include: {
      post: true,
    },
  });

  await recordJobMilestone(job.id, GenerationJobStatus.RECEIVED, "Intake received from extension.");

  return {
    jobId: job.id,
    postId: post.id,
    status: job.status,
    dashboardUrl: new URL(`/dashboard/jobs/${job.id}`, env.appUrl).toString(),
  };
}

export async function saveJobImageSelections(input: {
  userId: string;
  jobId: string;
  images: Array<{
    id: string;
    isSelected: boolean;
    isPreferred: boolean;
  }>;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);

  await prisma.$transaction(async (tx) => {
    for (const image of input.images) {
      await tx.jobSourceImage.updateMany({
        where: {
          id: image.id,
          jobId: job.id,
        },
        data: {
          isSelected: image.isSelected,
          isPreferred: image.isSelected ? image.isPreferred : false,
        },
      });
    }

    await tx.generationJob.update({
      where: { id: job.id },
      data: { status: GenerationJobStatus.REVIEWING },
    });
    await upsertJobMilestoneTx(
      tx,
      job.id,
      GenerationJobStatus.REVIEWING,
      "Source image review updated.",
    );
  });
}

export async function createAssistedGenerationPlans(input: {
  userId: string;
  jobId: string;
  pinCount: number;
  templateIds?: string[];
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);

  const selectedImages = job.sourceImages.filter((image) => image.isSelected);
  if (selectedImages.length === 0) {
    throw new Error("Select at least one source image before creating generation plans.");
  }

  const eligibleTemplateIds = (input.templateIds?.length ? input.templateIds : Object.keys(TEMPLATE_CONFIGS))
    .filter((templateId) => Boolean(getTemplateConfig(templateId)));

  if (eligibleTemplateIds.length === 0) {
    throw new Error("Choose at least one valid template.");
  }

  const baseSortOrder = job.generationPlans.length;
  const preferredImages = selectedImages.filter((image) => image.isPreferred);
  const imagePool = preferredImages.length > 0 ? [...preferredImages, ...selectedImages] : selectedImages;

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < input.pinCount; index += 1) {
      const templateId = eligibleTemplateIds[Math.floor(Math.random() * eligibleTemplateIds.length)];
      const template = getTemplateConfig(templateId);

      if (!template) {
        continue;
      }

      await tx.template.upsert({
        where: { id: template.id },
        update: {
          name: template.name,
          componentKey: template.componentKey,
          configJson: template as unknown as Prisma.InputJsonValue,
          isActive: true,
        },
        create: {
          id: template.id,
          name: template.name,
          componentKey: template.componentKey,
          configJson: template as unknown as Prisma.InputJsonValue,
          isActive: true,
        },
      });

      const plan = await tx.generationPlan.create({
        data: {
          jobId: job.id,
          mode: GenerationPlanMode.ASSISTED_AUTO,
          templateId,
          sortOrder: baseSortOrder + index,
          status: GenerationPlanStatus.READY,
        },
      });

      const assignments = Array.from({ length: template.imageSlotCount }).map((_, slotIndex) => {
        const image = imagePool[(index + slotIndex) % imagePool.length];
        return {
          planId: plan.id,
          sourceImageId: image.id,
          slotIndex,
        };
      });

      await tx.generationPlanImageAssignment.createMany({
        data: assignments,
      });
    }

    await tx.generationJob.update({
      where: { id: job.id },
      data: {
        status: GenerationJobStatus.READY_FOR_GENERATION,
        requestedPinCount: input.pinCount,
      },
    });
    await upsertJobMilestoneTx(
      tx,
      job.id,
      GenerationJobStatus.READY_FOR_GENERATION,
      "Assisted generation plans prepared.",
    );
  });
}

export async function createManualGenerationPlan(input: {
  userId: string;
  jobId: string;
  templateId: string;
  sourceImageIds: string[];
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const template = getTemplateConfig(input.templateId);

  if (!template) {
    throw new Error("Unknown template.");
  }

  if (input.sourceImageIds.length === 0) {
    throw new Error("Choose at least one source image.");
  }

  const allowedImages = new Set(job.sourceImages.map((image) => image.id));
  const chosenIds = input.sourceImageIds.filter((id) => allowedImages.has(id));
  if (chosenIds.length === 0) {
    throw new Error("No valid source images were provided.");
  }

  await prisma.template.upsert({
    where: { id: template.id },
    update: {
      name: template.name,
      componentKey: template.componentKey,
      configJson: template as unknown as Prisma.InputJsonValue,
      isActive: true,
    },
    create: {
      id: template.id,
      name: template.name,
      componentKey: template.componentKey,
      configJson: template as unknown as Prisma.InputJsonValue,
      isActive: true,
    },
  });

  const plan = await prisma.generationPlan.create({
    data: {
      jobId: job.id,
      mode: GenerationPlanMode.MANUAL,
      templateId: input.templateId,
      sortOrder: job.generationPlans.length,
      status: GenerationPlanStatus.READY,
      imageAssignments: {
        create: Array.from({ length: template.imageSlotCount }).map((_, slotIndex) => ({
          sourceImageId: chosenIds[slotIndex % chosenIds.length],
          slotIndex,
        })),
      },
    },
  });

  await prisma.generationJob.update({
    where: { id: job.id },
    data: { status: GenerationJobStatus.READY_FOR_GENERATION },
  });
  await recordJobMilestone(
    job.id,
    GenerationJobStatus.READY_FOR_GENERATION,
    "Manual generation plan added.",
  );

  return plan;
}

export async function generatePinsForJob(input: {
  userId: string;
  jobId: string;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const pendingPlanStatuses = new Set<GenerationPlanStatus>([
    GenerationPlanStatus.DRAFT,
    GenerationPlanStatus.READY,
    GenerationPlanStatus.FAILED,
  ]);
  const pendingPlans = job.generationPlans.filter((plan) => pendingPlanStatuses.has(plan.status));

  if (pendingPlans.length === 0) {
    throw new Error("Create at least one generation plan before rendering pins.");
  }

  const generatedPins = [];

  for (const plan of pendingPlans) {
    const template = TEMPLATE_CONFIGS[plan.templateId];
    if (!template) {
      throw new Error(`Unknown template configuration: ${plan.templateId}`);
    }

    await prisma.template.upsert({
      where: { id: template.id },
      update: {
        name: template.name,
        componentKey: template.componentKey,
        configJson: template as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
      create: {
        id: template.id,
        name: template.name,
        componentKey: template.componentKey,
        configJson: template as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    const exportObject = await renderPin({
      jobId: job.id,
      planId: plan.id,
      templateId: plan.templateId,
    });
    const exportUrl = exportObject.publicUrl ?? buildStorageAssetUrl(exportObject.key);

    const pin = await prisma.generatedPin.create({
      data: {
        jobId: job.id,
        planId: plan.id,
        templateId: plan.templateId,
        exportPath: exportUrl,
        storageKey: exportObject.key,
        pinCopy: {
          create: {},
        },
        publerMedia: {
          create: {
            status: MediaUploadStatus.PENDING,
            sourceUrl: exportUrl,
          },
        },
      },
      include: {
        pinCopy: true,
        publerMedia: true,
      },
    });

    await prisma.generationPlan.update({
      where: { id: plan.id },
      data: {
        status: GenerationPlanStatus.GENERATED,
      },
    });

    generatedPins.push(pin);
  }

  await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      status: GenerationJobStatus.PINS_GENERATED,
    },
  });
  await recordJobMilestone(job.id, GenerationJobStatus.PINS_GENERATED, "Pins rendered.");

  return {
    jobId: job.id,
    generatedPins,
  };
}

export async function uploadJobPinsToPubler(input: {
  userId: string;
  jobId: string;
  generatedPinIds?: string[];
  workspaceId?: string;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const settings = await getIntegrationSettingsForUserId(input.userId);
  const workspaceId = await resolveAccessiblePublerWorkspaceId({
    apiKey: settings.publerApiKey,
    requestedWorkspaceId: input.workspaceId?.trim() || settings.publerWorkspaceId,
  });

  if (!workspaceId) {
    throw new Error("Select a Publer workspace before uploading media.");
  }

  const publerClient = createPublerClient({
    apiKey: settings.publerApiKey,
    workspaceId,
  });
  const selectedPins = selectPinsForWorkflowAction(job, input.generatedPinIds);
  const result = createStepResultAccumulator();

  for (const pin of selectedPins) {
    if (pin.publerMedia?.status === MediaUploadStatus.UPLOADED && pin.publerMedia.mediaId) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;

    try {
      await prisma.publerMedia.upsert({
        where: { generatedPinId: pin.id },
        update: {
          status: MediaUploadStatus.UPLOADING,
          sourceUrl: pin.exportPath,
          errorMessage: null,
        },
        create: {
          generatedPinId: pin.id,
          status: MediaUploadStatus.UPLOADING,
          sourceUrl: pin.exportPath,
        },
      });

      const mediaJob = await uploadMediaWithQueueHandling({
        client: publerClient,
        imageUrl: pin.exportPath,
        options: {
          inLibrary: true,
          directUpload: true,
          name: `${job.articleTitleSnapshot} (${pin.templateId})`,
          source: job.postUrlSnapshot,
        },
      });
      const mediaSnapshot = await waitForPublerJobCompletion({
        client: publerClient,
        jobId: mediaJob.jobId,
      });

      if (mediaSnapshot.state !== "completed" || !mediaSnapshot.mediaId) {
        throw new Error(mediaSnapshot.error ?? "Publer media upload finished without a media ID.");
      }

      await prisma.publerMedia.update({
        where: { generatedPinId: pin.id },
        data: {
          status: MediaUploadStatus.UPLOADED,
          uploadJobId: mediaJob.jobId,
          mediaId: mediaSnapshot.mediaId,
          rawResponse: mediaSnapshot.raw as Prisma.InputJsonValue,
          errorMessage: null,
        },
      });

      result.succeeded += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unable to upload media.";
      result.failed += 1;
      result.failures.push({ pinId: pin.id, reason });

      await prisma.publerMedia.upsert({
        where: { generatedPinId: pin.id },
        update: {
          status: MediaUploadStatus.FAILED,
          sourceUrl: pin.exportPath,
          errorMessage: reason,
        },
        create: {
          generatedPinId: pin.id,
          status: MediaUploadStatus.FAILED,
          sourceUrl: pin.exportPath,
          errorMessage: reason,
        },
      });
    }
  }

  await finalizeStepOutcome(job.id, result, {
    successSync: true,
    failurePrefix: "Media upload",
  });

  return finalizeStepResult("Media upload", result);
}

export async function generateTitlesForJobPins(input: {
  userId: string;
  jobId: string;
  generatedPinIds?: string[];
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const settings = await getIntegrationSettingsForUserId(input.userId);
  const selectedPins = selectPinsForWorkflowAction(job, input.generatedPinIds);
  const result = createStepResultAccumulator();

  for (const pin of selectedPins) {
    if (pin.pinCopy?.titleStatus === PinCopyFieldStatus.FINALIZED && pin.pinCopy.title?.trim()) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;

    try {
      const titleDrafts = await generatePinTitle(buildTitleRequest(job, pin.template.name), {
        provider: settings.aiProvider,
        apiKey: settings.aiApiKey,
        model: settings.aiModel,
        customEndpoint: settings.aiCustomEndpoint,
      });
      const title = titleDrafts[0]?.title?.trim();
      if (!title) {
        throw new Error("AI title generation returned an empty title.");
      }

      await prisma.pinCopy.upsert({
        where: { generatedPinId: pin.id },
        update: {
          title,
          titleStatus: PinCopyFieldStatus.GENERATED,
        },
        create: {
          generatedPinId: pin.id,
          title,
          titleStatus: PinCopyFieldStatus.GENERATED,
        },
      });

      result.succeeded += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unable to generate a title.";
      result.failed += 1;
      result.failures.push({ pinId: pin.id, reason });
    }
  }

  await finalizeStepOutcome(job.id, result, {
    successSync: true,
    failurePrefix: "Title generation",
  });

  return finalizeStepResult("Title generation", result);
}

export async function saveJobPinCopyEdits(input: {
  userId: string;
  jobId: string;
  copies: Array<{
    generatedPinId: string;
    title?: string;
    description?: string;
  }>;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const pinIds = new Set(job.generatedPins.map((pin) => pin.id));
  const result = createStepResultAccumulator();

  await prisma.$transaction(async (tx) => {
    for (const copy of input.copies) {
      if (!pinIds.has(copy.generatedPinId)) {
        result.skipped += 1;
        continue;
      }

      result.processed += 1;

      await tx.pinCopy.upsert({
        where: { generatedPinId: copy.generatedPinId },
        update: {
          title: copy.title !== undefined ? copy.title.trim() || null : undefined,
          description: copy.description !== undefined ? copy.description.trim() || null : undefined,
          titleStatus:
            copy.title !== undefined ? PinCopyFieldStatus.FINALIZED : undefined,
          descriptionStatus:
            copy.description !== undefined ? PinCopyFieldStatus.FINALIZED : undefined,
        },
        create: {
          generatedPinId: copy.generatedPinId,
          title: copy.title?.trim() || null,
          description: copy.description?.trim() || null,
          titleStatus: copy.title ? PinCopyFieldStatus.FINALIZED : PinCopyFieldStatus.EMPTY,
          descriptionStatus: copy.description
            ? PinCopyFieldStatus.FINALIZED
            : PinCopyFieldStatus.EMPTY,
        },
      });

      result.succeeded += 1;
    }
  });

  await syncJobProgressStatus(job.id);

  return finalizeStepResult("Copy edits", result);
}

export async function generateDescriptionsForJobPins(input: {
  userId: string;
  jobId: string;
  generatedPinIds?: string[];
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const settings = await getIntegrationSettingsForUserId(input.userId);
  const selectedPins = selectPinsForWorkflowAction(job, input.generatedPinIds);
  const result = createStepResultAccumulator();

  for (const pin of selectedPins) {
    const finalizedTitle = pin.pinCopy?.title?.trim();
    if (!finalizedTitle) {
      result.failed += 1;
      result.failures.push({
        pinId: pin.id,
        reason: "Finalize or generate a title before generating descriptions.",
      });
      continue;
    }

    if (
      pin.pinCopy?.descriptionStatus === PinCopyFieldStatus.FINALIZED &&
      pin.pinCopy.description?.trim()
    ) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;

    try {
      const descriptionDrafts = await generatePinDescription(
        buildDescriptionRequest(job, finalizedTitle),
        {
          provider: settings.aiProvider,
          apiKey: settings.aiApiKey,
          model: settings.aiModel,
          customEndpoint: settings.aiCustomEndpoint,
        },
      );
      const description = descriptionDrafts[0]?.description?.trim();
      if (!description) {
        throw new Error("AI description generation returned an empty description.");
      }

      await prisma.pinCopy.upsert({
        where: { generatedPinId: pin.id },
        update: {
          description,
          descriptionStatus: PinCopyFieldStatus.GENERATED,
        },
        create: {
          generatedPinId: pin.id,
          description,
          descriptionStatus: PinCopyFieldStatus.GENERATED,
        },
      });

      result.succeeded += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unable to generate a description.";
      result.failed += 1;
      result.failures.push({ pinId: pin.id, reason });
    }
  }

  await finalizeStepOutcome(job.id, result, {
    successSync: true,
    failurePrefix: "Description generation",
  });

  return finalizeStepResult("Description generation", result);
}

export async function scheduleJobPins(input: {
  userId: string;
  jobId: string;
  firstPublishAt: string;
  intervalMinutes: number;
  jitterMinutes?: number;
  workspaceId?: string;
  accountId?: string;
  boardId?: string;
  boardIds?: string[];
  boardDistributionMode?: "round_robin" | "first_selected" | "primary_weighted";
  primaryBoardId?: string;
  primaryBoardPercent?: number;
  generatedPinIds?: string[];
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const settings = await getIntegrationSettingsForUserId(input.userId);
  const workspaceId = await resolveAccessiblePublerWorkspaceId({
    apiKey: settings.publerApiKey,
    requestedWorkspaceId: input.workspaceId?.trim() || settings.publerWorkspaceId,
  });
  const accountId = input.accountId?.trim() || settings.publerAccountId;
  const selectedBoardIds = Array.from(
    new Set(
      (input.boardIds?.length ? input.boardIds : [input.boardId?.trim() || settings.publerBoardId])
        .map((boardId) => boardId?.trim())
        .filter((boardId): boardId is string => Boolean(boardId)),
    ),
  );
  const boardDistributionMode = input.boardDistributionMode ?? "round_robin";
  const primaryBoardId = input.primaryBoardId?.trim() || selectedBoardIds[0] || null;
  const primaryBoardPercent =
    boardDistributionMode === "primary_weighted"
      ? Math.max(0, Math.min(100, input.primaryBoardPercent ?? 60))
      : null;
  const publerClient = createPublerClient({
    apiKey: settings.publerApiKey,
    workspaceId,
  });

  if (!accountId) {
    throw new Error("Select a Publer account before scheduling.");
  }

  if (selectedBoardIds.length === 0) {
    throw new Error("Select at least one Publer board before scheduling.");
  }

  if (
    boardDistributionMode === "primary_weighted" &&
    primaryBoardId &&
    !selectedBoardIds.includes(primaryBoardId)
  ) {
    throw new Error("The primary board must be one of the selected boards.");
  }

  const firstPublishAt = new Date(input.firstPublishAt);
  if (Number.isNaN(firstPublishAt.valueOf())) {
    throw new Error("Provide a valid first publish datetime.");
  }

  const requestedPins = selectPinsForWorkflowAction(job, input.generatedPinIds);
  const selectedPins = requestedPins.filter((pin) => !hasSuccessfulSchedule(pin));
  if (selectedPins.length === 0) {
    return finalizeStepResult("Scheduling", {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: requestedPins.length,
      failures: [],
    });
  }

  const previewItems = buildSchedulePreview({
    pinIds: selectedPins.map((pin) => pin.id),
    firstPublishAt,
    intervalMinutes: input.intervalMinutes,
    jitterMinutes: input.jitterMinutes ?? 0,
  });
  const previewByPinId = new Map(previewItems.map((item) => [item.pinId, item]));

  const scheduleRun = await prisma.scheduleRun.create({
    data: {
      jobId: job.id,
      status: ScheduleRunStatus.SUBMITTING,
      workspaceId,
      accountId,
      boardId: selectedBoardIds[0] ?? null,
      firstPublishAt,
      intervalMinutes: input.intervalMinutes,
      jitterMinutes: input.jitterMinutes ?? 0,
      rawResponse: {
        boardIds: selectedBoardIds,
        boardDistributionMode,
        primaryBoardId,
        primaryBoardPercent,
      } satisfies Prisma.InputJsonValue,
      submittedAt: new Date(),
    },
  });
  const result = createStepResultAccumulator();
  result.skipped = requestedPins.length - selectedPins.length;
  const scheduleAssignments: Array<{
    pinId: string;
    boardId: string;
    scheduledFor: string;
    status: "scheduled" | "failed";
    postId?: string;
    error?: string;
  }> = [];
  const boardAssignments = buildBoardAssignments({
    pinIds: selectedPins.map((pin) => pin.id),
    boardIds: selectedBoardIds,
    mode: boardDistributionMode,
    primaryBoardId,
    primaryBoardPercent,
  });
  const assignedBoardByPinId = new Map(boardAssignments.map((assignment) => [assignment.pinId, assignment.boardId]));

  for (const pin of selectedPins) {
    const preview = previewByPinId.get(pin.id);
    const scheduledFor = preview?.scheduledFor ?? firstPublishAt;
    const mediaId = pin.publerMedia?.mediaId?.trim();
    const title = pin.pinCopy?.title?.trim();
    const description = pin.pinCopy?.description?.trim();
    const assignedBoardId = assignedBoardByPinId.get(pin.id) ?? selectedBoardIds[0];

    const item = await prisma.scheduleRunItem.create({
      data: {
        scheduleRunId: scheduleRun.id,
        generatedPinId: pin.id,
        scheduledFor,
        status:
          mediaId && title && description
            ? ScheduleRunItemStatus.SUBMITTING
            : ScheduleRunItemStatus.FAILED,
        errorMessage:
          mediaId && title && description
            ? null
            : "Every pin must have uploaded media, title, and description before scheduling.",
      },
    });

    if (!mediaId || !title || !description) {
      result.failed += 1;
      result.failures.push({
        pinId: pin.id,
        reason: "Every pin must have uploaded media, title, and description before scheduling.",
      });
      continue;
    }

    result.processed += 1;

    try {
      const scheduleJob = await publerClient.schedulePost({
        networks: {
          pinterest: {
            type: "photo",
            title,
            text: description,
            url: job.postUrlSnapshot,
            media: [{ id: mediaId }],
          },
        },
        accounts: [
          {
            id: accountId,
            scheduled_at: scheduledFor.toISOString(),
            album_id: assignedBoardId,
          },
        ],
      });
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

      await prisma.scheduleRunItem.update({
        where: { id: item.id },
        data: {
          publerJobId: scheduleJob.jobId,
          publerPostId: outcome?.postId,
          status: ScheduleRunItemStatus.SCHEDULED,
          errorMessage: null,
        },
      });

      scheduleAssignments.push({
        pinId: pin.id,
        boardId: assignedBoardId,
        scheduledFor: scheduledFor.toISOString(),
        status: "scheduled",
        postId: outcome?.postId,
      });
      result.succeeded += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unable to schedule pin in Publer.";
      result.failed += 1;
      result.failures.push({ pinId: pin.id, reason });

      await prisma.scheduleRunItem.update({
        where: { id: item.id },
        data: {
          status: ScheduleRunItemStatus.FAILED,
          errorMessage: reason,
        },
      });

      scheduleAssignments.push({
        pinId: pin.id,
        boardId: assignedBoardId,
        scheduledFor: scheduledFor.toISOString(),
        status: "failed",
        error: reason,
      });
    }
  }

  await prisma.scheduleRun.update({
    where: { id: scheduleRun.id },
    data: {
      status: result.failed > 0 ? ScheduleRunStatus.FAILED : ScheduleRunStatus.COMPLETED,
      errorMessage: result.failed > 0 ? result.failures[0]?.reason ?? "Scheduling failed." : null,
      rawResponse: {
        boardIds: selectedBoardIds,
        boardDistributionMode,
        primaryBoardId,
        primaryBoardPercent,
        assignments: scheduleAssignments,
      } satisfies Prisma.InputJsonValue,
      completedAt: new Date(),
    },
  });

  await finalizeStepOutcome(job.id, result, {
    successSync: true,
    failurePrefix: "Scheduling",
  });

  return {
    ...finalizeStepResult("Scheduling", result),
    scheduleRunId: scheduleRun.id,
  };
}

export async function listJobsForUser(userId: string) {
  return prisma.generationJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: jobListInclude,
  });
}

export async function getJobForUser(jobId: string, userId: string): Promise<WorkflowJob> {
  return getOwnedJobOrThrow(jobId, userId);
}

async function getOwnedJobOrThrow(
  jobId: string,
  userId: string,
): Promise<WorkflowJob> {
  const job = await prisma.generationJob.findFirst({
    where: {
      id: jobId,
      userId,
    },
    include: jobDetailInclude,
  });

  if (!job) {
    throw new Error("Job not found.");
  }

  return job;
}

async function recordJobMilestone(
  jobId: string,
  status: GenerationJobStatus,
  details?: string,
) {
  await upsertJobMilestoneTx(prisma, jobId, status, details);
}

async function upsertJobMilestoneTx(
  tx: Pick<typeof prisma, "jobMilestone">,
  jobId: string,
  status: GenerationJobStatus,
  details?: string,
) {
  await tx.jobMilestone.upsert({
    where: {
      jobId_status: {
        jobId,
        status,
      },
    },
    update: {
      details,
    },
    create: {
      jobId,
      status,
      details,
    },
  });
}

function normalizeKeywords(keywords?: string[]) {
  return (keywords ?? []).map((keyword) => keyword.trim()).filter((keyword) => keyword !== "");
}

function buildTitleRequest(
  job: {
    articleTitleSnapshot: string;
    postUrlSnapshot: string;
    globalKeywords: string[];
    titleStyle: string | null;
    toneHint: string | null;
    listCountHint: number | null;
  },
  templateName: string,
): GeneratePinTitleRequest {
  const toneParts = [job.toneHint?.trim(), `Template: ${templateName}`].filter(Boolean);

  return {
    article_title: job.articleTitleSnapshot,
    destination_url: job.postUrlSnapshot,
    global_keywords: job.globalKeywords,
    title_style: toTitleStyle(job.titleStyle),
    tone_hint: toneParts.length > 0 ? toneParts.join(" | ") : undefined,
    list_count_hint: job.listCountHint ?? undefined,
    variation_count: 1,
  };
}

function buildDescriptionRequest(
  job: {
    articleTitleSnapshot: string;
    postUrlSnapshot: string;
    globalKeywords: string[];
    toneHint: string | null;
  },
  title: string,
): GeneratePinDescriptionRequest {
  return {
    article_title: job.articleTitleSnapshot,
    destination_url: job.postUrlSnapshot,
    chosen_titles: [title],
    global_keywords: job.globalKeywords,
    tone_hint: job.toneHint?.trim() || undefined,
  };
}

function toTitleStyle(value: string | null | undefined): GeneratePinTitleRequest["title_style"] {
  if (value === "balanced" || value === "seo" || value === "curiosity" || value === "benefit") {
    return value;
  }

  return "balanced";
}

function createStepResultAccumulator() {
  return {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    failures: [] as WorkflowStepResult["failures"],
  };
}

function finalizeStepResult(
  label: string,
  result: Omit<WorkflowStepResult, "message">,
): WorkflowStepResult {
  return {
    ...result,
    message: [
      `${label}: ${result.succeeded} succeeded`,
      result.failed > 0 ? `${result.failed} failed` : null,
      result.skipped > 0 ? `${result.skipped} skipped` : null,
    ]
      .filter(Boolean)
      .join(", "),
  };
}

async function finalizeStepOutcome(
  jobId: string,
  result: ReturnType<typeof createStepResultAccumulator>,
  options: {
    successSync: boolean;
    failurePrefix: string;
  },
) {
  if (result.failed > 0) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: GenerationJobStatus.FAILED,
      },
    });
    await recordJobMilestone(
      jobId,
      GenerationJobStatus.FAILED,
      `${options.failurePrefix} failed for ${result.failed} pin${result.failed === 1 ? "" : "s"}.`,
    );
    return;
  }

  if (options.successSync) {
    await syncJobProgressStatus(jobId);
  }
}

async function syncJobProgressStatus(jobId: string) {
  const [job, scheduledRows] = await Promise.all([
    prisma.generationJob.findUnique({
      where: { id: jobId },
      include: {
        sourceImages: true,
        generationPlans: true,
        generatedPins: {
          include: {
            pinCopy: true,
            publerMedia: true,
          },
        },
      },
    }),
    prisma.scheduleRunItem.findMany({
      where: {
        generatedPin: {
          jobId,
        },
        status: ScheduleRunItemStatus.SCHEDULED,
      },
      select: {
        generatedPinId: true,
      },
      distinct: ["generatedPinId"],
    }),
  ]);

  if (!job) {
    return;
  }

  const totalPins = job.generatedPins.length;
  const scheduledCount = scheduledRows.length;
  const uploadedCount = job.generatedPins.filter(
    (pin) => pin.publerMedia?.status === MediaUploadStatus.UPLOADED && pin.publerMedia.mediaId,
  ).length;
  const titleReadyCount = job.generatedPins.filter((pin) => pin.pinCopy?.title?.trim()).length;
  const descriptionReadyCount = job.generatedPins.filter((pin) =>
    pin.pinCopy?.description?.trim(),
  ).length;
  const hasReadyPlans = job.generationPlans.some(
    (plan) =>
      plan.status === GenerationPlanStatus.READY ||
      plan.status === GenerationPlanStatus.GENERATED,
  );

  let nextStatus = job.status;

  if (totalPins > 0 && scheduledCount === totalPins) {
    nextStatus = GenerationJobStatus.COMPLETED;
    await recordJobMilestone(jobId, GenerationJobStatus.SCHEDULED, "Pins submitted to Publer.");
    await recordJobMilestone(jobId, GenerationJobStatus.COMPLETED, "Publishing workflow completed.");
  } else if (totalPins > 0 && descriptionReadyCount === totalPins) {
    nextStatus = GenerationJobStatus.READY_TO_SCHEDULE;
    await recordJobMilestone(
      jobId,
      GenerationJobStatus.DESCRIPTIONS_GENERATED,
      "Draft descriptions generated.",
    );
    await recordJobMilestone(
      jobId,
      GenerationJobStatus.READY_TO_SCHEDULE,
      "Pins are ready for scheduling.",
    );
  } else if (totalPins > 0 && titleReadyCount === totalPins) {
    nextStatus = GenerationJobStatus.TITLES_GENERATED;
    await recordJobMilestone(jobId, GenerationJobStatus.TITLES_GENERATED, "Draft titles generated.");
  } else if (totalPins > 0 && uploadedCount === totalPins) {
    nextStatus = GenerationJobStatus.MEDIA_UPLOADED;
    await recordJobMilestone(
      jobId,
      GenerationJobStatus.MEDIA_UPLOADED,
      "Rendered pins uploaded to Publer media.",
    );
  } else if (totalPins > 0) {
    nextStatus = GenerationJobStatus.PINS_GENERATED;
  } else if (hasReadyPlans) {
    nextStatus = GenerationJobStatus.READY_FOR_GENERATION;
  } else if (job.sourceImages.length > 0) {
    nextStatus = GenerationJobStatus.REVIEWING;
  } else {
    nextStatus = GenerationJobStatus.RECEIVED;
  }

  if (job.status !== nextStatus) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: nextStatus,
      },
    });
  }
}

async function resolveAccessiblePublerWorkspaceId(input: {
  apiKey: string;
  requestedWorkspaceId?: string | null;
}) {
  const requestedWorkspaceId = input.requestedWorkspaceId?.trim() || "";
  const client = new PublerClient({
    apiKey: input.apiKey,
    workspaceId: "",
  });
  const workspaces = await client.getWorkspaces();

  if (workspaces.length === 0) {
    throw new Error("No Publer workspaces are available for the current API key.");
  }

  if (!requestedWorkspaceId) {
    return workspaces[0].id;
  }

  const matchingWorkspace = workspaces.find((workspace) => workspace.id === requestedWorkspaceId);
  if (matchingWorkspace) {
    return matchingWorkspace.id;
  }

  throw new Error(
    "The selected Publer workspace is not accessible with the current API key. Refresh destination and choose an available workspace.",
  );
}

function selectPinsForWorkflowAction(job: WorkflowJob, generatedPinIds?: string[]) {
  if (job.generatedPins.length === 0) {
    throw new Error("Generate pins before starting the publishing flow.");
  }

  if (!generatedPinIds?.length) {
    return job.generatedPins;
  }

  const availablePins = new Map(job.generatedPins.map((pin) => [pin.id, pin]));
  const selectedPins = Array.from(new Set(generatedPinIds))
    .map((pinId) => availablePins.get(pinId))
    .filter((pin): pin is WorkflowJob["generatedPins"][number] => Boolean(pin));

  if (selectedPins.length === 0) {
    throw new Error("Select at least one generated pin.");
  }

  return selectedPins;
}

function hasSuccessfulSchedule(pin: WorkflowJob["generatedPins"][number]) {
  return pin.scheduleRunItems.some((item) => item.status === ScheduleRunItemStatus.SCHEDULED);
}

function buildBoardAssignments(input: {
  pinIds: string[];
  boardIds: string[];
  mode: "round_robin" | "first_selected" | "primary_weighted";
  primaryBoardId?: string | null;
  primaryBoardPercent?: number | null;
}) {
  if (input.pinIds.length === 0 || input.boardIds.length === 0) {
    return [];
  }

  if (input.mode === "first_selected") {
    return input.pinIds.map((pinId) => ({
      pinId,
      boardId: input.boardIds[0],
    }));
  }

  if (input.mode === "round_robin") {
    return input.pinIds.map((pinId, index) => ({
      pinId,
      boardId: input.boardIds[index % input.boardIds.length],
    }));
  }

  const primaryBoardId = input.primaryBoardId && input.boardIds.includes(input.primaryBoardId)
    ? input.primaryBoardId
    : input.boardIds[0];
  const secondaryBoardIds = input.boardIds.filter((boardId) => boardId !== primaryBoardId);

  if (secondaryBoardIds.length === 0) {
    return input.pinIds.map((pinId) => ({
      pinId,
      boardId: primaryBoardId,
    }));
  }

  const primaryBoardPercent = Math.max(0, Math.min(100, input.primaryBoardPercent ?? 60));
  const targetPrimaryCount = Math.min(
    input.pinIds.length,
    Math.max(0, Math.round((input.pinIds.length * primaryBoardPercent) / 100)),
  );
  let assignedPrimaryCount = 0;
  let secondaryIndex = 0;

  return input.pinIds.map((pinId, index) => {
    const expectedPrimaryCount = Math.round(((index + 1) * targetPrimaryCount) / input.pinIds.length);
    const shouldUsePrimary =
      assignedPrimaryCount < targetPrimaryCount &&
      (assignedPrimaryCount < expectedPrimaryCount ||
        input.pinIds.length - (index + 1) < targetPrimaryCount - assignedPrimaryCount);

    if (shouldUsePrimary) {
      assignedPrimaryCount += 1;
      return {
        pinId,
        boardId: primaryBoardId,
      };
    }

    const boardId = secondaryBoardIds[secondaryIndex % secondaryBoardIds.length];
    secondaryIndex += 1;
    return {
      pinId,
      boardId,
    };
  });
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

export type GeneratedTitleDraft = PinTitleOption;
export type GeneratedDescriptionDraft = AIPinCopy;
