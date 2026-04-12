"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  RuntimeTemplateDocument,
  RuntimeTemplateElement,
} from "@/lib/runtime-templates/schema";
import { runtimeColorToHex } from "@/lib/runtime-templates/colors";
import {
  getRuntimeTemplateEffectiveDocument,
  getRuntimeTemplatePresetBackgroundValue,
  getRuntimeTemplatePresetElementStyleValue,
  setRuntimeTemplatePresetBackgroundOverride,
  setRuntimeTemplatePresetElementStyleOverride,
} from "@/lib/runtime-templates/presetOverrides";
import {
  resolveRuntimeBorderColor,
  resolveRuntimeFillColor,
  resolveRuntimeTemplateTokens,
  resolveRuntimeTextColor,
} from "@/lib/runtime-templates/tokens";
import {
  getTemplateVisualPresetSwatches,
  getTemplateVisualPresetCategoryMeta,
} from "@/lib/templates/visualPresets";
import {
  runtimeTemplateBorderTokenValues,
  runtimeTemplateFillTokenValues,
  runtimeTemplateFontTokenValues,
  runtimeTemplateImageFitModeValues,
  runtimeTemplateImageGridLayoutValues,
  runtimeTemplateImagePolicyModeValues,
  runtimeTemplateImageSemanticRoleValues,
  runtimeTemplateOverlayGradientValues,
  runtimeTemplateShadowTokenValues,
  runtimeTemplateShapeKindValues,
  runtimeTemplateTextAlignValues,
  runtimeTemplateTextTokenValues,
  runtimeTemplateTextTransformValues,
  type RuntimeTemplateValidationResult,
} from "@/lib/runtime-templates/types";
import {
  addValidationIgnoreRule,
  buildValidationIgnoreRuleFromIssue,
  describeValidationIgnoreRule,
  removeValidationIgnoreRule,
} from "@/lib/runtime-templates/validationIgnores";
import {
  templateVisualPresetCategories,
  templateVisualPresets,
  type TemplateVisualPresetCategoryId,
  type TemplateVisualPresetId,
} from "@/lib/templates/types";

type InspectorPanelProps = {
  document: RuntimeTemplateDocument;
  selectedElement: RuntimeTemplateElement | null;
  selectionCount?: number;
  currentPreset: TemplateVisualPresetId;
  onUpdateDocument: (updater: (document: RuntimeTemplateDocument) => RuntimeTemplateDocument) => void;
  onUpdateElement: (
    elementId: string,
    updater: (element: RuntimeTemplateElement) => RuntimeTemplateElement,
  ) => void;
};

export function InspectorPanel(props: InspectorPanelProps) {
  const {
    document,
    selectedElement,
    selectionCount = selectedElement ? 1 : 0,
    currentPreset,
    onUpdateDocument,
    onUpdateElement,
  } = props;
  const quickColorTargets = useMemo(
    () => getInspectorQuickColorTargets(selectedElement),
    [selectedElement],
  );
  const [quickColorTargetId, setQuickColorTargetId] = useState<string>("");
  const activeQuickColorTargetId = quickColorTargets.some(
    (target) => target.id === quickColorTargetId,
  )
    ? quickColorTargetId
    : (quickColorTargets[0]?.id ?? "");
  const presetPaletteSwatches = useMemo(
    () => getPresetPaletteSwatches(currentPreset),
    [currentPreset],
  );

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
      <div className="border-b border-[var(--dashboard-line)] px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
          Inspector
        </p>
        <h2 className="mt-0.5 text-lg font-bold text-[var(--dashboard-text)]">
          {selectionCount > 1
            ? `${selectionCount} elements selected`
            : selectedElement
              ? selectedElement.name
              : "Document settings"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {selectionCount > 1 ? (
            <MultiSelectionInspector selectionCount={selectionCount} />
          ) : selectedElement ? (
            <SelectedElementInspector
              document={document}
              selectedElement={selectedElement}
              currentPreset={currentPreset}
              onUpdateElement={onUpdateElement}
              onUpdateDocument={onUpdateDocument}
            />
          ) : (
            <DocumentInspector
              document={document}
              currentPreset={currentPreset}
              onUpdateDocument={onUpdateDocument}
            />
          )}

          <PresetPaletteTray
            swatches={presetPaletteSwatches}
            targets={quickColorTargets}
            activeTargetId={activeQuickColorTargetId}
            onChangeTarget={setQuickColorTargetId}
            onApplyColor={(value) => {
              const target = quickColorTargets.find(
                (entry) => entry.id === activeQuickColorTargetId,
              );
              if (!target) {
                return;
              }

              if (target.scope === "document") {
                onUpdateDocument((current) => ({
                  ...setRuntimeTemplatePresetBackgroundOverride(
                    current,
                    currentPreset,
                    {
                      customFill: value || undefined,
                    },
                    value
                      ? { lockFields: ["customFill"] }
                      : { unlockFields: ["customFill"] },
                  ),
                  background: {
                    ...current.background,
                    customFill: undefined,
                  },
                }));
                return;
              }

              if (target.elementId) {
                updatePresetScopedElementColor(
                  onUpdateDocument,
                  currentPreset,
                  target.elementId,
                  target.field,
                  value,
                );
              }
            }}
          />
        </div>
      </div>
    </section>
  );
}

function MultiSelectionInspector(props: { selectionCount: number }) {
  return (
    <div className="space-y-3">
      <SectionCard title="Multi-select">
        <p className="text-sm font-semibold text-[var(--dashboard-text)]">
          {props.selectionCount} elements selected
        </p>
        <p className="text-xs leading-5 text-[var(--dashboard-subtle)]">
          Use the top selection bar for batch actions like align, distribute, group, lock, hide,
          duplicate, and reorder. Select one element to edit its detailed settings here.
        </p>
      </SectionCard>
    </div>
  );
}

export function ValidationSidebar(props: {
  document: RuntimeTemplateDocument;
  validationResult: RuntimeTemplateValidationResult<RuntimeTemplateDocument>;
  persistedValidationResult?: RuntimeTemplateValidationResult<RuntimeTemplateDocument> | null;
  currentPreset: TemplateVisualPresetId;
  onUpdateDocument: (updater: (document: RuntimeTemplateDocument) => RuntimeTemplateDocument) => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
      <div className="border-b border-[var(--dashboard-line)] px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
          Validation
        </p>
        <h2 className="mt-0.5 text-lg font-bold text-[var(--dashboard-text)]">
          Finalize readiness
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <ValidationPanel {...props} />
      </div>
    </section>
  );
}

function SelectedElementInspector(props: {
  document: RuntimeTemplateDocument;
  selectedElement: RuntimeTemplateElement;
  currentPreset: TemplateVisualPresetId;
  onUpdateElement: (
    elementId: string,
    updater: (element: RuntimeTemplateElement) => RuntimeTemplateElement,
  ) => void;
  onUpdateDocument: (updater: (document: RuntimeTemplateDocument) => RuntimeTemplateDocument) => void;
}) {
  const { document, selectedElement, currentPreset, onUpdateElement, onUpdateDocument } = props;

  return (
    <div className="space-y-3">
      {renderElementSpecificControls(
        document,
        selectedElement,
        currentPreset,
        onUpdateElement,
        onUpdateDocument,
      )}

      <InspectorDisclosure title="Advanced" defaultOpen={false}>
        <div className="space-y-3">
          <TextInput
            label="Element name"
            value={selectedElement.name}
            onChange={(value) =>
              onUpdateElement(selectedElement.id, (element) => ({
                ...element,
                name: value || element.name,
              }))
            }
          />
        </div>
      </InspectorDisclosure>
    </div>
  );
}

function DocumentInspector(props: {
  document: RuntimeTemplateDocument;
  currentPreset: TemplateVisualPresetId;
  onUpdateDocument: (updater: (document: RuntimeTemplateDocument) => RuntimeTemplateDocument) => void;
}) {
  const { document, currentPreset, onUpdateDocument } = props;
  const backgroundColorOverride =
    getRuntimeTemplatePresetBackgroundValue(document, currentPreset, "customFill") ??
    document.background.customFill ??
    "";
  const backgroundPickerValue = getRuntimeBackgroundPickerValue(document, currentPreset);

  return (
    <div className="space-y-3">
      <SectionCard title="Setup">
        <InspectorSubsection title="Canvas">
          <div className="grid grid-cols-2 gap-2.5">
            <ReadOnlyValue label="Width" value={String(document.canvas.width)} />
            <ReadOnlyValue label="Height" value={String(document.canvas.height)} />
            <NumberInput label="Safe inset" value={document.canvas.safeInset} minimum={0} maximum={200} onChange={(value) => onUpdateDocument((current) => ({ ...current, canvas: { ...current.canvas, safeInset: value } }))} />
            <SelectInput label="Background fill" value={document.background.fillToken} options={runtimeTemplateFillTokenValues} onChange={(value) => onUpdateDocument((current) => ({ ...current, background: { fillToken: value as RuntimeTemplateDocument["background"]["fillToken"] } }))} />
          </div>
        </InspectorSubsection>
        <ColorPickerInput
          label="Background color override"
          value={backgroundColorOverride}
          pickerValue={backgroundPickerValue}
          onChange={(value) =>
            onUpdateDocument((current) => ({
              ...setRuntimeTemplatePresetBackgroundOverride(
                current,
                currentPreset,
                {
                  customFill: value || undefined,
                },
                value
                  ? { lockFields: ["customFill"] }
                  : { unlockFields: ["customFill"] },
              ),
              background: {
                ...current.background,
                customFill: undefined,
              },
            }))
          }
        />

        <InspectorSubsection title="Capabilities">
          <div className="grid grid-cols-2 gap-2.5">
            <NumberInput label="Image slot count" value={document.capabilities.imageSlotCount} minimum={1} maximum={24} onChange={(value) => onUpdateDocument((current) => ({ ...current, capabilities: { ...current.capabilities, imageSlotCount: value } }))} />
            <ToggleInput label="Supports subtitle" checked={document.capabilities.supportsSubtitle} onChange={(checked) => onUpdateDocument((current) => ({ ...current, capabilities: { ...current.capabilities, supportsSubtitle: checked } }))} />
            <ToggleInput label="Supports number" checked={document.capabilities.supportsItemNumber} onChange={(checked) => onUpdateDocument((current) => ({ ...current, capabilities: { ...current.capabilities, supportsItemNumber: checked } }))} />
            <ToggleInput label="Supports domain" checked={document.capabilities.supportsDomain} onChange={(checked) => onUpdateDocument((current) => ({ ...current, capabilities: { ...current.capabilities, supportsDomain: checked } }))} />
          </div>
        </InspectorSubsection>

        <InspectorSubsection title="Image policy">
          <div className="grid grid-cols-2 gap-2.5">
            <NumberInput label="Min slots required" value={document.validationRules.imagePolicy.minSlotsRequired} minimum={1} maximum={24} onChange={(value) => onUpdateDocument((current) => ({ ...current, validationRules: { ...current.validationRules, imagePolicy: { ...current.validationRules.imagePolicy, minSlotsRequired: value } } }))} />
            <SelectInput label="Mode" value={document.validationRules.imagePolicy.mode} options={runtimeTemplateImagePolicyModeValues} onChange={(value) => onUpdateDocument((current) => ({ ...current, validationRules: { ...current.validationRules, imagePolicy: { ...current.validationRules.imagePolicy, mode: value as RuntimeTemplateDocument["validationRules"]["imagePolicy"]["mode"] } } }))} />
          </div>
        </InspectorSubsection>
      </SectionCard>

      <SectionCard title="Preset policy">
        <ToggleInput
          label="Allow preset override"
          checked={document.presetPolicy.allowVisualPresetOverride}
          onChange={(checked) =>
            onUpdateDocument((current) => ({
              ...current,
              presetPolicy: {
                ...current.presetPolicy,
                allowVisualPresetOverride: checked,
              },
            }))
          }
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
              Allowed preset families
            </p>
            <p className="text-[11px] text-[var(--dashboard-subtle)]">
              {document.presetPolicy.allowedPresetCategories.length > 0
                ? `${document.presetPolicy.allowedPresetCategories.length} selected`
                : "All families allowed"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {templateVisualPresetCategories.map((categoryId) => {
              const active = document.presetPolicy.allowedPresetCategories.includes(categoryId);
              const meta = getTemplateVisualPresetCategoryMeta(categoryId);

              return (
                <ToggleChip
                  key={categoryId}
                  active={active}
                  label={meta.label}
                  onClick={() =>
                    onUpdateDocument((current) => ({
                      ...current,
                      presetPolicy: {
                        ...current.presetPolicy,
                        allowedPresetCategories: toggleStringValue(
                          current.presetPolicy.allowedPresetCategories,
                          categoryId,
                        ),
                      },
                    }))
                  }
                />
              );
            })}
          </div>
        </div>

        <details className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)]">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-[var(--dashboard-text)]">
            Exact presets
          </summary>
          <div className="space-y-3 border-t border-[var(--dashboard-line)] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-[var(--dashboard-subtle)]">
                Optional hard allowlist. If any exact presets are selected, finalize checks only those.
              </p>
              {document.presetPolicy.allowedPresetIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateDocument((current) => ({
                      ...current,
                      presetPolicy: {
                        ...current.presetPolicy,
                        allowedPresetIds: [],
                      },
                    }))
                  }
                  className="rounded-full border border-[var(--dashboard-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {templateVisualPresets.map((presetId) => (
                <ToggleChip
                  key={presetId}
                  active={document.presetPolicy.allowedPresetIds.includes(presetId)}
                  label={formatPresetLabel(presetId)}
                  onClick={() =>
                    onUpdateDocument((current) => ({
                      ...current,
                      presetPolicy: {
                        ...current.presetPolicy,
                        allowedPresetIds: toggleStringValue(
                          current.presetPolicy.allowedPresetIds,
                          presetId,
                        ),
                      },
                    }))
                  }
                />
              ))}
            </div>
          </div>
        </details>
      </SectionCard>

      <InspectorDisclosure title="Metadata" defaultOpen={false}>
        <div className="space-y-3">
          <TextInput label="Category" value={document.metadata.category} onChange={(value) => onUpdateDocument((current) => ({ ...current, metadata: { ...current.metadata, category: value } }))} />
          <TextInput label="Tags" value={document.metadata.tags.join(", ")} onChange={(value) => onUpdateDocument((current) => ({ ...current, metadata: { ...current.metadata, tags: value.split(",").map((item) => item.trim()).filter(Boolean) } }))} />
        </div>
      </InspectorDisclosure>
    </div>
  );
}

function renderElementSpecificControls(
  document: RuntimeTemplateDocument,
  selectedElement: RuntimeTemplateElement,
  currentPreset: TemplateVisualPresetId,
  onUpdateElement: InspectorPanelProps["onUpdateElement"],
  onUpdateDocument: InspectorPanelProps["onUpdateDocument"],
) {
  switch (selectedElement.type) {
    case "imageFrame":
      return renderImageFrameControls(document, selectedElement, currentPreset, onUpdateElement, onUpdateDocument);
    case "imageGrid":
      return renderImageGridControls(document, selectedElement, currentPreset, onUpdateElement, onUpdateDocument);
    case "shapeBlock":
      return renderShapeBlockControls(document, selectedElement, currentPreset, onUpdateElement, onUpdateDocument);
    case "overlay":
      return renderOverlayControls(document, selectedElement, currentPreset, onUpdateElement, onUpdateDocument);
    case "divider":
      return renderDividerControls(document, selectedElement, currentPreset, onUpdateElement, onUpdateDocument);
    default:
      return renderTextElementControls(document, selectedElement, currentPreset, onUpdateElement, onUpdateDocument);
  }
}

function getPresetScopedElementColorValue(
  document: RuntimeTemplateDocument,
  currentPreset: TemplateVisualPresetId,
  selectedElement: RuntimeTemplateElement,
  field:
    | "customFill"
    | "customBorderColor"
    | "overlayCustomFill"
    | "customTextColor",
) {
  const styleTokens = selectedElement.styleTokens as Record<string, unknown>;
  return (
    getRuntimeTemplatePresetElementStyleValue(document, currentPreset, selectedElement.id, field) ??
    ((styleTokens[field] as string | undefined) ?? "") ??
    ""
  );
}

function getRuntimeBackgroundPickerValue(
  document: RuntimeTemplateDocument,
  currentPreset: TemplateVisualPresetId,
) {
  const effectiveDocument = getRuntimeTemplateEffectiveDocument(document, currentPreset);
  const tokens = resolveRuntimeTemplateTokens(currentPreset);

  return (
    resolveRuntimeFillColor(
      tokens,
      effectiveDocument.background.fillToken,
      effectiveDocument.background.customFill,
    ) ?? ""
  );
}

function getRuntimeElementPickerValue(
  document: RuntimeTemplateDocument,
  currentPreset: TemplateVisualPresetId,
  elementId: string,
  field:
    | "customFill"
    | "customBorderColor"
    | "overlayCustomFill"
    | "customTextColor",
) {
  const effectiveDocument = getRuntimeTemplateEffectiveDocument(document, currentPreset);
  const effectiveElement = effectiveDocument.elements.find((element) => element.id === elementId);
  if (!effectiveElement) {
    return "";
  }

  const tokens = resolveRuntimeTemplateTokens(currentPreset);

  if (field === "customTextColor" && "textToken" in effectiveElement.styleTokens) {
    return resolveRuntimeTextColor(
      tokens,
      effectiveElement.styleTokens.textToken,
      effectiveElement.styleTokens.customTextColor,
    );
  }

  if (field === "customBorderColor" && "borderToken" in effectiveElement.styleTokens) {
    return (
      resolveRuntimeBorderColor(
        tokens,
        effectiveElement.styleTokens.borderToken,
        effectiveElement.styleTokens.customBorderColor,
      ) ?? ""
    );
  }

  if (field === "overlayCustomFill" && "overlayFillToken" in effectiveElement.styleTokens) {
    return (
      resolveRuntimeFillColor(
        tokens,
        effectiveElement.styleTokens.overlayFillToken,
        effectiveElement.styleTokens.overlayCustomFill,
      ) ?? ""
    );
  }

  if ("fillToken" in effectiveElement.styleTokens) {
    return (
      resolveRuntimeFillColor(
        tokens,
        effectiveElement.styleTokens.fillToken,
        effectiveElement.styleTokens.customFill,
      ) ?? ""
    );
  }

  return "";
}

function updatePresetScopedElementColor(
  onUpdateDocument: InspectorPanelProps["onUpdateDocument"],
  currentPreset: TemplateVisualPresetId,
  elementId: string,
  field:
    | "customFill"
    | "customBorderColor"
    | "overlayCustomFill"
    | "customTextColor",
  value: string,
) {
  onUpdateDocument((current) =>
    clearLegacyElementColorField(
      setRuntimeTemplatePresetElementStyleOverride(
        current,
        currentPreset,
        elementId,
        {
          [field]: value || undefined,
        },
        value ? { lockFields: [field] } : { unlockFields: [field] },
      ),
      elementId,
      field,
    ),
  );
}

function clearLegacyElementColorField(
  document: RuntimeTemplateDocument,
  elementId: string,
  field:
    | "customFill"
    | "customBorderColor"
    | "overlayCustomFill"
    | "customTextColor",
) {
  return {
    ...document,
    elements: document.elements.map((element) => {
      if (element.id !== elementId) {
        return element;
      }

      return {
        ...element,
        styleTokens: {
          ...element.styleTokens,
          [field]: undefined,
        },
      } as RuntimeTemplateElement;
    }),
  };
}

function renderImageFrameControls(
  document: RuntimeTemplateDocument,
  selectedElement: Extract<RuntimeTemplateElement, { type: "imageFrame" }>,
  currentPreset: TemplateVisualPresetId,
  onUpdateElement: InspectorPanelProps["onUpdateElement"],
  onUpdateDocument: InspectorPanelProps["onUpdateDocument"],
) {
  const fillPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customFill",
  );
  const overlayPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "overlayCustomFill",
  );
  const borderPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customBorderColor",
  );

  const updateImageFrame = (
    updater: (
      element: Extract<RuntimeTemplateElement, { type: "imageFrame" }>,
    ) => Extract<RuntimeTemplateElement, { type: "imageFrame" }>,
  ) =>
    onUpdateElement(selectedElement.id, (element) =>
      updater(element as Extract<RuntimeTemplateElement, { type: "imageFrame" }>),
    );

  return (
    <div className="space-y-3">
      <SectionCard title="Setup">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Semantic binding" value={selectedElement.semanticRole} options={runtimeTemplateImageSemanticRoleValues} onChange={(value) => updateImageFrame((element) => ({ ...element, semanticRole: value as typeof selectedElement.semanticRole }))} />
          <NumberInput label="Slot index" value={selectedElement.slotIndex} minimum={0} maximum={24} onChange={(value) => updateImageFrame((element) => ({ ...element, slotIndex: value }))} />
          <SelectInput label="Fit mode" value={selectedElement.fitMode} options={runtimeTemplateImageFitModeValues} onChange={(value) => updateImageFrame((element) => ({ ...element, fitMode: value as typeof selectedElement.fitMode }))} />
          <SelectInput label="Shape" value={selectedElement.shapeKind} options={runtimeTemplateShapeKindValues} onChange={(value) => updateImageFrame((element) => ({ ...element, shapeKind: value as typeof selectedElement.shapeKind }))} />
          <NumberInput label="Border radius" value={selectedElement.styleTokens.borderRadius} minimum={0} maximum={999} onChange={(value) => updateImageFrame((element) => ({ ...element, styleTokens: { ...element.styleTokens, borderRadius: value } }))} />
          <SelectInput label="Shadow token" value={selectedElement.styleTokens.shadowToken} options={runtimeTemplateShadowTokenValues} onChange={(value) => updateImageFrame((element) => ({ ...element, styleTokens: { ...element.styleTokens, shadowToken: value as typeof selectedElement.styleTokens.shadowToken } }))} />
        </div>
      </SectionCard>
      <SectionCard title="Style">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Fill token" value={selectedElement.styleTokens.fillToken ?? ""} options={["", ...runtimeTemplateFillTokenValues]} onChange={(value) => updateImageFrame((element) => ({ ...element, styleTokens: { ...element.styleTokens, fillToken: value ? (value as (typeof runtimeTemplateFillTokenValues)[number]) : undefined } }))} />
          <ColorPickerInput label="Fill color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customFill")} pickerValue={fillPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customFill", value)} />
          <SelectInput label="Border token" value={selectedElement.styleTokens.borderToken ?? ""} options={["", ...runtimeTemplateBorderTokenValues]} onChange={(value) => updateImageFrame((element) => ({ ...element, styleTokens: { ...element.styleTokens, borderToken: value ? (value as (typeof runtimeTemplateBorderTokenValues)[number]) : undefined } }))} />
          <ColorPickerInput label="Border color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customBorderColor")} pickerValue={borderPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customBorderColor", value)} />
        </div>
      </SectionCard>
      <InspectorDisclosure title="Crop" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2.5">
          <NumberInput
            label="Focus X"
            value={selectedElement.focalPoint.x}
            minimum={0}
            maximum={1}
            step={0.01}
            onChange={(value) =>
              updateImageFrame((element) => ({
                ...element,
                focalPoint: {
                  x: Math.min(Math.max(value, 0), 1),
                  y: element.focalPoint.y,
                },
              }))
            }
          />
          <NumberInput
            label="Focus Y"
            value={selectedElement.focalPoint.y}
            minimum={0}
            maximum={1}
            step={0.01}
            onChange={(value) =>
              updateImageFrame((element) => ({
                ...element,
                focalPoint: {
                  x: element.focalPoint.x,
                  y: Math.min(Math.max(value, 0), 1),
                },
              }))
            }
          />
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={() =>
              updateImageFrame((element) => ({
                ...element,
                focalPoint: { x: 0.5, y: 0.5 },
              }))
            }
            className="rounded-full border border-[var(--dashboard-line)] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
          >
            Reset crop
          </button>
        </div>
      </InspectorDisclosure>
      <InspectorDisclosure title="Overlay" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Overlay fill" value={selectedElement.styleTokens.overlayFillToken ?? ""} options={["", ...runtimeTemplateFillTokenValues]} onChange={(value) => updateImageFrame((element) => ({ ...element, styleTokens: { ...element.styleTokens, overlayFillToken: value ? (value as (typeof runtimeTemplateFillTokenValues)[number]) : undefined } }))} />
          <ColorPickerInput label="Overlay color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "overlayCustomFill")} pickerValue={overlayPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "overlayCustomFill", value)} />
          <SelectInput label="Overlay gradient" value={selectedElement.styleTokens.overlayGradient} options={runtimeTemplateOverlayGradientValues} onChange={(value) => updateImageFrame((element) => ({ ...element, styleTokens: { ...element.styleTokens, overlayGradient: value as typeof selectedElement.styleTokens.overlayGradient } }))} />
          <NumberInput label="Overlay opacity" value={selectedElement.styleTokens.overlayOpacity} minimum={0} maximum={1} step={0.05} onChange={(value) => updateImageFrame((element) => ({ ...element, styleTokens: { ...element.styleTokens, overlayOpacity: value } }))} />
        </div>
      </InspectorDisclosure>
    </div>
  );
}

function renderImageGridControls(
  document: RuntimeTemplateDocument,
  selectedElement: Extract<RuntimeTemplateElement, { type: "imageGrid" }>,
  currentPreset: TemplateVisualPresetId,
  onUpdateElement: InspectorPanelProps["onUpdateElement"],
  onUpdateDocument: InspectorPanelProps["onUpdateDocument"],
) {
  const fillPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customFill",
  );
  const overlayPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "overlayCustomFill",
  );
  const borderPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customBorderColor",
  );

  const updateImageGrid = (
    updater: (
      element: Extract<RuntimeTemplateElement, { type: "imageGrid" }>,
    ) => Extract<RuntimeTemplateElement, { type: "imageGrid" }>,
  ) =>
    onUpdateElement(selectedElement.id, (element) =>
      updater(element as Extract<RuntimeTemplateElement, { type: "imageGrid" }>),
    );

  return (
    <div className="space-y-3">
      <SectionCard title="Setup">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Semantic binding" value={selectedElement.semanticRole} options={runtimeTemplateImageSemanticRoleValues} onChange={(value) => updateImageGrid((element) => ({ ...element, semanticRole: value as typeof selectedElement.semanticRole }))} />
          <NumberInput label="Slot start" value={selectedElement.slotStartIndex} minimum={0} maximum={24} onChange={(value) => updateImageGrid((element) => ({ ...element, slotStartIndex: value }))} />
          <SelectInput label="Grid preset" value={selectedElement.layoutPreset} options={runtimeTemplateImageGridLayoutValues} onChange={(value) => updateImageGrid((element) => ({ ...element, layoutPreset: value as typeof selectedElement.layoutPreset }))} />
          <ReadOnlyValue label="Slot count" value={String(getGridSlotCount(selectedElement.layoutPreset))} />
          <NumberInput label="Gap" value={selectedElement.gap} minimum={0} maximum={120} onChange={(value) => updateImageGrid((element) => ({ ...element, gap: value }))} />
          <NumberInput label="Border radius" value={selectedElement.styleTokens.borderRadius} minimum={0} maximum={999} onChange={(value) => updateImageGrid((element) => ({ ...element, styleTokens: { ...element.styleTokens, borderRadius: value } }))} />
          <SelectInput label="Fit mode" value={selectedElement.fitMode} options={runtimeTemplateImageFitModeValues} onChange={(value) => updateImageGrid((element) => ({ ...element, fitMode: value as typeof selectedElement.fitMode }))} />
          <SelectInput label="Shadow token" value={selectedElement.styleTokens.shadowToken} options={runtimeTemplateShadowTokenValues} onChange={(value) => updateImageGrid((element) => ({ ...element, styleTokens: { ...element.styleTokens, shadowToken: value as typeof selectedElement.styleTokens.shadowToken } }))} />
        </div>
      </SectionCard>
      <SectionCard title="Style">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Fill token" value={selectedElement.styleTokens.fillToken ?? ""} options={["", ...runtimeTemplateFillTokenValues]} onChange={(value) => updateImageGrid((element) => ({ ...element, styleTokens: { ...element.styleTokens, fillToken: value ? (value as (typeof runtimeTemplateFillTokenValues)[number]) : undefined } }))} />
          <ColorPickerInput label="Fill color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customFill")} pickerValue={fillPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customFill", value)} />
          <SelectInput label="Border token" value={selectedElement.styleTokens.borderToken ?? ""} options={["", ...runtimeTemplateBorderTokenValues]} onChange={(value) => updateImageGrid((element) => ({ ...element, styleTokens: { ...element.styleTokens, borderToken: value ? (value as (typeof runtimeTemplateBorderTokenValues)[number]) : undefined } }))} />
          <ColorPickerInput label="Border color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customBorderColor")} pickerValue={borderPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customBorderColor", value)} />
        </div>
      </SectionCard>
      <InspectorDisclosure title="Overlay" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Overlay fill" value={selectedElement.styleTokens.overlayFillToken ?? ""} options={["", ...runtimeTemplateFillTokenValues]} onChange={(value) => updateImageGrid((element) => ({ ...element, styleTokens: { ...element.styleTokens, overlayFillToken: value ? (value as (typeof runtimeTemplateFillTokenValues)[number]) : undefined } }))} />
          <ColorPickerInput label="Overlay color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "overlayCustomFill")} pickerValue={overlayPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "overlayCustomFill", value)} />
          <SelectInput label="Overlay gradient" value={selectedElement.styleTokens.overlayGradient} options={runtimeTemplateOverlayGradientValues} onChange={(value) => updateImageGrid((element) => ({ ...element, styleTokens: { ...element.styleTokens, overlayGradient: value as typeof selectedElement.styleTokens.overlayGradient } }))} />
          <NumberInput label="Overlay opacity" value={selectedElement.styleTokens.overlayOpacity} minimum={0} maximum={1} step={0.05} onChange={(value) => updateImageGrid((element) => ({ ...element, styleTokens: { ...element.styleTokens, overlayOpacity: value } }))} />
        </div>
      </InspectorDisclosure>
    </div>
  );
}

function renderShapeBlockControls(
  document: RuntimeTemplateDocument,
  selectedElement: Extract<RuntimeTemplateElement, { type: "shapeBlock" }>,
  currentPreset: TemplateVisualPresetId,
  onUpdateElement: InspectorPanelProps["onUpdateElement"],
  onUpdateDocument: InspectorPanelProps["onUpdateDocument"],
) {
  const fillPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customFill",
  );
  const borderPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customBorderColor",
  );

  const updateShape = (
    updater: (
      element: Extract<RuntimeTemplateElement, { type: "shapeBlock" }>,
    ) => Extract<RuntimeTemplateElement, { type: "shapeBlock" }>,
  ) =>
    onUpdateElement(selectedElement.id, (element) =>
      updater(element as Extract<RuntimeTemplateElement, { type: "shapeBlock" }>),
    );

  return (
    <div className="space-y-3">
      <SectionCard title="Setup">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Shape" value={selectedElement.shapeKind} options={runtimeTemplateShapeKindValues} onChange={(value) => updateShape((element) => ({ ...element, shapeKind: value as typeof selectedElement.shapeKind }))} />
          <NumberInput label="Border radius" value={selectedElement.styleTokens.borderRadius} minimum={0} maximum={999} onChange={(value) => updateShape((element) => ({ ...element, styleTokens: { ...element.styleTokens, borderRadius: value } }))} />
          <SelectInput label="Shadow token" value={selectedElement.styleTokens.shadowToken} options={runtimeTemplateShadowTokenValues} onChange={(value) => updateShape((element) => ({ ...element, styleTokens: { ...element.styleTokens, shadowToken: value as typeof selectedElement.styleTokens.shadowToken } }))} />
        </div>
      </SectionCard>
      <SectionCard title="Style">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Fill token" value={selectedElement.styleTokens.fillToken} options={runtimeTemplateFillTokenValues} onChange={(value) => updateShape((element) => ({ ...element, styleTokens: { ...element.styleTokens, fillToken: value as typeof selectedElement.styleTokens.fillToken } }))} />
          <ColorPickerInput label="Fill color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customFill")} pickerValue={fillPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customFill", value)} />
          <SelectInput label="Border token" value={selectedElement.styleTokens.borderToken ?? ""} options={["", ...runtimeTemplateBorderTokenValues]} onChange={(value) => updateShape((element) => ({ ...element, styleTokens: { ...element.styleTokens, borderToken: value ? (value as (typeof runtimeTemplateBorderTokenValues)[number]) : undefined } }))} />
          <ColorPickerInput label="Border color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customBorderColor")} pickerValue={borderPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customBorderColor", value)} />
        </div>
      </SectionCard>
    </div>
  );
}

function renderOverlayControls(
  document: RuntimeTemplateDocument,
  selectedElement: Extract<RuntimeTemplateElement, { type: "overlay" }>,
  currentPreset: TemplateVisualPresetId,
  onUpdateElement: InspectorPanelProps["onUpdateElement"],
  onUpdateDocument: InspectorPanelProps["onUpdateDocument"],
) {
  const fillPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customFill",
  );

  const updateOverlay = (
    updater: (
      element: Extract<RuntimeTemplateElement, { type: "overlay" }>,
    ) => Extract<RuntimeTemplateElement, { type: "overlay" }>,
  ) =>
    onUpdateElement(selectedElement.id, (element) =>
      updater(element as Extract<RuntimeTemplateElement, { type: "overlay" }>),
    );

  return (
    <div className="space-y-3">
      <SectionCard title="Style">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Fill token" value={selectedElement.styleTokens.fillToken ?? ""} options={["", ...runtimeTemplateFillTokenValues]} onChange={(value) => updateOverlay((element) => ({ ...element, styleTokens: { ...element.styleTokens, fillToken: value ? (value as (typeof runtimeTemplateFillTokenValues)[number]) : undefined } }))} />
          <ColorPickerInput label="Fill color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customFill")} pickerValue={fillPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customFill", value)} />
          <SelectInput label="Gradient" value={selectedElement.styleTokens.gradient} options={runtimeTemplateOverlayGradientValues} onChange={(value) => updateOverlay((element) => ({ ...element, styleTokens: { ...element.styleTokens, gradient: value as typeof selectedElement.styleTokens.gradient } }))} />
          <NumberInput label="Opacity" value={selectedElement.styleTokens.opacity} minimum={0} maximum={1} step={0.05} onChange={(value) => updateOverlay((element) => ({ ...element, styleTokens: { ...element.styleTokens, opacity: value } }))} />
        </div>
      </SectionCard>
    </div>
  );
}

function renderDividerControls(
  document: RuntimeTemplateDocument,
  selectedElement: Extract<RuntimeTemplateElement, { type: "divider" }>,
  currentPreset: TemplateVisualPresetId,
  onUpdateElement: InspectorPanelProps["onUpdateElement"],
  onUpdateDocument: InspectorPanelProps["onUpdateDocument"],
) {
  const borderPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customBorderColor",
  );

  const updateDivider = (
    updater: (
      element: Extract<RuntimeTemplateElement, { type: "divider" }>,
    ) => Extract<RuntimeTemplateElement, { type: "divider" }>,
  ) =>
    onUpdateElement(selectedElement.id, (element) =>
      updater(element as Extract<RuntimeTemplateElement, { type: "divider" }>),
    );

  return (
    <SectionCard title="Style">
      <div className="grid grid-cols-2 gap-2.5">
        <NumberInput label="Stroke width" value={selectedElement.strokeWidth} minimum={1} maximum={20} onChange={(value) => updateDivider((element) => ({ ...element, strokeWidth: value }))} />
        <SelectInput label="Border token" value={selectedElement.styleTokens.borderToken} options={runtimeTemplateBorderTokenValues} onChange={(value) => updateDivider((element) => ({ ...element, styleTokens: { borderToken: value as typeof selectedElement.styleTokens.borderToken } }))} />
        <ColorPickerInput label="Border color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customBorderColor")} pickerValue={borderPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customBorderColor", value)} />
      </div>
    </SectionCard>
  );
}

function renderTextElementControls(
  document: RuntimeTemplateDocument,
  selectedElement: Extract<
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
  >,
  currentPreset: TemplateVisualPresetId,
  onUpdateElement: InspectorPanelProps["onUpdateElement"],
  onUpdateDocument: InspectorPanelProps["onUpdateDocument"],
) {
  const semanticOptions = getTextSemanticOptions(selectedElement.type);
  const textPickerValue = getRuntimeElementPickerValue(
    document,
    currentPreset,
    selectedElement.id,
    "customTextColor",
  );
  const updateText = (
    updater: (
      element: Extract<
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
      >,
    ) => Extract<
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
    >,
  ) =>
    onUpdateElement(selectedElement.id, (element) =>
      updater(
        element as Extract<
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
        >,
      ),
    );

  return (
    <div className="space-y-3">
      <SectionCard title="Setup">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Semantic binding" value={selectedElement.semanticRole} options={semanticOptions} onChange={(value) => updateText((element) => ({ ...element, semanticRole: value as typeof selectedElement.semanticRole }))} />
          <ToggleInput label="Hide when empty" checked={selectedElement.hideWhenEmpty} onChange={(checked) => updateText((element) => ({ ...element, hideWhenEmpty: checked }))} />
        </div>

        {(selectedElement.type === "ctaText" ||
          selectedElement.type === "labelText" ||
          selectedElement.semanticRole === "cta" ||
          selectedElement.semanticRole === "decorative") ? (
          <TextInput label="Static / fallback text" value={selectedElement.text} onChange={(value) => updateText((element) => ({ ...element, text: value }))} />
        ) : null}

        {selectedElement.type === "domainText" ? (
          <ToggleInput label="Sanitize domain" checked={selectedElement.sanitizeDomain} onChange={(checked) => updateText((element) => ({ ...element, sanitizeDomain: checked }))} />
        ) : null}
      </SectionCard>

      <SectionCard title="Style">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectInput label="Text token" value={selectedElement.styleTokens.textToken} options={runtimeTemplateTextTokenValues} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, textToken: value as typeof selectedElement.styleTokens.textToken } }))} />
          <ColorPickerInput label="Text color override" value={getPresetScopedElementColorValue(document, currentPreset, selectedElement, "customTextColor")} pickerValue={textPickerValue} onChange={(value) => updatePresetScopedElementColor(onUpdateDocument, currentPreset, selectedElement.id, "customTextColor", value)} />
          <SelectInput label="Font token" value={selectedElement.styleTokens.fontToken} options={runtimeTemplateFontTokenValues} getOptionLabel={formatRuntimeFontTokenLabel} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, fontToken: value as typeof selectedElement.styleTokens.fontToken } }))} />
          <SelectInput label="Text align" value={selectedElement.styleTokens.textAlign} options={runtimeTemplateTextAlignValues} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, textAlign: value as typeof selectedElement.styleTokens.textAlign } }))} />
          <SelectInput label="Transform" value={selectedElement.styleTokens.textTransform} options={runtimeTemplateTextTransformValues} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, textTransform: value as typeof selectedElement.styleTokens.textTransform } }))} />
          <ToggleInput label="Auto-fit" checked={selectedElement.styleTokens.autoFit} onChange={(checked) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, autoFit: checked } }))} />
        </div>
      </SectionCard>

      <InspectorDisclosure title="Text behavior" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2.5">
          <NumberInput label="Min font size" value={selectedElement.styleTokens.minFontSize} minimum={10} maximum={320} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, minFontSize: value } }))} />
          <NumberInput label="Max font size" value={selectedElement.styleTokens.maxFontSize} minimum={10} maximum={360} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, maxFontSize: value } }))} />
          <NumberInput label="Max lines" value={selectedElement.styleTokens.maxLines} minimum={1} maximum={6} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, maxLines: value } }))} />
          <NumberInput label="Line height" value={selectedElement.styleTokens.lineHeight} minimum={0.6} maximum={2.2} step={0.02} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, lineHeight: value } }))} />
          <NumberInput label="Letter spacing" value={selectedElement.styleTokens.letterSpacing} minimum={-0.3} maximum={0.6} step={0.01} onChange={(value) => updateText((element) => ({ ...element, styleTokens: { ...element.styleTokens, letterSpacing: value } }))} />
        </div>
      </InspectorDisclosure>
    </div>
  );
}

function ValidationPanel(props: {
  document: RuntimeTemplateDocument;
  validationResult: RuntimeTemplateValidationResult<RuntimeTemplateDocument>;
  persistedValidationResult?: RuntimeTemplateValidationResult<RuntimeTemplateDocument> | null;
  currentPreset: TemplateVisualPresetId;
  onUpdateDocument: (updater: (document: RuntimeTemplateDocument) => RuntimeTemplateDocument) => void;
}) {
  const {
    document,
    validationResult,
    persistedValidationResult,
    currentPreset,
    onUpdateDocument,
  } = props;
  const ignoredIssues = document.validationRules.ignoredIssues;
  const persistedStressCaseCount = Array.isArray(persistedValidationResult?.stress?.cases)
    ? persistedValidationResult.stress.cases.length
    : 0;
  const persistedContrastCheckCount = Array.isArray(
    persistedValidationResult?.preset?.contrastChecks,
  )
    ? persistedValidationResult.preset.contrastChecks.length
    : 0;
  const persistedBlockingErrors = persistedValidationResult?.errors.filter(
    (issue) => issue.blocking !== false,
  ) ?? [];
  const persistedWarnings = persistedValidationResult?.warnings ?? [];
  const hasLiveIssues =
    validationResult.errors.length > 0 || validationResult.warnings.length > 0;
  const failedSavedStressCases = persistedValidationResult?.stress?.cases.filter(
    (entry) => !entry.passed,
  ) ?? [];
  const failedSavedContrastChecks =
    persistedValidationResult?.preset?.contrastChecks.filter((entry) => !entry.passed) ?? [];
  const ignoreIssue = (issue: RuntimeTemplateValidationResult<RuntimeTemplateDocument>["errors"][number]) => {
    const nextRule = buildValidationIgnoreRuleFromIssue(issue);
    onUpdateDocument((current) => ({
      ...current,
      validationRules: {
        ...current.validationRules,
        ignoredIssues: addValidationIgnoreRule(current.validationRules.ignoredIssues, nextRule),
      },
    }));
  };
  const restoreIgnoredIssue = (
    rule: RuntimeTemplateDocument["validationRules"]["ignoredIssues"][number],
  ) => {
    onUpdateDocument((current) => ({
      ...current,
      validationRules: {
        ...current.validationRules,
        ignoredIssues: removeValidationIgnoreRule(current.validationRules.ignoredIssues, rule),
      },
    }));
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 -mx-1 rounded-[20px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)]/95 px-3 py-3 shadow-[var(--dashboard-shadow-sm)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <ValidationMetricPill tone={validationResult.blockingErrorCount > 0 ? "danger" : "neutral"} label={`${validationResult.blockingErrorCount} blocker${validationResult.blockingErrorCount === 1 ? "" : "s"}`} />
          <ValidationMetricPill tone={validationResult.warnings.length > 0 ? "warning" : "neutral"} label={`${validationResult.warnings.length} warning${validationResult.warnings.length === 1 ? "" : "s"}`} />
          <ValidationMetricPill tone="neutral" label={formatPresetLabel(currentPreset)} />
          {ignoredIssues.length > 0 ? (
            <ValidationMetricPill tone="neutral" label={`${ignoredIssues.length} ignored`} />
          ) : null}
        </div>
        <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
          {hasLiveIssues
            ? "Live validation is active for the current preset."
            : "No live blocking issues for the current preset."}
        </p>
      </div>

      {validationResult.errors.length > 0 ? (
        <SectionCard title="Blocking issues">
          <div className="space-y-2">
            {validationResult.errors.map((issue) => (
              <IssueRow
                key={`${issue.code}-${issue.path ?? "root"}-${issue.message}`}
                issue={issue}
                actionLabel="Ignore"
                onAction={() => ignoreIssue(issue)}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {validationResult.warnings.length > 0 ? (
        <ValidationDisclosure
          title="Warnings"
          summary={`${validationResult.warnings.length} warning${validationResult.warnings.length === 1 ? "" : "s"} for the current preset.`}
          defaultOpen={validationResult.errors.length === 0}
        >
          <div className="space-y-2">
            {validationResult.warnings.map((issue) => (
              <IssueRow
                key={`${issue.code}-${issue.path ?? "root"}-${issue.message}`}
                issue={issue}
                actionLabel="Ignore"
                onAction={() => ignoreIssue(issue)}
              />
            ))}
          </div>
        </ValidationDisclosure>
      ) : null}

      {!hasLiveIssues ? (
        <SectionCard title="Live status">
          <p className="text-sm leading-6 text-[var(--dashboard-subtle)]">
            No live structural, layout, or contrast issues are blocking the current preset view.
          </p>
        </SectionCard>
      ) : null}

      {ignoredIssues.length > 0 ? (
        <ValidationDisclosure
          title="Ignored checks"
          summary={`${ignoredIssues.length} ignore rule${ignoredIssues.length === 1 ? "" : "s"} active for this template.`}
        >
          <div className="space-y-2">
            {ignoredIssues.map((rule) => (
              <div
                key={`ignored-${rule.code}-${rule.path ?? "root"}-${rule.presetId ?? "any"}-${rule.stressCaseId ?? "any"}`}
                className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-sm text-[var(--dashboard-subtle)]">
                    <p className="font-semibold text-[var(--dashboard-text)]">
                      {describeValidationIgnoreRule(rule)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreIgnoredIssue(rule)}
                    className="shrink-0 rounded-full border border-[var(--dashboard-line)] bg-white px-3 py-1 text-xs font-semibold text-[var(--dashboard-text)]"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ValidationDisclosure>
      ) : null}

      {persistedValidationResult ? (
        <ValidationDisclosure
          title="Saved finalize report"
          summary={
            persistedValidationResult.blockingErrorCount > 0
              ? `${persistedValidationResult.blockingErrorCount} blocker${persistedValidationResult.blockingErrorCount === 1 ? "" : "s"} in the last saved validation run.`
              : "No saved blockers in the last finalize validation run."
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <ValidationMetricPill tone={persistedBlockingErrors.length > 0 ? "danger" : "neutral"} label={`${persistedBlockingErrors.length} blockers`} />
              <ValidationMetricPill tone={persistedWarnings.length > 0 ? "warning" : "neutral"} label={`${persistedWarnings.length} warnings`} />
              <ValidationMetricPill tone="neutral" label={`${persistedStressCaseCount} stress cases`} />
              <ValidationMetricPill tone="neutral" label={`${persistedContrastCheckCount} contrast checks`} />
            </div>

            {persistedBlockingErrors.length > 0 ? (
              <ValidationDisclosure
                title="Saved blockers"
                summary={`${persistedBlockingErrors.length} saved blocking issue${persistedBlockingErrors.length === 1 ? "" : "s"}.`}
              >
                <div className="space-y-2">
                  {persistedBlockingErrors.map((issue) => (
                    <IssueRow
                      key={`saved-${issue.code}-${issue.path ?? "root"}-${issue.message}`}
                      issue={issue}
                    />
                  ))}
                </div>
              </ValidationDisclosure>
            ) : null}

            {persistedWarnings.length > 0 ? (
              <ValidationDisclosure
                title="Saved warnings"
                summary={`${persistedWarnings.length} saved warning${persistedWarnings.length === 1 ? "" : "s"}.`}
              >
                <div className="space-y-2">
                  {persistedWarnings.map((issue) => (
                    <IssueRow
                      key={`saved-warning-${issue.code}-${issue.path ?? "root"}-${issue.message}`}
                      issue={issue}
                    />
                  ))}
                </div>
              </ValidationDisclosure>
            ) : null}

            <ValidationDisclosure
              title="Stress-case details"
              summary={
                failedSavedStressCases.length > 0
                  ? `${failedSavedStressCases.length} failed stress case${failedSavedStressCases.length === 1 ? "" : "s"}.`
                  : "All saved stress cases passed."
              }
            >
              <div className="space-y-2">
                {persistedValidationResult.stress.cases.map((entry) => (
                  <div
                    key={`stress-${entry.id}`}
                    className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                        {entry.label}
                      </p>
                      <ValidationMetricPill
                        tone={entry.passed ? "neutral" : entry.blocking ? "danger" : "warning"}
                        label={entry.passed ? "Passed" : entry.blocking ? "Failed" : "Warning"}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">
                      {entry.payloadSummary.title}
                    </p>
                  </div>
                ))}
              </div>
            </ValidationDisclosure>

            <ValidationDisclosure
              title="Contrast details"
              summary={
                failedSavedContrastChecks.length > 0
                  ? `${failedSavedContrastChecks.length} failed contrast check${failedSavedContrastChecks.length === 1 ? "" : "s"}.`
                  : "All saved contrast checks passed."
              }
            >
              <div className="space-y-2">
                {persistedValidationResult.preset.contrastChecks.map((check) => (
                  <div
                    key={`contrast-${check.presetId}-${check.elementId}-${check.role}`}
                    className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                        {check.role} · {formatPresetLabel(check.presetId)}
                      </p>
                      <ValidationMetricPill
                        tone={check.passed ? "neutral" : "danger"}
                        label={check.passed ? "Passed" : "Failed"}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">
                      Ratio {check.ratio?.toFixed(2) ?? "n/a"} / {check.minimumRatio.toFixed(1)} minimum
                    </p>
                  </div>
                ))}
              </div>
            </ValidationDisclosure>
          </div>
        </ValidationDisclosure>
      ) : null}
    </div>
  );
}

function IssueRow(props: {
  issue: RuntimeTemplateValidationResult["errors"][number];
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { issue, actionLabel, onAction } = props;
  const isError = issue.level === "error";

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${isError ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]" : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{issue.message}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {issue.path ? (
              <span className="rounded-full border border-current/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">
                {issue.path}
              </span>
            ) : null}
            {issue.context?.stressCaseLabel ? (
              <span className="rounded-full border border-current/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">
                {issue.context.stressCaseLabel}
              </span>
            ) : null}
            {issue.context?.presetId ? (
              <span className="rounded-full border border-current/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">
                {formatPresetLabel(issue.context.presetId)}
              </span>
            ) : null}
          </div>
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${isError ? "border border-[var(--dashboard-danger-border)] bg-white/80 text-[var(--dashboard-danger-ink)]" : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-text)]"}`}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function getTextSemanticOptions(
  type: Extract<
    RuntimeTemplateElement["type"],
    "titleText" | "subtitleText" | "domainText" | "numberText" | "ctaText" | "labelText"
  >,
) {
  if (type === "titleText") {
    return ["title", "subtitle", "domain", "cta", "decorative"] as const;
  }
  if (type === "subtitleText") {
    return ["subtitle", "title", "domain", "cta", "decorative"] as const;
  }
  if (type === "domainText") {
    return ["domain", "cta", "decorative"] as const;
  }
  if (type === "numberText") {
    return ["itemNumber", "decorative"] as const;
  }
  if (type === "ctaText") {
    return ["cta", "decorative"] as const;
  }
  return ["decorative", "cta", "subtitle"] as const;
}

function getGridSlotCount(layout: (typeof runtimeTemplateImageGridLayoutValues)[number]) {
  if (layout === "split-2-vertical" || layout === "split-2-horizontal") {
    return 2;
  }
  if (layout === "stack-3") {
    return 3;
  }
  if (layout === "grid-4") {
    return 4;
  }
  if (layout === "collage-5") {
    return 5;
  }
  if (layout === "split-6") {
    return 6;
  }
  if (layout === "grid-8") {
    return 8;
  }
  return 9;
}

function ValidationDisclosure(props: {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={props.defaultOpen}
      className="group rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{props.title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--dashboard-subtle)]">{props.summary}</p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)] group-open:hidden">
          Expand
        </span>
        <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)] group-open:inline">
          Collapse
        </span>
      </summary>
      <div className="border-t border-[var(--dashboard-line)] px-3 py-3">{props.children}</div>
    </details>
  );
}

function ValidationMetricPill(props: {
  label: string;
  tone: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    props.tone === "danger"
      ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
      : props.tone === "warning"
        ? "border-[color-mix(in_srgb,var(--dashboard-warning)_35%,white)] bg-[color-mix(in_srgb,var(--dashboard-warning)_12%,white)] text-[var(--dashboard-warning-ink)]"
        : "border-[var(--dashboard-line)] bg-white text-[var(--dashboard-subtle)]";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClass}`}
    >
      {props.label}
    </span>
  );
}

function InspectorDisclosure(props: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={props.defaultOpen}
      className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]"
    >
      <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-[var(--dashboard-text)]">
        {props.title}
      </summary>
      <div className="border-t border-[var(--dashboard-line)] px-3 py-3">
        {props.children}
      </div>
    </details>
  );
}

function InspectorSubsection(props: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
        {props.title}
      </p>
      {props.children}
    </div>
  );
}

function SectionCard(props: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
        {props.title}
      </p>
      <div className="mt-2.5 space-y-2.5">{props.children}</div>
    </div>
  );
}

function TextInput(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
      {props.label}
      <input type="text" value={props.value} onChange={(event) => props.onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]" />
    </label>
  );
}

function NumberInput(props: { label: string; value: number; minimum?: number; maximum?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
      {props.label}
      <input type="number" min={props.minimum} max={props.maximum} step={props.step ?? 1} value={Number.isFinite(props.value) ? props.value : 0} onChange={(event) => props.onChange(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]" />
    </label>
  );
}

function SelectInput(props: {
  label: string;
  value: string;
  options: readonly string[];
  getOptionLabel?: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
      {props.label}
      <select value={props.value} onChange={(event) => props.onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]">
        {props.options.map((option) => (
          <option key={option || "empty"} value={option}>
            {props.getOptionLabel?.(option) ?? (option || "None")}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorPickerInput(props: {
  label: string;
  value: string;
  pickerValue?: string;
  onChange: (value: string) => void;
}) {
  return <ColorPickerField {...props} />;
}

function ColorPickerField(props: {
  label: string;
  value: string;
  pickerValue?: string;
  onChange: (value: string) => void;
}) {
  const colorHex = useMemo(
    () => runtimeColorToHex(props.value || props.pickerValue || "") ?? "#ffffff",
    [props.pickerValue, props.value],
  );

  return (
    <div className="relative block text-sm font-semibold text-[var(--dashboard-subtle)]">
      <span>{props.label}</span>
      <div className="mt-2 flex items-center gap-2">
        <label className="flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-[var(--dashboard-line)] bg-white px-3 transition hover:border-[var(--dashboard-accent)]">
          <input
            type="color"
            value={colorHex}
            onChange={(event) => props.onChange(event.target.value)}
            className="sr-only"
          />
          <span
            className="h-6 w-6 shrink-0 rounded-md border border-[var(--dashboard-line)]"
            style={{
              background: props.value
                ? colorHex
                : "linear-gradient(135deg, #ffffff 0%, #eef1f8 100%)",
            }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[var(--dashboard-text)]">
              {props.value || "Use preset color"}
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
              Click to pick
            </span>
          </span>
        </label>
        {props.value ? (
          <button
            type="button"
            onClick={() => {
              props.onChange("");
            }}
            className="rounded-full border border-[var(--dashboard-line)] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ToggleInput(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]">
      <span>{props.label}</span>
      <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} className="h-4 w-4 rounded border-[var(--dashboard-line)] text-[var(--dashboard-accent)] focus:ring-[var(--dashboard-accent)]" />
    </label>
  );
}

function ReadOnlyValue(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
        {props.label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--dashboard-text)]">{props.value}</p>
    </div>
  );
}

function ToggleChip(props: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        props.active
          ? "border-[var(--dashboard-accent)] bg-[color-mix(in_srgb,var(--dashboard-accent)_10%,white)] text-[var(--dashboard-accent)]"
          : "border-[var(--dashboard-line)] bg-white text-[var(--dashboard-subtle)] hover:border-[var(--dashboard-accent-soft)]"
      }`}
    >
      {props.label}
    </button>
  );
}

function toggleStringValue<T extends string>(values: readonly T[], value: T) {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

function formatPresetLabel(
  presetId: string | TemplateVisualPresetCategoryId,
) {
  return presetId
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatRuntimeFontTokenLabel(value: string) {
  const labels: Record<string, string> = {
    "font.title": "Preset Title",
    "font.subtitle": "Preset Subtitle",
    "font.meta": "Preset Meta",
    "font.number": "Preset Number",
    "font.cta": "CTA Sans",
    "font.editorial-serif": "Editorial Serif",
    "font.display-serif": "Display Serif",
    "font.classic-serif": "Classic Serif",
    "font.book-serif": "Book Serif",
    "font.modern-sans": "Modern Sans",
    "font.grotesk": "Grotesk",
    "font.clean-sans": "Clean Sans",
    "font.condensed-sans": "Condensed Sans",
    "font.bold-sans": "Bold Sans",
    "font.rounded-sans": "Rounded Sans",
    "font.script": "Script",
    "font.signature": "Signature",
  };

  return labels[value] ?? (value || "None");
}

type InspectorQuickColorTarget = {
  id: string;
  label: string;
  scope: "document" | "element";
  elementId?: string;
  field:
    | "customFill"
    | "customBorderColor"
    | "overlayCustomFill"
    | "customTextColor";
};

function getInspectorQuickColorTargets(
  selectedElement: RuntimeTemplateElement | null,
): InspectorQuickColorTarget[] {
  if (!selectedElement) {
    return [
      {
        id: "document-background",
        label: "Background",
        scope: "document",
        field: "customFill",
      },
    ];
  }

  switch (selectedElement.type) {
    case "imageFrame":
    case "imageGrid":
      return [
        {
          id: `${selectedElement.id}-fill`,
          label: "Fill",
          scope: "element",
          elementId: selectedElement.id,
          field: "customFill",
        },
        {
          id: `${selectedElement.id}-overlay`,
          label: "Overlay",
          scope: "element",
          elementId: selectedElement.id,
          field: "overlayCustomFill",
        },
        {
          id: `${selectedElement.id}-border`,
          label: "Border",
          scope: "element",
          elementId: selectedElement.id,
          field: "customBorderColor",
        },
      ];
    case "shapeBlock":
      return [
        {
          id: `${selectedElement.id}-fill`,
          label: "Fill",
          scope: "element",
          elementId: selectedElement.id,
          field: "customFill",
        },
        {
          id: `${selectedElement.id}-border`,
          label: "Border",
          scope: "element",
          elementId: selectedElement.id,
          field: "customBorderColor",
        },
      ];
    case "overlay":
      return [
        {
          id: `${selectedElement.id}-fill`,
          label: "Overlay",
          scope: "element",
          elementId: selectedElement.id,
          field: "customFill",
        },
      ];
    case "divider":
      return [
        {
          id: `${selectedElement.id}-border`,
          label: "Divider",
          scope: "element",
          elementId: selectedElement.id,
          field: "customBorderColor",
        },
      ];
    default:
      return [
        {
          id: `${selectedElement.id}-text`,
          label: "Text",
          scope: "element",
          elementId: selectedElement.id,
          field: "customTextColor",
        },
      ];
  }
}

function getPresetPaletteSwatches(presetId: TemplateVisualPresetId) {
  return getTemplateVisualPresetSwatches(presetId);
}

function PresetPaletteTray(props: {
  swatches: string[];
  targets: InspectorQuickColorTarget[];
  activeTargetId: string;
  onChangeTarget: (value: string) => void;
  onApplyColor: (value: string) => void;
}) {
  const { swatches, targets, activeTargetId, onChangeTarget, onApplyColor } = props;

  if (swatches.length === 0 || targets.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Preset palette">
      {targets.length > 1 ? (
        <div className="mb-1">
          <select
            value={activeTargetId}
            onChange={(event) => onChangeTarget(event.target.value)}
            className="w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
          >
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-8 gap-2">
        {swatches.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onApplyColor(value)}
            className="h-8 w-full rounded-lg border border-[var(--dashboard-line)] transition hover:scale-[1.03] hover:border-[var(--dashboard-accent)]"
            style={{ background: value }}
            aria-label={`Apply ${value}`}
            title={value}
          />
        ))}
      </div>
    </SectionCard>
  );
}
