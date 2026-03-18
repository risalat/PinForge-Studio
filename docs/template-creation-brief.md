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
- Canvas must match the current Studio standard unless a real exception is documented
  - Current standard: `1080 x 1920`
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
- Keep template typography fixed at the template level
  - Presets may change colors
  - Presets must not silently swap the template's font family
- Define preset color-role mapping deliberately for every new template
  - Do not just pipe `palette.title`, `palette.number`, or `palette.divider` directly into every field
  - Decide how each preset role is used by this specific layout:
    - panel / band background
    - badge / circle / card background
    - badge border
    - number color
    - primary title line
    - secondary title line
    - subtitle / kicker
    - domain / footer text
  - High-energy preset families and soft preset families usually need different color assignment rules in the same template
  - If the template has a dark text strip, the accent line should usually use the brightest readable preset role, not a generic tint
  - If the template has a light badge or card, the number should usually use a deeper accent role than the title text
  - Always optimize for visual hierarchy first:
    - title readability
    - number emphasis
    - clean contrast against the immediate background
  - Prefer template-level, category-aware color selection when one generic formula produces muddy or washed results

### Tasks

1. Inspect the reference image visually
2. Infer the layout structure:
   - number of image slots
   - title block
   - subtitle block
   - footer/domain strip
   - badge/circle/overlay/card if present
   - preset role mapping for this layout:
     - which palette role drives the main band
     - which palette role drives badge background
     - which palette role drives number color
     - which palette role drives title line 1 vs line 2
     - which roles need category-aware overrides
3. Implement the template in:
   - `src/templates/<TEMPLATE_COMPONENT_NAME>.tsx`
4. If needed, update:
   - `src/lib/templates/types.ts`
   - `src/lib/templates/registry.tsx`
   - `src/lib/templates/sampleData.ts`
   - preview route(s)
5. Add or update a preview route so the template can be inspected in the browser
6. Verify preview and render behavior before calling the template done
   - open the preview route
   - check a real rendered output when the template is used in generation
   - do not rely on static code inspection alone for text-fitting templates
7. Keep styling simple but visually faithful
8. Prefer reusable subcomponents over duplicated markup when sensible

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
- Start with a layout map before coding.
  - Write down the true image-slot proportions first: rows, columns, overlaps, title-band position, badge position, footer position.
  - Most wasted time came from building the wrong grid interpretation and then trying to tune around it.
- Treat one-line title templates as a separate class.
  - If the reference clearly expects a single-line title, do not use guessed font-size buckets.
  - Use measured one-line fitting with a fixed inner text frame.
  - Verify against the real rendered title, not only sample copy.
- Do not compensate for bad layout with copy hacks.
  - First fix the title box width, padding, alignment, and font family.
  - Only then tighten title word-count guidance if the layout still truly requires it.
- Use the correct font before tuning size.
  - Wrong font choice changes width metrics enough to make all later sizing work unreliable.
  - Match the reference font style first, then tune size, spacing, and line-height.
- One-line autofit needs different overflow rules than multiline autofit.
  - Single-line text should fit based primarily on width.
  - Multiline text should fit based on both width and allowed height.
  - If the fitter uses multiline height rules for one-line text, it will shrink far too much.
- Tune title and subtitle together, not in isolation.
  - If the title grows, the subtitle often needs a separate max-size cap so the hierarchy stays intact.
  - If both use aggressive autofit ranges, the subtitle can visually compete with the title or vice versa.
- Treat preset colors as a layout system, not just a palette lookup.
  - Good templates usually need field-by-field preset decisions rather than simple one-to-one mapping.
  - Badge background, number color, title accent color, and band background should be tested as separate roles.
  - Soft palettes and bold palettes often need different assignment logic inside the same template.
  - If a preset family repeatedly produces muddy titles or weak badges, fix the template's role mapping before blaming the preset itself.
- Keep text roles explicit.
  - Title, subtitle, number, and footer/domain should each have deliberate font, spacing, and color decisions.
  - Do not rely on generic font classes when the visual hierarchy matters.
- Lock typography at the template level.
  - Once a template is locked, its font families, weights, spacing, and text transforms are part of the template definition.
  - Visual presets may change color treatment, but they must not swap a locked template's typography.
  - Different templates should have intentionally different typography systems when the references call for it.
- Start visually faithful, then systematize.
  - First match the reference layout closely.
  - After that, connect the template into shared preset, autofit, and render-context systems where appropriate.
- Preview/render parity is part of template completion.
  - A template is not done just because the preview page looks right.
  - If generated output or render screenshots drift from preview, fix the shared fitting/render path before adding more local template tweaks.
- Keep the reference asset tidy.
  - Once a reference is implemented and approved, move it to `public/template-reference/done/` with a stable descriptive filename.
  - Consistent reference naming makes later QA and cleanup much easier.
- Use template config as the source of truth.
  - Register slot count, text fields, canvas size, preview route, and `numberTreatment` correctly in `registry.tsx`.
  - Do not infer these later in the workflow if they belong in template metadata.
