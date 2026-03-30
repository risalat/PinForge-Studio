import { getPresetIdsForCategories } from "@/lib/templates/visualPresets";
import type { TemplateVisualPresetId } from "@/lib/templates/types";
import type { RuntimeTemplateDocument } from "@/lib/runtime-templates/schema";
import type {
  RuntimeTemplateBorderToken,
  RuntimeTemplateFillToken,
  RuntimeTemplateTextToken,
} from "@/lib/runtime-templates/types";

export const runtimeTemplatePresetElementOverrideFieldKeys = [
  "fillToken",
  "borderToken",
  "overlayFillToken",
  "textToken",
  "customFill",
  "customBorderColor",
  "overlayCustomFill",
  "customTextColor",
] as const;

export const runtimeTemplatePresetBackgroundOverrideFieldKeys = [
  "fillToken",
  "customFill",
] as const;

export type RuntimeTemplatePresetElementOverrideField =
  (typeof runtimeTemplatePresetElementOverrideFieldKeys)[number];
export type RuntimeTemplatePresetBackgroundOverrideField =
  (typeof runtimeTemplatePresetBackgroundOverrideFieldKeys)[number];

type RuntimeTemplatePresetBackgroundOverride = NonNullable<
  RuntimeTemplateDocument["presetOverrides"][string]
>["background"];

type RuntimeTemplatePresetElementOverride = NonNullable<
  NonNullable<RuntimeTemplateDocument["presetOverrides"][string]>["elements"][string]
>;

type RuntimeTemplatePresetElementStylePatch = Partial<{
  fillToken: RuntimeTemplateFillToken | undefined;
  borderToken: RuntimeTemplateBorderToken | undefined;
  overlayFillToken: RuntimeTemplateFillToken | undefined;
  textToken: RuntimeTemplateTextToken | undefined;
  customFill: string | undefined;
  customBorderColor: string | undefined;
  overlayCustomFill: string | undefined;
  customTextColor: string | undefined;
}>;

type RuntimeTemplatePresetBackgroundPatch = Partial<{
  fillToken: RuntimeTemplateFillToken | undefined;
  customFill: string | undefined;
}>;

export function getRuntimeTemplatePresetIds(document: RuntimeTemplateDocument) {
  if (document.presetPolicy.allowedPresetIds.length > 0) {
    return [...document.presetPolicy.allowedPresetIds] as TemplateVisualPresetId[];
  }

  return getPresetIdsForCategories(
    document.presetPolicy.allowedPresetCategories as Parameters<typeof getPresetIdsForCategories>[0],
  );
}

export function getRuntimeTemplateEffectiveDocument(
  document: RuntimeTemplateDocument,
  presetId?: string | null,
): RuntimeTemplateDocument {
  if (!presetId) {
    return document;
  }

  const presetOverride = document.presetOverrides[presetId];
  if (!presetOverride) {
    return document;
  }

  const backgroundOverride = omitLockedFields(
    presetOverride.background ?? {},
  ) as Partial<RuntimeTemplateDocument["background"]>;

  return {
    ...document,
    background: {
      ...document.background,
      ...backgroundOverride,
    },
    elements: document.elements.map((element) => {
      const elementOverride = presetOverride.elements[element.id];
      if (!elementOverride) {
        return element;
      }

      const elementStyleOverride = omitLockedFields(
        elementOverride,
      ) as Partial<typeof element.styleTokens>;

      return {
        ...element,
        styleTokens: {
          ...element.styleTokens,
          ...elementStyleOverride,
        } as typeof element.styleTokens,
      } as typeof element;
    }),
  };
}

function omitLockedFields<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== "lockedFields"),
  );
}

export function getRuntimeTemplatePresetElementStyleValue(
  document: RuntimeTemplateDocument,
  presetId: string,
  elementId: string,
  field: RuntimeTemplatePresetElementOverrideField,
) {
  const presetOverride = document.presetOverrides[presetId];
  const elementOverride = presetOverride?.elements[elementId];
  return elementOverride?.[field];
}

export function getRuntimeTemplatePresetBackgroundValue(
  document: RuntimeTemplateDocument,
  presetId: string,
  field: RuntimeTemplatePresetBackgroundOverrideField,
) {
  const presetOverride = document.presetOverrides[presetId];
  return presetOverride?.background?.[field];
}

export function isRuntimeTemplatePresetElementFieldLocked(
  document: RuntimeTemplateDocument,
  presetId: string,
  elementId: string,
  field: RuntimeTemplatePresetElementOverrideField,
) {
  return (
    document.presetOverrides[presetId]?.elements[elementId]?.lockedFields?.includes(field) ?? false
  );
}

export function isRuntimeTemplatePresetBackgroundFieldLocked(
  document: RuntimeTemplateDocument,
  presetId: string,
  field: RuntimeTemplatePresetBackgroundOverrideField,
) {
  return document.presetOverrides[presetId]?.background?.lockedFields?.includes(field) ?? false;
}

export function setRuntimeTemplatePresetElementStyleOverride(
  document: RuntimeTemplateDocument,
  presetId: string,
  elementId: string,
  patch: RuntimeTemplatePresetElementStylePatch,
  options?: {
    lockFields?: RuntimeTemplatePresetElementOverrideField[];
    unlockFields?: RuntimeTemplatePresetElementOverrideField[];
  },
): RuntimeTemplateDocument {
  const currentPresetOverride = document.presetOverrides[presetId] ?? { elements: {} };
  const currentElementOverride = currentPresetOverride.elements[elementId] ?? { lockedFields: [] };
  const nextElementOverride: RuntimeTemplatePresetElementOverride = {
    ...currentElementOverride,
    ...patch,
    lockedFields: [...(currentElementOverride.lockedFields ?? [])],
  };

  for (const field of options?.lockFields ?? []) {
    if (!nextElementOverride.lockedFields?.includes(field)) {
      nextElementOverride.lockedFields = [...(nextElementOverride.lockedFields ?? []), field];
    }
  }

  for (const field of options?.unlockFields ?? []) {
    nextElementOverride.lockedFields =
      nextElementOverride.lockedFields?.filter((entry) => entry !== field) ?? [];
  }

  for (const [key, value] of Object.entries(nextElementOverride)) {
    if (value === undefined) {
      delete (nextElementOverride as Record<string, unknown>)[key];
    }
  }

  if ((nextElementOverride.lockedFields?.length ?? 0) === 0) {
    delete (nextElementOverride as Record<string, unknown>).lockedFields;
  }

  const nextPresetOverride = {
    ...currentPresetOverride,
    elements: {
      ...currentPresetOverride.elements,
    },
  };

  if (Object.keys(nextElementOverride).length === 0) {
    delete nextPresetOverride.elements[elementId];
  } else {
    nextPresetOverride.elements[elementId] = nextElementOverride;
  }

  return applyRuntimeTemplatePresetOverride(document, presetId, nextPresetOverride);
}

export function setRuntimeTemplatePresetBackgroundOverride(
  document: RuntimeTemplateDocument,
  presetId: string,
  patch: RuntimeTemplatePresetBackgroundPatch,
  options?: {
    lockFields?: RuntimeTemplatePresetBackgroundOverrideField[];
    unlockFields?: RuntimeTemplatePresetBackgroundOverrideField[];
  },
): RuntimeTemplateDocument {
  const currentPresetOverride = document.presetOverrides[presetId] ?? { elements: {} };
  const currentBackground = currentPresetOverride.background ?? { lockedFields: [] };
  const nextBackground: RuntimeTemplatePresetBackgroundOverride = {
    ...currentBackground,
    ...patch,
    lockedFields: [...(currentBackground.lockedFields ?? [])],
  };

  for (const field of options?.lockFields ?? []) {
    if (!nextBackground.lockedFields?.includes(field)) {
      nextBackground.lockedFields = [...(nextBackground.lockedFields ?? []), field];
    }
  }

  for (const field of options?.unlockFields ?? []) {
    nextBackground.lockedFields =
      nextBackground.lockedFields?.filter((entry) => entry !== field) ?? [];
  }

  for (const [key, value] of Object.entries(nextBackground)) {
    if (value === undefined) {
      delete (nextBackground as Record<string, unknown>)[key];
    }
  }

  if ((nextBackground.lockedFields?.length ?? 0) === 0) {
    delete (nextBackground as Record<string, unknown>).lockedFields;
  }

  const nextPresetOverride = {
    ...currentPresetOverride,
    background: Object.keys(nextBackground).length > 0 ? nextBackground : undefined,
  };

  return applyRuntimeTemplatePresetOverride(document, presetId, nextPresetOverride);
}

function applyRuntimeTemplatePresetOverride(
  document: RuntimeTemplateDocument,
  presetId: string,
  presetOverride: RuntimeTemplateDocument["presetOverrides"][string],
): RuntimeTemplateDocument {
  const nextPresetOverrides = {
    ...document.presetOverrides,
  };

  const hasBackground = Boolean(presetOverride.background);
  const hasElements = Object.keys(presetOverride.elements ?? {}).length > 0;

  if (!hasBackground && !hasElements) {
    delete nextPresetOverrides[presetId];
  } else {
    nextPresetOverrides[presetId] = {
      ...(hasBackground ? { background: presetOverride.background } : {}),
      elements: presetOverride.elements ?? {},
    };
  }

  return {
    ...document,
    presetOverrides: nextPresetOverrides,
  };
}

export function clearRuntimeTemplatePresetOverridesForPreset(
  document: RuntimeTemplateDocument,
  presetId: string,
) {
  const nextPresetOverrides = {
    ...document.presetOverrides,
  };
  delete nextPresetOverrides[presetId];
  return {
    ...document,
    presetOverrides: nextPresetOverrides,
  };
}
