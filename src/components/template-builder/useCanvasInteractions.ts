"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { RuntimeTemplateElement } from "@/lib/runtime-templates/schema";

type CanvasGuide = {
  id: string;
  orientation: "horizontal" | "vertical";
  position: number;
};

type ResizeHandle =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

type SelectionChangeOptions = {
  additive?: boolean;
  preferGroup?: boolean;
};

type UseCanvasInteractionsOptions = {
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  safeInset: number;
  showGuides: boolean;
  elements: RuntimeTemplateElement[];
  selectedElementIds: string[];
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
  onBeginHistoryAction: () => void;
};

type InteractionState =
  | {
      mode: "move";
      elementIds: string[];
      originPointer: {
        x: number;
        y: number;
      };
      originRects: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
      originBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }
  | {
      mode: "resize";
      elementId: string;
      handle: ResizeHandle | null;
      originPointer: {
        x: number;
        y: number;
      };
      originRect: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }
  | {
      mode: "marquee";
      originPointer: {
        x: number;
        y: number;
      };
      additive: boolean;
      baselineSelection: string[];
    };

const SNAP_TOLERANCE = 12;
const MIN_ELEMENT_SIZE = 24;

export function useCanvasInteractions(options: UseCanvasInteractionsOptions) {
  const {
    zoom,
    canvasWidth,
    canvasHeight,
    safeInset,
    showGuides,
    elements,
    selectedElementIds,
    onChangeSelection,
    onUpdateElement,
    onBeginHistoryAction,
  } = options;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const [guides, setGuides] = useState<CanvasGuide[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const getCanvasPoint = useCallback(
    (event: PointerEvent | ReactPointerEvent<HTMLElement>) => {
      const stage = stageRef.current;
      if (!stage) {
        return { x: 0, y: 0 };
      }

      const rect = stage.getBoundingClientRect();
      return {
        x: clamp((event.clientX - rect.left) / zoom, 0, canvasWidth),
        y: clamp((event.clientY - rect.top) / zoom, 0, canvasHeight),
      };
    },
    [canvasHeight, canvasWidth, zoom],
  );

  const changeSelection = useCallback(
    (elementId: string | null, selectionOptions?: SelectionChangeOptions) => {
      if (!elementId) {
        onChangeSelection([], null, { persistPrimary: true });
        return;
      }

      const target = elements.find((element) => element.id === elementId);
      if (!target) {
        return;
      }

      const targetIds =
        selectionOptions?.preferGroup && target.groupId
          ? elements
              .filter(
                (element) => element.visible && element.groupId === target.groupId,
              )
              .map((element) => element.id)
          : [target.id];

      if (selectionOptions?.additive) {
        const existing = new Set(selectedElementIds);
        const everySelected = targetIds.every((id) => existing.has(id));
        const next = everySelected
          ? selectedElementIds.filter((id) => !targetIds.includes(id))
          : [...selectedElementIds, ...targetIds.filter((id) => !existing.has(id))];
        const nextPrimary = next.includes(target.id) ? target.id : next[0] ?? null;
        onChangeSelection(next, nextPrimary, { persistPrimary: true });
        return;
      }

      onChangeSelection(targetIds, target.id, { persistPrimary: true });
    },
    [elements, onChangeSelection, selectedElementIds],
  );

  const commitInteraction = useCallback(
    (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) {
        return;
      }

      const point = getCanvasPoint(event);
      if (interaction.mode === "marquee") {
        const nextRect = normalizeRect(interaction.originPointer, point);
        setMarqueeRect(nextRect);
        const hitIds = expandSelectionForGroups(
          elements
            .filter((element) => element.visible)
            .filter((element) =>
              rectsIntersect(nextRect, {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
              }),
            )
            .map((element) => element.id),
          elements,
        );
        const nextSelection = interaction.additive
          ? unionSelection(interaction.baselineSelection, hitIds)
          : hitIds;
        onChangeSelection(nextSelection, nextSelection[0] ?? null, {
          persistPrimary: false,
        });
        return;
      }

      const deltaX = point.x - interaction.originPointer.x;
      const deltaY = point.y - interaction.originPointer.y;

      if (interaction.mode === "move") {
        const movedBounds = {
          x: interaction.originBounds.x + deltaX,
          y: interaction.originBounds.y + deltaY,
          width: interaction.originBounds.width,
          height: interaction.originBounds.height,
        };
        const snapped = applySnapGuides({
          rect: movedBounds,
          canvasWidth,
          canvasHeight,
          safeInset,
          enabled: showGuides,
        });
        setGuides(snapped.guides);
        const offsetX = snapped.rect.x - interaction.originBounds.x;
        const offsetY = snapped.rect.y - interaction.originBounds.y;
        interaction.originRects.forEach((entry) => {
          onUpdateElement(
            entry.id,
            (element) => ({
              ...element,
              x: entry.x + offsetX,
              y: entry.y + offsetY,
            }),
            { recordHistory: false },
          );
        });
        return;
      }

      const nextRect = resolveNextRect({
        interaction,
        deltaX,
        deltaY,
      });
      const snapped = applySnapGuides({
        rect: nextRect,
        canvasWidth,
        canvasHeight,
        safeInset,
        enabled: showGuides,
      });

      setGuides(snapped.guides);
      onUpdateElement(
        interaction.elementId,
        (element) => ({
          ...element,
          x: snapped.rect.x,
          y: snapped.rect.y,
          width: snapped.rect.width,
          height: snapped.rect.height,
        }),
        { recordHistory: false },
      );
    },
    [
      canvasHeight,
      canvasWidth,
      elements,
      getCanvasPoint,
      onChangeSelection,
      onUpdateElement,
      safeInset,
      showGuides,
    ],
  );

  const stopInteraction = useCallback(() => {
    interactionRef.current = null;
    setGuides([]);
    setMarqueeRect(null);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!interactionRef.current) {
        return;
      }
      commitInteraction(event);
    };

    const handlePointerUp = () => {
      stopInteraction();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [commitInteraction, stopInteraction]);

  const beginMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>, element: RuntimeTemplateElement) => {
      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        changeSelection(element.id, { additive: true, preferGroup: true });
        return;
      }

      const nextSelectionIds =
        selectedElementIds.includes(element.id)
          ? selectedElementIds
          : getSelectionIdsForElement(element, elements);
      const movableIds = nextSelectionIds.filter((id) => {
        const current = elements.find((entry) => entry.id === id);
        return current && !current.locked;
      });

      event.preventDefault();
      event.stopPropagation();
      onChangeSelection(nextSelectionIds, element.id, { persistPrimary: true });

      if (element.locked || movableIds.length === 0) {
        return;
      }

      const originRects = movableIds
        .map((id) => elements.find((entry) => entry.id === id))
        .filter((entry): entry is RuntimeTemplateElement => Boolean(entry))
        .map((entry) => ({
          id: entry.id,
          x: entry.x,
          y: entry.y,
          width: entry.width,
          height: entry.height,
        }));

      onBeginHistoryAction();
      interactionRef.current = {
        mode: "move",
        elementIds: movableIds,
        originPointer: getCanvasPoint(event),
        originRects,
        originBounds: getSelectionBounds(originRects),
      };
    },
    [
      changeSelection,
      elements,
      getCanvasPoint,
      onBeginHistoryAction,
      onChangeSelection,
      selectedElementIds,
    ],
  );

  const beginResize = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      element: RuntimeTemplateElement,
      handle: ResizeHandle,
    ) => {
      if (element.locked) {
        changeSelection(element.id, { preferGroup: true });
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onChangeSelection([element.id], element.id, { persistPrimary: true });
      onBeginHistoryAction();
      interactionRef.current = {
        mode: "resize",
        elementId: element.id,
        handle,
        originPointer: getCanvasPoint(event),
        originRect: {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        },
      };
    },
    [changeSelection, getCanvasPoint, onBeginHistoryAction, onChangeSelection],
  );

  const beginMarquee = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      const additive = event.shiftKey || event.metaKey || event.ctrlKey;
      const origin = getCanvasPoint(event);
      interactionRef.current = {
        mode: "marquee",
        originPointer: origin,
        additive,
        baselineSelection: additive ? selectedElementIds : [],
      };
      setMarqueeRect({
        x: origin.x,
        y: origin.y,
        width: 0,
        height: 0,
      });
      if (!additive) {
        onChangeSelection([], null, { persistPrimary: false });
      }
    },
    [getCanvasPoint, onChangeSelection, selectedElementIds],
  );

  const clearSelection = useCallback(() => {
    onChangeSelection([], null, { persistPrimary: true });
    stopInteraction();
  }, [onChangeSelection, stopInteraction]);

  return {
    stageRef,
    guides,
    marqueeRect,
    beginMove,
    beginResize,
    beginMarquee,
    clearSelection,
    changeSelection,
  };
}

function resolveNextRect(input: {
  interaction: Extract<InteractionState, { mode: "resize" }>;
  deltaX: number;
  deltaY: number;
}) {
  const { interaction, deltaX, deltaY } = input;
  const { originRect } = interaction;

  const handle = interaction.handle ?? "se";
  let x = originRect.x;
  let y = originRect.y;
  let width = originRect.width;
  let height = originRect.height;

  if (handle.includes("e")) {
    width = Math.max(MIN_ELEMENT_SIZE, originRect.width + deltaX);
  }

  if (handle.includes("s")) {
    height = Math.max(MIN_ELEMENT_SIZE, originRect.height + deltaY);
  }

  if (handle.includes("w")) {
    width = Math.max(MIN_ELEMENT_SIZE, originRect.width - deltaX);
    x = originRect.x + (originRect.width - width);
  }

  if (handle.includes("n")) {
    height = Math.max(MIN_ELEMENT_SIZE, originRect.height - deltaY);
    y = originRect.y + (originRect.height - height);
  }

  return {
    x,
    y,
    width,
    height,
  };
}

function applySnapGuides(input: {
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  canvasWidth: number;
  canvasHeight: number;
  safeInset: number;
  enabled: boolean;
}) {
  const { rect, canvasWidth, canvasHeight, safeInset, enabled } = input;
  const bounded = boundRect(rect, canvasWidth, canvasHeight);

  if (!enabled) {
    return {
      rect: bounded,
      guides: [] as CanvasGuide[],
    };
  }

  const guideLines: CanvasGuide[] = [];
  let nextRect = bounded;

  const verticalCandidates = [
    { id: "safe-left", value: safeInset },
    { id: "center-x", value: canvasWidth / 2 },
    { id: "safe-right", value: canvasWidth - safeInset },
  ];
  const horizontalCandidates = [
    { id: "safe-top", value: safeInset },
    { id: "center-y", value: canvasHeight / 2 },
    { id: "safe-bottom", value: canvasHeight - safeInset },
  ];

  const leftSnap = findClosestSnap(nextRect.x, verticalCandidates);
  const centerXSnap = findClosestSnap(nextRect.x + nextRect.width / 2, verticalCandidates);
  const rightSnap = findClosestSnap(nextRect.x + nextRect.width, verticalCandidates);
  const topSnap = findClosestSnap(nextRect.y, horizontalCandidates);
  const centerYSnap = findClosestSnap(nextRect.y + nextRect.height / 2, horizontalCandidates);
  const bottomSnap = findClosestSnap(nextRect.y + nextRect.height, horizontalCandidates);

  const bestHorizontal = bestSnap([leftSnap, centerXSnap, rightSnap]);
  const bestVertical = bestSnap([topSnap, centerYSnap, bottomSnap]);

  if (bestHorizontal && bestHorizontal.distance <= SNAP_TOLERANCE) {
    if (bestHorizontal === leftSnap) {
      nextRect = { ...nextRect, x: bestHorizontal.candidate.value };
    } else if (bestHorizontal === centerXSnap) {
      nextRect = {
        ...nextRect,
        x: bestHorizontal.candidate.value - nextRect.width / 2,
      };
    } else {
      nextRect = {
        ...nextRect,
        x: bestHorizontal.candidate.value - nextRect.width,
      };
    }
    guideLines.push({
      id: bestHorizontal.candidate.id,
      orientation: "vertical",
      position: bestHorizontal.candidate.value,
    });
  }

  if (bestVertical && bestVertical.distance <= SNAP_TOLERANCE) {
    if (bestVertical === topSnap) {
      nextRect = { ...nextRect, y: bestVertical.candidate.value };
    } else if (bestVertical === centerYSnap) {
      nextRect = {
        ...nextRect,
        y: bestVertical.candidate.value - nextRect.height / 2,
      };
    } else {
      nextRect = {
        ...nextRect,
        y: bestVertical.candidate.value - nextRect.height,
      };
    }
    guideLines.push({
      id: bestVertical.candidate.id,
      orientation: "horizontal",
      position: bestVertical.candidate.value,
    });
  }

  return {
    rect: boundRect(nextRect, canvasWidth, canvasHeight),
    guides: guideLines,
  };
}

function bestSnap(snaps: Array<ReturnType<typeof findClosestSnap>>) {
  return snaps
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((left, right) => left.distance - right.distance)[0];
}

function findClosestSnap(
  value: number,
  candidates: Array<{
    id: string;
    value: number;
  }>,
) {
  return candidates
    .map((candidate) => ({
      candidate,
      distance: Math.abs(value - candidate.value),
    }))
    .sort((left, right) => left.distance - right.distance)[0] ?? null;
}

function boundRect(
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  canvasWidth: number,
  canvasHeight: number,
) {
  return {
    x: clamp(rect.x, 0, Math.max(0, canvasWidth - rect.width)),
    y: clamp(rect.y, 0, Math.max(0, canvasHeight - rect.height)),
    width: clamp(rect.width, MIN_ELEMENT_SIZE, canvasWidth),
    height: clamp(rect.height, MIN_ELEMENT_SIZE, canvasHeight),
  };
}

function getSelectionBounds(
  rects: Array<{ x: number; y: number; width: number; height: number }>,
) {
  const left = Math.min(...rects.map((entry) => entry.x));
  const top = Math.min(...rects.map((entry) => entry.y));
  const right = Math.max(...rects.map((entry) => entry.x + entry.width));
  const bottom = Math.max(...rects.map((entry) => entry.y + entry.height));
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function getSelectionIdsForElement(
  element: RuntimeTemplateElement,
  elements: RuntimeTemplateElement[],
) {
  if (!element.groupId) {
    return [element.id];
  }
  return elements
    .filter((entry) => entry.visible && entry.groupId === element.groupId)
    .map((entry) => entry.id);
}

function unionSelection(left: string[], right: string[]) {
  return [...new Set([...left, ...right])];
}

function expandSelectionForGroups(
  elementIds: string[],
  elements: RuntimeTemplateElement[],
) {
  const initial = new Set(elementIds);
  const groupIds = new Set(
    elements
      .filter((entry) => initial.has(entry.id))
      .map((entry) => entry.groupId)
      .filter((value): value is string => Boolean(value)),
  );
  if (groupIds.size === 0) {
    return elementIds;
  }
  return elements
    .filter(
      (entry) => initial.has(entry.id) || (entry.visible && entry.groupId && groupIds.has(entry.groupId)),
    )
    .map((entry) => entry.id);
}

function rectsIntersect(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
) {
  return !(
    left.x + left.width < right.x ||
    right.x + right.width < left.x ||
    left.y + left.height < right.y ||
    right.y + right.height < left.y
  );
}

function normalizeRect(
  origin: { x: number; y: number },
  point: { x: number; y: number },
) {
  return {
    x: Math.min(origin.x, point.x),
    y: Math.min(origin.y, point.y),
    width: Math.abs(point.x - origin.x),
    height: Math.abs(point.y - origin.y),
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
