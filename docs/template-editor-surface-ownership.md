# Template Editor Surface Ownership

Phase 0 source-of-truth note. Verified against the current implementation on `2026-04-12`.

## Route and shell wiring

- Editor route: `src/app/dashboard/templates/[templateId]/edit/page.tsx`
- Route component: `RuntimeTemplateEditPage`
- Page surface: `TemplateDraftEditor`
- Shared dashboard shell: `src/components/dashboard/DashboardShell.tsx`
- Current editor-shell exception:
  - the normal dashboard header is suppressed on the editor route
  - the editor still renders inside the dashboard shell/sidebar frame
  - editor-specific height and overflow rules now live in `DashboardShell` and `EditorWorkspaceShell`

## Verified surface ownership

### Top command bar

Owned by `TemplateDraftEditor`.

Purpose:
- document-level actions
- version/state visibility
- save/finalize/preview actions
- undo/redo and duplicate draft

Examples currently here:
- rename entry point
- version/status chips
- validation-clean / issue summary chip
- save state
- preview
- fix preset / fix all
- validate
- save
- finalize
- undo / redo / duplicate draft

### Contextual selection bar

Owned by `QuickControlBar` inside `TemplateDraftEditor`.

Purpose:
- high-frequency, selection-scoped actions while eyes stay on canvas

Examples currently here:
- duplicate selected element
- bring forward / send backward
- hide / show
- lock / unlock
- delete
- compact geometry controls
- compact token selectors when applicable

### Canvas header

Owned by `CanvasEditor`.

Purpose:
- canvas-view controls, not deep content configuration

Examples currently here:
- preset picker
- zoom
- safe area toggle
- snap guides toggle
- canvas size label

### Left workspace / left rail

Owned by `TemplateDraftEditor`.

Purpose:
- add/select/manage editor supporting panels, one at a time

Verified tabs:
- `Elements`
- `Layers`
- `Template`

### Layers panel

Owned by `LayerPanel`.

Purpose:
- layer selection and coarse element management

Current overlap with top contextual bar:
- hide/show
- lock/unlock
- bring forward / send backward
- duplicate
- delete

This duplication is real, but not removed in Phase 0 because it is not yet clear whether
the top quick bar or the layer list should lose those actions first.

### Inspector

Owned by `InspectorPanel`.

Purpose:
- deep selected-element configuration
- document configuration when nothing is selected
- preset palette helpers

Verified current focus:
- element-type-specific settings
- text settings
- grid/image/shape/overlay/divider settings
- document canvas/capabilities/preset policy/image policy/metadata
- preset palette application

Not a primary duplication source for quick actions:
- duplicate / delete / lock / hide / reorder are not prominently repeated here

### Validation

Owned by `ValidationSidebar` in `InspectorPanel.tsx`.

Purpose:
- live finalize readiness
- blocker and warning visibility
- ignored-issue management
- saved validation report access

Desktop rule preserved:
- inspector and validation stay visible side by side
- no desktop tab merge
- no desktop stacking

## Phase 0 implementation note

`EditorWorkspaceShell` is the new layout boundary for the editor page.

It does not change ownership or remove features. It exists to give later phases one place to
adjust:
- dedicated editor workspace mode
- fixed-height desktop viewport behavior
- dual-right-column layout
- left-side simplification

without reworking feature components first.
