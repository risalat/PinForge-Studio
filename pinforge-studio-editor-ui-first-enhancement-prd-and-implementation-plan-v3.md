# PinForge Studio — Editor-First UI Enhancement PRD & Phase Plan (v3)

## Why this revision exists

This revision corrects and tightens the previous plan after re-checking the current editor implementation and the current UI.

This version is based on the current code and current screen patterns, not on guesses.

### Verified references used for this revision
- `src/components/template-builder/CanvasEditor.tsx`
- `src/components/template-builder/useCanvasInteractions.ts`
- `src/components/template-builder/InspectorPanel.tsx`
- `src/components/template-builder/LayerPanel.tsx`
- `src/components/runtime-template/RuntimeTemplateCanvas.tsx`
- `src/lib/runtime-templates/schema.zod.ts`
- current editor screenshots shared in this thread

---

## Verified current-state observations

### What the current code/UI already does

#### 1. The top contextual header already owns many quick actions
From the current screen, the header/context row already carries fast, selection-scoped operations such as:
- duplicate
- front / back
- hide
- lock
- delete
- quick token choices like fill / border
- selection identity chips and at-a-glance metadata

This means the header is already functioning as the primary quick-action surface.

#### 2. The inspector is not primarily carrying those quick actions
After re-checking `InspectorPanel.tsx`, the inspector is mainly responsible for:
- element-type-specific configuration
- token and override details
- text settings
- shape/image/grid/overlay/divider configuration
- document settings when nothing is selected
- preset palette support

It is **not** primarily rendering duplicate / hide / lock / delete / front / back / x-y-w-h / opacity controls there.

#### 3. Inspector and Validation are separate useful surfaces today
The current UI pattern of keeping both visible is helpful for the actual workflow:
- edit in Inspector
- see pass/fail and warnings update in Validation
- continue iterating without mode switching

That workflow should be preserved.

#### 4. The inspector is still scroll-heavy
Even though it is not duplicating all quick actions, the inspector is still vertically dense and card-heavy. It still needs compaction and better information hierarchy.

#### 5. The current interaction model is still a real constraint
`useCanvasInteractions.ts` is still fundamentally built around single-element move/resize interactions. So shell cleanup and density improvements should happen before or alongside heavier interaction expansion.

#### 6. The left side is still the easiest place to win back space
The current editor experience still carries too much left-side presence:
- global app sidebar
- inner editor rail
- left content/tool area

This is still the best place to reclaim space without hurting your live Inspector + Validation workflow.

---

## Core correction from the previous version

### Previous assumption that is now corrected
The previous version leaned too far toward a single shared right rail with Inspector/Validation switching or merging.

### Correct direction
For **large desktop layouts**, the editor should preserve:
- a dedicated **Inspector column**
- a dedicated **Validation column**
- both visible simultaneously
- both full-height
- both independently scrollable

The optimization should come from:
- denser controls
- stricter control ownership
- less left-side chrome
- less duplication between top header and inspector
- moving bulky secondary detail out of permanent columns

Not from hiding Validation behind tabs.

---

## Core product principle for this phase

**Every new feature must either reduce friction, preserve the current fast edit/validate workflow, or stay hidden until needed.**

That means:
- no permanent new panel unless it replaces something else
- no feature that duplicates an existing control surface without justification
- no wider page chrome at the expense of the canvas unless it clearly improves speed
- no adding more tall inspector cards without compaction

---

## Editor UI north star

The editor should feel:
- dedicated
- focused
- light
- keyboard-friendly
- canvas-first
- low-scroll
- quick-action-driven
- powerful without looking crowded

The right mental model remains:
**lean Canva for structured Pinterest template production**

But with one important correction:
**unlike Canva-style single-inspector mode, this editor should preserve simultaneous Inspector + Validation visibility on large desktop layouts.**

---

# Top-level design strategy

## 1. Treat the template editor as a dedicated workspace mode

The template editor should not inherit the default app-shell density rules.

### Recommendation
For the editor page only:
- remove the full left app sidebar entirely on desktop, or collapse it to a very small icon strip
- preserve only minimal global navigation access
- keep workspace context lightweight in the header instead of a heavy sidebar block

### Preferred behavior
Use a dedicated editor shell with:
- back button
- document title
- version / status chips
- issue summary
- save / preview / validate / finalize actions
- compact workspace selector only if truly needed

This still gives the biggest immediate gain.

---

## 2. Preserve dual right columns on desktop

Because your workflow depends on editing and validating at the same time, the editor should keep:
- **Inspector column**
- **Validation column**

### Desktop recommendation
- Inspector width target: `340–380px`
- Validation width target: `300–340px`
- both independently scrollable
- both full-height within the workspace viewport

### Important rule
Do not stack Inspector over Validation on desktop.
Do not force tab switching between them on desktop.

### Responsive note
On narrower breakpoints, these can collapse into tabs or drawers. But not on the primary desktop layout.

---

## 3. Reduce left-side chrome before shrinking the right side

The current screen still loses too much space on the left.

### Recommendation
Replace the current left-side structure with:
- slim editor tool rail
- one flyout panel at a time

### Left tool rail
Potential tools:
- Elements
- Layers
- Content
- Blocks
- Template

### Left flyout rules
- only one open at a time
- width target `280–320px`
- hidden by default when appropriate
- easy to reopen via tool rail icons

This preserves the two useful right columns while still reclaiming meaningful canvas width.

---

## 4. Use a strict control-ownership model

This is the most important architectural rule for keeping the editor lightweight.

### Top contextual action bar owns
Anything that is:
- high-frequency
- selection-scoped
- used while eyes stay on canvas
- quick-action friendly

That includes current or future candidates such as:
- selection identity chips
- duplicate
- front / back
- hide / show
- lock / unlock
- delete
- x / y / w / h
- opacity
- quick fill / border / common tokens
- alignment tools for multi-select later

### Inspector owns
Anything that is:
- deeper
- type-specific
- lower frequency
- configuration-oriented rather than quick-action oriented

That includes:
- shape kind
- border radius
- slot index / slot start
- grid preset
- fit mode
- text behavior
- auto-fit settings
- font token and text settings
- overlay and shadow detail
- advanced preset overrides
- document settings when nothing is selected

### Validation owns
- live pass/fail status
- current preset issues
- ignore / restore flows
- saved validation summaries
- issue grouping and bucket views

### Rule
If a control already lives effectively in the top contextual bar, it must not be reintroduced prominently in the inspector without strong reason.

---

## 5. Keep both right columns, but make both denser

The right answer is not to remove one of them.
The right answer is to compress both of them.

### Inspector should become:
- denser
- less card-heavy
- more grouped
- more progressive
- less repetitive

### Validation should become:
- summary-first
- blockers-first
- compact by default
- expandable for detail

---

## 6. Move bulky detail out of permanent columns

To preserve two always-visible right columns, secondary detail must not live permanently inside them.

### Keep permanently visible
#### Inspector
- current element configuration
- current document settings when nothing selected
- quick palette helpers

#### Validation
- live status summary
- current issue counts
- most relevant live issues
- ignore / restore / focus actions

### Move out to drawer / modal / collapsible detail
- full stress-case gallery
- preset matrix details
- large saved finalize reports
- compare screenshots
- deep QA artifacts
- long-form diagnostics tables

This allows both columns to remain useful without becoming bloated.

---

## 7. The inspector needs structural compaction, not feature removal

The inspector should not lose power. It should lose vertical waste.

### Inspector compaction rules
- reduce heavy card stacking
- use compact grouped sections
- use tighter vertical spacing
- prefer 2-column property grids for short controls
- collapse advanced sections by default
- keep only one or two advanced groups open at once
- keep palette tools compact and contextual

### Good candidates for compact grouping
- min / max font size
- line height / max lines / letter spacing
- slot start / slot count
- fit mode / shape / radius
- fill / border / shadow groups

### Avoid
- large one-input-per-row layouts for short fields
- repeated section cards for small toggles/selects
- repeating top-bar quick controls in inspector

---

## 8. Validation should stay visible, but become more operational

Validation is useful because it is always visible while editing.
That should stay.

### Validation column structure
#### Sticky top summary
Always visible:
- blocking count
- warnings count
- current preset
- validate state
- quick actions like validate / fix preset / fix all if appropriate

#### Compact live issues section
Show:
- blockers first
- most relevant warnings next
- concise message
- element/path reference
- ignore/focus actions

#### Collapsible sections
- ignored checks
- saved finalize report
- stress-case details
- contrast details

### Principle
Validation should be glanceable first, expandable second.

---

## 9. Use a fixed-height viewport architecture

This page should be a no-page-scroll workspace on desktop.

### Rule
Desktop editor page should use:
- fixed app viewport height
- internal pane scrolling only where necessary
- stable center canvas zone
- independent scrolling in:
  - left flyout
  - inspector column
  - validation column

Never rely on long page scroll for the overall editor.

---

## 10. Preserve simple mental models

The user should always know:
- where to add things
- where to edit the selected element
- where document settings live
- where issues live
- where content preview values live
- which surface owns a control

UI simplification must not become ambiguity.

---

# Recommended target layout

## Target desktop shell

### Top command bar
Contains:
- back button
- document title
- version / status chips
- issue summary chip
- preview / validate / save / finalize
- undo / redo

Optional:
- compact workspace switcher
- autosave state

### Contextual selection bar
Keep and strengthen the current pattern.

Contains selection-scoped quick controls such as:
- selected element chips
- quick actions
- fast token selections
- geometry and other fast controls as appropriate

This should remain the primary quick-action surface.

### Left edge
#### Preferred
No full global sidebar on this page.

#### Acceptable
Very narrow icon-only global strip.

No large workspace cards or heavy nav blocks.

### Left editor rail
Slim icon rail with:
- Elements
- Layers
- Content
- Blocks
- Template

### Left flyout
- one open at a time
- width `280–320px`
- resizable later if useful

### Center canvas zone
Keep the canvas dominant.

Canvas header should include:
- canvas size
- preset selector
- zoom controls
- safe area toggle
- snap guides toggle
- fit / 100% / actual size if useful

### Right side
Keep **two independent columns**:
- Inspector column
- Validation column

Both full-height.
Both independently scrollable.

### Bottom utility tray
Hidden by default.

Used for:
- stress-case preview strip
- issue detail matrix
- preset matrix
- compare screenshots
- QA artifacts
- wide diagnostics content

---

# UI-specific product requirements

## Editor shell requirements
- the editor page must be visually distinct from standard app pages
- the canvas must gain horizontal space, not lose it, in the redesign
- the editor must remain fully usable on common laptop widths
- page-level vertical scrolling must be eliminated on desktop
- any new feature must specify where it lives before implementation begins

## Left side requirements
- no more than one expanded left flyout at a time
- left tool rail must be keyboard reachable
- frequently used tools must be no more than one click away
- the global sidebar must not remain heavy on this page if it materially harms canvas space

## Inspector requirements
- inspector should prioritize deep selected-element configuration
- inspector should not prominently duplicate controls already owned by the contextual top bar
- common configuration should fit above the fold where possible
- advanced controls must use progressive disclosure
- compact two-column density should be the default for short fields

## Validation requirements
- validation must remain simultaneously visible with the inspector on large desktop layouts
- validation summary must remain glanceable while editing
- long issue lists and stress previews should not permanently dominate the validation column
- validation detail depth should expand only when the user asks for it

## Right-side layout requirements
- Inspector and Validation should remain side by side on the primary desktop editor layout
- both columns must be independently scrollable
- optimization should come from compaction, not from hiding one of them

---

# Scope continuity from the previous roadmap

The following major improvement scopes remain in scope:
- editor shell refinement
- inspector compaction
- validation UX redesign
- selection / multi-select / grouping / alignment
- image crop / focal controls
- reusable blocks / sections / variants
- library / compare / clone workflows
- analytics and recommendation layer
- QA automation and release confidence

This revision changes **layout strategy and sequencing**, not the broader product direction.

---

# Updated scope and sequencing

## New implementation principle
**No major feature expansion before the editor shell, control ownership, and inspector/validation density are corrected.**

That means shell and density work now come first.

---

# Phase plan

## Phase 0 — Ground-truth UI audit and shell refactor foundation

### Goal
Start from the actual current editor structure and lock the ownership model before changing behavior.

### Scope
- audit current editor control ownership by surface:
  - top command bar
  - contextual selection bar
  - left rail / left panel
  - inspector
  - validation
  - canvas header
- document and remove true duplicated controls
- create dedicated editor page shell foundation
- prepare fixed-height workspace layout foundation
- preserve all current functionality during migration

### Acceptance criteria
- current control ownership is explicitly documented in code/comments or plan notes
- no speculative duplication remains in the redesign plan
- foundation exists for editor-specific shell without breaking current editing flows

---

## Phase 1 — Dedicated editor shell and left-side simplification

### Goal
Make the page feel like a dedicated creation workspace.

### Scope
- remove or heavily minimize the global sidebar on the editor page
- establish fixed-height, no-page-scroll desktop layout
- keep slim left editor rail
- keep one-at-a-time left flyout panel
- preserve center canvas width as the primary beneficiary

### Acceptance criteria
- canvas gains noticeable horizontal breathing room
- editor feels lighter immediately
- no feature loss
- no full-page desktop scrolling

---

## Phase 2 — Inspector compaction and control-ownership cleanup

### Goal
Make the inspector denser and smarter without losing power.

### Scope
- redesign inspector into denser grouped sections
- reduce vertical waste and repeated card stacking
- remove or de-emphasize only controls that are truly duplicated with the contextual header
- keep deep element/document configuration in inspector
- keep quick actions out of inspector if already owned elsewhere

### Strong requirements
- no guessing about duplication; use current implementation as source of truth
- compact rows and grouped controls should replace tall stacks where possible
- selected-element configuration should dominate the inspector experience

### Acceptance criteria
- less inspector scrolling in common editing flows
- inspector stays powerful but feels lighter
- no unnecessary duplication with current header actions

---

## Phase 3 — Validation column compaction and clarity redesign

### Goal
Keep validation always visible without letting it become visually heavy.

### Scope
- preserve separate Validation column on desktop
- create sticky top validation summary
- make blockers-first issue presentation
- compress ignored checks and saved report presentation
- move large detail to collapsibles, drawers, or modals
- keep live edit-to-validate workflow intact

### Acceptance criteria
- validation remains visible while editing
- validation becomes easier to scan
- column feels lighter without losing utility

---

## Phase 4 — Selection command layer, multi-select, grouping, and alignment

### Goal
Upgrade the editing workflow to match the stronger shell.

### Scope
- multi-select
- marquee selection
- group / ungroup
- align and distribute
- batch lock/hide
- selection bounding box controls
- contextual quick actions for multi-select in the header/selection bar

### Important note
This phase should respect the ownership model:
- fast selection actions belong near the top contextual surface
- deeper configuration belongs in inspector

### Acceptance criteria
- multi-select operations feel native and predictable
- batch editing does not create inspector clutter

---

## Phase 5 — Image crop/focal controls with compact UX

### Goal
Add image placement precision without bloating the interface.

### Scope
- crop/focal mode for image frames
- compact crop controls in quick-action context or focused inspector section
- reset crop
- fit mode preview
- slot labels / slot helpers in editor mode

### UI rule
Crop mode should be a temporary focused state, not a giant permanent inspector section.

### Acceptance criteria
- image correction becomes faster
- crop controls do not make the default inspector tall and messy

---

## Phase 6 — Reusable blocks, sections, and variants

### Goal
Add reuse power without increasing daily layout friction.

### Scope
- Blocks panel in the left tool system
- save selection as reusable block
- insert block from library
- starter sections
- duplicate as variant
- family/variant grouping in library

### UI rule
Blocks live in the left tool system or supporting trays, not as another permanent right-side burden.

### Acceptance criteria
- reusability grows without making the editor busier

---

## Phase 7 — Library UX, compare UX, and built-in to custom cloning

### Goal
Make the template system more operational.

### Scope
- built-in to custom clone flow
- version compare
- active vs draft compare
- richer template cards and filters
- where-used warnings
- archive guardrails

### Acceptance criteria
- library workflows improve without affecting editor density
- compare views use modals/drawers/trays where appropriate instead of permanent editor chrome

---

## Phase 8 — Analytics and recommendation layer

### Goal
Connect templates to outcomes without compromising the editor shell.

### Scope
- template usage analytics
- template version analytics
- fragile template views
- overused template views
- top performers by context
- rule-based recommendation hints

### UI rule
Analytics belong in library/system views, not as permanent editor surfaces.

### Acceptance criteria
- the editor remains focused on editing
- analytics live where decision-making happens

---

## Phase 9 — QA automation and release confidence

### Goal
Improve release confidence without inflating the editor page.

### Scope
- preview artifact generation for finalized versions
- compare screenshots
- preset matrix previews
- stress-case screenshot packs
- failed-preview diagnostics

### UI rule
QA detail should live in compare screens, version drawers, or trays, not permanently in the default editor shell.

---

# Explicit UI guardrails for Codex

## Guardrail 1
Do not add any new permanently visible panel to the editor page unless it replaces an existing panel.

## Guardrail 2
Do not increase desktop page-level scrolling.

## Guardrail 3
Do not remove simultaneous Inspector + Validation visibility on the primary desktop layout.

## Guardrail 4
Do not guess control duplication. Check the actual current surface before moving or deleting controls.

## Guardrail 5
Do not leave the full global sidebar intact on this page if it materially reduces canvas visibility.

## Guardrail 6
Every new feature must specify one of these homes:
- top command bar
- contextual selection bar
- left tool rail
- left flyout
- canvas header / canvas quick UI
- inspector column
- validation column
- bottom tray
- modal

If a feature cannot be placed cleanly in one of those, the design is not ready.

## Guardrail 7
Default state should favor the canvas and the current live edit/validate loop, not generic app chrome.

## Guardrail 8
Common quick controls should stay near the current contextual header/surface. Deep controls belong in inspector. Validation stays visible but compact.

---

# Recommended first implementation slice

Before major new feature expansion, implement this exact sequence:

1. Ground-truth UI audit of current editor surfaces
2. Dedicated editor shell
3. Remove or collapse the heavy global sidebar on this page
4. Preserve dual right columns
5. Compact inspector redesign
6. Compact validation redesign
7. Control-ownership cleanup between header and inspector

Only after that should multi-select, crop tools, blocks, and deeper workflow layers continue.

---

# Final recommendation

Yes, there is still a lot of room to improve this screen.

But the right improvement is now clearer:

**Keep the live Inspector + Validation workflow, reclaim space from the left side, and make the inspector/validation columns denser and more disciplined instead of hiding them.**

That will make the editor feel lighter without reducing the power you already use.
