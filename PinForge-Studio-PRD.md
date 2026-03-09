# PinForge Studio — PRD and Technical Blueprint

## 1. Product overview

**PinForge Studio** is a web application that generates Pinterest pins from blog posts using predefined HTML/CSS templates, exports them as PNG/JPEG, and sends them to Publer for scheduling.

It works alongside the existing **PinForge Chrome extension**, which already has scraping, AI copy generation, scheduling logic, and Publer API client utilities.

## 2. Core goals

### Primary goals
- Generate high-quality Pinterest pins automatically
- Match Canva-style designs as closely as possible
- Automate Publer publishing
- Track pin history, scheduling, and refresh timing

### Secondary goals
- Make templates reusable and easy to add
- Keep storage costs low
- Support future multi-user SaaS expansion
- Run locally first, then deploy to Vercel

## 3. Final decisions locked

- Product name: **PinForge Studio**
- Dev mode: **local first**
- Deployment target: **Vercel**
- Planned domain: **pinforge.tenreclabs.com**
- Canvas size: **1000 × 1500**
- Template implementation: **React components**
- Storage strategy: **local disk in development, Cloudflare R2 in production**
- Database: **PostgreSQL**
- Initial user model: **single user**, but schema should support future multi-user
- Publer integration: **auto-send to Publer**
- Template names: **generic layout-type names**

## 4. Recommended tech stack

### App
- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS

### Backend
- Next.js route handlers / server actions where appropriate
- Playwright for HTML/CSS-to-image rendering
- Prisma ORM

### Database
- PostgreSQL (Supabase Postgres is fine)

### Storage
- Development: local disk
- Production: Cloudflare R2

### Deployment
- Vercel

## 5. System architecture

```text
PinForge Chrome Extension
        |
        |  request with post data
        v
PinForge Studio API
        |
        +-- create generation job
        +-- fetch source images
        +-- generate AI copy if needed
        +-- render pin images
        +-- upload to Publer
        +-- log records
        v
Database + temporary storage
```

## 6. Division of responsibilities

### Chrome extension responsibilities
- Detect current article page
- Scrape article metadata
- Collect candidate images
- Collect image context such as nearby heading, caption, alt text, and snippet
- Let the user choose images and trigger generation
- Send payload to PinForge Studio

### PinForge Studio responsibilities
- Receive generation payload
- Optionally enhance or validate metadata
- Fetch or accept image assets
- Generate AI titles and descriptions
- Choose templates
- Render final pin images
- Upload pins to Publer
- Store records for jobs, posts, and schedules
- Power the dashboard

## 7. Why keep the extension instead of going fully standalone

A fully standalone app is possible later, but the extension still gives you a huge advantage because it can inspect the live article page and gather image context from the DOM.

That makes it much better at:
- detecting real in-post images
- reading captions and alt text
- reading nearest H2/H3 or surrounding text
- collecting image-specific context for AI title/description generation

So the recommended architecture is:
- **extension = scraper + launcher**
- **studio = rendering + publishing + tracking engine**

## 8. Canvas standard

All templates use a fixed pin canvas:

- Width: **1000 px**
- Height: **1500 px**
- Aspect ratio: **2:3**

Every template component must render against this exact canvas.

## 9. Template system

Templates are implemented as React components.

Example folder structure:

```text
src/templates/
  split-vertical-title/
    template.tsx
    config.json
  split-horizontal-title/
    template.tsx
    config.json
  grid-4-overlay/
    template.tsx
    config.json
```

## 10. Template naming convention

Templates use generic layout names, not niche-specific names.

Examples:
- `split-vertical-title`
- `split-horizontal-title`
- `grid-4-overlay`
- `grid-4-center-card`
- `grid-4-badge-card`
- `grid-2-title-band`

## 11. Initial template pack

The first uploaded examples become the first layout pack. These should be recreated as reusable layout types.

Initial target set:
- `split-vertical-title`
- `split-horizontal-title`
- `grid-4-overlay`
- `grid-4-center-card`
- `grid-4-badge-card`
- `grid-2-title-band`

If a sixth sample is added later, map it into the same naming system.

## 12. Template lifecycle

A template follows this lifecycle:

1. Designed in Canva
2. Recreated manually in HTML/CSS as a React component
3. Compared visually against the Canva original in a preview route
4. Adjusted until visually close enough
5. Locked for long-term reuse

Templates are usually a one-time build. After a template is locked, it should be reusable indefinitely.

## 13. Template config schema

Each template should have a small JSON config describing metadata.

Example:

```json
{
  "id": "grid-4-overlay",
  "name": "Grid 4 Overlay",
  "canvas": { "width": 1000, "height": 1500 },
  "imageSlotCount": 4,
  "textFields": ["title", "domain"],
  "features": {
    "overlay": true,
    "badge": false,
    "footer": true
  }
}
```

## 14. Image input model

Use a **dynamic image array** for automation.

Example props:

```ts
images: string[]
```

This is cleaner than hard-coded `img1`, `img2`, `img3` props when the system later chooses templates automatically.

## 15. Image slot behavior

To mimic Canva-style frame behavior, image slots use:

- `object-fit: cover`
- `object-position: center`
- `overflow: hidden`

This gives the familiar “drop image in frame and crop neatly” behavior.

## 16. Text behavior

Each text field should define:
- font family
- font weight
- font size
- line height
- max lines
- alignment
- overflow behavior

Important rule: text overflow rules must be locked per template.

Recommended options per field:
- shrink text within a min/max size range
- clamp to max lines
- optionally hide subtitle if title is too long

## 17. Preview and comparison workflow

Templates are recreated **inside the app**, not in chat.

Routes:
- `/preview/[templateId]` for live browser preview
- `/render/[templateId]` for export rendering

Comparison workflow:
1. Open Canva original side by side
2. Open the preview route
3. Adjust CSS until the HTML version visually matches
4. Lock the template

## 18. Rendering pipeline

Rendering method:
- React component renders template page
- Playwright loads the render route
- Wait for fonts and images to load
- Capture screenshot at 1000 × 1500
- Export as PNG or JPEG

## 19. Storage strategy

### Temporary assets
Use temporary storage for:
- source images from article
- rendered outputs before and shortly after upload

### Permanent storage
Store only metadata permanently:
- templates
- posts
- generation jobs
- generated pin records
- scheduling records

## 20. Storage abstraction

Use an abstraction layer so development and production storage can swap cleanly.

Interface:
- `StorageProvider`

Implementations:
- `LocalStorageProvider`
- `R2StorageProvider`

Methods:
- `put()`
- `getUrl()`
- `delete()`
- `exists()`

Everything else in the system should depend on `StorageProvider`, not on local disk or R2 directly.

## 21. Temporary file lifecycle

Recommended cleanup rules:
- source images: delete after successful render/upload
- rendered pins: keep for short retry window, then delete

Suggested defaults:
- source images: delete immediately after success
- rendered images: delete after 7 days

## 22. Database entities

### User
- `id`
- `email`
- `createdAt`

### Post
- `id`
- `url`
- `title`
- `domain`
- `createdAt`
- `updatedAt`

### GenerationJob
- `id`
- `postId`
- `status`
- `requestedTemplates`
- `createdAt`
- `updatedAt`

### GeneratedPin
- `id`
- `jobId`
- `templateId`
- `title`
- `description`
- `exportPath`
- `publerPostId`
- `scheduledAt`
- `createdAt`

### Template
- `id`
- `name`
- `componentKey`
- `configJson`
- `isActive`
- `createdAt`

## 23. Dashboard requirements

### Overview
Show:
- number of posts processed
- pins generated
- pins scheduled
- posts needing fresh pins

### Post tracker
Show:
- post title
- post URL
- total pins generated
- total pins scheduled
- last scheduled date
- freshness status

### Jobs view
Show:
- generation jobs
- status
- template count
- output count
- Publer handoff status

### Templates view
Show:
- template preview
- slot count
- template status
- usage stats

## 24. Fresh-pin logic

The app should flag posts that may need new pins.

Basic rule:
- if the most recent scheduled pin date is older than 30 days, mark as “Needs fresh pin”

Later rules can include:
- low variant count
- last published pin date if pulled from Publer later
- board-level distribution gaps

## 25. Extension-to-studio payload

Recommended payload shape:

```ts
{
  postUrl: string
  postTitle: string
  domain: string
  images: Array<{
    imageUrl?: string
    imageBlobTempId?: string
    alt?: string
    caption?: string
    nearestHeading?: string
    sectionHeadingPath?: string[]
    surroundingTextSnippet?: string
  }>
  globalKeywords?: string[]
  forceKeywords?: boolean
  titleStyle?: 'balanced' | 'seo' | 'curiosity' | 'benefit'
  scheduleOptions?: {
    startAt: string
    gapDays: number
    jitterDays?: number
    count?: number
  }
}
```

## 26. How the extension should send images

Use a **hybrid strategy**.

### Preferred method
Send the **image URLs + context** to the Studio app.

The server then fetches the source images directly.

Advantages:
- less payload sent from extension
- simpler API
- lower browser memory usage

### Fallback method
If an image cannot be fetched reliably from the server, the extension uploads the image blob to a temporary endpoint.

Suggested endpoint:
- `POST /api/uploads/temp`

Then the generation payload references the uploaded temporary asset.

This hybrid model is the safest real-world solution.

## 27. Do we need to change the extension code?

**Yes.**

The extension will need changes so it can:
- call PinForge Studio endpoints
- send article payload to the app
- optionally upload image blobs to a temp upload endpoint
- receive generation/scheduling results back from the app

The current extension already has the right kind of building blocks, but it still needs a Studio transport layer.

## 28. Can the app be fully standalone without the extension?

Yes, but that should be a later mode, not the first one.

A standalone-only app could work from:
- pasted article URL
- RSS feeds
- WordPress REST API
- sitemap jobs

But for the first version, the extension is still the best source of rich article context.

## 29. Publer integration strategy

Do **not** reinvent the wheel.

The existing extension already has a Publer client and scheduler utilities. Reuse that logic in PinForge Studio rather than rewriting from scratch.

Best implementation pattern:
- extract shared Publer and scheduling code into a common package or shared module
- use the same request shapes in both extension and studio

## 30. AI copy generation strategy

Also reuse the extension’s AI copy generation logic.

The existing extension already supports:
- multiple providers
- title and description generation modes
- image-aware context payloads

Best implementation pattern:
- move AI client logic to shared server-safe utilities where needed
- keep request/response schema aligned between extension and studio

## 31. Recommended code sharing approach

Create a shared folder or package later such as:

```text
packages/shared/
  ai/
  publer/
  scheduler/
  types/
```

Then both projects can consume:
- Publer client
- scheduler
- shared request types
- AI payload types

## 32. Initial file structure

```text
src/
  app/
    dashboard/
    preview/
    render/
    api/
  templates/
    split-vertical-title/
    split-horizontal-title/
    grid-4-overlay/
    grid-4-center-card/
    grid-4-badge-card/
    grid-2-title-band/
  components/
    ImageSlot.tsx
    TitlePanel.tsx
    FooterDomain.tsx
  lib/
    renderer/
    storage/
    publer/
    ai/
    jobs/
    templates/
  prisma/
```

## 33. Development sequence

### Phase 1
- app skeleton
- storage abstraction
- DB schema
- preview route

### Phase 2
- first HTML/CSS template recreation
- Playwright rendering pipeline
- local export test

### Phase 3
- extension → studio API connection
- temp upload endpoint
- generation jobs

### Phase 4
- Publer automation reuse
- AI title/description reuse
- dashboard records

### Phase 5
- freshness detection
- template management polish

## 34. Upgrade-safe design recommendations

To keep future upgrades smooth:

- isolate storage behind `StorageProvider`
- isolate Publer behind a dedicated client/service
- isolate AI generation behind a dedicated service
- keep templates mostly presentational
- keep payload types shared
- treat template configs as data, not hard-coded constants scattered across files
- keep all rendering at fixed canvas size
- avoid mixing dashboard logic with rendering logic

## 35. MVP success criteria

The MVP is successful if it can:
1. Receive a post payload from the extension
2. Render at least one locked template correctly
3. Export final 1000 × 1500 PNGs
4. Send generated pins to Publer automatically
5. Record the job, post, and schedule metadata
6. Show basic post freshness tracking in the dashboard

## 36. Immediate next build target

The first working milestone should be:
- one template recreated in HTML/CSS
- preview route
- render route
- PNG export

That proves the hardest visual part early.

## 37. Notes on future scale

The architecture should support later additions such as:
- standalone article URL mode
- bulk pin generation
- multi-user accounts
- invite system
- SaaS billing
- template editor UI
- Publer publish-status sync if available later

## 38. Final principle

PinForge Studio should be built around three stable subsystems:
- **Template engine**
- **Rendering engine**
- **Publishing pipeline**

Everything else should sit on top of those.
