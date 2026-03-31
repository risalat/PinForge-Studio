"use client";

import type { RuntimeTemplateElement } from "@/lib/runtime-templates/schema";

type LayerPanelProps = {
  elements: RuntimeTemplateElement[];
  selectedElementId: string | null;
  onSelectElement: (elementId: string) => void;
  onToggleVisibility: (elementId: string) => void;
  onToggleLocked: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onBringForward: (elementId: string) => void;
  onSendBackward: (elementId: string) => void;
};

export function LayerPanel(props: LayerPanelProps) {
  const {
    elements,
    selectedElementId,
    onSelectElement,
    onToggleVisibility,
    onToggleLocked,
    onDuplicateElement,
    onDeleteElement,
    onBringForward,
    onSendBackward,
  } = props;

  const layers = [...elements].sort((left, right) => right.zIndex - left.zIndex);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
          Layers
        </p>
        <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
          {layers.length}
        </span>
      </div>
      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {layers.map((element) => {
          const selected = element.id === selectedElementId;
          return (
            <div
              key={element.id}
              className={`rounded-[20px] border px-3 py-3 ${
                selected
                  ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)]"
                  : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectElement(element.id)}
                className="w-full text-left"
              >
                <p className="text-sm font-semibold text-[var(--dashboard-text)]">{element.name}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  {`${element.type} · z${element.zIndex}`}
                </p>
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                <MiniAction
                  label={element.visible ? "Hide" : "Show"}
                  onClick={() => onToggleVisibility(element.id)}
                />
                <MiniAction
                  label={element.locked ? "Unlock" : "Lock"}
                  onClick={() => onToggleLocked(element.id)}
                />
                <MiniAction label="Up" onClick={() => onBringForward(element.id)} />
                <MiniAction label="Down" onClick={() => onSendBackward(element.id)} />
                <MiniAction label="Duplicate" onClick={() => onDuplicateElement(element.id)} />
                <MiniAction
                  label="Delete"
                  onClick={() => onDeleteElement(element.id)}
                  destructive
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MiniAction(props: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
        props.destructive
          ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
          : "border-[var(--dashboard-line)] bg-white text-[var(--dashboard-subtle)]"
      }`}
    >
      {props.label}
    </button>
  );
}
