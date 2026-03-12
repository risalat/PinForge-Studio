## PinForge Template Creation Brief

Use this brief whenever creating a new PinForge Studio template from a Canva-style reference image.

Reference image location:

`public/template-reference/<REFERENCE_FILENAME>.png`

Target template component:

`src/templates/<TEMPLATE_COMPONENT_NAME>.tsx`

Template id / slug:

`<TEMPLATE_SLUG>`

### Requirements

- Recreate the layout in React + Tailwind as closely as possible to the reference image
- Canvas must be exactly `1000 x 1500`
- Use `position: relative` and `overflow: hidden`
- Use existing shared components where appropriate:
  - `ImageSlot`
  - `FooterDomain`
  - `AutoFitTitle`
  - any other reusable components already in the project
- Keep the template layout-focused; do not add unrelated business logic
- Images must use Canva-like slot behavior:
  - `object-fit: cover`
  - `object-position: center`
- Support dynamic props as appropriate for this template:
  - `title`
  - `subtitle` (if needed)
  - `images[]`
  - `domain`
  - `badge/count` (if needed)

### Tasks

1. Inspect the reference image visually
2. Infer the layout structure:
   - number of image slots
   - title block
   - subtitle block
   - footer/domain strip
   - badge/circle/overlay/card if present
3. Implement the template in:
   - `src/templates/<TEMPLATE_COMPONENT_NAME>.tsx`
4. If needed, update:
   - `src/lib/templates/types.ts`
   - `src/lib/templates/registry.tsx`
   - `src/lib/templates/sampleData.ts`
   - preview route(s)
5. Add or update a preview route so the template can be inspected in the browser
6. Keep styling simple but visually faithful
7. Prefer reusable subcomponents over duplicated markup when sensible

### Output Requirements

- Summarize the inferred layout
- List files changed
- Explain which props are required by this template
- Tell the user the preview URL to open

### Working Lessons From The First Successful Templates

- Build template families when the references are close variants.
  - The first two successful templates shared the same split-vertical structure and only differed in subtitle support.
  - Reuse a shared base when geometry is the same, but create a separate template when the layout meaning changes, such as a true hero-number design.
- Keep generation logic aligned with template capability.
  - If a template has no subtitle slot, avoid pushing subtitle-style copy into the title.
  - If a template uses a dedicated hero number area, do not also force that number into the title text.
- Preserve saved render context.
  - Manual overrides like `title`, `subtitle`, `itemNumber`, and `visualPreset` must survive the render step.
  - Do not overwrite saved plan notes with a partial object.
- Add a preview route for every template immediately.
  - This keeps layout tuning fast and avoids testing only through full job generation.
- Keep text roles explicit.
  - Title, subtitle, number, and footer/domain should each have deliberate font, spacing, and color decisions.
  - Do not rely on generic font classes when the visual hierarchy matters.
- Start visually faithful, then systematize.
  - First match the reference layout closely.
  - After that, connect the template into shared preset, autofit, and render-context systems where appropriate.
- Use template config as the source of truth.
  - Register slot count, text fields, canvas size, preview route, and `numberTreatment` correctly in `registry.tsx`.
  - Do not infer these later in the workflow if they belong in template metadata.
