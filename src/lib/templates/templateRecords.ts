import {
  Prisma,
  TemplateLifecycleStatus,
  TemplateRendererKind,
  TemplateSourceKind,
  type Template,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTemplateConfig } from "@/lib/templates/registry";

export function ensureBuiltInTemplateRecord(
  templateId: string,
  options?: {
    tx?: Prisma.TransactionClient;
  },
) {
  const templateConfig = getTemplateConfig(templateId);
  if (!templateConfig) {
    throw new Error(`Unknown built-in template: ${templateId}`);
  }

  const db = options?.tx ?? prisma;

  return db.template.upsert({
    where: { id: templateConfig.id },
    update: {
      name: templateConfig.name,
      componentKey: templateConfig.componentKey,
      configJson: templateConfig as unknown as Prisma.InputJsonValue,
      isActive: true,
      sourceKind: TemplateSourceKind.BUILTIN,
      rendererKind: TemplateRendererKind.BUILTIN_COMPONENT,
      lifecycleStatus: TemplateLifecycleStatus.FINALIZED,
      canvasWidth: templateConfig.canvas.width,
      canvasHeight: templateConfig.canvas.height,
    },
    create: {
      id: templateConfig.id,
      name: templateConfig.name,
      componentKey: templateConfig.componentKey,
      configJson: templateConfig as unknown as Prisma.InputJsonValue,
      isActive: true,
      sourceKind: TemplateSourceKind.BUILTIN,
      rendererKind: TemplateRendererKind.BUILTIN_COMPONENT,
      lifecycleStatus: TemplateLifecycleStatus.FINALIZED,
      canvasWidth: templateConfig.canvas.width,
      canvasHeight: templateConfig.canvas.height,
    },
  });
}

export async function ensureBuiltInTemplateRecords(
  templateIds: string[],
  options?: {
    tx?: Prisma.TransactionClient;
  },
) {
  const uniqueTemplateIds = normalizeTemplateIds(templateIds);
  const templates: Template[] = [];

  for (const templateId of uniqueTemplateIds) {
    templates.push(await ensureBuiltInTemplateRecord(templateId, options));
  }

  return templates;
}

export async function ensureTemplateRecordsForUser(input: {
  userId: string;
  templateIds: string[];
  tx?: Prisma.TransactionClient;
}) {
  const db = input.tx ?? prisma;
  const uniqueTemplateIds = normalizeTemplateIds(input.templateIds);

  if (uniqueTemplateIds.length === 0) {
    return [] satisfies Template[];
  }

  const builtInTemplateIds: string[] = [];
  const customTemplateIds: string[] = [];

  for (const templateId of uniqueTemplateIds) {
    if (getTemplateConfig(templateId)) {
      builtInTemplateIds.push(templateId);
      continue;
    }

    customTemplateIds.push(templateId);
  }

  const builtInTemplates = await ensureBuiltInTemplateRecords(builtInTemplateIds, {
    tx: input.tx,
  });
  const customTemplates =
    customTemplateIds.length > 0
      ? await db.template.findMany({
          where: {
            id: {
              in: customTemplateIds,
            },
            createdByUserId: input.userId,
            sourceKind: TemplateSourceKind.CUSTOM,
          },
        })
      : ([] satisfies Template[]);

  const templatesById = new Map<string, Template>();
  for (const template of [...builtInTemplates, ...customTemplates]) {
    templatesById.set(template.id, template);
  }

  const missingTemplateIds = uniqueTemplateIds.filter((templateId) => !templatesById.has(templateId));
  if (missingTemplateIds.length > 0) {
    throw new Error("One or more templates could not be found for this user.");
  }

  return uniqueTemplateIds.map((templateId) => templatesById.get(templateId)!);
}

function normalizeTemplateIds(templateIds: string[]) {
  return Array.from(
    new Set(
      templateIds
        .map((templateId) => templateId.trim())
        .filter(Boolean),
    ),
  );
}
