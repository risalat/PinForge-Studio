import { getRuntimeTemplateGridSlotCount } from "@/lib/runtime-templates/imageGridPresets";
import type { RuntimeTemplateDocument, RuntimeTemplateElement } from "@/lib/runtime-templates/schema";
import type { TemplateRenderProps } from "@/lib/templates/types";

type RuntimeTextElement = Extract<
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
>;

export function resolveRuntimeTextBinding(input: {
  payload: TemplateRenderProps;
  element: RuntimeTextElement;
}) {
  const { payload, element } = input;

  switch (element.semanticRole) {
    case "title":
      return payload.title.trim();
    case "subtitle":
      return payload.subtitle?.trim() ?? "";
    case "domain":
      return sanitizeDomainText(payload.domain, "sanitizeDomain" in element ? element.sanitizeDomain : true);
    case "itemNumber":
      return typeof payload.itemNumber === "number" && Number.isFinite(payload.itemNumber)
        ? String(payload.itemNumber)
        : "";
    case "cta":
      return "text" in element && element.text.trim() ? element.text.trim() : "Read more";
    case "decorative":
      return "text" in element ? element.text.trim() : "";
    default:
      return "";
  }
}

export function resolveRuntimeImage(input: {
  document: RuntimeTemplateDocument;
  payload: TemplateRenderProps;
  slotIndex: number;
}) {
  const { document, payload, slotIndex } = input;
  const images = payload.images.filter((value) => value.trim() !== "");
  const exact = images[slotIndex];

  if (exact) {
    return exact;
  }

  const mode = document.validationRules.imagePolicy.mode;
  if (mode === "ALLOW_FEWER_DUPLICATE_LAST" && images.length > 0) {
    return images[images.length - 1];
  }

  if (mode === "ALLOW_FEWER_FILL_PLACEHOLDER") {
    return "/sample-images/1.jpg";
  }

  return null;
}

export function resolveRuntimeImageGrid(input: {
  document: RuntimeTemplateDocument;
  payload: TemplateRenderProps;
  element: Extract<RuntimeTemplateElement, { type: "imageGrid" }>;
}) {
  const { document, payload, element } = input;
  const slotCount = getRuntimeTemplateGridSlotCount(element.layoutPreset);

  return Array.from({ length: slotCount }, (_, offset) =>
    resolveRuntimeImage({
      document,
      payload,
      slotIndex: element.slotStartIndex + offset,
    }),
  );
}

export function getRuntimeTemplateUsedImageSlots(document: RuntimeTemplateDocument) {
  const slots = new Set<number>();

  document.elements.forEach((element) => {
    if (element.type === "imageFrame") {
      slots.add(element.slotIndex);
    }

    if (element.type === "imageGrid") {
      const slotCount = getRuntimeTemplateGridSlotCount(element.layoutPreset);
      Array.from({ length: slotCount }, (_, index) => element.slotStartIndex + index).forEach((slotIndex) =>
        slots.add(slotIndex),
      );
    }
  });

  return Array.from(slots).sort((left, right) => left - right);
}

function sanitizeDomainText(value: string, sanitize = true) {
  const trimmed = value.trim();
  if (!sanitize) {
    return trimmed;
  }

  return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "");
}
