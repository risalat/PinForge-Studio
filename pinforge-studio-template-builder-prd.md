# PinForge Studio — Manual Template Builder PRD (Version 1)

## 1) Product summary

Build a **schema-based visual template builder** inside PinForge Studio for creating reusable Pinterest pin templates on a fixed **1080×1920 canvas**.

The builder should let a user visually compose a template from approved elements such as:

- image frames
- image grids
- title, subtitle, number, domain, footer, CTA fields
- shape blocks like rectangles, circles, pills, arches, badges, dividers
- color surfaces, overlays, strokes, shadows

Once a template is finalized, it can be **locked/published into the template library** and reused across future jobs the same way built-in templates are reused today.

This is **not** a Canva clone. It is a constrained, production-safe template system optimized for:

- Pinterest collage and hero-style pins
- dynamic article-driven content
- preset-responsive color and typography
- consistent rendering through Studio’s existing Playwright export pipeline

---

## 2) Why this feature matters

Today, adding a new template requires manual React component work and registry wiring. That is fine for high-control internal templates, but it slows down experimentation and makes every layout request a dev task.

A visual builder unlocks:

- faster template creation
- more unique template variety
- reusable “house style” systems per site/workspace
- reduced dev dependency for every new design
- easier A/B testing of layouts and presets
- tighter creative control without leaving Studio

This should become a strong retention feature because users can build and reuse their own branded template systems.

---

## 3) Current state assumptions from the codebase

The current Studio architecture already supports most of the foundations needed:

- Templates are already modeled around a fixed **1080×1920 canvas**, image slot counts, text fields, and feature flags.
- Templates are currently registered as named configs and mapped to React components.
- Render output is generated through existing render pages and Playwright capture.
- Dynamic render payloads already merge job data, plan-level overrides, selected images, domain, count hint, and visual preset.
- There are existing auto-fit text primitives for both single text blocks and stacked lines.
- There is already a DB `Template` model and a background-task based pipeline.
- There is already a visual QA screenshot script for preview vs render comparison.

That means the proposed builder should **fit into the current system** rather than replace it.

---

## 4) Product goals

### Primary goals

1. Let users visually create reusable templates on a 1080×1920 canvas.
2. Let templates be built from a safe set of production-ready elements.
3. Make templates respond to visual presets without manual per-template recoloring.
4. Keep final render fidelity high between editor preview and export.
5. Allow draft → validate → finalize → lock → reuse lifecycle.
6. Preserve backward compatibility with current built-in templates.
7. Avoid users creating templates that break with real data.

### Secondary goals

1. Support multiple template styles:
   - hero image + title card
   - collage grids
   - number-led list posts
   - editorial text bands
   - CTA/footer/domain styles
2. Make template creation fast enough to be practical.
3. Generate template thumbnails automatically.
4. Provide strong template validation and preview states.

### Non-goals for v1

- Full Canva clone
- Arbitrary vector path drawing
- Freehand drawing tools
- Collaboration / multiplayer editing
- Mobile editing
- PSD/Figma import
- Animation
- Arbitrary custom web fonts uploaded by users
- Fully custom data variables beyond approved semantic bindings

---

## 5) Product principles

1. **Constrained freedom**
   Users can design visually, but only within production-safe rules.

2. **Semantic over cosmetic**
   A “title field” is not just text; it is a semantic title bound to dynamic content and preset-aware styling.

3. **Preview must match export**
   What the user sees in preview should be extremely close to the final image.

4. **Lock before production**
   Drafts can remain flexible; templates used in generation should be validated and versioned.

5. **Version everything**
   Once a template is used in a generation job, that version must remain stable forever.

---

## 6) Personas

### A. PinForge operator / power user
Creates many templates for multiple sites and wants speed, repeatability, and variety.

### B. Site owner / brand maintainer
Wants a reusable “brand look” with controlled typography, domain placement, and preset behavior.

### C. Studio admin / developer
Needs a clean schema, reliable rendering, and fewer one-off template component requests.

---

## 7) Core use cases

### UC1 — Create a new template from scratch
User opens builder, selects blank canvas, adds image frames, title box, number badge, footer/domain, chooses preset-compatible styling, and saves as draft.

### UC2 — Create a template from a starter layout
User starts from a built-in starter or blueprint, modifies layout, swaps elements, saves as a custom version.

### UC3 — Finalize and lock a template
User validates template, sees all checks pass, publishes it into the template library, and locks it for future use.

### UC4 — Reuse template in a generation job
User selects a custom locked template like any other library template during plan creation.

### UC5 — Edit a template after it has been used
User makes changes, but Studio creates a **new version** rather than mutating the version already used by prior plans and generated pins.

### UC6 — Test a template against worst-case data
User previews with:
- long titles
- short titles
- two-digit and three-digit numbers
- long domain names
- missing subtitle
- fewer images than ideal

### UC7 — Build site-specific branded packs
User creates multiple templates for the same niche site and uses a shared style system with different preset options.

---

## 8) Functional scope

## 8.1 Builder modes

### Draft mode
- fully editable
- can be renamed
- elements can be added/removed
- bindings and style tokens can change
- validation warnings visible live

### Preview mode
- clean canvas preview
- toggle between sample data and stress-test data
- switch visual presets live
- export preview thumbnail

### Validate mode
- run template safety checks
- show hard errors vs warnings
- show missing bindings or element conflicts

### Finalized / Locked mode
- immutable for production use
- selectable in template library
- can be cloned to create a new draft version

---

## 8.2 Screens / surfaces

1. Template library
2. New template flow
3. Editor canvas
4. Left panel: elements/layers
5. Right panel: inspector/properties
6. Top toolbar: save, preview, validate, finalize, duplicate, zoom
7. Test data switcher
8. Preset switcher
9. Validation report drawer
10. Template detail / version history page

---

## 9) Supported element system

## 9.1 Element categories

### A. Media elements
1. **Image Frame**
   - binds to one image slot
   - rectangle / rounded rectangle / circle / pill / arch / squircle
   - supports border, shadow, overlay, crop mode

2. **Image Grid Group**
   - preset grid patterns:
     - 2-up vertical
     - 2-up horizontal
     - 3 stack
     - 4 grid
     - 5 collage
     - 6 split collage
     - 9 grid
   - grid may be implemented either as:
     - a compound element, or
     - multiple linked image frame elements

3. **Background Image**
   - usually full-canvas or large hero area
   - single image slot binding
   - overlay support

### B. Text elements
1. **Title Field**
   - bound to dynamic title
   - optional stacked-line mode
   - auto-fit required

2. **Subtitle Field**
   - bound to subtitle
   - optional visibility when empty

3. **Number Field**
   - bound to itemNumber
   - formatting options:
     - raw number
     - padded
     - with prefix text
     - hidden when no number

4. **Domain Field**
   - bound to domain
   - optional strip `https://` and `www.`
   - optional uppercase
   - single-line auto-fit

5. **CTA Field**
   - typically static text like “Read More”, “See Ideas”, “Get Inspired”
   - optional dynamic later, but static in v1 is enough

6. **Footer Field**
   - can be static or domain-based
   - often combined with band/background element

7. **Static Text**
   - for labels like “TRENDING”, “SPRING”, “BUDGET”, “DIY”

### C. Shape / structural elements
1. Rectangle
2. Rounded rectangle
3. Circle
4. Pill
5. Arch
6. Divider line
7. Accent stripe
8. Badge/sticker block
9. Overlay block
10. Gradient overlay

### D. Container / decorative elements
1. Group container
2. Band container
3. Card container
4. Frame/stroke overlay

---

## 9.2 Element properties

Each element should support a controlled subset of properties.

### Core layout props
- id
- type
- x
- y
- width
- height
- rotation
- zIndex
- opacity
- visible
- locked

### Style props
- fill token
- stroke token
- stroke width
- corner radius
- shadow preset
- blend/overlay style (limited)
- padding
- text alignment
- vertical alignment

### Binding props
- data binding key
- fallback text
- empty state behavior
- visibility rules
- optional max character recommendations

### Shape props
- shape kind
- radius / curvature
- arch depth (if supported)
- border mode

### Media props
- image slot index
- fit mode (`cover`, `contain`)
- focal point x/y
- overlay token
- border and clip shape

### Text props
- semantic role
- typography token
- min font size
- max font size
- max lines
- line height token or number
- letter spacing token or value
- transform (`none`, `uppercase`, etc.)
- line stack mode
- color token

---

## 10) Recommended constraints for v1

To keep the system safe and sane, v1 should include constraints.

### Hard constraints
- Fixed canvas: **1080×1920**
- Only approved element types
- No arbitrary HTML/CSS injection
- No arbitrary uploaded fonts
- No arbitrary SVG/path drawing
- No negative element sizes
- Elements must stay within bounded canvas area unless explicitly allowed for bleed
- Rotation capped to reasonable range (ex: -20° to +20°)
- Image slot indexes must be unique where required
- Templates must declare expected image slot count
- At least one dynamic title or equivalent main text element required
- Hidden required fields must be validated

### Soft constraints
- Snap to guides/grid
- Warn if title area is too small
- Warn if domain field overlaps safe zone
- Warn if contrast is too low
- Warn if number block lacks number binding
- Warn if template depends on subtitle but subtitle is often absent
- Warn if required image count is unusually high

---

## 11) Editing interactions

## 11.1 Canvas interactions
- drag to move element
- resize with handles
- rotate with handle
- snap to grid
- snap to edge / center guides
- zoom in/out
- pan canvas
- multi-select optional in later phase

## 11.2 Layer interactions
- reorder layers
- bring forward / send backward
- show/hide
- lock/unlock
- duplicate
- delete
- group / ungroup (phase 2 if needed)

## 11.3 Keyboard interactions
- arrow nudging
- shift+arrow larger nudge
- delete selected element
- copy/paste/duplicate
- undo/redo

## 11.4 Inspector interactions
- edit position numerically
- edit size numerically
- select binding
- select style tokens
- adjust text behavior
- set empty-state logic
- set preset compatibility

---

## 12) Semantic binding model

The builder should not treat all text as generic. It should support approved data bindings.

### Required v1 bindings
- `title`
- `subtitle`
- `itemNumber`
- `domain`
- `images[0..n]`

### Optional v1 bindings
- `ctaLabel` (can default to static)
- `footerText` (static)
- `siteName` (if different from domain)
- `badgeText` (static)

### Binding behavior rules
- A title field may be required.
- A subtitle field may be optional and hidden when empty.
- Number field should support:
  - hide when missing
  - fallback to listCountHint if present
- Domain field should sanitize URL prefix.
- Image bindings should allow:
  - fixed slot assignment
  - optional fallback behavior for missing images

---

## 13) Preset-responsive styling system

The builder must make elements respond to visual presets, not hard-coded colors.

## 13.1 Token strategy

Recommended semantic token groups:

### Surface tokens
- `surface.canvas`
- `surface.primary`
- `surface.secondary`
- `surface.accent`
- `surface.overlay`
- `surface.badge`
- `surface.footer`

### Text tokens
- `text.title`
- `text.subtitle`
- `text.meta`
- `text.inverse`
- `text.number`
- `text.cta`

### Stroke / accent tokens
- `stroke.default`
- `stroke.accent`
- `accent.primary`
- `accent.secondary`

### Typography tokens
- `font.title`
- `font.subtitle`
- `font.meta`
- `font.number`
- `font.cta`

This can map onto the existing preset palette/typography system while making runtime templates more generic.

## 13.2 Preset compatibility
Each template should optionally define:
- all presets allowed
- preset categories allowed
- preset-specific overrides if necessary

## 13.3 Contrast handling
Templates should validate text/background contrast using the resolved tokens for each tested preset.

---

## 14) Template schema design

This is the most important part of the system.

### Recommended approach
Introduce a **runtime template schema** for custom templates.

System templates can remain component-based for now. Custom templates use schema-based rendering.

### Proposed top-level schema

```json
{
  "schemaVersion": 1,
  "templateKind": "custom-runtime",
  "canvas": { "width": 1080, "height": 1920, "safePadding": 40 },
  "meta": {
    "name": "Color Block Hero Number",
    "description": "3-image collage with number tile and footer pill",
    "category": "listicle",
    "status": "draft"
  },
  "requirements": {
    "minImages": 3,
    "maxImages": 3,
    "supportsSubtitle": false,
    "supportsNumber": true,
    "supportsDomain": true
  },
  "presetPolicy": {
    "allowedPresetIds": ["sunset-punch", "berry-citrus"],
    "allowedPresetCategories": ["graphic-pop", "fresh-vivid"]
  },
  "elements": [
    {
      "id": "bg-1",
      "type": "shape",
      "shape": "rect",
      "x": 0,
      "y": 0,
      "width": 1080,
      "height": 1920,
      "zIndex": 0,
      "style": { "fillToken": "surface.canvas" }
    },
    {
      "id": "img-hero",
      "type": "imageFrame",
      "slotIndex": 0,
      "shape": "roundedRect",
      "x": 40,
      "y": 40,
      "width": 1000,
      "height": 860,
      "zIndex": 10,
      "style": {
        "radius": 36,
        "fitMode": "cover",
        "strokeToken": "stroke.default",
        "strokeWidth": 0
      }
    },
    {
      "id": "number-badge",
      "type": "textField",
      "binding": "itemNumber",
      "x": 70,
      "y": 650,
      "width": 180,
      "height": 180,
      "zIndex": 40,
      "textBehavior": {
        "role": "number",
        "minFontSize": 84,
        "maxFontSize": 124,
        "maxLines": 1,
        "autoFit": true
      },
      "style": {
        "fillToken": "surface.badge",
        "textToken": "text.number",
        "fontToken": "font.number",
        "radius": 30,
        "shadowPreset": "lg"
      }
    }
  ]
}
```

---

## 15) Template versioning model

This is mandatory.

### Why
If a template changes after being used for generation, old generated pins and rerenders can break or change unexpectedly.

### Recommendation
Use separate template identity and template version records.

### Proposed model

#### TemplateDefinition
- id
- owner/user id
- workspace id (optional if multi-workspace matters)
- name
- slug
- kind (`SYSTEM_COMPONENT`, `CUSTOM_RUNTIME`)
- status (`DRAFT`, `FINALIZED`, `ARCHIVED`)
- activeVersionId
- thumbnail
- createdAt / updatedAt

#### TemplateVersion
- id
- templateDefinitionId
- versionNumber
- schemaVersion
- runtimeSchemaJson
- validationReportJson
- previewImageKey
- isPublished
- createdAt
- createdBy

### Existing plan usage changes
GenerationPlan and GeneratedPin should store either:
- `templateVersionId`, or
- a render snapshot json

Best practice: store both `templateVersionId` and key render snapshot fields.

---

## 16) Recommended database changes

The current `Template` table is not enough for a builder workflow if it must support drafts, locking, and version history safely.

### Recommended changes
Either:

### Option A — Evolve current `Template`
Add:
- ownerId
- kind
- status
- schemaVersion
- runtimeSchemaJson
- activeVersionNumber
- thumbnailStorageKey
- isSystem
- isLocked
- baseTemplateId (optional starter lineage)

And create a second `TemplateVersion` table.

### Option B — Introduce new tables
- `TemplateDefinition`
- `TemplateVersion`
- optionally `TemplateThumbnail`

### Strong recommendation
Use **Option B** for cleaner separation and version safety.

---

## 17) Rendering architecture

## 17.1 Current architecture fit
Current built-ins are hand-authored React components with absolute layout. Keep that path for system templates.

### New path
Create a **TemplateRuntimeRenderer** for custom runtime templates.

### Flow
1. Load template version schema
2. Load render payload
3. Resolve preset tokens
4. Resolve bindings
5. Render runtime elements on fixed canvas
6. Wait for text autofit readiness
7. Export via Playwright

## 17.2 Runtime element renderer
Implement renderer per element type:
- imageFrame renderer
- textField renderer
- shape renderer
- divider renderer
- group/container renderer
- overlay renderer

## 17.3 Fidelity rule
The same runtime renderer should be used for:
- editor preview
- preview page
- final render page

Do not maintain different logic paths if possible.

---

## 18) Validation system

Templates need strong validation before finalize.

## 18.1 Hard errors
- no title field
- no visible primary content
- invalid/missing image binding
- element outside canvas beyond allowed bounds
- zero-size element
- invalid preset token
- unsupported shape/type
- version schema mismatch
- invalid dynamic field reference

## 18.2 Warnings
- title area too narrow
- likely overflow at common title lengths
- contrast risk in one or more presets
- domain text likely too long
- subtitle optional but required visually
- too many overlapping decorative layers
- required image count > selected job typically provides
- number field visible without fallback

## 18.3 Stress test profiles
Every template should be testable against sample content sets:

1. Short title
2. Long title
3. 2-digit number
4. 3-digit number
5. Long domain
6. Missing subtitle
7. Missing number
8. Minimum image count
9. Mixed-orientation images

---

## 19) Empty and fallback behaviors

This is where many builders go to die.

Each dynamic field needs explicit empty-state behavior.

### Title
- required
- fallback to article title or generated artwork title

### Subtitle
- hide if empty
- or preserve spacer if layout depends on it

### Number
- use itemNumber if present
- fallback to listCountHint if present
- else hide or show default placeholder in draft mode only

### Domain
- sanitize and show domainSnapshot
- if missing, use workspace/site domain if available
- otherwise warning

### Image slots
Need configurable policy:
- `REQUIRE_EXACT`
- `ALLOW_FEWER_HIDE_UNUSED`
- `ALLOW_FEWER_DUPLICATE_LAST`
- `ALLOW_FEWER_FILL_PLACEHOLDER`

For production, `HIDE_UNUSED` is usually safer than duplicate-last unless the design explicitly expects repetition.

---

## 20) Library and lifecycle behavior

## 20.1 Template states
- Draft
- Validated
- Finalized
- Locked
- Archived

## 20.2 Lifecycle rules
- Draft templates are not available in production generation.
- Finalized templates are selectable.
- Locked templates cannot be edited directly.
- Editing a locked template creates a new draft version.
- Archived templates remain referenced for old jobs but cannot be newly selected.

## 20.3 Template library features
- search
- filter by owner/site/category
- filter by image count
- filter by supports number/subtitle/domain
- preview thumbnail
- duplicate template
- archive template
- view version history

---

## 21) Starter templates and blueprints

To accelerate adoption, the builder should support starter layouts.

### Starter options
1. Blank canvas
2. Hero image + centered title band
3. 3-image number collage
4. 4-image grid + footer
5. 5-image center band
6. Hero arch + sidebar
7. Editorial title card
8. CTA-led single image pin

These are not necessarily fully locked templates. They are editable blueprints.

---

## 22) Editor UX details

## 22.1 Left panel
- layers list
- add element button
- quick starter blocks
- visibility and lock toggles

## 22.2 Right panel inspector
Sections:
- position & size
- binding
- appearance
- typography
- spacing
- interaction rules
- empty-state logic
- validation info

## 22.3 Top toolbar
- save draft
- undo / redo
- zoom
- toggle safe area
- toggle preset selector
- validate
- finalize
- duplicate
- preview full screen

## 22.4 Preview helpers
- sample content switcher
- stress-test toggle
- preset carousel/dropdown
- show/hide guides
- show text boxes
- render readiness indicator

---

## 23) Permissions and ownership

Depending on Studio’s user model, templates may need ownership rules.

### v1 recommendation
- template belongs to user
- optionally tag to workspace/site
- only owner can edit
- custom templates visible only to owner unless shared later

### Future
- shared team template packs
- workspace-level template library
- read-only shared packs

---

## 24) API / backend requirements

## 24.1 Template APIs
- `POST /api/templates` — create template definition
- `GET /api/templates` — list templates
- `GET /api/templates/:id` — get template + active version
- `POST /api/templates/:id/versions` — save new version draft
- `POST /api/templates/:id/validate` — run validation
- `POST /api/templates/:id/finalize` — publish active draft version
- `POST /api/templates/:id/duplicate` — duplicate template
- `POST /api/templates/:id/archive` — archive template

## 24.2 Preview/render APIs
- `POST /api/template-preview` — temporary preview payload
- optional cached thumbnail endpoint
- runtime render route for published template versions

## 24.3 Validation services
- schema validation
- layout validation
- contrast validation
- text fit validation
- missing binding validation

---

## 25) Performance requirements

### Editor performance
- canvas interaction should feel responsive
- avoid re-rendering the entire tree on every drag
- use throttled/high-performance pointer handling
- keep preview cheap during drag; finalize expensive checks after drag

### Render performance
- use same background worker strategy for final exports
- template preview thumbnails can be generated asynchronously
- cache resolved preset/theme tokens when possible

### Scalability
- template editing is low concurrency
- rendering is more important than editing throughput
- builder should not slow existing job generation flow

---

## 26) Reliability requirements

- no runtime template should be selectable if validation fails
- old pins must remain reproducible
- preview/render mismatch should be measurable and testable
- invalid schema should never crash the production generation worker

---

## 27) Accessibility and usability requirements

Even though output is image-first, the editor should still be usable:

- keyboard support for selection and nudge
- visible focus state in inspector/layer list
- large enough handles for desktop use
- sensible defaults for element insertion
- clear warnings with human-readable fixes

---

## 28) Analytics / observability

Track:
- templates created
- templates finalized
- templates used in jobs
- most-used starter layouts
- most-used presets in custom templates
- validation error frequency
- finalize failure rate
- template render failure rate
- preview/render mismatch incidents
- average time from draft to finalized

This will help decide which elements and controls deserve future investment.

---

## 29) Edge cases to design for

### Data-driven edge cases
- title much longer than expected
- title only one short word
- missing subtitle
- missing number
- number has 3 digits
- domain is very long
- domain includes protocol and `www`
- fewer images than requested
- broken image URL
- portrait vs landscape source images
- duplicate image assignments

### Layout edge cases
- rotated element overlaps safe area
- text becomes unreadable in some presets
- badge sits partly outside canvas
- hidden subtitle leaves awkward gap
- two elements occupy same z-index unexpectedly
- overlapping shadows muddy the design
- tiny text after autofit becomes useless

### Product edge cases
- user edits template already used in past jobs
- template archived but still referenced historically
- preset deleted/renamed later
- schema version migration needed
- runtime renderer changes after templates already exist
- worker rerenders old template with newer code
- user creates template with 9 image slots but typical job only has 4 useful images

### Operational edge cases
- preview works locally but render differs in worker env
- fonts load differently in browser vs Playwright
- editor saves invalid partial state
- thumbnail generation fails
- draft version lost during browser refresh
- concurrent edits from two tabs

---

## 30) Guardrails that should exist before implementation starts

1. **Template versioning**
2. **Runtime schema validation**
3. **Preset token system**
4. **Stress-test preview**
5. **Finalize gate with hard errors**
6. **Old-version reproducibility**
7. **Single shared runtime for preview and export**

Without these, the feature will look nice at demo time and become chaos in production.

---

## 31) Suggested phased rollout

## Phase 0 — Foundations
- design runtime schema
- add DB versioning model
- build token resolver
- build runtime renderer
- create simple preview page for runtime templates

## Phase 1 — MVP builder
- fixed canvas editor
- add/move/resize/rotate
- element types:
  - image frame
  - text field
  - shape
  - domain/footer pill
  - number block
- basic layers panel
- inspector
- save draft
- validate
- finalize
- library listing

## Phase 2 — Productivity features
- starter blueprints
- duplicate
- undo/redo
- snap guides
- thumbnail generation
- stress-test presets
- archive + version history
- grouped grid helpers

## Phase 3 — Quality and scale
- richer validation
- better cropping/focal point controls
- group/ungroup
- alignment tools
- richer preset policies
- better telemetry

---

## 32) MVP recommendation

If implementation bandwidth is limited, the MVP should include:

### Element types
- imageFrame
- textField
- shape
- divider
- domain/footer pill

### Bindings
- title
- subtitle
- itemNumber
- domain
- image slots

### Editing
- add/move/resize/rotate
- layer reorder
- duplicate/delete
- inspector
- preset switcher
- validation panel

### Lifecycle
- save draft
- finalize
- lock
- clone to new version

### Tests
- preview vs render parity
- long title and long domain cases
- missing subtitle case
- missing number case

This is enough to produce valuable templates without overbuilding.

---

## 33) Recommended technical approach for the codebase

1. Keep existing built-in templates untouched initially.
2. Introduce **runtime templates** as a second template path.
3. Add `renderRuntimeTemplate(schema, payload, preset)` function.
4. Use the same auto-fit primitives already used in existing templates.
5. Reuse current render route pattern.
6. Add new builder pages under a separate custom-template section.
7. Keep production generation limited to **finalized published template versions** only.
8. Add a visual QA flow specifically for runtime templates.

---

## 34) Acceptance criteria

A v1 release is successful when:

1. User can create a draft template visually on a 1080×1920 canvas.
2. User can add image, text, number, domain, and shape elements.
3. User can bind fields to title/subtitle/itemNumber/domain/images.
4. Template responds to allowed visual presets.
5. Validation catches missing required bindings and major layout risks.
6. User can finalize and lock the template.
7. Locked template appears in library and can be selected in generation.
8. Final generated pin matches preview closely.
9. Editing a used template results in a new version, not mutation.
10. Old jobs remain reproducible.

---

## 35) Open questions to resolve before build

1. Should custom templates be user-private only in v1, or workspace-scoped?
2. Should image grids be compound elements or separate linked frames?
3. Should subtitle and CTA be optional per template, or globally available?
4. How many presets should a custom template support by default?
5. Should templates store a render snapshot along with version reference for full reproducibility?
6. Should custom templates be allowed to hide unused image slots automatically?
7. Do we need per-site “brand packs” in v1 or later?
8. How much rotation freedom is acceptable before templates become too easy to break?

---

## 36) Final recommendation

Build this as a **Schema-Based Pinterest Template Builder**, not a general design editor.

That gives PinForge Studio:

- enough flexibility for custom template creation
- safe production rendering
- reusable template libraries
- preset-aware styling
- a clear path to future growth

It avoids the trap of building half a Canva and still not solving the real production problem: **stable, reusable, dynamic pin templates that render reliably with real content**.