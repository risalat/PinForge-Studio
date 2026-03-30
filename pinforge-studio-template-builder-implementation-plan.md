# PinForge Studio — Template Builder Implementation Plan

This document turns the Template Builder PRD into an execution plan for Codex.

It is written against the current PinForge Studio architecture:
- Next.js 16 app with Prisma/Postgres, background worker, Playwright rendering, and Zod already present.
- Templates are currently a mix of DB records and hard-coded React components.
- Rendering currently flows through `getRenderPayload()` and `renderTemplate()`.
- Built-in templates must continue working unchanged while the new runtime-template path is introduced.

---

## 1) Guardrails Codex must follow

### Non-negotiable constraints
1. **Do not break built-in templates.** Existing registry-based templates must keep working exactly as they do today.
2. **Do not replace the current renderer first.** Add a second runtime-template path beside the current built-in component path.
3. **Use DOM/HTML/CSS rendering, not a canvas library.** The editor preview and final Playwright export must stay visually aligned.
4. **Support versioned custom templates from day one.** Editing a finalized template must create a new version, not mutate history.
5. **Keep v1 constrained.** No arbitrary SVG drawing, no freeform vector tools, no group/ungroup, no collaboration, no mobile editor.
6. **Use the same schema validator in editor, API, and renderer.** One source of truth.
7. **Every finalize action must run validation/stress checks.** Drafts may be ugly; finalized production templates may not.

### Product rule
The Template Builder is **not** a Canva clone. It is a **Pinterest runtime-template builder** for reusable 1080×1920 templates that remain safe under variable content.

---

## 2) What exists today and how the implementation should fit it

Current system already provides the right foundations:
- fixed 1080×1920 template configs and template metadata
- visual preset system for color and typography
- job/plan-based render payload assembly
- auto-fit text primitives
- background worker/task system
- visual QA screenshots via Playwright

The implementation should extend these foundations rather than bypass them.

---

## 3) Recommended delivery slices

Ship this in **6 phases**, with each phase reviewable and mergeable on its own.

### Phase 1 — Runtime template data model and schema foundation
Goal: add DB models, versioning, and Zod schema definitions without shipping editor UI yet.

### Phase 2 — Runtime renderer path
Goal: render a JSON-schema-defined template end-to-end through preview and final render, while leaving built-ins untouched.

### Phase 3 — Editor shell and draft management
Goal: create a usable draft editor with canvas, layer list, inspector, drag/resize, save draft, preview.

### Phase 4 — Element system and semantic bindings
Goal: add the approved v1 element catalog and connect element bindings to job/plan render payload fields.

### Phase 5 — Finalize/lock workflow and validation gates
Goal: stress testing, finalize flow, locked versions, and runtime-template QA.

### Phase 6 — Generation flow integration and library UX
Goal: custom templates appear in the template library and can be used in generation plans safely.

---

## 4) Data model design

## 4.1 Why versioning is required
Today, `GenerationPlan` and `GeneratedPin` point at `Template` records, but there is no first-class template version snapshot. That is risky for custom templates because changing a template later could alter future renders or make old plans hard to reproduce.

**Recommendation:** add versioned custom templates now.

## 4.2 Recommended Prisma changes
Keep the existing `Template` model, but evolve it to support built-in and custom templates together.

### Add enums
- `TemplateSourceKind` = `BUILTIN | CUSTOM`
- `TemplateLifecycleStatus` = `DRAFT | FINALIZED | ARCHIVED`
- `TemplateRendererKind` = `BUILTIN_COMPONENT | RUNTIME_SCHEMA`

### Update `Template`
Add fields similar to:
- `sourceKind TemplateSourceKind @default(BUILTIN)`
- `rendererKind TemplateRendererKind @default(BUILTIN_COMPONENT)`
- `slug String? @unique` for custom library URLs
- `description String?`
- `createdByUserId String?`
- `activeVersionId String?`
- `thumbnailPath String?`
- `previewImagePath String?`
- `canvasWidth Int @default(1080)`
- `canvasHeight Int @default(1920)`
- `updatedAt DateTime @updatedAt`

Keep existing fields like `configJson`, `componentKey`, `isActive` for backwards compatibility.

### Add `TemplateVersion`
A new model for immutable snapshots.

Recommended fields:
- `id String @id @default(cuid())`
- `templateId String`
- `versionNumber Int`
- `lifecycleStatus TemplateLifecycleStatus @default(DRAFT)`
- `schemaJson Json`
- `editorStateJson Json?`
- `summaryJson Json?`
- `validationJson Json?`
- `isActive Boolean @default(false)`
- `isLocked Boolean @default(false)`
- `createdByUserId String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Indexes / constraints:
- unique `(templateId, versionNumber)`
- index on `(templateId, lifecycleStatus, createdAt)`

### Add template-version snapshots to usage models
Add nullable `templateVersionId` to:
- `GenerationPlan`
- `GeneratedPin`

This ensures each plan/pin can point to the exact custom-template version used.

### Why nullable?
Because built-in templates already exist and should not require backfilling immediately.

## 4.3 Seeding and backfill strategy
- Existing built-in templates remain as `sourceKind=BUILTIN`, `rendererKind=BUILTIN_COMPONENT`.
- No initial version rows are required for built-ins.
- Custom templates created through the new builder will create `Template` + `TemplateVersion` rows.

---

## 5) Runtime schema design

## 5.1 Core design principle
A runtime template is **a JSON document describing layout + bindings + style tokens**, not freeform JSX.

## 5.2 Top-level schema shape
Recommended top-level object:

```ts
RuntimeTemplateSchema = {
  schemaVersion: 1,
  canvas: { width: 1080, height: 1920, safeInset: 36 },
  metadata: {
    name,
    description,
    category,
    tags,
  },
  capabilities: {
    supportsSubtitle,
    supportsItemNumber,
    supportsDomain,
    imageSlotCount,
  },
  presetPolicy: {
    allowVisualPresetOverride: true,
    allowedPresetCategories: [...],
    tokenMode: 'preset-bound',
  },
  background: {...},
  elements: [...],
  validationRules: {...},
}
```

## 5.3 v1 element catalog
Only support these in v1:

### Visual/container elements
- `imageFrame`
- `imageGrid`
- `shapeBlock`
- `overlay`
- `divider`

### Text elements
- `titleText`
- `subtitleText`
- `domainText`
- `ctaText`
- `numberText`
- `labelText`

### Compound/preset elements
- `footerBar`
- `domainPill`
- `numberBadge`
- `titleCard`

## 5.4 Required shared fields for every element
Every element should have:
- `id`
- `type`
- `name`
- `x`
- `y`
- `width`
- `height`
- `rotation`
- `zIndex`
- `visible`
- `locked`
- `opacity`
- `semanticRole?`
- `bindings?`
- `styleTokens`
- `constraints`

## 5.5 Semantic roles
Roles should remain strongly typed and limited:
- `title`
- `subtitle`
- `itemNumber`
- `domain`
- `cta`
- `imageSlot[0..n]`
- `backgroundImage`
- `decorative`

Rule: only one element may be the primary `title` role. Same for `subtitle`, `itemNumber`, and `domain`.

## 5.6 Token system
Do not store arbitrary colors/fonts as the default path.
Use **preset-bound tokens**.

Recommended token families:
- `surface.canvas`
- `surface.primary`
- `surface.secondary`
- `surface.accent`
- `surface.inverse`
- `text.title`
- `text.subtitle`
- `text.meta`
- `text.inverse`
- `border.primary`
- `border.accent`
- `shadow.soft`
- `shadow.strong`
- `font.title`
- `font.subtitle`
- `font.meta`
- `font.number`

Optional v1 escape hatch:
- allow `customHex` only behind an advanced toggle and mark the template as `custom-color` in validation metadata.

---

## 6) Runtime renderer plan

## 6.1 Architecture
Introduce a second rendering path:

### Built-in path
Existing registry/component rendering remains unchanged.

### Runtime path
For `rendererKind=RUNTIME_SCHEMA`, render through a generic runtime renderer:
- load template version
- validate schema with Zod
- resolve tokens from selected preset
- resolve semantic bindings from render payload
- render DOM elements on the same 1080×1920 canvas

## 6.2 Suggested new modules
- `src/lib/runtime-templates/schema.ts`
- `src/lib/runtime-templates/schema.zod.ts`
- `src/lib/runtime-templates/types.ts`
- `src/lib/runtime-templates/validate.ts`
- `src/lib/runtime-templates/tokens.ts`
- `src/lib/runtime-templates/bindings.ts`
- `src/lib/runtime-templates/renderRuntimeTemplate.tsx`
- `src/lib/runtime-templates/defaults.ts`
- `src/lib/runtime-templates/stressTest.ts`
- `src/components/runtime-template/*`

## 6.3 Rendering resolver
Refactor the current template resolution flow so render pages can handle both systems.

Recommended flow:
1. resolve template record from DB or registry
2. fetch correct payload from plan/job
3. if built-in -> existing `renderTemplate()` path
4. if runtime -> `renderRuntimeTemplate(version.schemaJson, payload)`

## 6.4 DOM parity rule
The editor preview should reuse the same runtime template components used by final render.

Do **not** build one preview renderer and another export renderer.
That is how layout bugs breed after midnight.

---

## 7) Editor architecture

## 7.1 High-level editor layout
Three-pane desktop editor:

### Left panel
- template info
- element catalog
- layers list
- page-level actions

### Center
- zoomable 1080×1920 canvas
- snap guides
- safe area guides
- selection box / resize handles

### Right panel
- inspector for selected element
- bindings
- tokens
- typography
- spacing
- validation warnings

## 7.2 Draft lifecycle
States:
- draft version
- previewable draft
- validation passed
- finalized/locked
- archived

### Rules
- Draft versions are editable.
- Finalized versions are immutable.
- “Edit finalized template” clones to a new draft version.

## 7.3 Interaction model for v1
Must support:
- click to select
- drag to move
- resize via corner/edge handles
- duplicate element
- delete element
- reorder z-index / bring forward / send backward
- nudge with arrow keys
- shift-nudge for larger steps
- manual numeric input for x/y/w/h
- rotation via numeric slider/input only

Not required in v1:
- direct on-canvas rotation handle
- multi-select
- grouping
- freehand drawing

## 7.4 Editor persistence
Store both:
- `schemaJson` = runtime renderer source of truth
- `editorStateJson` = canvas UI state, zoom preferences, guide visibility, collapsed panels, etc.

---

## 8) v1 element behavior details

## 8.1 Image frame
Supports:
- one semantic image slot binding
- border radius
- border token
- crop mode: `cover`
- optional overlay gradient

Do not support advanced masking in v1.
Only these shapes for image frames:
- rectangle
- rounded rectangle
- circle/ellipse
- arch

## 8.2 Image grid
Supports:
- 2, 3, 4, 5, 6, 8, 9 slot presets
- gap size
- common border radius
- optional frame/border token
- optional per-slot override later, not required in v1

Important rule:
Grid layouts must be **preset layouts**, not arbitrary nested freeform grids in v1.

## 8.3 Title text
Supports:
- binding to `title`
- auto-fit mode
- max lines
- min/max font size
- line height
- letter spacing
- text transform
- alignment
- optional forced line-break mode later, not required in first pass

## 8.4 Subtitle / domain / CTA / number
Same pattern as title, but with stricter defaults.

### Number block
Should support:
- plain number
- badge number
- hero number tile
- prefix/suffix toggle later, not required first

## 8.5 Shape block
Supports:
- rectangle
- rounded rectangle
- circle
- pill
- arch
- slanted card/parallelogram preset

No arbitrary polygon editing.

## 8.6 Footer bar / domain pill / title card
These are convenience components for speed.
Internally they may compile down to multiple primitive elements later, but v1 may keep them as explicit compound element types.

---

## 9) Validation and finalize workflow

## 9.1 Why validation matters
A template that looks good with “Patio Ideas” but breaks with “27 Small Front Porch Decorating Ideas” is not production-ready.

## 9.2 Validation buckets
### Structural validation
- required top-level fields present
- element IDs unique
- semantic role uniqueness rules
- bounds valid
- supported element/token names only

### Layout validation
- elements remain inside canvas or safe overflow rules
- domain/footer not clipped
- title/subtitle blocks not overlapping illegal regions
- image slots present up to declared count
- locked/finalized template contains at least one title and one image role

### Preset validation
- required tokens resolvable across all allowed preset categories
- text/background contrast above threshold for critical text

### Stress validation
Render the template against sample cases such as:
- short title
- long title
- title with number already present
- missing subtitle
- very long domain
- 1-digit and 2-digit item numbers
- low image count fallback

## 9.3 Finalize rules
A version may only be finalized when:
- schema validation passes
- stress validation passes
- preview thumbnail generated
- required semantic roles satisfied
- no blocking overlap/clipping detected

## 9.4 Validation output
Store results in `validationJson`, e.g.:
- `errors[]`
- `warnings[]`
- `stressCases[]`
- `contrastChecks[]`
- `generatedAt`

---

## 10) Template library integration

## 10.1 Library sections
Split the library into:
- Built-in Templates
- My Custom Templates
- Drafts
- Finalized
- Archived

## 10.2 Template cards
Show:
- thumbnail
- name
- latest version number
- lifecycle state
- image slot count
- supported bindings
- allowed preset categories
- last updated

## 10.3 Actions
Draft template card actions:
- Edit Draft
- Duplicate
- Preview
- Run Validation
- Finalize
- Archive

Finalized template card actions:
- Preview
- Use in Plan
- Create New Draft from This Version
- Duplicate as New Template
- Archive

---

## 11) Generation flow integration

## 11.1 Plan assignment
When a custom template is chosen for a generation plan:
- store `templateId`
- store the exact `templateVersionId`
- store chosen preset in plan render context
- validate that the chosen plan has enough selected images for the template

## 11.2 Render payload binding
Current payload already contains:
- title
- subtitle
- item number
- domain
- images
- visual preset

That is enough for v1 runtime-template binding.

## 11.3 Fallback rules
If a template requires more image slots than available:
- block finalize for impossible schemas if min image count is too strict
- at plan usage time, allow repeated last image fallback only if template setting explicitly allows it

Recommended schema setting:
- `imagePolicy: { minSlotsRequired, allowDuplicateFallback, allowLastImageRepeat }`

## 11.4 Copy generation compatibility
Custom templates must declare summary metadata so copy generation knows what kind of title structure is expected.

Recommended template summary fields:
- `headlineStyle`
- `preferredWordCount`
- `preferredMaxChars`
- `preferredMaxLines`
- `numberPlacement` (`none`, `separate`, `inline-forbidden`)
- `toneTags`

This can live in `summaryJson` or version metadata.

---

## 12) Suggested routes and UI surface

Use your existing authenticated route group. Exact folder names may vary.

Recommended routes:
- `/templates` — library
- `/templates/new` — create template
- `/templates/[templateId]` — template details
- `/templates/[templateId]/edit?version=draft` — draft editor
- `/templates/[templateId]/preview?version=...` — preview page
- `/templates/[templateId]/validate?version=...` — validation view

Recommended API / server actions:
- create template draft
- duplicate template
- update draft schema
- reorder elements
- run validation
- finalize version
- archive template/version
- generate template thumbnail
- list library entries

---

## 13) Suggested file targets for Codex

## Phase 1 likely files
- `prisma/schema.prisma`
- migration files
- `src/lib/runtime-templates/schema.zod.ts`
- `src/lib/runtime-templates/types.ts`
- `src/lib/runtime-templates/defaults.ts`
- `src/lib/runtime-templates/validate.ts`
- `src/lib/runtime-templates/db.ts`

## Phase 2 likely files
- `src/lib/templates/registry.tsx` (minimal safe refactor only)
- `src/lib/templates/getRenderPayload.ts`
- `src/lib/runtime-templates/renderRuntimeTemplate.tsx`
- `src/components/runtime-template/*`
- preview/render route adjustments

## Phase 3 likely files
- new editor routes/pages
- `src/components/template-builder/CanvasEditor.tsx`
- `src/components/template-builder/LayerPanel.tsx`
- `src/components/template-builder/InspectorPanel.tsx`
- `src/components/template-builder/ElementCatalog.tsx`
- `src/components/template-builder/useCanvasInteractions.ts`

## Phase 4 likely files
- element-specific inspector controls
- bindings and token controls
- image-grid presets
- semantic role validator updates

## Phase 5 likely files
- `src/lib/runtime-templates/stressTest.ts`
- `scripts/template-visual-qa.mjs` enhancement for runtime templates
- finalize server actions / background tasks

## Phase 6 likely files
- template library UI
- generation plan picker UI
- plan assignment logic
- plan render context updates if required

---

## 14) Phase-by-phase acceptance criteria

## Phase 1 acceptance
- Prisma schema updated and migrated successfully.
- Can create a custom template draft record and a version row.
- Zod schema validates a default runtime template document.
- No existing built-in template flow is broken.

## Phase 2 acceptance
- A runtime template version can render on a preview page.
- Same runtime template can render through the final render path.
- Preset tokens resolve correctly.
- At least one sample runtime template renders with title, number, domain, and images.

## Phase 3 acceptance
- User can create/edit/save a draft template.
- Can add/select/move/resize/delete/reorder elements.
- Can edit numeric bounds and token assignments in inspector.
- Draft persists correctly after refresh.

## Phase 4 acceptance
- Approved v1 element catalog is usable.
- Semantic bindings work against real plan/job payload fields.
- Image slot assignment rules are enforced.
- Auto-fit title/subtitle/domain elements behave predictably.

## Phase 5 acceptance
- Validation report is generated and saved.
- Finalize is blocked on validation errors.
- Finalized versions become immutable.
- Editing finalized template creates a new draft version.
- Runtime-template screenshot QA can compare preview vs final render.

## Phase 6 acceptance
- Custom finalized templates appear in library.
- User can select a finalized custom template in a plan.
- `templateVersionId` is persisted to plan and generated pins.
- Existing built-in templates still work in the same flows.

---

## 15) First implementation slice Codex should do now

Start with **Phase 1 only**.

### Why
This gives the project a stable foundation without touching the risky editor/render UI first.

### Phase 1 exact task list
1. Extend Prisma schema with template source/version enums and `TemplateVersion` model.
2. Add nullable `templateVersionId` to `GenerationPlan` and `GeneratedPin`.
3. Create Zod schema/types for runtime template documents.
4. Create a default starter template schema factory.
5. Create DB helpers/server actions for:
   - create custom template
   - create initial draft version
   - fetch template + active/draft versions
6. Add a minimal protected page that lists custom templates and can create a starter draft.
7. Keep all built-in template behavior untouched.

### Phase 1 deliverables
- migration
- schema/types
- starter draft creation path
- simple library list page
- no editor yet

---

## 16) Recommended commit strategy

Use one PR/branch, but split work into reviewable commits:

1. `Add versioned runtime template schema foundation`
2. `Add runtime template creation and draft persistence`
3. `Add runtime template renderer path`
4. `Add template builder editor shell`
5. `Add element inspectors and bindings`
6. `Add finalize validation and runtime QA`
7. `Integrate custom templates into generation flow`

---

## 17) What Codex should explicitly avoid

- Do not migrate built-in templates into schema-based templates in the first rollout.
- Do not replace `renderTemplate()` wholesale.
- Do not introduce Fabric.js/Konva for v1.
- Do not support mobile editing.
- Do not allow finalized versions to be edited in place.
- Do not over-generalize nested layout systems in v1.
- Do not build arbitrary vector or pen tools.

---

## 18) Final recommendation

The winning sequence is:
1. **Schema and versioning first**
2. **Renderer second**
3. **Editor third**
4. **Finalize/validation before plan integration**

That order keeps risk low and preserves the current PinForge Studio production flow while the builder grows beside it.

---

## 19) Deferred polish backlog after Phase 6

These are intentionally outside the locked Phase 6 scope, but should stay visible for later implementation:

- Deep-link `Use in plan` from the template library directly into a specific job with template preselection.
- Filter preset-override UI by each custom template's allowed preset families.
- Add richer template thumbnails, lifecycle badges, and version badges in the manager page.
- Feed finalized custom templates into generation-plan recommendation logic beyond the current safe/manual selection path.
- Broader Phase 7+ rollout polish, including production hardening and generation-strategy enhancements.
