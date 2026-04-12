"use client";

import { RuntimeTemplateCanvas } from "@/components/runtime-template/RuntimeTemplateCanvas";
import { useCanvasInteractions } from "@/components/template-builder/useCanvasInteractions";
import type {
  RuntimeTemplateDocument,
  RuntimeTemplateEditorState,
  RuntimeTemplateElement,
} from "@/lib/runtime-templates/schema";
import type { TemplateRenderProps, TemplateVisualPresetId } from "@/lib/templates/types";
import { templateVisualPresets } from "@/lib/templates/types";
import type { PointerEvent as ReactPointerEvent } from "react";

type CanvasEditorProps = {
  document: RuntimeTemplateDocument;
  payload: TemplateRenderProps;
  editorState: RuntimeTemplateEditorState;
  selectedElementIds: string[];
  primarySelectedElementId: string | null;
  onChangeSelection: (
    elementIds: string[],
    primaryElementId: string | null,
    options?: { persistPrimary?: boolean },
  ) => void;
  onUpdateElement: (
    elementId: string,
    updater: (element: RuntimeTemplateElement) => RuntimeTemplateElement,
    options?: { recordHistory?: boolean },
  ) => void;
  onUpdateEditorState: (
    updater: (state: RuntimeTemplateEditorState) => RuntimeTemplateEditorState,
    options?: { recordHistory?: boolean },
  ) => void;
  onBeginHistoryAction: () => void;
  onChangeVisualPreset: (presetId: TemplateVisualPresetId) => void;
  cropModeElementId: string | null;
  onSetImageFrameFocalPoint: (elementId: string, point: { x: number; y: number }) => void;
};

const HANDLE_POSITIONS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

export function CanvasEditor(props: CanvasEditorProps) {
  const {
    document,
    payload,
    editorState,
    selectedElementIds,
    primarySelectedElementId,
    onChangeSelection,
    onUpdateElement,
    onUpdateEditorState,
    onBeginHistoryAction,
    onChangeVisualPreset,
    cropModeElementId,
    onSetImageFrameFocalPoint,
  } = props;

  const {
    stageRef,
    guides,
    marqueeRect,
    beginMove,
    beginResize,
    beginMarquee,
    clearSelection,
  } = useCanvasInteractions({
    zoom: editorState.zoom,
    canvasWidth: document.canvas.width,
    canvasHeight: document.canvas.height,
    safeInset: document.canvas.safeInset,
    showGuides: editorState.showGuides,
    elements: document.elements,
    selectedElementIds,
    onChangeSelection,
    onUpdateElement,
    onBeginHistoryAction,
  });

  const selectedElements = document.elements.filter((element) =>
    selectedElementIds.includes(element.id),
  );
  const selectedElement =
    selectedElements.length === 1
      ? selectedElements[0]
      : document.elements.find((element) => element.id === primarySelectedElementId) ?? null;
  const selectionBounds =
    selectedElements.length > 1 ? getSelectionBounds(selectedElements) : null;
  const overlayElements = [...document.elements]
    .filter((element) => element.visible)
    .sort((left, right) => right.zIndex - left.zIndex);
  const stageWidth = Math.round(document.canvas.width * editorState.zoom);
  const stageHeight = Math.round(document.canvas.height * editorState.zoom);
  const handleStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    beginMarquee(event);
  };

  const handleCanvasSurfacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    beginMarquee(event);
  };
  const handleWorkspacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const targetNode = event.target as Node | null;
    if (targetNode && stageRef.current?.contains(targetNode)) {
      return;
    }

    clearSelection();
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dashboard-line)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
            Canvas
          </p>
          <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
            1080 x 1920
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
            Preset
            <select
              value={payload.visualPreset}
              onChange={(event) =>
                onChangeVisualPreset(event.target.value as TemplateVisualPresetId)
              }
              className="bg-transparent text-sm font-semibold text-[var(--dashboard-text)] outline-none"
            >
              {templateVisualPresets.map((presetId) => (
                <option key={presetId} value={presetId}>
                  {presetId}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              onUpdateEditorState((state) => ({
                ...state,
                zoom: Math.max(0.2, Number((state.zoom - 0.1).toFixed(2))),
              }))
            }
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
          >
            -
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateEditorState((state) => ({
                ...state,
                zoom: 0.42,
              }))
            }
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]"
          >
            {Math.round(editorState.zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateEditorState((state) => ({
                ...state,
                zoom: Math.min(1.25, Number((state.zoom + 0.1).toFixed(2))),
              }))
            }
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
          >
            +
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateEditorState((state) => ({
                ...state,
                showSafeArea: !state.showSafeArea,
              }))
            }
            className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              editorState.showSafeArea
                ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
                : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-muted)]"
            }`}
          >
            Safe area
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateEditorState((state) => ({
                ...state,
                showGuides: !state.showGuides,
              }))
            }
            className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              editorState.showGuides
                ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
                : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-muted)]"
            }`}
          >
            Snap guides
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,#f7f9ff_0%,#edf2fb_45%,#e9eef8_100%)] p-6"
        onPointerDown={handleWorkspacePointerDown}
      >
        <div className="flex min-h-full items-start justify-center" onPointerDown={handleWorkspacePointerDown}>
          <div
            ref={stageRef}
            className="relative"
            style={{
              width: stageWidth,
              height: stageHeight,
            }}
            onPointerDown={handleStagePointerDown}
          >
            <div
              className="absolute left-0 top-0 overflow-hidden rounded-[24px] shadow-[0_40px_100px_rgba(15,23,42,0.25)]"
              style={{
                width: document.canvas.width,
                height: document.canvas.height,
                transform: `scale(${editorState.zoom})`,
                transformOrigin: "top left",
              }}
              onPointerDown={handleCanvasSurfacePointerDown}
            >
              {renderCanvasGuides(document, editorState)}
              {renderGuideLines(guides, document)}
              <RuntimeTemplateCanvas document={document} payload={payload} />
              {overlayElements.map((element) => (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    zIndex: element.zIndex + 1000,
                    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                    transformOrigin: "center center",
                  }}
                >
                  <button
                    type="button"
                    onPointerDown={(event) => beginMove(event, element)}
                    className={`absolute inset-0 rounded-[10px] border text-left transition ${
                      selectedElementIds.includes(element.id)
                        ? "border-[var(--dashboard-accent)] bg-[rgba(30,94,255,0.08)] shadow-[0_0_0_1px_rgba(30,94,255,0.18)]"
                        : "border-transparent bg-transparent hover:border-[rgba(30,94,255,0.3)] hover:bg-[rgba(30,94,255,0.05)]"
                    } ${element.locked ? "cursor-not-allowed" : "cursor-move"}`}
                  >
                    {primarySelectedElementId === element.id ? (
                      <span className="absolute left-2 top-2 rounded-full bg-[var(--dashboard-accent)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                        {element.name}
                      </span>
                    ) : null}
                    {selectedElementIds.includes(element.id) ? renderSlotHelper(element) : null}
                  </button>

                  {element.type === "imageFrame" && cropModeElementId === element.id ? (
                    <ImageFrameCropOverlay
                      element={element}
                      onChange={(point) => onSetImageFrameFocalPoint(element.id, point)}
                    />
                  ) : null}
                </div>
              ))}

              {marqueeRect ? (
                <div
                  className="pointer-events-none absolute border border-dashed border-[var(--dashboard-accent)] bg-[rgba(30,94,255,0.08)]"
                  style={{
                    left: marqueeRect.x,
                    top: marqueeRect.y,
                    width: marqueeRect.width,
                    height: marqueeRect.height,
                    zIndex: 5300,
                  }}
                />
              ) : null}

              {selectionBounds ? (
                <MultiSelectionBounds bounds={selectionBounds} count={selectedElements.length} />
              ) : null}

              {selectedElement && selectedElements.length === 1 ? (
                <SelectionHandles element={selectedElement} onResize={beginResize} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getSelectionBounds(elements: RuntimeTemplateElement[]) {
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

function MultiSelectionBounds(props: {
  bounds: { x: number; y: number; width: number; height: number };
  count: number;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute rounded-[14px] border-2 border-dashed border-[var(--dashboard-accent)] bg-[rgba(30,94,255,0.04)]"
        style={{
          left: props.bounds.x,
          top: props.bounds.y,
          width: props.bounds.width,
          height: props.bounds.height,
          zIndex: 5250,
        }}
      />
      <span
        className="pointer-events-none absolute rounded-full bg-[var(--dashboard-accent)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
        style={{
          left: props.bounds.x + 8,
          top: Math.max(8, props.bounds.y + 8),
          zIndex: 5260,
        }}
      >
        {props.count} selected
      </span>
    </>
  );
}

function renderSlotHelper(element: RuntimeTemplateElement) {
  if (element.type === "imageFrame") {
    return (
      <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-[rgba(15,23,42,0.78)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
        Slot {element.slotIndex + 1}
      </span>
    );
  }

  if (element.type === "imageGrid") {
    const endSlot = element.slotStartIndex + getGridSlotCount(element.layoutPreset);
    return (
      <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-[rgba(15,23,42,0.78)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
        Slots {element.slotStartIndex + 1}-{endSlot}
      </span>
    );
  }

  return null;
}

function ImageFrameCropOverlay(props: {
  element: Extract<RuntimeTemplateElement, { type: "imageFrame" }>;
  onChange: (point: { x: number; y: number }) => void;
}) {
  const handlePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
    props.onChange(point);
  };

  return (
    <div
      className="absolute inset-0 cursor-crosshair rounded-[10px] border border-dashed border-white/85 bg-[rgba(15,23,42,0.08)]"
      onPointerDown={handlePointer}
      onPointerMove={(event) => {
        if ((event.buttons & 1) !== 1) {
          return;
        }
        handlePointer(event);
      }}
    >
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-[rgba(15,23,42,0.78)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
        Crop mode
      </span>
      <div
        className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[rgba(30,94,255,0.12)] shadow-[0_6px_16px_rgba(15,23,42,0.25)]"
        style={{
          left: `${props.element.focalPoint.x * 100}%`,
          top: `${props.element.focalPoint.y * 100}%`,
        }}
      >
        <div className="absolute inset-x-1/2 top-1 h-4 w-px -translate-x-1/2 bg-white" />
        <div className="absolute inset-y-1/2 left-1 h-px w-4 -translate-y-1/2 bg-white" />
      </div>
    </div>
  );
}

function renderCanvasGuides(
  document: RuntimeTemplateDocument,
  editorState: RuntimeTemplateEditorState,
) {
  if (!editorState.showSafeArea) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute border border-dashed border-[rgba(30,94,255,0.35)]"
      style={{
        left: document.canvas.safeInset,
        top: document.canvas.safeInset,
        width: document.canvas.width - document.canvas.safeInset * 2,
        height: document.canvas.height - document.canvas.safeInset * 2,
        zIndex: 5000,
      }}
    />
  );
}

function renderGuideLines(
  guides: Array<{
    id: string;
    orientation: "horizontal" | "vertical";
    position: number;
  }>,
  document: RuntimeTemplateDocument,
) {
  return guides.map((guide) => (
    <div
      key={guide.id}
      className="pointer-events-none absolute bg-[rgba(30,94,255,0.6)]"
      style={{
        zIndex: 5100,
        left: guide.orientation === "vertical" ? guide.position : 0,
        top: guide.orientation === "horizontal" ? guide.position : 0,
        width: guide.orientation === "vertical" ? 1 : document.canvas.width,
        height: guide.orientation === "horizontal" ? 1 : document.canvas.height,
      }}
    />
  ));
}

function SelectionHandles(props: {
  element: RuntimeTemplateElement;
  onResize: (
    event: ReactPointerEvent<HTMLElement>,
    element: RuntimeTemplateElement,
    handle: (typeof HANDLE_POSITIONS)[number],
  ) => void;
}) {
  const { element, onResize } = props;

  return (
    <>
      {HANDLE_POSITIONS.map((handle) => {
        const style = resolveHandlePosition(element, handle);
        return (
          <button
            key={handle}
            type="button"
            onPointerDown={(event) => onResize(event, element, handle)}
            className="absolute h-4 w-4 rounded-full border-2 border-white bg-[var(--dashboard-accent)] shadow-[0_6px_16px_rgba(30,94,255,0.32)]"
            style={{
              ...style,
              zIndex: element.zIndex + 1200,
            }}
          />
        );
      })}
    </>
  );
}

function resolveHandlePosition(
  element: RuntimeTemplateElement,
  handle: (typeof HANDLE_POSITIONS)[number],
) {
  const half = 8;
  const positions = {
    n: {
      left: element.x + element.width / 2 - half,
      top: element.y - half,
      cursor: "ns-resize",
    },
    ne: {
      left: element.x + element.width - half,
      top: element.y - half,
      cursor: "nesw-resize",
    },
    e: {
      left: element.x + element.width - half,
      top: element.y + element.height / 2 - half,
      cursor: "ew-resize",
    },
    se: {
      left: element.x + element.width - half,
      top: element.y + element.height - half,
      cursor: "nwse-resize",
    },
    s: {
      left: element.x + element.width / 2 - half,
      top: element.y + element.height - half,
      cursor: "ns-resize",
    },
    sw: {
      left: element.x - half,
      top: element.y + element.height - half,
      cursor: "nesw-resize",
    },
    w: {
      left: element.x - half,
      top: element.y + element.height / 2 - half,
      cursor: "ew-resize",
    },
    nw: {
      left: element.x - half,
      top: element.y - half,
      cursor: "nwse-resize",
    },
  } as const;

  return positions[handle];
}

function getGridSlotCount(layout: Extract<RuntimeTemplateElement, { type: "imageGrid" }>["layoutPreset"]) {
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
