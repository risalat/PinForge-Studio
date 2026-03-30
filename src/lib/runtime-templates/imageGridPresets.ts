import type { RuntimeTemplateImageGridLayout } from "@/lib/runtime-templates/types";

export type RuntimeTemplateGridSlotRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GridCellFraction = RuntimeTemplateGridSlotRect;

const GRID_LAYOUTS: Record<
  RuntimeTemplateImageGridLayout,
  {
    slotCount: number;
    cells: GridCellFraction[];
  }
> = {
  "split-2-vertical": {
    slotCount: 2,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  "split-2-horizontal": {
    slotCount: 2,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  "stack-3": {
    slotCount: 3,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  "grid-4": {
    slotCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  "collage-5": {
    slotCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 0.58 },
      { x: 0.6, y: 0, width: 0.4, height: 0.28 },
      { x: 0.6, y: 0.28, width: 0.4, height: 0.3 },
      { x: 0, y: 0.58, width: 0.38, height: 0.42 },
      { x: 0.38, y: 0.58, width: 0.62, height: 0.42 },
    ],
  },
  "split-6": {
    slotCount: 6,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 / 3 },
      { x: 0.5, y: 0, width: 0.5, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 0.5, height: 1 / 3 },
      { x: 0.5, y: 1 / 3, width: 0.5, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 0.5, height: 1 / 3 },
      { x: 0.5, y: 2 / 3, width: 0.5, height: 1 / 3 },
    ],
  },
  "grid-8": {
    slotCount: 8,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 0.5 },
      { x: 0.25, y: 0, width: 0.25, height: 0.5 },
      { x: 0.5, y: 0, width: 0.25, height: 0.5 },
      { x: 0.75, y: 0, width: 0.25, height: 0.5 },
      { x: 0, y: 0.5, width: 0.25, height: 0.5 },
      { x: 0.25, y: 0.5, width: 0.25, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.25, height: 0.5 },
      { x: 0.75, y: 0.5, width: 0.25, height: 0.5 },
    ],
  },
  "grid-9": {
    slotCount: 9,
    cells: Array.from({ length: 9 }, (_, index) => ({
      x: (index % 3) / 3,
      y: Math.floor(index / 3) / 3,
      width: 1 / 3,
      height: 1 / 3,
    })),
  },
};

export function getRuntimeTemplateGridSlotCount(layout: RuntimeTemplateImageGridLayout) {
  return GRID_LAYOUTS[layout].slotCount;
}

export function getRuntimeTemplateGridLayoutRects(input: {
  layout: RuntimeTemplateImageGridLayout;
  width: number;
  height: number;
  gap: number;
}): RuntimeTemplateGridSlotRect[] {
  const { layout, width, height, gap } = input;
  const definition = GRID_LAYOUTS[layout];

  return definition.cells.map((cell) => {
    const left = cell.x * width;
    const top = cell.y * height;
    const cellWidth = cell.width * width;
    const cellHeight = cell.height * height;

    return {
      x: left + gap / 2,
      y: top + gap / 2,
      width: Math.max(24, cellWidth - gap),
      height: Math.max(24, cellHeight - gap),
    };
  });
}
