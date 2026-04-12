"use client";

import type { ReactNode } from "react";

type EditorWorkspaceShellProps = {
  commandBar: ReactNode;
  leftWorkspace: ReactNode;
  canvasWorkspace: ReactNode;
  inspectorWorkspace: ReactNode;
  validationWorkspace: ReactNode;
};

// Phase 0 shell groundwork:
// - keeps the current desktop principle of left workspace + canvas + inspector + validation
// - provides editor-only surface boundaries so later phases can simplify shell chrome
//   without re-litigating control ownership inside TemplateDraftEditor
export function EditorWorkspaceShell(props: EditorWorkspaceShellProps) {
  const {
    commandBar,
    leftWorkspace,
    canvasWorkspace,
    inspectorWorkspace,
    validationWorkspace,
  } = props;

  return (
    <div
      data-editor-workspace
      className="flex h-full min-h-0 flex-col gap-4 overflow-hidden text-[var(--dashboard-text)]"
    >
      <div data-editor-surface="command-bar" className="shrink-0">
        {commandBar}
      </div>

      <div
        data-editor-surface="workspace-grid"
        className="grid min-h-0 flex-1 items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px_340px]"
      >
        <aside data-editor-surface="left-workspace" className="min-h-0 overflow-hidden">
          {leftWorkspace}
        </aside>

        <div data-editor-surface="canvas-workspace" className="min-h-0 overflow-hidden">
          {canvasWorkspace}
        </div>

        <aside data-editor-surface="inspector" className="min-h-0 overflow-hidden">
          {inspectorWorkspace}
        </aside>

        <aside data-editor-surface="validation" className="min-h-0 overflow-hidden">
          {validationWorkspace}
        </aside>
      </div>
    </div>
  );
}
