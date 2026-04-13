"use client";

import { useMemo, useState } from "react";
import { starterTemplateBlocks } from "@/lib/template-blocks/starterBlocks";
import type { TemplateBlockContent } from "@/lib/template-blocks/schema";

export type EditorTemplateBlock = {
  id: string;
  name: string;
  description: string | null;
  elementCount: number;
  imageSlotCount: number;
  sourceTemplateName: string | null;
  block: TemplateBlockContent;
};

type BlocksPanelProps = {
  selectionCount: number;
  blocks: EditorTemplateBlock[];
  onSaveSelection: (input: { name: string; description?: string }) => Promise<void>;
  onInsertBlock: (content: TemplateBlockContent) => void;
  statusMessage?: string | null;
  isSaving?: boolean;
};

export function BlocksPanel(props: BlocksPanelProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const savedBlocks = useMemo(() => props.blocks, [props.blocks]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
          Blocks
        </p>
        <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
          {savedBlocks.length + starterTemplateBlocks.length}
        </span>
      </div>

      {props.selectionCount > 0 ? (
        <form
          className="mt-3 rounded-[20px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await props.onSaveSelection({
              name,
              description,
            });
            setName("");
            setDescription("");
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
            Save current selection
          </p>
          <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">
            {props.selectionCount} selected element{props.selectionCount === 1 ? "" : "s"}
          </p>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Block name"
            className="mt-3 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-sm text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
          />
          <textarea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-sm text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            {props.statusMessage ? (
              <span className="text-xs text-[var(--dashboard-subtle)]">{props.statusMessage}</span>
            ) : (
              <span className="text-xs text-[var(--dashboard-muted)]">Reusable in this editor.</span>
            )}
            <button
              type="submit"
              disabled={!name.trim() || props.isSaving}
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {props.isSaving ? "Saving..." : "Save block"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 rounded-[20px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3 text-xs text-[var(--dashboard-muted)]">
          Select one or more elements to save a reusable block.
        </div>
      )}

      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <BlockSection
          title="Starter blocks"
          emptyLabel="No starter blocks."
          items={starterTemplateBlocks.map((block) => ({
            id: block.id,
            name: block.name,
            description: block.description,
            elementCount: block.content.elements.length,
            imageSlotCount: block.content.elements.reduce((count, element) => {
              if (element.type === "imageFrame") {
                return count + 1;
              }
              if (element.type === "imageGrid") {
                return count + 1;
              }
              return count;
            }, 0),
            sourceTemplateName: "Starter",
            block: block.content,
          }))}
          onInsert={props.onInsertBlock}
        />
        <BlockSection
          title="My blocks"
          emptyLabel="No saved blocks yet."
          items={savedBlocks}
          onInsert={props.onInsertBlock}
        />
      </div>
    </section>
  );
}

function BlockSection(props: {
  title: string;
  emptyLabel: string;
  items: EditorTemplateBlock[];
  onInsert: (content: TemplateBlockContent) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
          {props.title}
        </p>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
          {props.items.length}
        </span>
      </div>
      {props.items.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3 text-xs text-[var(--dashboard-muted)]">
          {props.emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          {props.items.map((block) => (
            <article
              key={block.id}
              className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--dashboard-text)]">
                    {block.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--dashboard-subtle)]">
                    {block.description || "Reusable element stack"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => props.onInsert(block.block)}
                  className="shrink-0 rounded-full border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-accent-strong)]"
                >
                  Insert
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <MiniChip label={`${block.elementCount} elements`} />
                {block.imageSlotCount > 0 ? <MiniChip label={`${block.imageSlotCount} slots`} /> : null}
                {block.sourceTemplateName ? <MiniChip label={block.sourceTemplateName} /> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniChip(props: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--dashboard-line)] bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
      {props.label}
    </span>
  );
}
