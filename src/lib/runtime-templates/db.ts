import {
  Prisma,
  TemplateLifecycleStatus,
  TemplateRendererKind,
  TemplateSourceKind,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createDefaultRuntimeTemplateEditorState,
  createStarterRuntimeTemplateDocument,
} from "@/lib/runtime-templates/defaults";
import {
  runtimeTemplateDocumentDraftSchema,
  runtimeTemplateDocumentSchema,
  type RuntimeTemplateDocument,
} from "@/lib/runtime-templates/schema";
import {
  summarizeRuntimeTemplateDocument,
  validateRuntimeTemplateDocument,
} from "@/lib/runtime-templates/validate";
import type { RuntimeTemplateValidationResult } from "@/lib/runtime-templates/types";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import {
  buildTemplateGroupingMetadata,
  resolveTemplateUserGroupsFromAssignments,
} from "@/lib/templates/templateGroupMetadata";
import { getPresetIdsForCategories } from "@/lib/templates/visualPresets";

const runtimeTemplateTransactionOptions = {
  maxWait: 10_000,
  timeout: 20_000,
} satisfies Parameters<typeof prisma.$transaction>[1];

export async function createStarterCustomTemplateDraft(input: {
  userId: string;
  name?: string;
  description?: string;
}) {
  const name = input.name?.trim() || "Starter Custom Template";
  const description = input.description?.trim() || null;
  const document = createStarterRuntimeTemplateDocument({ name, description: description ?? undefined });
  const parsedDraft = runtimeTemplateDocumentDraftSchema.safeParse(document);
  const schemaValidation = validateRuntimeTemplateDocument(document, { mode: "schema" });
  const fullValidation = validateRuntimeTemplateDocument(document, { mode: "full" });
  const editorState =
    createDefaultRuntimeTemplateEditorState() as unknown as Prisma.InputJsonValue;

  if (!parsedDraft.success || !schemaValidation.document) {
    const details = [...schemaValidation.errors, ...schemaValidation.warnings]
      .slice(0, 3)
      .map((entry) => entry.message)
      .join(" | ");
    throw new Error(
      details
        ? `Starter runtime template draft failed validation. ${details}`
        : "Starter runtime template draft failed validation.",
    );
  }

  const summary = summarizeRuntimeTemplateDocument(parsedDraft.data);

  return prisma.$transaction(async (tx) => {
    const slug = await buildUniqueTemplateSlug(tx, name);
    const componentKey = `runtime:${slug}`;

    const template = await tx.template.create({
      data: {
        name,
        slug,
        description,
        componentKey,
        configJson: {
          runtimeTemplate: true,
          schemaVersion: document.schemaVersion,
        } satisfies Prisma.InputJsonValue,
        isActive: true,
        sourceKind: TemplateSourceKind.CUSTOM,
        rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
        lifecycleStatus: TemplateLifecycleStatus.DRAFT,
        createdByUserId: input.userId,
        canvasWidth: document.canvas.width,
        canvasHeight: document.canvas.height,
      },
    });

    const version = await tx.templateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        lifecycleStatus: TemplateLifecycleStatus.DRAFT,
        schemaJson: schemaValidation.document as unknown as Prisma.InputJsonValue,
        editorStateJson: editorState,
        summaryJson: summary as unknown as Prisma.InputJsonValue,
        validationJson: toValidationJson(fullValidation),
        isActive: true,
        isLocked: false,
        createdByUserId: input.userId,
      },
    });

    const updatedTemplate = await tx.template.update({
      where: { id: template.id },
      data: {
        activeVersionId: version.id,
      },
      include: {
        activeVersion: true,
      },
    });

    return {
      template: updatedTemplate,
      version,
    };
  }, runtimeTemplateTransactionOptions);
}

export async function listCustomTemplatesForUser(userId: string) {
  const templates = await prisma.template.findMany({
    where: {
      sourceKind: TemplateSourceKind.CUSTOM,
      createdByUserId: userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      _count: {
        select: {
          generationPlans: true,
          generatedPins: true,
        },
      },
      activeVersion: {
        select: {
          id: true,
          versionNumber: true,
          lifecycleStatus: true,
          isActive: true,
          isLocked: true,
          summaryJson: true,
          validationJson: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      templateGroupAssignments: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              slug: true,
              sortOrder: true,
            },
          },
        },
      },
      variantFamily: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        select: {
          id: true,
        },
      },
      versions: {
        select: {
          id: true,
          versionNumber: true,
          lifecycleStatus: true,
          isActive: true,
          isLocked: true,
          validationJson: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          versionNumber: "desc",
        },
      },
    },
  });

  return templates.map((template) => {
    const groupingMetadata = buildTemplateGroupingMetadata({
      systemCategories: extractTemplateCategoriesFromSummaryJson(
        template.activeVersion?.summaryJson ?? null,
      ),
      userGroups: resolveTemplateUserGroupsFromAssignments(template.templateGroupAssignments),
    });

    return {
      ...template,
      ...groupingMetadata,
      variantFamilyTemplate:
        template.variantFamily ??
        (template.variants.length > 0
          ? {
              id: template.id,
              name: template.name,
            }
          : null),
      variantCount: template.variants.length,
      isVariant: Boolean(template.variantFamilyId),
      templateCategories: groupingMetadata.systemCategories,
    };
  });
}

export async function getRuntimeTemplateForRender(input: {
  templateId: string;
  versionId?: string | null;
}) {
  const template = await prisma.template.findFirst({
    where: {
      id: input.templateId,
      sourceKind: TemplateSourceKind.CUSTOM,
      rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
      isActive: true,
    },
    include: {
      activeVersion: true,
      versions: input.versionId
        ? {
            where: {
              id: input.versionId,
            },
            take: 1,
          }
        : false,
    },
  });

  if (!template) {
    return null;
  }

  const selectedVersion =
    input.versionId && Array.isArray(template.versions) && template.versions.length > 0
      ? template.versions[0]
      : template.activeVersion;

  if (!selectedVersion) {
    return null;
  }

  return {
    template,
    version: selectedVersion,
  };
}

export async function getEditableRuntimeTemplateDraftForUser(input: {
  userId: string;
  templateId: string;
}) {
  return prisma.template.findFirst({
    where: {
      id: input.templateId,
      sourceKind: TemplateSourceKind.CUSTOM,
      rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
      createdByUserId: input.userId,
      isActive: true,
    },
    include: {
      activeVersion: true,
      variantFamily: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        select: {
          id: true,
        },
      },
      templateGroupAssignments: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              slug: true,
              sortOrder: true,
            },
          },
        },
      },
      versions: {
        orderBy: {
          versionNumber: "desc",
        },
      },
    },
  });
}

export async function getTemplateWithVersionsForUser(input: {
  userId: string;
  templateId: string;
  versionId?: string | null;
}) {
  const template = await prisma.template.findFirst({
    where: {
      id: input.templateId,
      sourceKind: TemplateSourceKind.CUSTOM,
      createdByUserId: input.userId,
    },
    include: {
      activeVersion: true,
      variantFamily: {
        select: {
          id: true,
          name: true,
        },
      },
      variants: {
        select: {
          id: true,
        },
      },
      templateGroupAssignments: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              slug: true,
              sortOrder: true,
            },
          },
        },
      },
      versions: {
        orderBy: {
          versionNumber: "desc",
        },
      },
    },
  });

  if (!template) {
    return null;
  }

  const selectedVersion = input.versionId
    ? template.versions.find((version) => version.id === input.versionId) ?? template.activeVersion
    : template.activeVersion;

  const groupingMetadata = buildTemplateGroupingMetadata({
    systemCategories: extractTemplateCategoriesFromSummaryJson(
      selectedVersion?.summaryJson ?? template.activeVersion?.summaryJson ?? null,
    ),
    userGroups: resolveTemplateUserGroupsFromAssignments(template.templateGroupAssignments),
  });

  return {
    ...template,
    ...groupingMetadata,
    variantFamilyTemplate:
      template.variantFamily ??
      (template.variants.length > 0
        ? {
            id: template.id,
            name: template.name,
          }
        : null),
    variantCount: template.variants.length,
    isVariant: Boolean(template.variantFamilyId),
    templateCategories: groupingMetadata.systemCategories,
    selectedVersion,
  };
}

export async function saveRuntimeTemplateDraftForUser(input: {
  userId: string;
  templateId: string;
  versionId: string;
  name: string;
  description?: string | null;
  document: RuntimeTemplateDocument;
  editorState: Prisma.InputJsonValue;
}) {
  const parsedDraft = runtimeTemplateDocumentDraftSchema.safeParse(input.document);
  if (!parsedDraft.success) {
    const details = parsedDraft.error.issues
      .slice(0, 3)
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
      .join(" | ");
    throw new Error(
      details
        ? `Runtime template draft structure is invalid. ${details}`
        : "Runtime template draft structure is invalid.",
    );
  }

  const draftDocument = parsedDraft.data;
  const summary = summarizeRuntimeTemplateDocument(draftDocument);

  return prisma.$transaction(async (tx) => {
    const template = await tx.template.findFirst({
      where: {
        id: input.templateId,
        createdByUserId: input.userId,
        sourceKind: TemplateSourceKind.CUSTOM,
        rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
      },
      include: {
        activeVersion: true,
      },
    });

    if (!template) {
      throw new Error("Runtime template draft not found.");
    }

    if (template.activeVersionId !== input.versionId) {
      throw new Error("Only the active draft version can be edited.");
    }

    if (
      template.activeVersion?.isLocked ||
      template.activeVersion?.lifecycleStatus === TemplateLifecycleStatus.FINALIZED
    ) {
      throw new Error("Finalized runtime template versions are immutable.");
    }

    const updatedTemplate = await tx.template.update({
      where: { id: template.id },
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        canvasWidth: draftDocument.canvas.width,
        canvasHeight: draftDocument.canvas.height,
        lifecycleStatus: TemplateLifecycleStatus.DRAFT,
      },
    });

      const updatedVersion = await tx.templateVersion.update({
        where: { id: input.versionId },
        data: {
          lifecycleStatus: TemplateLifecycleStatus.DRAFT,
          isLocked: false,
          schemaJson: draftDocument as unknown as Prisma.InputJsonValue,
          editorStateJson: input.editorState,
          summaryJson: summary as unknown as Prisma.InputJsonValue,
        },
      });

      return {
        template: updatedTemplate,
        version: updatedVersion,
        summary,
        validation: parseStoredValidation(updatedVersion.validationJson),
      };
    }, runtimeTemplateTransactionOptions);
}

export async function runRuntimeTemplateValidationForUser(input: {
  userId: string;
  templateId: string;
  versionId: string;
}) {
  const version = await getOwnedRuntimeTemplateVersion(input);
  const document = runtimeTemplateDocumentSchema.parse(version.schemaJson);
  const validation = validateRuntimeTemplateDocument(document, { mode: "full" });
  const summary = validation.document
    ? summarizeRuntimeTemplateDocument(validation.document)
    : summarizeRuntimeTemplateDocument(document);

  await prisma.templateVersion.update({
    where: {
      id: version.id,
    },
    data: {
      summaryJson: summary as unknown as Prisma.InputJsonValue,
      validationJson: toValidationJson(validation),
    },
  });

  return {
    validation,
    summary,
    versionId: version.id,
  };
}

export async function finalizeRuntimeTemplateVersionForUser(input: {
  userId: string;
  templateId: string;
  versionId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const template = await tx.template.findFirst({
      where: {
        id: input.templateId,
        createdByUserId: input.userId,
        sourceKind: TemplateSourceKind.CUSTOM,
        rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
      },
      include: {
        activeVersion: true,
        versions: {
          where: {
            id: input.versionId,
          },
          take: 1,
        },
      },
    });

    if (!template) {
      throw new Error("Runtime template not found.");
    }

    const version = template.versions[0] ?? template.activeVersion;
    if (!version || version.id !== input.versionId) {
      throw new Error("Runtime template version not found.");
    }

    if (version.isLocked || version.lifecycleStatus === TemplateLifecycleStatus.FINALIZED) {
      const document = runtimeTemplateDocumentSchema.parse(version.schemaJson);
      const validation =
        parseStoredValidation(version.validationJson) ??
        validateRuntimeTemplateDocument(document, { mode: "full" });
      return {
        version,
        validation,
      };
    }

    const document = runtimeTemplateDocumentSchema.parse(version.schemaJson);
    const validation = validateRuntimeTemplateDocument(document, { mode: "full" });
    if (!validation.document || validation.blockingErrorCount > 0) {
      await tx.templateVersion.update({
        where: { id: version.id },
        data: {
          summaryJson: summarizeRuntimeTemplateDocument(document) as unknown as Prisma.InputJsonValue,
          validationJson: toValidationJson(validation),
        },
      });
      throw new Error("Validation must pass before finalizing this runtime template version.");
    }

    const summary = summarizeRuntimeTemplateDocument(validation.document);
    const previewPreset = resolveDefaultPreviewPreset(validation.document);
    const previewPath = `/preview/runtime/${template.id}?versionId=${version.id}&preset=${previewPreset}`;
    const renderPath = `/render/${template.id}?versionId=${version.id}`;

    await tx.templateVersion.updateMany({
      where: {
        templateId: template.id,
      },
      data: {
        isActive: false,
      },
    });

    const finalizedVersion = await tx.templateVersion.update({
      where: {
        id: version.id,
      },
      data: {
        lifecycleStatus: TemplateLifecycleStatus.FINALIZED,
        isLocked: true,
        isActive: true,
        summaryJson: summary as unknown as Prisma.InputJsonValue,
        validationJson: toValidationJson(validation),
      },
    });

    await tx.template.update({
      where: {
        id: template.id,
      },
      data: {
        activeVersionId: finalizedVersion.id,
        lifecycleStatus: TemplateLifecycleStatus.FINALIZED,
        thumbnailPath: previewPath,
        previewImagePath: renderPath,
      },
    });

    return {
      version: finalizedVersion,
      validation,
      previewPath,
      renderPath,
    };
  }, runtimeTemplateTransactionOptions);
}

export async function createEditableDraftFromFinalizedTemplateForUser(input: {
  userId: string;
  templateId: string;
  sourceVersionId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const template = await tx.template.findFirst({
      where: {
        id: input.templateId,
        createdByUserId: input.userId,
        sourceKind: TemplateSourceKind.CUSTOM,
        rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
      },
      include: {
        activeVersion: true,
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
        },
      },
    });

    if (!template || !template.activeVersion) {
      throw new Error("Runtime template not found.");
    }

    const sourceVersion =
      (input.sourceVersionId
        ? template.versions.find((version) => version.id === input.sourceVersionId)
        : template.activeVersion) ?? template.activeVersion;

    if (
      sourceVersion.lifecycleStatus === TemplateLifecycleStatus.DRAFT &&
      !sourceVersion.isLocked &&
      template.activeVersionId === sourceVersion.id
    ) {
      return {
        templateId: template.id,
        versionId: sourceVersion.id,
        cloned: false,
      };
    }

    const schemaDocument = runtimeTemplateDocumentDraftSchema.parse(sourceVersion.schemaJson);
    const editorState =
      (sourceVersion.editorStateJson as Prisma.InputJsonValue | null) ??
      (createDefaultRuntimeTemplateEditorState() as unknown as Prisma.InputJsonValue);
    const validation = validateRuntimeTemplateDocument(schemaDocument, { mode: "full" });
    const summary = summarizeRuntimeTemplateDocument(
      validation.document ?? schemaDocument,
    );
    const nextVersionNumber = (template.versions[0]?.versionNumber ?? 0) + 1;

    await tx.templateVersion.updateMany({
      where: {
        templateId: template.id,
      },
      data: {
        isActive: false,
      },
    });

    const draftVersion = await tx.templateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: nextVersionNumber,
        lifecycleStatus: TemplateLifecycleStatus.DRAFT,
        schemaJson: schemaDocument as unknown as Prisma.InputJsonValue,
        editorStateJson: editorState,
        summaryJson: summary as unknown as Prisma.InputJsonValue,
        validationJson: toValidationJson(validation),
        isActive: true,
        isLocked: false,
        createdByUserId: input.userId,
      },
    });

    await tx.template.update({
      where: {
        id: template.id,
      },
      data: {
        activeVersionId: draftVersion.id,
        lifecycleStatus: TemplateLifecycleStatus.DRAFT,
      },
    });

    return {
      templateId: template.id,
      versionId: draftVersion.id,
      cloned: true,
      sourceVersionId: sourceVersion.id,
    };
  }, runtimeTemplateTransactionOptions);
}

export async function duplicateRuntimeTemplateDraftForUser(input: {
  userId: string;
  templateId: string;
  asVariant?: boolean;
}) {
  const source = await getEditableRuntimeTemplateDraftForUser(input);
  if (!source?.activeVersion) {
    throw new Error("Runtime template draft not found.");
  }

  const schemaDocument = runtimeTemplateDocumentDraftSchema.parse(source.activeVersion.schemaJson);
  const validation = validateRuntimeTemplateDocument(schemaDocument, { mode: "full" });
  const editorState =
    (source.activeVersion.editorStateJson as Prisma.InputJsonValue | null) ??
    (createDefaultRuntimeTemplateEditorState() as unknown as Prisma.InputJsonValue);
  const summary = summarizeRuntimeTemplateDocument(validation.document ?? schemaDocument);

  return prisma.$transaction(async (tx) => {
    const variantFamilyId = input.asVariant
      ? source.variantFamilyId ?? source.id
      : null;
    const variantFamilyName = variantFamilyId
      ? await getVariantFamilyName(tx, variantFamilyId, source.name)
      : null;
    const variantName = input.asVariant
      ? await buildNextVariantName(tx, variantFamilyId as string)
      : null;
    const name =
      input.asVariant && variantFamilyName && variantName
        ? `${variantFamilyName} ${variantName}`
        : `${source.name} Copy`;
    const slug = await buildUniqueTemplateSlug(tx, name);
    const componentKey = `runtime:${slug}`;

    const template = await tx.template.create({
      data: {
        name,
        slug,
        description: source.description,
        componentKey,
        configJson:
          source.configJson === null
            ? Prisma.JsonNull
            : (source.configJson as Prisma.InputJsonValue),
        isActive: true,
        sourceKind: TemplateSourceKind.CUSTOM,
        rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
        lifecycleStatus: TemplateLifecycleStatus.DRAFT,
        createdByUserId: input.userId,
        variantFamilyId,
        variantName,
        variantSortOrder: input.asVariant
          ? await buildNextVariantSortOrder(tx, variantFamilyId as string)
          : 0,
        canvasWidth: source.canvasWidth,
        canvasHeight: source.canvasHeight,
      },
    });

    const version = await tx.templateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        lifecycleStatus: TemplateLifecycleStatus.DRAFT,
        schemaJson: schemaDocument as unknown as Prisma.InputJsonValue,
        editorStateJson: editorState,
        summaryJson: summary as Prisma.InputJsonValue,
        validationJson: toValidationJson(validation),
        isActive: true,
        isLocked: false,
        createdByUserId: input.userId,
      },
    });

    await tx.template.update({
      where: { id: template.id },
      data: {
        activeVersionId: version.id,
      },
    });

    return {
      templateId: template.id,
      versionId: version.id,
      variantFamilyId,
      variantName,
    };
  }, runtimeTemplateTransactionOptions);
}

export async function archiveRuntimeTemplateForUser(input: {
  userId: string;
  templateId: string;
}) {
  const template = await prisma.template.findFirst({
    where: {
      id: input.templateId,
      createdByUserId: input.userId,
      sourceKind: TemplateSourceKind.CUSTOM,
      rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
    },
    include: {
      activeVersion: true,
    },
  });

  if (!template) {
    throw new Error("Runtime template not found.");
  }

  return prisma.template.update({
    where: { id: template.id },
    data: {
      lifecycleStatus: TemplateLifecycleStatus.ARCHIVED,
    },
  });
}

export async function deleteRuntimeTemplateForUser(input: {
  userId: string;
  templateId: string;
}) {
  const template = await prisma.template.findFirst({
    where: {
      id: input.templateId,
      createdByUserId: input.userId,
      sourceKind: TemplateSourceKind.CUSTOM,
      rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
    },
    include: {
      versions: {
        select: {
          lifecycleStatus: true,
        },
      },
      _count: {
        select: {
          generationPlans: true,
          generatedPins: true,
        },
      },
    },
  });

  if (!template) {
    throw new Error("Runtime template not found.");
  }

  const hasFinalizedVersion = template.versions.some(
    (version) => version.lifecycleStatus === TemplateLifecycleStatus.FINALIZED,
  );

  if (hasFinalizedVersion) {
    throw new Error("Finalized custom templates cannot be deleted. Archive them instead.");
  }

  if (template._count.generationPlans > 0 || template._count.generatedPins > 0) {
    throw new Error("Templates already used in plans or generated pins cannot be deleted.");
  }

  await prisma.template.delete({
    where: {
      id: template.id,
    },
  });

  return {
    deleted: true,
    templateId: template.id,
  };
}

export function createRuntimeTemplateVersionSnapshot(input: {
  document: RuntimeTemplateDocument;
}) {
  const validation = validateRuntimeTemplateDocument(input.document, { mode: "full" });
  const validatedDocument = validation.document;
  if (!validation.ok || !validatedDocument) {
    throw new Error("Runtime template snapshot is invalid.");
  }

  return {
    schemaJson: validatedDocument,
    summaryJson: summarizeRuntimeTemplateDocument(validatedDocument),
    validationJson: validation,
  };
}

async function getOwnedRuntimeTemplateVersion(input: {
  userId: string;
  templateId: string;
  versionId: string;
}) {
  const template = await prisma.template.findFirst({
    where: {
      id: input.templateId,
      createdByUserId: input.userId,
      sourceKind: TemplateSourceKind.CUSTOM,
      rendererKind: TemplateRendererKind.RUNTIME_SCHEMA,
    },
    include: {
      versions: {
        where: {
          id: input.versionId,
        },
        take: 1,
      },
    },
  });

  const version = template?.versions[0];
  if (!template || !version) {
    throw new Error("Runtime template version not found.");
  }

  return version;
}

function resolveDefaultPreviewPreset(document: RuntimeTemplateDocument) {
  if (document.presetPolicy.allowedPresetIds.length > 0) {
    return document.presetPolicy.allowedPresetIds[0];
  }
  const categoryPresetIds = getPresetIdsForCategories(
    document.presetPolicy.allowedPresetCategories as Parameters<typeof getPresetIdsForCategories>[0],
  );
  return categoryPresetIds[0] ?? getSampleRuntimeTemplateRenderProps().visualPreset ?? "teal-flare";
}

function toValidationJson(
  validation: RuntimeTemplateValidationResult<RuntimeTemplateDocument>,
) {
  return validation as unknown as Prisma.InputJsonValue;
}

function parseStoredValidation(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const warnings = Array.isArray(record.warnings) ? record.warnings : [];
  const structuralRecord =
    record.structural && typeof record.structural === "object"
      ? (record.structural as Record<string, unknown>)
      : {};
  const layoutRecord =
    record.layout && typeof record.layout === "object"
      ? (record.layout as Record<string, unknown>)
      : {};
  const presetRecord =
    record.preset && typeof record.preset === "object"
      ? (record.preset as Record<string, unknown>)
      : {};
  const stressRecord =
    record.stress && typeof record.stress === "object"
      ? (record.stress as Record<string, unknown>)
      : {};

  return {
    ok: Boolean(record.ok),
    document: (record.document ?? null) as RuntimeTemplateDocument | null,
    errors: errors as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["errors"],
    warnings: warnings as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["warnings"],
    structural: {
      errors: Array.isArray(structuralRecord.errors)
        ? (structuralRecord.errors as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["errors"])
        : [],
      warnings: Array.isArray(structuralRecord.warnings)
        ? (structuralRecord.warnings as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["warnings"])
        : [],
    },
    layout: {
      errors: Array.isArray(layoutRecord.errors)
        ? (layoutRecord.errors as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["errors"])
        : [],
      warnings: Array.isArray(layoutRecord.warnings)
        ? (layoutRecord.warnings as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["warnings"])
        : [],
    },
    preset: {
      errors: Array.isArray(presetRecord.errors)
        ? (presetRecord.errors as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["errors"])
        : [],
      warnings: Array.isArray(presetRecord.warnings)
        ? (presetRecord.warnings as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["warnings"])
        : [],
      contrastChecks: Array.isArray(presetRecord.contrastChecks)
        ? (presetRecord.contrastChecks as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["preset"]["contrastChecks"])
        : [],
      presetIdsChecked: Array.isArray(presetRecord.presetIdsChecked)
        ? presetRecord.presetIdsChecked.filter((entry): entry is string => typeof entry === "string")
        : [],
    },
    stress: {
      errors: Array.isArray(stressRecord.errors)
        ? (stressRecord.errors as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["errors"])
        : [],
      warnings: Array.isArray(stressRecord.warnings)
        ? (stressRecord.warnings as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["warnings"])
        : [],
      cases: Array.isArray(stressRecord.cases)
        ? (stressRecord.cases as RuntimeTemplateValidationResult<RuntimeTemplateDocument>["stress"]["cases"])
        : [],
    },
    generatedAt:
      typeof record.generatedAt === "string" ? record.generatedAt : new Date(0).toISOString(),
    blockingErrorCount:
      typeof record.blockingErrorCount === "number" ? record.blockingErrorCount : errors.length,
    mode: record.mode === "schema" ? "schema" : "full",
  } satisfies RuntimeTemplateValidationResult<RuntimeTemplateDocument>;
}

async function buildUniqueTemplateSlug(
  tx: Prisma.TransactionClient,
  name: string,
): Promise<string> {
  const base = slugifyTemplateName(name);
  let slug = base;
  let suffix = 2;

  while (await tx.template.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function buildNextVariantName(
  tx: Prisma.TransactionClient,
  variantFamilyId: string,
) {
  const family = await tx.template.findUnique({
    where: {
      id: variantFamilyId,
    },
    select: {
      variants: {
        select: {
          variantName: true,
        },
      },
    },
  });

  const existing = new Set(
    (family?.variants ?? [])
      .map((variant) => variant.variantName)
      .filter((value): value is string => Boolean(value)),
  );

  let index = existing.size + 1;
  let candidate = `Variant ${index}`;
  while (existing.has(candidate)) {
    index += 1;
    candidate = `Variant ${index}`;
  }

  return candidate;
}

async function getVariantFamilyName(
  tx: Prisma.TransactionClient,
  variantFamilyId: string,
  fallbackTemplateName: string,
) {
  const family = await tx.template.findUnique({
    where: {
      id: variantFamilyId,
    },
    select: {
      name: true,
    },
  });

  return family?.name ?? fallbackTemplateName;
}

async function buildNextVariantSortOrder(
  tx: Prisma.TransactionClient,
  variantFamilyId: string,
) {
  const current = await tx.template.findFirst({
    where: {
      variantFamilyId,
    },
    orderBy: {
      variantSortOrder: "desc",
    },
    select: {
      variantSortOrder: true,
    },
  });

  return (current?.variantSortOrder ?? 0) + 1;
}

function slugifyTemplateName(input: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "custom-template";
}

function extractTemplateCategoriesFromSummaryJson(summaryJson: Prisma.JsonValue | null) {
  if (!summaryJson || typeof summaryJson !== "object" || Array.isArray(summaryJson)) {
    return [];
  }

  const templateCategories = (summaryJson as Record<string, unknown>).templateCategories;
  if (!Array.isArray(templateCategories)) {
    return [];
  }

  return templateCategories.filter((value): value is string => typeof value === "string");
}
