# Template Visual System Tracker

Last updated: March 12, 2026

## Goal

Pin templates need to render with enough polish that they compete with Canva-quality Pinterest graphics. That means typography, title band, subtitle, footer, and color treatment all need to be designed as one visual system instead of separate ad hoc styles.

The long-term goal is dynamic, image-aware templates where the same template family can produce multiple polished looks without feeling repetitive.

## Quality Bar

- Preview and exported PNG should match closely.
- Title, subtitle, number, and footer need explicit font bindings.
- Footer treatment must stay visually synchronized with title-band styling.
- Text should autofit without breaking decorative ratios.
- Presets must create distinct looks without compromising readability.
- Template styling should respond to source context so pins do not all look identical.

## Workstream Status

| Phase | Status | Scope |
| --- | --- | --- |
| 1. Foundation contract | In progress | Shared preset contract, explicit typography roles, footer/title sync |
| 2. Split template refactor | In progress | Make split vertical templates the reference implementation |
| 3. Context-aware preset selection | In progress | Recommend presets from article + source-image context |
| 4. Dashboard controls | In progress | Surface preset choice and future manual overrides |
| 5. Advanced copy fitting | In progress | AI subtitle generation, number-aware rendering, overflow guards |
| 6. Visual QA guardrails | In progress | Render-vs-preview checks and visual regression workflow |
| 7. Pixel-aware image analysis | Pending | Upgrade from metadata-aware heuristics to true image analysis |

## Phase 1 Deliverables

- [x] Introduce a richer visual preset model instead of a local component-only color map
- [x] Define explicit font roles for title, subtitle, number, and footer
- [x] Add footer-specific layout and typography controls to the preset system
- [x] Refactor split vertical templates to consume shared visual presets
- [x] Replace generic `font-serif` dependence with explicit font-family bindings
- [x] Extend autofit behavior beyond the title so subtitle/footer are governed too
- [x] Keep render payload compatible with existing jobs by accepting legacy `colorPreset`
- [x] Add first-pass context-aware preset recommendation during render planning

## Current Implementation Notes

### Shared preset system

- Visual presets now live in `src/lib/templates/visualPresets.ts`
- Presets define:
  - palette for canvas, band, footer, divider, title, subtitle, domain, number
  - typography roles for title, subtitle, number, and footer/domain
  - layout rules for band height, footer height, padding, max lines, and font ranges

### Font binding

- The app now exposes dedicated font variables for:
  - `Space Grotesk`
  - `Cormorant Garamond`
  - `Libre Baskerville`
  - `Lora`
- Templates now bind text roles to explicit font stacks instead of relying on a generic serif utility class

### Footer synchronization

- Footer background, footer font, footer spacing, and footer sizing are now part of the same preset as the title band
- This keeps the footer visually related to the rest of the pin rather than looking like an unrelated strip

### Autofit behavior

- Title still uses autofit
- Subtitle and footer now also use autofit-driven sizing bounds
- This is a first pass and still needs tighter visual QA against live pins

### Dynamic styling

- The current preset recommendation is metadata-aware, not yet pixel-aware
- It uses article title plus source-image metadata signals such as headings, captions, and snippets
- This is the foundation for dynamic variation now, with deeper image analysis scheduled later

## Risks / Remaining Gaps

- Subtitle content generation is still heuristic and not yet using a dedicated short-form AI prompt
- Number-aware template rendering is not fully wired into current split templates
- Template number treatment still needs to expand from `none`/`badge` into future hero-number layouts
- Dashboard does not yet expose preset override controls
- Preview/render fidelity needs screenshot-level QA
- True image analysis is not yet implemented because the current stack has no dedicated image-analysis dependency

## Next Steps

1. Deepen the dashboard workflow from basic plan-field editing into richer live preset previews.
2. Tighten subtitle QA against real generated jobs and tune prompt behavior where needed.
3. Expand number-aware rendering into future dedicated roundup/listicle template families.
4. Evolve the screenshot audit into stricter visual regression coverage.
5. Evaluate a safe image-analysis approach for brightness, contrast, and dominant-tone scoring.

## Change Log

### March 10, 2026

- Added a shared split-template visual preset registry
- Added explicit multi-font role bindings
- Refactored split vertical template styling to use preset-driven footer/title/subtitle synchronization
- Added generic autofit text support for subtitle and footer roles
- Added first-pass context-aware preset recommendation in render planning
- Added saved-plan controls for title, subtitle, item number, and visual preset overrides
- Added dedicated AI render-copy generation for title + short subtitle packaging
- Added number-aware badge rendering for split vertical templates
- Added a repeatable screenshot audit script and QA guide for preview/render fidelity

### March 11, 2026

- Replaced generic `badge` capability with explicit template number treatment
- Marked current split templates as title-led so they no longer render a detached count pill
- Added template-aware artwork-copy shaping so headline-only templates avoid colon-heavy render titles
- Tuned split-template title spacing and line-height for cleaner multiline serif composition

### March 12, 2026

- Tightened subtitle-template title fitting to prioritize larger two-line editorial headlines
- Added brighter high-contrast split presets for more feed-stopping Pinterest variation
- Expanded preset recommendation scoring so vibrant, blue-forward, and sunlit imagery can beat the default earthy preset when appropriate
