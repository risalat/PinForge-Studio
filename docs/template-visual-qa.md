# Template Visual QA

Run this whenever template layout, typography, presets, or render payload behavior changes.

## Purpose

The preview and exported render need to stay visually aligned. This check captures both paths so typography drift, spacing drift, and footer/title-band mismatches get caught early.

## Command

```bash
npm run template:qa
```

Optional:

```bash
PINFORGE_BASE_URL=https://pin-forge-studio.vercel.app npm run template:qa
```

## Output

Screenshots are saved to:

`artifacts/template-qa/`

Each template gets:

- `*-preview.png`
- `*-render.png`

## Review Checklist

- Title font matches between preview and render
- Subtitle font and size match between preview and render
- Footer font, size, and spacing feel synchronized with the title band
- Title band padding and decorative divider spacing remain stable
- Number badge looks intentional and does not crowd the subtitle/title
- Text contrast is strong enough to stand out in-feed
- Different presets still preserve the template’s composition

## Current Scope

This captures screenshot pairs for:

- `split-vertical-title`
- `split-vertical-title-no-subtitle`

Add new templates here as they are introduced so every template family has a repeatable audit path.
