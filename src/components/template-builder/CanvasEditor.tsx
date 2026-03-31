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
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
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
};

const HANDLE_POSITIONS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

export function CanvasEditor(props: CanvasEditorProps) {
  const {
    document,
    payload,
    editorState,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
    onUpdateEditorState,
    onBeginHistoryAction,
    onChangeVisualPreset,
  } = props;

  const { stageRef, guides, beginMove, beginResize, clearSelection } = useCanvasInteractions({
    zoom: editorState.zoom,
    canvasWidth: document.canvas.width,
    canvasHeight: document.canvas.height,
    safeInset: document.canvas.safeInset,
    showGuides: editorState.showGuides,
    onSelectElement,
    onUpdateElement,
    onBeginHistoryAction,
  });

  const selectedElement =
    document.elements.find((element) => element.id === selectedElementId) ?? null;
  const overlayElements = [...document.elements]
    .filter((element) => element.visible)
    .sort((left, right) => right.zIndex - left.zIndex);
  const stageWidth = Math.round(document.canvas.width * editorState.zoom);
  const stageHeight = Math.round(document.canvas.height * editorState.zoom);

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

      <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,#f7f9ff_0%,#edf2fb_45%,#e9eef8_100%)] p-6">
        <div className="flex min-h-full items-start justify-center">
          <div
            ref={stageRef}
            className="relative"
            style={{
              width: stageWidth,
              height: stageHeight,
            }}
            onPointerDown={() => clearSelection()}
          >
            <div
              className="absolute left-0 top-0 overflow-hidden rounded-[24px] shadow-[0_40px_100px_rgba(15,23,42,0.25)]"
              style={{
                width: document.canvas.width,
                height: document.canvas.height,
                transform: `scale(${editorState.zoom})`,
                transformOrigin: "top left",
              }}
            >
              {renderCanvasGuides(document, editorState)}
              {renderGuideLines(guides, document)}
              <RuntimeTemplateCanvas document={document} payload={payload} />
              {overlayElements.map((element) => (
                <button
                  key={element.id}
                  type="button"
                  onPointerDown={(event) => beginMove(event, element)}
                  className={`absolute rounded-[10px] border text-left transition ${
                    selectedElementId === element.id
                      ? "border-[var(--dashboard-accent)] bg-[rgba(30,94,255,0.08)] shadow-[0_0_0_1px_rgba(30,94,255,0.18)]"
                      : "border-transparent bg-transparent hover:border-[rgba(30,94,255,0.3)] hover:bg-[rgba(30,94,255,0.05)]"
                  } ${element.locked ? "cursor-not-allowed" : "cursor-move"}`}
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
                  {selectedElementId === element.id ? (
                    <span className="absolute left-2 top-2 rounded-full bg-[var(--dashboard-accent)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                      {element.name}
                    </span>
                  ) : null}
                </button>
              ))}

              {selectedElement ? (
                <SelectionHandles element={selectedElement} onResize={beginResize} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
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
