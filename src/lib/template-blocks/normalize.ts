import { getRuntimeTemplateGridSlotCount } from "@/lib/runtime-templates/imageGridPresets";
import type {
  RuntimeTemplateDocument,
  RuntimeTemplateElement,
} from "@/lib/runtime-templates/schema";
import type { RuntimeTemplateTextSemanticRole } from "@/lib/runtime-templates/types";
import {
  templateBlockContentSchema,
  type TemplateBlockContent,
  type TemplateBlockSummary,
} from "@/lib/template-blocks/schema";

const collidingTextRoles = new Set<RuntimeTemplateTextSemanticRole>([
  "title",
  "subtitle",
  "itemNumber",
  "domain",
  "cta",
]);

export function createTemplateBlockContentFromSelection(input: {
  document: RuntimeTemplateDocument;
  elementIds: string[];
}): TemplateBlockContent | null {
  const selectedElements = input.document.elements
    .filter((element) => input.elementIds.includes(element.id))
    .sort((left, right) => left.zIndex - right.zIndex);

  if (selectedElements.length === 0) {
    return null;
  }

  const bounds = getElementBounds(selectedElements);
  const content = templateBlockContentSchema.parse({
    schemaVersion: 1,
    bounds: {
      width: bounds.width,
      height: bounds.height,
    },
    elements: selectedElements.map((element, index) => ({
      ...element,
      x: element.x - bounds.x,
      y: element.y - bounds.y,
      zIndex: (index + 1) * 10,
      locked: false,
    })),
  });

  return content;
}

export function insertTemplateBlockContent(input: {
  document: RuntimeTemplateDocument;
  content: TemplateBlockContent;
}): {
  document: RuntimeTemplateDocument;
  insertedElementIds: string[];
} {
  const content = templateBlockContentSchema.parse(input.content);
  const existingElements = [...input.document.elements];
  const nextZIndexBase = getMaxZIndex(existingElements);
  const nextGroupIds = new Map<string, string>();
  const nextElements: RuntimeTemplateElement[] = [];
  const usedTextRoles = new Set<RuntimeTemplateTextSemanticRole>(
    existingElements
      .filter(hasTextSemanticRole)
      .map((element) => element.semanticRole)
      .filter((role): role is RuntimeTemplateTextSemanticRole => collidingTextRoles.has(role)),
  );
  const initialSlotCursor = getNextImageSlotCursor(existingElements);
  let nextImageSlot = initialSlotCursor;
  const insertionOrigin = getBlockInsertOrigin({
    document: input.document,
    content,
    existingCount: existingElements.length,
  });

  content.elements
    .slice()
    .sort((left, right) => left.zIndex - right.zIndex)
    .forEach((element, index) => {
      const duplicate = {
        ...element,
        id: createElementId(element.type, [...existingElements, ...nextElements]),
        name: element.name,
        x: insertionOrigin.x + element.x,
        y: insertionOrigin.y + element.y,
        zIndex: nextZIndexBase + (index + 1) * 10,
        locked: false,
      } satisfies RuntimeTemplateElement;

      if (element.groupId) {
        const mappedGroupId =
          nextGroupIds.get(element.groupId) ??
          createElementGroupId([...existingElements, ...nextElements]);
        nextGroupIds.set(element.groupId, mappedGroupId);
        duplicate.groupId = mappedGroupId;
      } else {
        duplicate.groupId = undefined;
      }

      if (duplicate.type === "imageFrame") {
        duplicate.slotIndex = nextImageSlot;
        nextImageSlot += 1;
      }

      if (duplicate.type === "imageGrid") {
        duplicate.slotStartIndex = nextImageSlot;
        nextImageSlot += getRuntimeTemplateGridSlotCount(duplicate.layoutPreset);
      }

      if (hasTextSemanticRole(duplicate) && collidingTextRoles.has(duplicate.semanticRole)) {
        if (usedTextRoles.has(duplicate.semanticRole)) {
          duplicate.semanticRole = "decorative";
          duplicate.name = `${duplicate.name} Decorative`;
        } else {
          usedTextRoles.add(duplicate.semanticRole);
        }
      }

      nextElements.push(duplicate);
    });

  return {
    document: {
      ...input.document,
      elements: [...existingElements, ...nextElements],
    },
    insertedElementIds: nextElements.map((element) => element.id),
  };
}

export function summarizeTemplateBlockContent(content: TemplateBlockContent): TemplateBlockSummary {
  const parsed = templateBlockContentSchema.parse(content);
  const imageSlotCount = parsed.elements.reduce((count, element) => {
    if (element.type === "imageFrame") {
      return count + 1;
    }
    if (element.type === "imageGrid") {
      return count + getRuntimeTemplateGridSlotCount(element.layoutPreset);
    }
    return count;
  }, 0);

  return {
    elementCount: parsed.elements.length,
    imageSlotCount,
    elementTypes: [...new Set(parsed.elements.map((element) => element.type))],
    textRoles: [
      ...new Set(
        parsed.elements.filter(hasTextSemanticRole).map((element) => element.semanticRole),
      ),
    ],
  };
}

function getBlockInsertOrigin(input: {
  document: RuntimeTemplateDocument;
  content: TemplateBlockContent;
  existingCount: number;
}) {
  const preferredX = input.document.canvas.safeInset + 48 + (input.existingCount % 3) * 24;
  const preferredY = input.document.canvas.safeInset + 72 + (input.existingCount % 4) * 24;
  const maxX = Math.max(
    input.document.canvas.safeInset,
    input.document.canvas.width - input.content.bounds.width - input.document.canvas.safeInset,
  );
  const maxY = Math.max(
    input.document.canvas.safeInset,
    input.document.canvas.height - input.content.bounds.height - input.document.canvas.safeInset,
  );

  return {
    x: clamp(preferredX, input.document.canvas.safeInset, maxX),
    y: clamp(preferredY, input.document.canvas.safeInset, maxY),
  };
}

function getElementBounds(elements: RuntimeTemplateElement[]) {
  const left = Math.min(...elements.map((element) => element.x));
  const top = Math.min(...elements.map((element) => element.y));
  const right = Math.max(...elements.map((element) => element.x + element.width));
  const bottom = Math.max(...elements.map((element) => element.y + element.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function getMaxZIndex(elements: RuntimeTemplateElement[]) {
  return elements.reduce((maximum, element) => Math.max(maximum, element.zIndex), 0);
}

function getNextImageSlotCursor(elements: RuntimeTemplateElement[]) {
  return elements.reduce((maximum, element) => {
    if (element.type === "imageFrame") {
      return Math.max(maximum, element.slotIndex + 1);
    }
    if (element.type === "imageGrid") {
      return Math.max(
        maximum,
        element.slotStartIndex + getRuntimeTemplateGridSlotCount(element.layoutPreset),
      );
    }
    return maximum;
  }, 0);
}

function hasTextSemanticRole(
  element: RuntimeTemplateElement,
): element is Extract<
  RuntimeTemplateElement,
  {
    type:
      | "titleText"
      | "subtitleText"
      | "domainText"
      | "numberText"
      | "ctaText"
      | "labelText";
  }
> {
  return (
    element.type === "titleText" ||
    element.type === "subtitleText" ||
    element.type === "domainText" ||
    element.type === "numberText" ||
    element.type === "ctaText" ||
    element.type === "labelText"
  );
}

function createElementGroupId(elements: RuntimeTemplateElement[]) {
  const existing = new Set(
    elements
      .map((element) => element.groupId)
      .filter((value): value is string => Boolean(value)),
  );

  let index = existing.size + 1;
  let candidate = `group-${index}`;
  while (existing.has(candidate)) {
    index += 1;
    candidate = `group-${index}`;
  }

  return candidate;
}

function createElementId(
  type: RuntimeTemplateElement["type"],
  allElements: RuntimeTemplateElement[],
) {
  const prefix = type.replace(/([A-Z])/g, "-$1").toLowerCase();
  let index = allElements.length + 1;
  let candidate = `${prefix}-${index}`;
  const existing = new Set(allElements.map((element) => element.id));
  while (existing.has(candidate)) {
    index += 1;
    candidate = `${prefix}-${index}`;
  }
  return candidate;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
