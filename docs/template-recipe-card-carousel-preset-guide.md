# Recipe Card Carousel Preset Binding Guide

This template is intentionally bound to the existing `TemplateVisualPreset` system. It does not introduce a separate token model.

## Roles

- `canvas background`
  - derived from `palette.canvas`, `palette.footer`, and supporting colors
  - must stay visually distinct from the title card
- `decorative background tint`
  - derived from `palette.divider` plus `supportingColors`
  - used only for soft radial washes and depth cues
- `back image panel`
  - lighter frame fill than the front panels
  - should recede behind the title card
- `front image panel border/shadow`
  - slightly stronger frame fill and stronger shadow than the back panel
  - used to separate the lower and front cards from the canvas
- `title card fill`
  - selected as a contrasting surface for the title text
  - should usually remain light, even for stronger presets, to avoid a heavy brick effect
- `title text`
  - uses the boldest available preset accent
  - must pass a minimum contrast ratio of `4.8` on the title card
- `number badge`
  - darker, stronger accent than the title card
  - should read as the second-highest emphasis after the title
- `roundup/category pill`
  - quieter secondary surface
  - should not compete with the number badge
- `domain/footer pill`
  - deeper footer/domain accent
  - anchors the composition below the lower image
- `divider/header line`
  - low-alpha accent line derived from `palette.divider` / dark ink
- `shadows/depth`
  - softer presets use stronger shadows to avoid a washed-out stack
  - strong presets use calmer shadows to avoid visual heaviness

## Binding Rules

1. `title text` carries the preset personality.
   - pick the most chromatic preset accent from:
     - `palette.title`
     - `palette.number`
     - `palette.domain`
     - `supportingColors`
   - darken it enough to stay readable

2. `title card fill` must contrast with the title text first, not with the preset accent itself.
   - prefer light surfaces from:
     - `palette.band`
     - `palette.canvas`
     - `palette.footer`
   - avoid saturated fills for strong presets unless readability forces it

3. `number badge` should feel stronger than the roundup pill.
   - use a deeper accent surface than the title card
   - keep the text high-contrast and clean

4. `roundup pill` should be secondary.
   - lighter and quieter than the number badge
   - readable, but not dominant

5. `domain pill` should anchor the lower region.
   - darker than the roundup pill
   - lighter visual weight than the number badge

## Heuristics

- soft / pastel presets
  - darken title text substantially
  - increase surface separation between canvas and title card
  - use stronger card shadows

- strong / saturated presets
  - keep title card light or lightly tinted
  - let title text carry the bold color
  - reduce support-surface saturation so pills do not compete

- dark / moody presets
  - keep title card readable and clearly detached from the canvas
  - use strong footer/domain pill contrast
  - maintain visible image-frame borders

## Contrast Floors

- title text on title card: `>= 4.8`
- roundup pill text: `>= 4.5`
- number badge text: `>= 5.6`
- domain pill text: `>= 7`

These values mirror the repo’s existing runtime contrast heuristics rather than inventing a new standard.

## Safe Extension Guidance

- Do not hardcode preset-specific colors for individual presets.
- If a new preset looks weak, fix the role resolver, not the one preset.
- Prefer:
  - stronger contrast
  - lighter title cards
  - darker title ink
  over simply increasing saturation everywhere.
- Keep the hierarchy stable:
  1. title
  2. number badge
  3. roundup pill
  4. domain pill
