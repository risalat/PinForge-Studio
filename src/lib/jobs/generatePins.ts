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
  generatePinRenderCopy,
  generatePinTitle,
  type AIProvider,
  type GeneratePinRenderCopyRequest,
  type GeneratePinDescriptionRequest,
  type GeneratePinTitleRequest,
  type PinCopy as AIPinCopy,
  type PinTitleOption,
} from "@/lib/ai";
import {
  EditablePinDescriptionSchema,
  EditablePinSubtitleSchema,
  EditablePinTitleSchema,
} from "@/lib/ai/validators";
import { env } from "@/lib/env";
import { resolveCanonicalPost } from "@/lib/posts/canonicalPost";
import { prisma } from "@/lib/prisma";
import {
  PublerClient,
  createPublerClient,
  extractScheduleOutcomesFromJobRaw,
  isFailureStatus,
  uploadMediaWithQueueHandling,
  waitForPublerJobCompletion,
} from "@/lib/publer/publerClient";
import { buildSchedulePreview } from "@/lib/jobs/schedulePreview";
import { renderPin } from "@/lib/renderer/renderPin";
import {
  getIntegrationSettingsForUserId,
  resolveAiCredentialForUserId,
} from "@/lib/settings/integrationSettings";
import { getStorageProvider } from "@/lib/storage";
import { buildStorageAssetUrl, resolveStoredAssetUrl } from "@/lib/storage/assetUrl";
import {
  compactHeroTwoSplitTextTitle,
  isHeroTwoSplitTextTitleWithinLimit,
} from "@/lib/templates/heroTwoSplitTextTitle";
import {
  parsePlanRenderContext,
  serializePlanRenderContext,
  toPlanVisualPreset,
} from "@/lib/templates/planRenderContext";
import { getTemplateConfig, TEMPLATE_CONFIGS } from "@/lib/templates/registry";
import {
  getPresetIdsForCategories,
  getPresetIdsForTemplate,
  recommendSplitVerticalVisualPresetWithImageAwareness,
  splitVerticalBoldPresetIds,
  splitVerticalFemininePresetIds,
} from "@/lib/templates/visualPresets";
import {
  templateVisualPresets,
  type TemplateVisualPresetCategoryId,
  type TemplateNumberTreatment,
  type TemplateVisualPresetId,
} from "@/lib/templates/types";
import type { GenerateRequestPayload } from "@/lib/types";
import { normalizeArticleUrl, resolveDomain } from "@/lib/types";

export type GeneratePinsInput = GenerateRequestPayload;

type AssistedPresetStrategy =
  | "recommended"
  | "random_all"
  | "random_bold"
  | "random_feminine";

const intakeBlockingStatuses = [
  GenerationJobStatus.RECEIVED,
  GenerationJobStatus.REVIEWING,
  GenerationJobStatus.READY_FOR_GENERATION,
  GenerationJobStatus.PINS_GENERATED,
  GenerationJobStatus.MEDIA_UPLOADED,
  GenerationJobStatus.TITLES_GENERATED,
  GenerationJobStatus.DESCRIPTIONS_GENERATED,
  GenerationJobStatus.READY_TO_SCHEDULE,
  GenerationJobStatus.SCHEDULED,
  GenerationJobStatus.FAILED,
] as const;

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
          scheduleRunItems: true,
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

export type JobCycleListItem = Prisma.GenerationJobGetPayload<{
  select: {
    id: true;
    postId: true;
    articleTitleSnapshot: true;
    status: true;
    createdAt: true;
  };
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
  const canonicalPostUrl = normalizeArticleUrl(input.payload.postUrl);
  const domain = resolveDomain({
    postUrl: canonicalPostUrl,
    domain: input.payload.domain,
  });
  const post = await resolveCanonicalPost({
    url: canonicalPostUrl,
    title: input.payload.title,
    domain,
    replaceTitle: true,
  });

  const existingUnresolvedJob = await prisma.generationJob.findFirst({
    where: {
      userId: input.userId,
      postId: post.id,
      status: {
        in: [...intakeBlockingStatuses],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingUnresolvedJob) {
    return {
      jobId: existingUnresolvedJob.id,
      postId: post.id,
      status: existingUnresolvedJob.status,
      dashboardUrl: new URL(`/dashboard/jobs/${existingUnresolvedJob.id}`, env.appUrl).toString(),
      intakeAction: "reused_existing_job" as const,
      message: "An unresolved Studio job already exists for this URL. Reusing that job.",
    };
  }

  const latestCompletedJob = await prisma.generationJob.findFirst({
    where: {
      userId: input.userId,
      postId: post.id,
      status: GenerationJobStatus.COMPLETED,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
    },
  });

  const job = await prisma.generationJob.create({
    data: {
      userId: input.userId,
      postId: post.id,
      postUrlSnapshot: canonicalPostUrl,
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

  await recordJobMilestone(
    job.id,
    GenerationJobStatus.RECEIVED,
    latestCompletedJob
      ? "Fresh-pin intake received from extension after a completed cycle."
      : "Intake received from extension.",
  );

  return {
    jobId: job.id,
    postId: post.id,
    status: job.status,
    dashboardUrl: new URL(`/dashboard/jobs/${job.id}`, env.appUrl).toString(),
    intakeAction: latestCompletedJob ? ("created_fresh_intake" as const) : ("created" as const),
    message: latestCompletedJob
      ? "A completed cycle already existed for this URL. A new fresh-pin intake was created."
      : "A new intake job was created.",
  };
}

export async function createFreshPinsJobFromPost(input: {
  userId: string;
  postId: string;
}) {
  const latestJob = await prisma.generationJob.findFirst({
    where: {
      userId: input.userId,
      postId: input.postId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      post: true,
      sourceImages: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!latestJob) {
    throw new Error("No Studio job exists for this post yet.");
  }

  if (latestJob.sourceImages.length === 0) {
    throw new Error("The latest Studio job has no reusable source images.");
  }

  const job = await prisma.generationJob.create({
    data: {
      userId: input.userId,
      postId: latestJob.postId,
      postUrlSnapshot: normalizeArticleUrl(latestJob.postUrlSnapshot),
      articleTitleSnapshot: latestJob.articleTitleSnapshot,
      domainSnapshot: latestJob.domainSnapshot,
      status: GenerationJobStatus.REVIEWING,
      globalKeywords: latestJob.globalKeywords,
      titleStyle: latestJob.titleStyle,
      toneHint: latestJob.toneHint,
      listCountHint: latestJob.listCountHint,
      titleVariationCount: latestJob.titleVariationCount,
      sourceImages: {
        create: latestJob.sourceImages.map((image) => ({
          url: image.url,
          alt: image.alt,
          caption: image.caption,
          nearestHeading: image.nearestHeading,
          sectionHeadingPath: image.sectionHeadingPath,
          surroundingTextSnippet: image.surroundingTextSnippet,
          sortOrder: image.sortOrder,
          isSelected: image.isSelected,
          isPreferred: image.isPreferred,
        })),
      },
    },
  });

  await recordJobMilestone(job.id, GenerationJobStatus.RECEIVED, "Fresh-pin intake created from Post Pulse.");
  await recordJobMilestone(job.id, GenerationJobStatus.REVIEWING, "Ready for review from Post Pulse.");

  return {
    jobId: job.id,
    postId: latestJob.postId,
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
  globalKeywords?: string[];
  titleStyle?: GeneratePinTitleRequest["title_style"];
  toneHint?: string;
  listCountHint?: number | null;
  titleVariationCount?: number | null;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  await prisma.$transaction([
    ...input.images.map((image) =>
      prisma.jobSourceImage.updateMany({
        where: {
          id: image.id,
          jobId: job.id,
        },
        data: {
          isSelected: image.isSelected,
          isPreferred: image.isSelected ? image.isPreferred : false,
        },
      }),
    ),
    prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: GenerationJobStatus.REVIEWING,
        globalKeywords:
          input.globalKeywords !== undefined
            ? normalizeKeywords(input.globalKeywords)
            : undefined,
        titleStyle: input.titleStyle ?? undefined,
        toneHint:
          input.toneHint !== undefined ? input.toneHint.trim() || null : undefined,
        listCountHint:
          input.listCountHint !== undefined ? input.listCountHint : undefined,
        titleVariationCount:
          input.titleVariationCount !== undefined ? input.titleVariationCount : undefined,
      },
    }),
    prisma.jobMilestone.upsert({
      where: {
        jobId_status: {
          jobId: job.id,
          status: GenerationJobStatus.REVIEWING,
        },
      },
      update: {
        details: "Source image review updated.",
      },
      create: {
        jobId: job.id,
        status: GenerationJobStatus.REVIEWING,
        details: "Source image review updated.",
      },
    }),
  ]);
}

export async function createAssistedGenerationPlans(input: {
  userId: string;
  jobId: string;
  pinCount: number;
  templateIds?: string[];
  presetStrategy?: AssistedPresetStrategy;
  presetCategoryIds?: TemplateVisualPresetCategoryId[];
  allowAnyPresetOverride?: boolean;
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
  const selectedImagePool = shuffleBySeed(selectedImages, `${job.id}:selected-images`);
  const preferredImagePool = shuffleBySeed(preferredImages, `${job.id}:preferred-images`);
  const templateSequence = buildBalancedSequence(
    eligibleTemplateIds,
    input.pinCount,
    `${job.id}:template-sequence`,
  );
  const presetPool = getPresetPoolForAssistedPlans(input.presetStrategy, input.presetCategoryIds);
  const presetSequence = buildBalancedSequence(
    presetPool,
    input.pinCount,
    `${job.id}:preset-sequence:${input.presetStrategy ?? "recommended"}`,
  );
  const preparedPlans = await Promise.all(
    Array.from({ length: input.pinCount }).map(async (_, index) => {
      const templateId = templateSequence[index] ?? eligibleTemplateIds[index % eligibleTemplateIds.length];
      const template = getTemplateConfig(templateId);

      if (!template) {
        return null;
      }

      const assignedImages = buildAssistedImageAssignments({
        selectedImages: selectedImagePool,
        preferredImages: preferredImagePool,
        slotCount: template.imageSlotCount,
        planIndex: index,
        templateId,
      });
      const templatePresetPool = input.allowAnyPresetOverride
        ? presetPool
        : getPresetIdsForTemplate(templateId, presetPool);
      const templateFallbackPreset = templatePresetPool.includes(presetSequence[index]!)
        ? presetSequence[index]
        : templatePresetPool[0];
      const renderContext = await buildSeedPlanRenderContext(
        job,
        assignedImages.map((sourceImage) => ({
          sourceImage,
        })),
        input.presetStrategy,
        {
          allowedPresetPool: templatePresetPool,
          fallbackPreset: templateFallbackPreset,
        },
      );

      return {
        template,
        templateId,
        sortOrder: baseSortOrder + index,
        notes: serializePlanRenderContext(renderContext),
        assignedImages,
      };
    }),
  );

  const templatesToUpsert = Array.from(
    new Map(
      preparedPlans
        .filter((preparedPlan): preparedPlan is NonNullable<typeof preparedPlans[number]> => Boolean(preparedPlan))
        .map((preparedPlan) => [preparedPlan.template.id, preparedPlan.template]),
    ).values(),
  );

  await prisma.$transaction([
    ...templatesToUpsert.map((template) =>
      prisma.template.upsert({
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
      }),
    ),
    ...preparedPlans
      .filter((preparedPlan): preparedPlan is NonNullable<typeof preparedPlans[number]> => Boolean(preparedPlan))
      .map((preparedPlan) =>
        prisma.generationPlan.create({
          data: {
            jobId: job.id,
            mode: GenerationPlanMode.ASSISTED_AUTO,
            templateId: preparedPlan.templateId,
            sortOrder: preparedPlan.sortOrder,
            status: GenerationPlanStatus.READY,
            notes: preparedPlan.notes,
            imageAssignments: {
              create: preparedPlan.assignedImages.map((image, slotIndex) => ({
                sourceImageId: image.id,
                slotIndex,
              })),
            },
          },
        }),
      ),
    prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: GenerationJobStatus.READY_FOR_GENERATION,
        requestedPinCount: input.pinCount,
      },
    }),
    prisma.jobMilestone.upsert({
      where: {
        jobId_status: {
          jobId: job.id,
          status: GenerationJobStatus.READY_FOR_GENERATION,
        },
      },
      update: {
        details: "Assisted generation plans prepared.",
      },
      create: {
        jobId: job.id,
        status: GenerationJobStatus.READY_FOR_GENERATION,
        details: "Assisted generation plans prepared.",
      },
    }),
  ]);
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

  const manualAssignedImages = Array.from({ length: template.imageSlotCount }).map(
    (_, slotIndex) =>
      job.sourceImages.find((image) => image.id === chosenIds[slotIndex % chosenIds.length])!,
  );
  const manualRenderContext = await buildSeedPlanRenderContext(
    job,
    manualAssignedImages.map((sourceImage) => ({
      sourceImage,
    })),
    "recommended",
    {
      allowedPresetPool: getPresetIdsForTemplate(input.templateId),
    },
  );

  const plan = await prisma.generationPlan.create({
    data: {
      jobId: job.id,
      mode: GenerationPlanMode.MANUAL,
      templateId: input.templateId,
      sortOrder: job.generationPlans.length,
      status: GenerationPlanStatus.READY,
      notes: serializePlanRenderContext(manualRenderContext),
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

export async function updateGenerationPlanRenderContext(input: {
  userId: string;
  jobId: string;
  planId: string;
  title?: string;
  subtitle?: string;
  itemNumber?: number | null;
  visualPreset?: string | null;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const plan = job.generationPlans.find((entry) => entry.id === input.planId);

  if (!plan) {
    throw new Error("Generation plan not found.");
  }

  const existing = parsePlanRenderContext(plan.notes);
  const pinsToDelete = plan.generatedPins.filter((pin) => pin.scheduleRunItems.length === 0);
  const next = {
    ...existing,
    title: input.title !== undefined ? parseEditablePinTitle(input.title) || undefined : existing.title,
    subtitle:
      input.subtitle !== undefined
        ? parseEditablePinSubtitle(input.subtitle) || undefined
        : existing.subtitle,
    itemNumber:
      input.itemNumber !== undefined
        ? parseEditableItemNumber(input.itemNumber)
        : existing.itemNumber,
    visualPreset:
      input.visualPreset !== undefined
        ? toPlanVisualPreset(input.visualPreset ?? undefined)
        : existing.visualPreset,
  };

  await prisma.generationPlan.update({
    where: { id: plan.id },
    data: {
      notes: serializePlanRenderContext(next),
      status:
        plan.status === GenerationPlanStatus.GENERATED
          ? GenerationPlanStatus.READY
          : plan.status,
    },
  });

  await prisma.generatedPin.deleteMany({
    where: {
      planId: plan.id,
      scheduleRunItems: { none: {} },
    },
  });
  await deleteStoredAssetsForPins(pinsToDelete);

  await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      status: GenerationJobStatus.READY_FOR_GENERATION,
    },
  });

  await recordJobMilestone(
    job.id,
    GenerationJobStatus.READY_FOR_GENERATION,
    "Plan render settings updated.",
  );
}

export async function generatePinsForJob(input: {
  userId: string;
  jobId: string;
  planIds?: string[];
  aiCredentialId?: string;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const [settings, aiCredential] = await Promise.all([
    getIntegrationSettingsForUserId(input.userId),
    resolveAiCredentialForUserId({
      userId: input.userId,
      aiCredentialId: input.aiCredentialId,
    }),
  ]);
  const aiConfig = aiCredential
    ? {
        aiProvider: aiCredential.provider,
        aiApiKey: aiCredential.apiKey,
        aiModel: aiCredential.model,
        aiCustomEndpoint: aiCredential.customEndpoint,
      }
    : settings;
  const pendingPlanStatuses = new Set<GenerationPlanStatus>([
    GenerationPlanStatus.DRAFT,
    GenerationPlanStatus.READY,
    GenerationPlanStatus.FAILED,
  ]);
  const selectedPlanIds = input.planIds?.length ? new Set(input.planIds) : null;
  const pendingPlans = job.generationPlans.filter(
    (plan) =>
      pendingPlanStatuses.has(plan.status) &&
      (!selectedPlanIds || selectedPlanIds.has(plan.id)),
  );

  if (pendingPlans.length === 0) {
    throw new Error(
      selectedPlanIds
        ? "Select at least one ready plan before rendering pins."
        : "Create at least one generation plan before rendering pins.",
    );
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

      const recentArtworkTitles = generatedPins
        .map((pin) => pin.pinCopy?.title?.trim())
        .filter((value): value is string => Boolean(value));
      const renderCopy = await generateRenderCopyForPlan(job, plan, aiConfig, recentArtworkTitles);
    const nextRenderContext = serializePlanRenderContext({
      ...parsePlanRenderContext(plan.notes),
      ...renderCopy,
    });
    await prisma.generationPlan.update({
      where: { id: plan.id },
      data: {
        notes: nextRenderContext,
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
          create: {
            title: renderCopy.title,
            titleStatus: PinCopyFieldStatus.GENERATED,
          },
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

export async function discardGenerationPlansForJob(input: {
  userId: string;
  jobId: string;
  planIds?: string[];
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const selectedPlanIds = input.planIds?.length ? new Set(input.planIds) : null;
  const plansToDiscard = job.generationPlans.filter(
    (plan) => !selectedPlanIds || selectedPlanIds.has(plan.id),
  );

  if (plansToDiscard.length === 0) {
    return {
      jobId: job.id,
      discardedPlanCount: 0,
    };
  }

  const scheduledPlans = plansToDiscard.filter((plan) =>
    plan.generatedPins.some((pin) => pin.scheduleRunItems.length > 0),
  );
  if (scheduledPlans.length > 0) {
    throw new Error(
      "Plans that already entered scheduling cannot be discarded from this screen.",
    );
  }

  const discardedPlanIds = plansToDiscard.map((plan) => plan.id);
  const pinsToDelete = plansToDiscard.flatMap((plan) => plan.generatedPins);

  await prisma.$transaction(async (tx) => {
    await tx.generationPlan.deleteMany({
      where: {
        id: { in: discardedPlanIds },
      },
    });

    const remainingPlans = await tx.generationPlan.findMany({
      where: { jobId: job.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    for (const [sortOrder, plan] of remainingPlans.entries()) {
      await tx.generationPlan.update({
        where: { id: plan.id },
        data: { sortOrder },
      });
    }

    await tx.scheduleRun.deleteMany({
      where: {
        jobId: job.id,
        items: { none: {} },
      },
    });
  });
  await deleteStoredAssetsForPins(pinsToDelete);

  await syncJobProgressStatus(job.id);

  const remainingPlanCount = await prisma.generationPlan.count({
    where: { jobId: job.id },
  });
  if (remainingPlanCount > 0) {
    await recordJobMilestone(
      job.id,
      GenerationJobStatus.READY_FOR_GENERATION,
      `${plansToDiscard.length} generation plan${plansToDiscard.length === 1 ? "" : "s"} discarded.`,
    );
  }

  return {
    jobId: job.id,
    discardedPlanCount: plansToDiscard.length,
  };
}

export async function discardGeneratedPinsForJob(input: {
  userId: string;
  jobId: string;
  generatedPinIds?: string[];
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);

  if (job.generatedPins.length === 0) {
    return {
      jobId: job.id,
      discardedPinCount: 0,
    };
  }

  const pinsToDiscard = selectPinsForWorkflowAction(job, input.generatedPinIds);
  const scheduledPins = pinsToDiscard.filter((pin) => pin.scheduleRunItems.length > 0);
  if (scheduledPins.length > 0) {
    throw new Error(
      "Generated pins that already entered scheduling cannot be discarded from this screen.",
    );
  }

  const affectedPlanIds = Array.from(new Set(pinsToDiscard.map((pin) => pin.planId)));
  const discardedPinIds = pinsToDiscard.map((pin) => pin.id);
  const discardedPinCount = pinsToDiscard.length;

  await prisma.$transaction(async (tx) => {
    await tx.generatedPin.deleteMany({
      where: {
        id: { in: discardedPinIds },
      },
    });

    if (affectedPlanIds.length > 0) {
      await tx.generationPlan.updateMany({
        where: {
          id: { in: affectedPlanIds },
        },
        data: {
          status: GenerationPlanStatus.READY,
        },
      });
    }

    await tx.scheduleRun.deleteMany({
      where: {
        jobId: job.id,
        items: { none: {} },
      },
    });

    await tx.generationJob.update({
      where: { id: job.id },
      data: {
        status: GenerationJobStatus.READY_FOR_GENERATION,
      },
    });

    await upsertJobMilestoneTx(
      tx,
      job.id,
      GenerationJobStatus.READY_FOR_GENERATION,
      "Generated pins discarded. Plans reset and ready for a fresh render.",
    );
  });
  await deleteStoredAssetsForPins(pinsToDiscard);

  return {
    jobId: job.id,
    discardedPinCount,
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
    const pinAssetUrl = getPinAssetUrl(pin);

    if (pin.publerMedia?.status === MediaUploadStatus.UPLOADED && pin.publerMedia.mediaId) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;

    try {
      const reusableMedia = await findReusableUploadedMedia(job.id, pin);
      if (reusableMedia?.mediaId) {
        await prisma.publerMedia.upsert({
          where: { generatedPinId: pin.id },
          update: {
            status: MediaUploadStatus.UPLOADED,
            sourceUrl: pinAssetUrl,
            uploadJobId: reusableMedia.uploadJobId,
            mediaId: reusableMedia.mediaId,
            rawResponse: reusableMedia.rawResponse as Prisma.InputJsonValue,
            errorMessage: null,
          },
          create: {
            generatedPinId: pin.id,
            status: MediaUploadStatus.UPLOADED,
            sourceUrl: pinAssetUrl,
            uploadJobId: reusableMedia.uploadJobId,
            mediaId: reusableMedia.mediaId,
            rawResponse: reusableMedia.rawResponse as Prisma.InputJsonValue,
          },
        });

        result.succeeded += 1;
        continue;
      }

      await prisma.publerMedia.upsert({
        where: { generatedPinId: pin.id },
        update: {
          status: MediaUploadStatus.UPLOADING,
          sourceUrl: pinAssetUrl,
          errorMessage: null,
        },
        create: {
          generatedPinId: pin.id,
          status: MediaUploadStatus.UPLOADING,
          sourceUrl: pinAssetUrl,
        },
      });

      const mediaJob = await uploadMediaWithQueueHandling({
        client: publerClient,
        imageUrl: pinAssetUrl,
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
          sourceUrl: pinAssetUrl,
          errorMessage: reason,
        },
        create: {
          generatedPinId: pin.id,
          status: MediaUploadStatus.FAILED,
          sourceUrl: pinAssetUrl,
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
  aiCredentialId?: string;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const aiCredential = await resolveAiCredentialForUserId({
    userId: input.userId,
    aiCredentialId: input.aiCredentialId,
  });
  if (!aiCredential) {
    throw new Error("Save an AI credential in Integrations before generating titles.");
  }
  const selectedPins = selectPinsForWorkflowAction(job, input.generatedPinIds);
  const result = createStepResultAccumulator();
  const generatedTitleOptions: Array<{
    pinId: string;
    titles: string[];
  }> = [];
  const keywordPlan = buildPinKeywordFocusPlan(selectedPins, job.globalKeywords);
  const pinsToGenerate = selectedPins.filter((pin) => {
    const existingTitle = pin.pinCopy?.title?.trim();
    if (existingTitle && pin.pinCopy?.titleStatus === PinCopyFieldStatus.FINALIZED) {
      result.skipped += 1;
      return false;
    }

    result.processed += 1;
    return true;
  });
  const recentTitles: string[] = [];
  const usedKeywordFocuses = new Set<string>();

  for (const chunk of chunkArray(pinsToGenerate, 4)) {
    const chunkPrimaryKeywords = chunk
      .map((pin) => keywordPlan.get(pin.id)?.primaryKeyword?.trim())
      .filter((value): value is string => Boolean(value));

    const chunkResults = await Promise.all(
      chunk.map(async (pin) => {
        try {
          const coordination = keywordPlan.get(pin.id);
          const titleDrafts = await generatePinTitle(
            buildTitleRequest(
              job,
              {
                templateName: pin.template.name,
                templateSupportsSubtitle:
                  getTemplateConfig(pin.templateId)?.textFields.includes("subtitle") ?? false,
                numberTreatment:
                  getTemplateConfig(pin.templateId)?.features.numberTreatment ?? "none",
                imageAssignments: pin.plan.imageAssignments,
                itemNumber:
                  parsePlanRenderContext(pin.plan.notes).itemNumber ??
                  job.listCountHint ??
                  job.sourceImages.length,
              },
              {
                keywordFocus: coordination?.primaryKeyword,
                secondaryKeywords: coordination?.secondaryKeywords ?? [],
                avoidKeywords: [
                  ...usedKeywordFocuses,
                  ...chunkPrimaryKeywords.filter(
                    (keyword) => keyword !== coordination?.primaryKeyword,
                  ),
                ],
                recentTitles: recentTitles.slice(-8),
              },
            ),
            {
              provider: aiCredential.provider,
              apiKey: aiCredential.apiKey,
              model: aiCredential.model,
              customEndpoint: aiCredential.customEndpoint,
            },
          );
          const titleCandidates = normalizeGeneratedTitleCandidates(titleDrafts);
          const title = titleCandidates[0]?.trim();
          if (!title) {
            throw new Error("AI title generation returned an empty title.");
          }

          await prisma.pinCopy.upsert({
            where: { generatedPinId: pin.id },
            update: {
              title,
              titleOptions: titleCandidates,
              titleStatus: PinCopyFieldStatus.GENERATED,
            },
            create: {
              generatedPinId: pin.id,
              title,
              titleOptions: titleCandidates,
              titleStatus: PinCopyFieldStatus.GENERATED,
            },
          });

          return {
            ok: true as const,
            pinId: pin.id,
            titles: titleCandidates,
            title,
            primaryKeyword: coordination?.primaryKeyword?.trim() || "",
          };
        } catch (error) {
          return {
            ok: false as const,
            pinId: pin.id,
            reason: error instanceof Error ? error.message : "Unable to generate a title.",
          };
        }
      }),
    );

    for (const item of chunkResults) {
      if (!item.ok) {
        result.failed += 1;
        result.failures.push({ pinId: item.pinId, reason: item.reason });
        continue;
      }

      generatedTitleOptions.push({
        pinId: item.pinId,
        titles: item.titles,
      });
      recentTitles.push(item.title);
      if (item.primaryKeyword) {
        usedKeywordFocuses.add(item.primaryKeyword);
      }
      result.succeeded += 1;
    }
  }

  await finalizeStepOutcome(job.id, result, {
    successSync: true,
    failurePrefix: "Title generation",
  });

  return {
    ...finalizeStepResult("Title generation", result),
    generatedTitleOptions,
  };
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
  const copyOperations: Prisma.PrismaPromise<unknown>[] = [];

  for (const copy of input.copies) {
    if (!pinIds.has(copy.generatedPinId)) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;
    const validatedTitle =
      copy.title !== undefined ? parseEditablePinTitle(copy.title) : undefined;
    const validatedDescription =
      copy.description !== undefined
        ? parseEditablePinDescription(copy.description)
        : undefined;

    copyOperations.push(
      prisma.pinCopy.upsert({
        where: { generatedPinId: copy.generatedPinId },
        update: {
          title: validatedTitle !== undefined ? validatedTitle || null : undefined,
          description:
            validatedDescription !== undefined ? validatedDescription || null : undefined,
          titleStatus:
            validatedTitle !== undefined
              ? validatedTitle
                ? PinCopyFieldStatus.FINALIZED
                : PinCopyFieldStatus.EMPTY
              : undefined,
          descriptionStatus:
            validatedDescription !== undefined
              ? validatedDescription
                ? PinCopyFieldStatus.FINALIZED
                : PinCopyFieldStatus.EMPTY
              : undefined,
        },
        create: {
          generatedPinId: copy.generatedPinId,
          title: validatedTitle || null,
          description: validatedDescription || null,
          titleStatus: validatedTitle ? PinCopyFieldStatus.FINALIZED : PinCopyFieldStatus.EMPTY,
          descriptionStatus: validatedDescription
            ? PinCopyFieldStatus.FINALIZED
            : PinCopyFieldStatus.EMPTY,
        },
      }),
    );

    result.succeeded += 1;
  }

  if (copyOperations.length > 0) {
    await prisma.$transaction(copyOperations);
  }

  await syncJobProgressStatus(job.id);

  return finalizeStepResult("Copy edits", result);
}

export async function generateDescriptionsForJobPins(input: {
  userId: string;
  jobId: string;
  generatedPinIds?: string[];
  aiCredentialId?: string;
}) {
  const job = await getOwnedJobOrThrow(input.jobId, input.userId);
  const aiCredential = await resolveAiCredentialForUserId({
    userId: input.userId,
    aiCredentialId: input.aiCredentialId,
  });
  if (!aiCredential) {
    throw new Error("Save an AI credential in Integrations before generating descriptions.");
  }
  const selectedPins = selectPinsForWorkflowAction(job, input.generatedPinIds);
  const result = createStepResultAccumulator();
  const keywordPlan = buildPinKeywordFocusPlan(selectedPins, job.globalKeywords);
  const pinsToGenerate: Array<(typeof selectedPins)[number] & { finalizedTitle: string }> = [];

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

    const existingDescription = pin.pinCopy?.description?.trim();
    if (existingDescription && pin.pinCopy?.descriptionStatus === PinCopyFieldStatus.FINALIZED) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;
    pinsToGenerate.push({
      ...pin,
      finalizedTitle,
    });
  }

  const usedKeywordFocuses = new Set<string>();

  for (const chunk of chunkArray(pinsToGenerate, 5)) {
    try {
      const descriptionDrafts = await generatePinDescription(
        buildDescriptionRequest(
          job,
          chunk.map((pin) => pin.finalizedTitle),
          chunk.map((pin) => ({
            title: pin.finalizedTitle,
            primaryKeyword: keywordPlan.get(pin.id)?.primaryKeyword,
            secondaryKeywords: keywordPlan.get(pin.id)?.secondaryKeywords ?? [],
          })),
          Array.from(usedKeywordFocuses),
        ),
        {
          provider: aiCredential.provider,
          apiKey: aiCredential.apiKey,
          model: aiCredential.model,
          customEndpoint: aiCredential.customEndpoint,
        },
      );

      for (const [index, pin] of chunk.entries()) {
        const description = descriptionDrafts[index]?.description?.trim();
        if (!description) {
          result.failed += 1;
          result.failures.push({
            pinId: pin.id,
            reason: "AI description generation returned an empty description.",
          });
          continue;
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

        const primaryKeyword = keywordPlan.get(pin.id)?.primaryKeyword?.trim();
        if (primaryKeyword) {
          usedKeywordFocuses.add(primaryKeyword);
        }
        result.succeeded += 1;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unable to generate descriptions.";
      for (const pin of chunk) {
        result.failed += 1;
        result.failures.push({ pinId: pin.id, reason });
      }
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
  schedulePlan?: Array<{
    pinId: string;
    scheduledFor: string;
  }>;
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

  const fallbackPreviewItems = buildSchedulePreview({
    pinIds: selectedPins.map((pin) => pin.id),
    firstPublishAt,
    intervalMinutes: input.intervalMinutes,
    jitterMinutes: input.jitterMinutes ?? 0,
  });
  const previewByPinId = new Map(fallbackPreviewItems.map((item) => [item.pinId, item]));

  for (const scheduledItem of input.schedulePlan ?? []) {
    const scheduledFor = new Date(scheduledItem.scheduledFor);
    if (Number.isNaN(scheduledFor.valueOf())) {
      throw new Error("Schedule plan contains an invalid datetime.");
    }

    previewByPinId.set(scheduledItem.pinId, {
      pinId: scheduledItem.pinId,
      index: 0,
      scheduledFor,
      jitterOffsetMinutes: 0,
    });
  }

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
  const successfullyScheduledPinIds: string[] = [];
  const boardAssignments = buildBoardAssignments({
    pinIds: selectedPins.map((pin) => pin.id),
    boardIds: selectedBoardIds,
    mode: boardDistributionMode,
    primaryBoardId,
    primaryBoardPercent,
  });
  const assignedBoardByPinId = new Map(boardAssignments.map((assignment) => [assignment.pinId, assignment.boardId]));
  const scheduledAssetKeys = new Set(
    job.generatedPins
      .filter((pin) => pin.id !== undefined && hasSuccessfulSchedule(pin))
      .map((pin) => getPinAssetKey(pin))
      .filter((value): value is string => Boolean(value)),
  );
  const schedulablePins: Array<{
    pin: (typeof selectedPins)[number];
    itemId: string;
    scheduledFor: Date;
    assignedBoardId: string;
    assetKey: string;
    title: string;
    description: string;
    mediaId: string;
  }> = [];

  for (const pin of selectedPins) {
    const preview = previewByPinId.get(pin.id);
    const scheduledFor = preview?.scheduledFor ?? firstPublishAt;
    const mediaId = pin.publerMedia?.mediaId?.trim();
    const title = pin.pinCopy?.title?.trim();
    const description = pin.pinCopy?.description?.trim();
    const assignedBoardId = assignedBoardByPinId.get(pin.id) ?? selectedBoardIds[0];
    const assetKey = getPinAssetKey(pin);

    if (assetKey && scheduledAssetKeys.has(assetKey)) {
      result.skipped += 1;
      continue;
    }

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
    schedulablePins.push({
      pin,
      itemId: item.id,
      scheduledFor,
      assignedBoardId,
      assetKey,
      title,
      description,
      mediaId,
    });
  }

  if (schedulablePins.length > 0) {
    try {
      const scheduleJob = await publerClient.schedulePosts({
        bulk: {
          state: "scheduled",
          posts: schedulablePins.map((entry) => ({
            networks: {
              pinterest: {
                type: "photo",
                title: entry.title,
                text: entry.description,
                url: job.postUrlSnapshot,
                media: [{ id: entry.mediaId }],
              },
            },
            accounts: [
              {
                id: accountId,
                scheduled_at: entry.scheduledFor.toISOString(),
                album_id: entry.assignedBoardId,
              },
            ],
          })),
        },
      });

      const scheduleSnapshot = await waitForPublerJobCompletion({
        client: publerClient,
        jobId: scheduleJob.jobId,
      });

      if (scheduleSnapshot.state !== "completed") {
        throw new Error(scheduleSnapshot.error ?? "Publer schedule job failed.");
      }

      const outcomes = extractScheduleOutcomesFromJobRaw(scheduleSnapshot.raw);

      for (const [index, entry] of schedulablePins.entries()) {
        const outcome = outcomes[index];
        if (outcome?.error || isFailureStatus(outcome?.status)) {
          const reason = outcome?.error ?? "Publer schedule outcome reported failure.";
          result.failed += 1;
          result.failures.push({ pinId: entry.pin.id, reason });

          await prisma.scheduleRunItem.update({
            where: { id: entry.itemId },
            data: {
              publerJobId: scheduleJob.jobId,
              status: ScheduleRunItemStatus.FAILED,
              errorMessage: reason,
            },
          });

          scheduleAssignments.push({
            pinId: entry.pin.id,
            boardId: entry.assignedBoardId,
            scheduledFor: entry.scheduledFor.toISOString(),
            status: "failed",
            error: reason,
          });
          continue;
        }

        await prisma.scheduleRunItem.update({
          where: { id: entry.itemId },
          data: {
            publerJobId: scheduleJob.jobId,
            publerPostId: outcome?.postId,
            status: ScheduleRunItemStatus.SCHEDULED,
            errorMessage: null,
          },
        });

        scheduleAssignments.push({
          pinId: entry.pin.id,
          boardId: entry.assignedBoardId,
          scheduledFor: entry.scheduledFor.toISOString(),
          status: "scheduled",
          postId: outcome?.postId,
        });
        successfullyScheduledPinIds.push(entry.pin.id);
        if (entry.assetKey) {
          scheduledAssetKeys.add(entry.assetKey);
        }
        result.succeeded += 1;
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unable to schedule pins in Publer.";

      for (const entry of schedulablePins) {
        result.failed += 1;
        result.failures.push({ pinId: entry.pin.id, reason });

        await prisma.scheduleRunItem.update({
          where: { id: entry.itemId },
          data: {
            status: ScheduleRunItemStatus.FAILED,
            errorMessage: reason,
          },
        });

        scheduleAssignments.push({
          pinId: entry.pin.id,
          boardId: entry.assignedBoardId,
          scheduledFor: entry.scheduledFor.toISOString(),
          status: "failed",
          error: reason,
        });
      }
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

  if (successfullyScheduledPinIds.length > 0) {
    await prisma.pinCopy.updateMany({
      where: {
        generatedPinId: {
          in: successfullyScheduledPinIds,
        },
      },
      data: {
        titleOptions: [],
      },
    });
  }

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

export async function getJobForUser(jobId: string, userId: string): Promise<WorkflowJob | null> {
  return prisma.generationJob.findFirst({
    where: {
      id: jobId,
      userId,
    },
    include: jobDetailInclude,
  });
}

export async function listJobCyclesForPost(userId: string, postId: string): Promise<JobCycleListItem[]> {
  return prisma.generationJob.findMany({
    where: {
      userId,
      postId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      postId: true,
      articleTitleSnapshot: true,
      status: true,
      createdAt: true,
    },
  });
}

async function getOwnedJobOrThrow(
  jobId: string,
  userId: string,
): Promise<WorkflowJob> {
  const job = await getJobForUser(jobId, userId);

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

function normalizeGeneratedTitleCandidates(items: PinTitleOption[]) {
  return Array.from(
    new Set(
      items
        .map((item) => item.title.trim())
        .filter((title) => title !== ""),
    ),
  ).slice(0, 10);
}

async function buildSeedPlanRenderContext(
  job: {
    articleTitleSnapshot: string;
    domainSnapshot: string;
    listCountHint: number | null;
    sourceImages: Array<{ id: string }>;
  },
  assignments: Array<{
    sourceImage: {
      url?: string;
      alt: string | null;
      caption: string | null;
      nearestHeading: string | null;
      sectionHeadingPath: string[];
      surroundingTextSnippet: string | null;
    };
  }>,
  presetStrategy: AssistedPresetStrategy = "recommended",
  options?: {
    allowedPresetPool?: TemplateVisualPresetId[];
    fallbackPreset?: TemplateVisualPresetId;
  },
) {
  let visualPreset: TemplateVisualPresetId;

  if (
    presetStrategy === "random_all" ||
    presetStrategy === "random_bold" ||
    presetStrategy === "random_feminine"
  ) {
    visualPreset = options?.fallbackPreset ?? pickRandomPreset(options?.allowedPresetPool);
  } else {
    const recommendedPreset = await recommendSplitVerticalVisualPresetWithImageAwareness({
      articleTitle: job.articleTitleSnapshot,
      pinTitle: job.articleTitleSnapshot,
      domain: job.domainSnapshot,
      imageSignals: assignments.map((assignment) => assignment.sourceImage),
    });

    visualPreset =
      options?.allowedPresetPool?.length && !options.allowedPresetPool.includes(recommendedPreset)
        ? options.fallbackPreset ?? options.allowedPresetPool[0] ?? recommendedPreset
        : recommendedPreset;
  }

  return {
    itemNumber: job.listCountHint ?? job.sourceImages.length,
    visualPreset,
  };
}

function pickRandomPreset(pool?: readonly TemplateVisualPresetId[]): TemplateVisualPresetId {
  const source = pool?.length ? pool : templateVisualPresets;
  return source[Math.floor(Math.random() * source.length)];
}

function getPresetPoolForAssistedPlans(
  presetStrategy: AssistedPresetStrategy | undefined,
  presetCategoryIds?: TemplateVisualPresetCategoryId[],
) {
  const categoryFilteredPool = getPresetIdsForCategories(presetCategoryIds);
  const strategyPool =
    presetStrategy === "random_bold"
      ? categoryFilteredPool.filter((presetId) => splitVerticalBoldPresetIds.includes(presetId))
      : presetStrategy === "random_feminine"
        ? categoryFilteredPool.filter((presetId) => splitVerticalFemininePresetIds.includes(presetId))
      : categoryFilteredPool;

  if (strategyPool.length > 0) {
    return strategyPool;
  }

  if (presetStrategy === "random_bold") {
    return splitVerticalBoldPresetIds;
  }

  if (presetStrategy === "random_feminine") {
    return splitVerticalFemininePresetIds;
  }

  return [...templateVisualPresets];
}

function buildBalancedSequence<T>(values: readonly T[], count: number, seed: string) {
  if (values.length === 0 || count <= 0) {
    return [] as T[];
  }

  const sequence: T[] = [];
  let cycle = 0;

  while (sequence.length < count) {
    sequence.push(...shuffleBySeed(values, `${seed}:${cycle}`));
    cycle += 1;
  }

  return sequence.slice(0, count);
}

function shuffleBySeed<T>(values: readonly T[], seed: string) {
  const result = [...values];
  let state = Math.max(1, hashString(seed));

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function buildAssistedImageAssignments(input: {
  selectedImages: WorkflowJob["sourceImages"];
  preferredImages: WorkflowJob["sourceImages"];
  slotCount: number;
  planIndex: number;
  templateId: string;
}) {
  const { selectedImages, preferredImages, slotCount, planIndex, templateId } = input;
  if (selectedImages.length === 0) {
    return [];
  }

  const templateHash = hashString(templateId);
  const assignments: typeof selectedImages = [];
  const usedImageIds = new Set<string>();
  const primaryStep = pickCoprimeStep(selectedImages.length, (templateHash % 7) + 1);
  const secondaryStep = pickCoprimeStep(selectedImages.length, (planIndex % 5) + 2);
  const preferredHero =
    preferredImages.length > 0
      ? preferredImages[(planIndex + templateHash) % preferredImages.length]
      : undefined;

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    const candidate =
      slotIndex === 0 && preferredHero
        ? preferredHero
        : findDistributedImage({
            images: selectedImages,
            usedImageIds,
            startIndex: (planIndex * primaryStep + slotIndex * secondaryStep + templateHash) % selectedImages.length,
          });

    assignments.push(candidate);
    if (selectedImages.length >= slotCount) {
      usedImageIds.add(candidate.id);
    }
  }

  return assignments;
}

function findDistributedImage(input: {
  images: WorkflowJob["sourceImages"];
  usedImageIds: Set<string>;
  startIndex: number;
}) {
  const { images, usedImageIds, startIndex } = input;
  for (let offset = 0; offset < images.length; offset += 1) {
    const candidate = images[(startIndex + offset) % images.length];
    if (!usedImageIds.has(candidate.id)) {
      return candidate;
    }
  }

  return images[startIndex % images.length];
}

function pickCoprimeStep(length: number, preferredStep: number) {
  if (length <= 1) {
    return 1;
  }

  let step = Math.max(1, preferredStep % length);
  while (greatestCommonDivisor(step, length) !== 1) {
    step = (step + 1) % length || 1;
  }

  return step;
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}

async function generateRenderCopyForPlan(
  job: WorkflowJob,
  plan: WorkflowJob["generationPlans"][number],
  settings: {
    aiProvider: AIProvider;
    aiApiKey: string;
    aiModel: string;
    aiCustomEndpoint: string;
  },
  recentArtworkTitles: string[] = [],
) {
  const templateConfig = getTemplateConfig(plan.templateId);
  if (!templateConfig) {
    throw new Error(`Unknown template configuration: ${plan.templateId}`);
  }

  const existing = parsePlanRenderContext(plan.notes);
  const supportsSubtitle = templateConfig.textFields.includes("subtitle");
  const numberTreatment = templateConfig.features.numberTreatment;
  const itemNumber = existing.itemNumber ?? job.listCountHint ?? job.sourceImages.length;
  let title = existing.title?.trim();
  let subtitle = existing.subtitle?.trim();

  if (!title || (supportsSubtitle && !subtitle)) {
    const renderCopy = await generatePinRenderCopy(
      buildRenderCopyRequest(job, {
        templateId: plan.templateId,
        templateName: plan.template.name,
        templateSupportsSubtitle: supportsSubtitle,
        numberTreatment,
        imageAssignments: plan.imageAssignments,
        itemNumber,
        lockedTitle: title,
        recentTitles: recentArtworkTitles,
      }),
      {
        provider: settings.aiProvider,
        apiKey: settings.aiApiKey,
        model: settings.aiModel,
        customEndpoint: settings.aiCustomEndpoint,
      },
    );

    title = title || renderCopy[0]?.title?.trim();
    subtitle = subtitle || renderCopy[0]?.subtitle?.trim();
  }

  if (!title) {
    throw new Error("AI title generation returned an empty title.");
  }

  if (supportsSubtitle && !subtitle) {
    subtitle = buildSubtitleFromTitle(title, job.articleTitleSnapshot);
  }

  const shapedCopy = shapeRenderCopyForTemplate({
    templateId: plan.templateId,
    title,
    subtitle,
    itemNumber,
    articleTitle: job.articleTitleSnapshot,
    supportsSubtitle,
    numberTreatment,
  });

  const visualPreset =
    existing.visualPreset ||
    (await recommendSplitVerticalVisualPresetWithImageAwareness({
      articleTitle: job.articleTitleSnapshot,
      pinTitle: shapedCopy.title,
      subtitle: shapedCopy.subtitle,
      domain: job.domainSnapshot,
      allowedPresetIds: getPresetIdsForTemplate(plan.templateId),
      imageSignals: plan.imageAssignments.map((assignment) => assignment.sourceImage),
    }));

  return {
    title: shapedCopy.title,
    subtitle: shapedCopy.subtitle,
    itemNumber,
    visualPreset,
  };
}

function buildRenderCopyRequest(
  job: {
    articleTitleSnapshot: string;
    postUrlSnapshot: string;
    globalKeywords: string[];
    titleStyle: string | null;
    toneHint: string | null;
    listCountHint: number | null;
    titleVariationCount?: number | null;
  },
  pin: {
    templateId: string;
    templateName: string;
    templateSupportsSubtitle: boolean;
    numberTreatment: TemplateNumberTreatment;
      imageAssignments: Array<{
      sourceImage: {
        url: string;
        alt: string | null;
        caption: string | null;
        nearestHeading: string | null;
        sectionHeadingPath: string[];
        surroundingTextSnippet: string | null;
      };
    }>;
    itemNumber?: number;
    lockedTitle?: string;
    recentTitles?: string[];
  },
  ): GeneratePinRenderCopyRequest {
    const titleRequest = buildTitleRequest(job, pin, {
      recentTitles: pin.recentTitles,
    });
    const artworkRule = getArtworkTitleRule(pin.templateId);
    return {
      ...titleRequest,
      locked_title: pin.lockedTitle?.trim() || undefined,
      subtitle_style_hint: pin.templateSupportsSubtitle
        ? "Very short editorial kicker, 3 to 5 words."
        : "No subtitle slot. Keep any secondary angle out of the artwork title.",
      template_id: pin.templateId,
      template_name: pin.templateName,
      template_supports_subtitle: pin.templateSupportsSubtitle,
      template_number_treatment: pin.numberTreatment,
      artwork_goal: pin.templateSupportsSubtitle
        ? "Create a clean Pinterest title + subtitle pairing for the artwork. Prioritize short, punchy readability over SEO."
        : "Create one clean Pinterest artwork headline that reads well without a subtitle. Prioritize short, punchy readability over SEO.",
      artwork_title_single_line: artworkRule.singleLine,
      artwork_title_max_chars: artworkRule.maxChars,
      artwork_title_max_words: artworkRule.maxWords,
      artwork_title_max_lines: artworkRule.maxLines,
    };
  }

function buildTitleRequest(
  job: {
    articleTitleSnapshot: string;
    postUrlSnapshot: string;
    globalKeywords: string[];
    titleStyle: string | null;
    toneHint: string | null;
    listCountHint: number | null;
    titleVariationCount?: number | null;
    sourceImages?: Array<{ id: string }>;
  },
  pin: {
    templateName: string;
    templateSupportsSubtitle: boolean;
    numberTreatment: TemplateNumberTreatment;
    imageAssignments: Array<{
      sourceImage: {
        url: string;
        alt: string | null;
        caption: string | null;
        nearestHeading: string | null;
        sectionHeadingPath: string[];
        surroundingTextSnippet: string | null;
      };
    }>;
    itemNumber?: number;
  },
  coordination?: {
    keywordFocus?: string;
    secondaryKeywords?: string[];
    avoidKeywords?: string[];
    recentTitles?: string[];
  },
): GeneratePinTitleRequest {
  const toneParts = [job.toneHint?.trim(), `Template: ${pin.templateName}`].filter(Boolean);
  const images = pin.imageAssignments.map((assignment) =>
    buildDedupedImageContext(assignment.sourceImage),
  );
  const focusedKeywords = buildFocusedKeywordList(
    job.globalKeywords,
    coordination?.keywordFocus,
    coordination?.secondaryKeywords ?? [],
  );

  return {
    article_title: job.articleTitleSnapshot,
    destination_url: job.postUrlSnapshot,
    global_keywords: focusedKeywords,
    keyword_focus: coordination?.keywordFocus,
    secondary_keywords: coordination?.secondaryKeywords,
    avoid_keywords: coordination?.avoidKeywords?.slice(0, 8),
    recent_titles: coordination?.recentTitles?.slice(-6),
    title_style: toTitleStyle(job.titleStyle),
    tone_hint: toneParts.length > 0 ? toneParts.join(" | ") : undefined,
    list_count_hint: pin.itemNumber ?? job.listCountHint ?? undefined,
    variation_count: job.titleVariationCount ?? 3,
    images,
  };
}

function buildDedupedImageContext(sourceImage: {
  url: string;
  alt: string | null;
  caption: string | null;
  nearestHeading: string | null;
  sectionHeadingPath: string[];
  surroundingTextSnippet: string | null;
}) {
  const used = new Set<string>();
  const alt = takeUniqueText(sourceImage.alt, used);
  const caption = takeUniqueText(sourceImage.caption, used);
  const nearestHeading = takeUniqueText(sourceImage.nearestHeading, used);
  const sectionHeadingPath = sourceImage.sectionHeadingPath
    .map((value) => takeUniqueText(value, used))
    .filter((value): value is string => Boolean(value));
  const surroundingTextSnippet = takeUniqueText(sourceImage.surroundingTextSnippet, used);
  const preferredKeywords = dedupeTextValues([
    sourceImage.nearestHeading,
    sourceImage.caption,
    ...sourceImage.sectionHeadingPath,
    sourceImage.alt,
  ]).filter((value) => !used.has(normalizeContextText(value)));

  return {
    image_url: sourceImage.url,
    alt: alt ?? undefined,
    caption: caption ?? undefined,
    nearest_heading: nearestHeading ?? undefined,
    section_heading_path: sectionHeadingPath.length > 0 ? sectionHeadingPath : undefined,
    surrounding_text_snippet: surroundingTextSnippet ?? undefined,
    preferred_keywords: preferredKeywords.length > 0 ? preferredKeywords : undefined,
  };
}

function takeUniqueText(value: string | null | undefined, used: Set<string>) {
  const normalized = normalizeContextText(value);
  if (!normalized || used.has(normalized)) {
    return undefined;
  }

  used.add(normalized);
  return value?.trim();
}

function dedupeTextValues(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeContextText(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(value!.trim());
  }

  return result;
}

function normalizeContextText(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.toLowerCase().replace(/\s+/g, " ");
}

function parseEditablePinTitle(value: string) {
  return EditablePinTitleSchema.parse(value);
}

function parseEditablePinDescription(value: string) {
  return EditablePinDescriptionSchema.parse(value);
}

function parseEditablePinSubtitle(value: string) {
  return EditablePinSubtitleSchema.parse(value);
}

function parseEditableItemNumber(value: number | null) {
  if (value === null) {
    return undefined;
  }

  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) {
    throw new Error("Item number must be a positive integer.");
  }

  return Math.floor(next);
}

function buildSubtitleFromTitle(title: string, articleTitle: string) {
  const normalizedTitle = title.trim().toLowerCase();
  const articleWords = articleTitle
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const filteredWords = articleWords.filter((word) => !normalizedTitle.includes(word.toLowerCase()));
  const fallbackWords = filteredWords.length > 0 ? filteredWords : articleWords;
  const subtitle = fallbackWords.slice(0, 5).join(" ").trim();

  return subtitle || undefined;
}

function shapeRenderCopyForTemplate(input: {
  templateId: string;
  title: string;
  subtitle?: string;
  itemNumber?: number;
  articleTitle: string;
  supportsSubtitle: boolean;
  numberTreatment: TemplateNumberTreatment;
}) {
  let title = normalizeRenderText(input.title);
  let subtitle: string | undefined = normalizeRenderText(input.subtitle) || undefined;

  if (input.supportsSubtitle) {
    const split = splitRenderTitle(title);
    if (split) {
      title = split.title;
      if (shouldUseSplitSubtitle(split.subtitle, subtitle)) {
        subtitle = split.subtitle;
      }
    }

    title = integrateItemNumberIntoRenderTitle(title, input.itemNumber, input.numberTreatment);
    subtitle = subtitle ? normalizeSubtitleKicker(subtitle, title, input.articleTitle) : undefined;
    title = enforceArtworkTitleRule(input.templateId, title);

    return {
      title,
      subtitle,
    };
  }

  title = collapseSingleFieldRenderTitle({
    templateId: input.templateId,
    title,
    subtitle,
    itemNumber: input.itemNumber,
    numberTreatment: input.numberTreatment,
  });

  return {
    title: enforceArtworkTitleRule(input.templateId, title),
    subtitle: undefined,
  };
}

function collapseSingleFieldRenderTitle(input: {
  templateId: string;
  title: string;
  subtitle?: string;
  itemNumber?: number;
  numberTreatment: TemplateNumberTreatment;
}) {
  const split = splitRenderTitle(input.title);
  let headline = split?.title ?? input.title;

  headline = headline
    .replace(/\s*[|/]\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/[,:;.\-–—]+$/g, "")
    .trim();

  headline = integrateItemNumberIntoRenderTitle(headline, input.itemNumber, input.numberTreatment);

  if (headline.length > 70 && split?.title) {
    headline = integrateItemNumberIntoRenderTitle(
      split.title,
      input.itemNumber,
      input.numberTreatment,
    );
  }

  if (headline.length > 80 && input.subtitle) {
    headline = headline.replace(/\s+/g, " ").split(/\s+/).slice(0, 10).join(" ");
  }

  if (input.templateId === "hero-two-split-text" && !isHeroTwoSplitTextTitleWithinLimit(headline)) {
    headline = compactHeroTwoSplitTextTitle(headline);
  }

  return headline;
}

function getArtworkTitleRule(templateId: string) {
  switch (templateId) {
    case "nine-image-grid-overlay-number-footer":
      return { maxWords: 4, maxChars: 28, maxLines: 1, singleLine: true };
    case "hero-two-split-text":
      return { maxWords: 5, maxChars: 36, maxLines: 3, singleLine: false };
    case "masonry-grid-number-title-footer":
      return { maxWords: 5, maxChars: 34, maxLines: 2, singleLine: false };
    case "six-image-triple-split-slant-hero-footer":
      return { maxWords: 5, maxChars: 34, maxLines: 2, singleLine: false };
    case "single-image-header-title-domain-cta":
      return { maxWords: 7, maxChars: 52, maxLines: 3, singleLine: false };
    case "single-image-subtitle-title-cta":
    case "single-image-title-footer":
    case "four-image-grid-title-footer":
    case "four-image-grid-number-title-domain":
    case "four-image-masonry-hero-number-domain-pill":
    case "split-vertical-title":
    case "split-vertical-title-no-subtitle":
    case "split-vertical-title-number":
    case "hero-text-triple-split-footer":
      return { maxWords: 6, maxChars: 42, maxLines: 2, singleLine: false };
    default:
      return { maxWords: 6, maxChars: 44, maxLines: 2, singleLine: false };
  }
}

function enforceArtworkTitleRule(templateId: string, title: string) {
  const rule = getArtworkTitleRule(templateId);
  let headline = normalizeRenderText(title)
    .replace(/\s{2,}/g, " ")
    .trim();

  headline = cutArtworkAtWeakClause(headline);

  const words = headline.split(/\s+/).filter(Boolean);
  if (words.length > rule.maxWords) {
    headline = words.slice(0, rule.maxWords).join(" ");
  }

  while (headline.length > rule.maxChars) {
    const reducedWords = headline.split(/\s+/).filter(Boolean);
    if (reducedWords.length <= 2) {
      break;
    }
    reducedWords.pop();
    headline = reducedWords.join(" ");
  }

  if (templateId === "hero-two-split-text" && !isHeroTwoSplitTextTitleWithinLimit(headline)) {
    headline = compactHeroTwoSplitTextTitle(headline);
  }

  return headline;
}

function cutArtworkAtWeakClause(title: string) {
  const words = title.split(/\s+/).filter(Boolean);
  const weakClauseWords = new Set([
    "that",
    "for",
    "with",
    "while",
    "when",
    "because",
    "where",
    "which",
  ]);

  const weakClauseIndex = words.findIndex(
    (word, index) => index >= 3 && weakClauseWords.has(word.toLowerCase().replace(/[^a-z]/g, "")),
  );

  return weakClauseIndex > 0 ? words.slice(0, weakClauseIndex).join(" ") : title;
}

function integrateItemNumberIntoRenderTitle(
  title: string,
  itemNumber: number | undefined,
  numberTreatment: TemplateNumberTreatment,
) {
  const cleanedTitle = normalizeRenderText(title);
  if (!itemNumber || cleanedTitle === "") {
    return cleanedTitle;
  }

  if (numberTreatment === "hero") {
    return cleanedTitle.replace(/^\d+\s+/, "").trim();
  }

  if (startsWithNumericCount(cleanedTitle)) {
    return cleanedTitle;
  }

  return `${itemNumber} ${cleanedTitle}`.trim();
}

function splitRenderTitle(title: string) {
  const separators = [":", " - ", " – ", " — "];

  for (const separator of separators) {
    const index = title.indexOf(separator);
    if (index <= 0) {
      continue;
    }

    const left = normalizeRenderText(title.slice(0, index));
    const right = normalizeRenderText(title.slice(index + separator.length));
    if (left && right) {
      return {
        title: left,
        subtitle: right,
      };
    }
  }

  return null;
}

function normalizeSubtitleKicker(subtitle: string, title: string, articleTitle: string) {
  const next = normalizeRenderText(subtitle)
    .replace(/[.:;,\-–—]+$/g, "")
    .trim();

  if (!next) {
    return undefined;
  }

  const normalizedTitle = normalizeContextText(title);
  const normalizedSubtitle = normalizeContextText(next);
  if (normalizedSubtitle === normalizedTitle) {
    return buildSubtitleFromTitle(title, articleTitle);
  }

  return next;
}

function shouldUseSplitSubtitle(splitSubtitle: string, currentSubtitle?: string) {
  const candidate = normalizeRenderText(splitSubtitle);
  if (!candidate) {
    return false;
  }

  if (!currentSubtitle) {
    return true;
  }

  const current = normalizeRenderText(currentSubtitle);
  if (!current) {
    return true;
  }

  const currentWordCount = wordCount(current);
  const candidateWordCount = wordCount(candidate);
  const currentLooksGeneric = looksGenericSubtitle(current);
  const candidateLooksSpecific = !looksGenericSubtitle(candidate);

  return (
    candidateWordCount <= 5 &&
    candidate.length <= 40 &&
    (currentLooksGeneric || (candidateLooksSpecific && candidateWordCount >= currentWordCount))
  );
}

function normalizeRenderText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function buildPinKeywordFocusPlan(
  pins: Array<{
    id: string;
    plan: {
      imageAssignments: Array<{
        sourceImage: {
          alt: string | null;
          caption: string | null;
          nearestHeading: string | null;
          sectionHeadingPath: string[];
          surroundingTextSnippet: string | null;
        };
      }>;
    };
  }>,
  globalKeywords: string[],
) {
  const keywords = dedupeKeywordPool(globalKeywords);
  const usageCount = new Map<string, number>();
  const plan = new Map<
    string,
    {
      primaryKeyword?: string;
      secondaryKeywords: string[];
    }
  >();

  if (keywords.length === 0) {
    for (const pin of pins) {
      plan.set(pin.id, {
        secondaryKeywords: [],
      });
    }
    return plan;
  }

  for (const pin of pins) {
    const pinContext = buildPinKeywordContext(pin.plan.imageAssignments);
    const rankedKeywords = keywords
      .map((keyword, index) => ({
        keyword,
        index,
        usage: usageCount.get(keyword) ?? 0,
        score: scoreKeywordAgainstContext(keyword, pinContext),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (left.usage !== right.usage) {
          return left.usage - right.usage;
        }
        return left.index - right.index;
      });

    const primaryKeyword = rankedKeywords[0]?.keyword;
    if (primaryKeyword) {
      usageCount.set(primaryKeyword, (usageCount.get(primaryKeyword) ?? 0) + 1);
    }

    const secondaryKeywords = rankedKeywords
      .filter((entry) => entry.keyword !== primaryKeyword)
      .slice(0, 2)
      .map((entry) => entry.keyword);

    plan.set(pin.id, {
      primaryKeyword,
      secondaryKeywords,
    });
  }

  return plan;
}

function buildPinKeywordContext(
  assignments: Array<{
    sourceImage: {
      alt: string | null;
      caption: string | null;
      nearestHeading: string | null;
      sectionHeadingPath: string[];
      surroundingTextSnippet: string | null;
    };
  }>,
) {
  return assignments
    .flatMap((assignment) => [
      assignment.sourceImage.alt,
      assignment.sourceImage.caption,
      assignment.sourceImage.nearestHeading,
      ...assignment.sourceImage.sectionHeadingPath,
      assignment.sourceImage.surroundingTextSnippet,
    ])
    .map((value) => normalizeContextText(value))
    .filter(Boolean)
    .join(" ");
}

function scoreKeywordAgainstContext(keyword: string, context: string) {
  if (!context) {
    return 0;
  }

  const normalizedKeyword = normalizeContextText(keyword);
  if (!normalizedKeyword) {
    return 0;
  }

  let score = 0;
  if (context.includes(normalizedKeyword)) {
    score += 3;
  }

  const parts = normalizedKeyword.split(/\s+/).filter((part) => part.length >= 4);
  for (const part of parts) {
    if (context.includes(part)) {
      score += 1;
    }
  }

  return score;
}

function dedupeKeywordPool(keywords: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const keyword of keywords) {
    const normalized = normalizeContextText(keyword);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(keyword.trim());
  }

  return result;
}

function buildFocusedKeywordList(
  globalKeywords: string[],
  primaryKeyword?: string,
  secondaryKeywords: string[] = [],
) {
  const ordered = [
    ...(primaryKeyword ? [primaryKeyword] : []),
    ...secondaryKeywords,
    ...globalKeywords,
  ];

  return dedupeKeywordPool(ordered).slice(0, 6);
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function startsWithNumericCount(value: string) {
  return /^\d+\b/.test(value.trim());
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function looksGenericSubtitle(value: string) {
  const normalized = normalizeContextText(value);
  return [
    "design details",
    "organic design details",
    "earthy details",
    "cozy details",
    "editorial details",
    "styled spaces",
    "soft styling",
    "warm styling",
    "design inspiration",
    "natural styling",
  ].some((term) => normalized === term || normalized.endsWith(` ${term}`));
}

function buildDescriptionRequest(
  job: {
    articleTitleSnapshot: string;
    postUrlSnapshot: string;
    globalKeywords: string[];
    toneHint: string | null;
  },
  titles: string[],
  keywordFocusByTitle?: Array<{
    title: string;
    primaryKeyword?: string;
    secondaryKeywords?: string[];
  }>,
  avoidRepeatingKeywords?: string[],
): GeneratePinDescriptionRequest {
  return {
    article_title: job.articleTitleSnapshot,
    destination_url: job.postUrlSnapshot,
    chosen_titles: titles,
    global_keywords: job.globalKeywords.slice(0, 10),
    keyword_focus_by_title: keywordFocusByTitle,
    avoid_repeating_keywords: avoidRepeatingKeywords?.slice(0, 10),
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

async function findReusableUploadedMedia(
  jobId: string,
  pin: WorkflowJob["generatedPins"][number],
) {
  const assetConditions: Prisma.GeneratedPinWhereInput[] = [];
  if (pin.storageKey?.trim()) {
    assetConditions.push({ storageKey: pin.storageKey.trim() });
  }
  assetConditions.push({ exportPath: pin.exportPath });

  return prisma.publerMedia.findFirst({
    where: {
      status: MediaUploadStatus.UPLOADED,
      mediaId: {
        not: null,
      },
      generatedPin: {
        jobId,
        id: {
          not: pin.id,
        },
        OR: assetConditions,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

function getPinAssetKey(pin: Pick<WorkflowJob["generatedPins"][number], "storageKey" | "exportPath">) {
  return pin.storageKey?.trim() || pin.exportPath.trim();
}

function getPinAssetUrl(pin: Pick<WorkflowJob["generatedPins"][number], "storageKey" | "exportPath">) {
  return resolveStoredAssetUrl({
    storageKey: pin.storageKey,
    exportPath: pin.exportPath,
  });
}

async function deleteStoredAssetsForPins(
  pins: Array<Pick<WorkflowJob["generatedPins"][number], "storageKey">>,
) {
  const keys = Array.from(
    new Set(
      pins
        .map((pin) => pin.storageKey?.trim())
        .filter((key): key is string => Boolean(key)),
    ),
  );

  if (keys.length === 0) {
    return;
  }

  const storageProvider = getStorageProvider();
  await Promise.allSettled(keys.map((key) => storageProvider.delete(key)));
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

export type GeneratedTitleDraft = PinTitleOption;
export type GeneratedDescriptionDraft = AIPinCopy;
