"use client";

import type { RuntimeTemplateElementType } from "@/lib/runtime-templates/types";

const CATALOG_ITEMS: Array<{
  type: RuntimeTemplateElementType;
  label: string;
  description: string;
}> = [
  {
    type: "imageFrame",
    label: "Image frame",
    description: "Bind a specific image slot into the layout.",
  },
  {
    type: "imageGrid",
    label: "Image grid",
    description: "Preset multi-slot image layouts for 2 to 9 images.",
  },
  {
    type: "shapeBlock",
    label: "Shape block",
    description: "Add a preset-aware surface, card, or badge.",
  },
  {
    type: "overlay",
    label: "Overlay",
    description: "Add a solid or gradient overlay wash above images or cards.",
  },
  {
    type: "titleText",
    label: "Title text",
    description: "Primary headline bound to the render title.",
  },
  {
    type: "subtitleText",
    label: "Subtitle text",
    description: "Optional kicker or supporting subhead.",
  },
  {
    type: "numberText",
    label: "Number text",
    description: "List number bound to itemNumber.",
  },
  {
    type: "domainText",
    label: "Domain text",
    description: "Domain or URL footer label.",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Simple rule to separate sections.",
  },
  {
    type: "ctaText",
    label: "CTA text",
    description: "Static call-to-action label.",
  },
  {
    type: "labelText",
    label: "Label text",
    description: "Static eyebrow or decorative label.",
  },
];

type ElementCatalogProps = {
  onAddElement: (type: RuntimeTemplateElementType) => void;
};

export function ElementCatalog({ onAddElement }: ElementCatalogProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
          Elements
        </p>
        <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
          Add
        </span>
      </div>
      <div className="mt-3 grid min-h-0 flex-1 gap-2 overflow-y-auto pr-1">
        {CATALOG_ITEMS.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onAddElement(item.type)}
            className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3 text-left transition hover:border-[var(--dashboard-accent)] hover:bg-white"
          >
            <p className="text-sm font-semibold text-[var(--dashboard-text)]">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--dashboard-subtle)]">{item.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
