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

type UseCanvasInteractionsOptions = {
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  safeInset: number;
  showGuides: boolean;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (
    elementId: string,
    updater: (element: RuntimeTemplateElement) => RuntimeTemplateElement,
    options?: { recordHistory?: boolean },
  ) => void;
  onBeginHistoryAction: () => void;
};

type InteractionState = {
  mode: "move" | "resize";
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
    onSelectElement,
    onUpdateElement,
    onBeginHistoryAction,
  } = options;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const [guides, setGuides] = useState<CanvasGuide[]>([]);

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

  const commitInteraction = useCallback(
    (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) {
        return;
      }

      const point = getCanvasPoint(event);
      const deltaX = point.x - interaction.originPointer.x;
      const deltaY = point.y - interaction.originPointer.y;
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
      onUpdateElement(interaction.elementId, (element) => ({
        ...element,
        x: snapped.rect.x,
        y: snapped.rect.y,
        width: snapped.rect.width,
        height: snapped.rect.height,
      }), { recordHistory: false });
    },
    [canvasHeight, canvasWidth, getCanvasPoint, onUpdateElement, safeInset, showGuides],
  );

  const stopInteraction = useCallback(() => {
    interactionRef.current = null;
    setGuides([]);
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
      if (element.locked) {
        onSelectElement(element.id);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onSelectElement(element.id);
      onBeginHistoryAction();
      interactionRef.current = {
        mode: "move",
        elementId: element.id,
        handle: null,
        originPointer: getCanvasPoint(event),
        originRect: {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        },
      };
    },
    [getCanvasPoint, onBeginHistoryAction, onSelectElement],
  );

  const beginResize = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      element: RuntimeTemplateElement,
      handle: ResizeHandle,
    ) => {
      if (element.locked) {
        onSelectElement(element.id);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onSelectElement(element.id);
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
    [getCanvasPoint, onBeginHistoryAction, onSelectElement],
  );

  const clearSelection = useCallback(() => {
    onSelectElement(null);
    stopInteraction();
  }, [onSelectElement, stopInteraction]);

  return {
    stageRef,
    guides,
    beginMove,
    beginResize,
    clearSelection,
  };
}

function resolveNextRect(input: {
  interaction: InteractionState;
  deltaX: number;
  deltaY: number;
}) {
  const { interaction, deltaX, deltaY } = input;
  const { originRect } = interaction;

  if (interaction.mode === "move") {
    return {
      x: originRect.x + deltaX,
      y: originRect.y + deltaY,
      width: originRect.width,
      height: originRect.height,
    };
  }

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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
