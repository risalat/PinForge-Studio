import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RuntimeTemplateDocument } from "@/lib/runtime-templates/schema";
import {
  createTemplateBlockContentFromSelection,
  summarizeTemplateBlockContent,
} from "@/lib/template-blocks/normalize";
import { templateBlockContentSchema } from "@/lib/template-blocks/schema";

export async function listTemplateBlocksForUser(userId: string) {
  const blocks = await prisma.templateBlock.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      sourceTemplate: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return blocks.map((block) => ({
    ...block,
    block: templateBlockContentSchema.parse(block.blockJson),
  }));
}

export async function createTemplateBlockForUser(input: {
  userId: string;
  name: string;
  description?: string;
  document: RuntimeTemplateDocument;
  elementIds: string[];
  sourceTemplateId?: string;
}) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Block name is required.");
  }

  const content = createTemplateBlockContentFromSelection({
    document: input.document,
    elementIds: input.elementIds,
  });

  if (!content) {
    throw new Error("Select at least one element to save a block.");
  }

  const summary = summarizeTemplateBlockContent(content);
  const slug = await buildUniqueTemplateBlockSlug(name, input.userId);

  return prisma.templateBlock.create({
    data: {
      userId: input.userId,
      name,
      slug,
      description: input.description?.trim() || null,
      sourceTemplateId: input.sourceTemplateId || null,
      elementCount: summary.elementCount,
      imageSlotCount: summary.imageSlotCount,
      blockJson: content as unknown as Prisma.InputJsonValue,
      previewMetaJson: {
        elementTypes: summary.elementTypes,
        textRoles: summary.textRoles,
      } satisfies Prisma.InputJsonValue,
    },
    include: {
      sourceTemplate: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function buildUniqueTemplateBlockSlug(name: string, userId: string) {
  const base = toSlug(name) || "template-block";
  let slug = base;
  let suffix = 2;

  while (
    await prisma.templateBlock.findFirst({
      where: {
        userId,
        slug,
      },
      select: {
        id: true,
      },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
