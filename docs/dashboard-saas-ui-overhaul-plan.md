# Dashboard SaaS UI Overhaul Plan

Last updated: March 11, 2026

## Purpose

PinForge Studio needs to feel like a real SaaS application, not a collection of disconnected pages. The current dashboard makes key tasks too hard to reach, wastes large-screen space, and does not support the fast review-to-publish workflow the product now requires.

This document defines the target IA, app shell, page architecture, design system, and rollout plan before implementation starts.

## Primary Problems To Fix

### Navigation friction

- Publishing is buried behind multiple page hops.
- There is no persistent shell or primary navigation.
- Important destinations are discovered through buttons inside pages rather than a stable menu.

### Weak spatial hierarchy

- Pages are centered inside narrow containers, which wastes desktop width.
- Job review, generation planning, and publish actions feel like separate documents instead of one product workspace.
- There is no fixed location for status, actions, search, or recents.

### Inconsistent workflow visibility

- Users do not get a strong sense of where a job is in the pipeline.
- The system does not foreground “what needs attention now”.
- Review, generation, and publishing exist, but they are not presented as one coherent operating model.

### Visual and product maturity gap

- The UI does not feel app-like or premium.
- Current color usage and typography are serviceable but not distinctive.
- The product needs a stronger desktop SaaS shell with clear navigation, filtering, and status surfaces.

## Product Goals

1. Make every important area reachable in one or two clicks.
2. Introduce a full-width application shell with persistent side navigation.
3. Present the pin workflow as a clear operational pipeline:
   intake -> review -> plans -> generate -> publish
4. Create a polished SaaS design language that feels modern, calm, and tool-like.
5. Preserve the existing backend workflow while making the interface dramatically more usable.

## UX Principles

### One shell, many workspaces

The dashboard should feel like one application with multiple workspaces, not separate standalone pages.

### Workflow-first, not page-first

Navigation should mirror the actual user journey:
- inbox
- jobs
- publishing
- library
- integrations

### Important actions stay visible

The user should always know:
- where they are
- what needs attention
- what the next action is
- how to get back

### Large-screen native

The app should use full desktop width intelligently:
- fixed sidebar
- sticky top bar
- flexible multi-column layouts
- dense but readable information panels

### Consistency over novelty

The dashboard should feel premium, but the design language must be systematic enough that new pages can inherit it without reinvention.

## Target Information Architecture

### Primary navigation

This should live in a persistent left sidebar.

- `Overview`
- `Inbox`
- `Jobs`
- `Publishing`
- `Library`
- `API Keys`
- `Integrations`
- `Settings`

### Secondary navigation / contextual tabs

This should live in the page header or content header, depending on page.

Examples:

- `Jobs`: board, list, timeline
- `Job Detail`: review, plans, generated pins, publishing
- `Publishing`: queue, scheduled, failed
- `Library`: templates, presets, previews
- `Integrations`: Publer, AI, storage

## Proposed Route Structure

### Dashboard shell

- `/dashboard`

### Overview

- `/dashboard`

### Intake / inbox

- `/dashboard/inbox`
- Purpose:
  - highlight newly received jobs
  - show jobs needing review
  - show failed jobs needing intervention

### Jobs workspace

- `/dashboard/jobs`
- `/dashboard/jobs/[jobId]`
- `/dashboard/jobs/[jobId]/publish`

### Publishing workspace

- `/dashboard/publishing`
- `/dashboard/publishing/queue`
- `/dashboard/publishing/scheduled`
- `/dashboard/publishing/failed`

This allows users to reach the publish queue directly without navigating through a job page first.

### Library

- `/dashboard/library`

Current `/library` can be retained temporarily, but the long-term product-facing route should live under the dashboard shell.

### API keys

- `/dashboard/api-keys`

### Integrations

- `/dashboard/integrations`

This should eventually absorb the current settings-specific provider pages.

### Settings

- `/dashboard/settings`

## Global Shell Design

### Layout

- Full-width app canvas
- Fixed left sidebar
- Sticky top bar
- Scrollable main content region
- No narrow `max-w-*` wrappers on dashboard pages
- Content grids should scale to large displays rather than centering at 5xl/6xl

### Sidebar content

Top:
- brand mark + product name
- workspace/account switcher area

Middle:
- primary nav
- grouped sections:
  - workspace
  - assets
  - system

Bottom:
- quick actions
  - new review
  - open publish queue
  - library
- user profile block
- sign out

### Top bar content

- page title + breadcrumb
- global search
- quick status chips
- notifications / issues
- contextual primary action button

Examples:
- Overview: `Open inbox`
- Job detail: `Generate pins`
- Publish page: `Upload media` or `Schedule selected pins`

## Visual Direction

The target is a refined editorial SaaS dashboard:
- calm neutral base
- sharp typography hierarchy
- controlled accent usage
- layered panels
- subtle gradients
- high clarity

This should not look like generic Tailwind admin UI.

## Design System

### Color system

#### Base neutrals

- `canvas`: warm light neutral with slight stone tint
- `panel`: soft elevated white/linen
- `panel-alt`: slightly tinted surface for nested modules
- `line`: quiet warm-gray border
- `text-primary`: near-ink charcoal
- `text-secondary`: muted taupe-gray

#### Accent family

Recommended direction:
- primary accent: deep cobalt or electric blue
- supporting accent: soft mint/seafoam for success signals
- warning accent: saffron/amber
- danger accent: muted coral/rust

Reason:
- the current brown/beige system works for the pin templates but is too one-note for the product shell
- the dashboard should feel sharper and more app-like

#### Status colors

- `received/reviewing`: amber
- `ready/generated`: blue
- `uploaded/titles/descriptions ready`: teal/green
- `scheduled/completed`: green
- `failed`: coral/red

### Typography

The dashboard and the template system should not use the exact same typographic voice for every surface.

#### App UI fonts

- Primary UI font:
  - `Space Grotesk` or similar modern geometric sans for navigation, labels, controls
- Display / section font:
  - use selectively for major page headings only
- Monospace-like utility treatment:
  - for IDs, statuses, timestamps only if needed

#### Typography rules

- tighter heading scale
- softer body scale
- restrained uppercase usage
- labels should be readable, not decorative

### Radius, borders, shadows

- large rounded panels: 22px to 28px
- nested cards: 16px to 20px
- shadow language:
  - low blur
  - broad spread
  - subtle depth
- border-first surfaces instead of heavy drop shadows everywhere

### Motion

- page load fade/slide
- sidebar item hover transitions
- panel reveal on navigation
- avoid excessive micro-animation

## Core Layout Patterns

### Pattern 1: Workspace page

Use for:
- Overview
- Inbox
- Jobs
- Publishing

Structure:
- page header
- stats row
- filters/search row
- main content grid

### Pattern 2: Detail workspace

Use for:
- Job detail
- Publish detail

Structure:
- breadcrumb + title + status + primary actions
- left column: main workflow content
- right column: sticky context rail

Right rail should include:
- job status
- quick milestones
- source counts
- pin counts
- shortcuts:
  - review
  - plans
  - generated pins
  - publish

### Pattern 3: Configuration workspace

Use for:
- Integrations
- API keys
- Settings

Structure:
- left side: category nav
- right side: main forms / cards

## Page-by-Page Plan

## 1. Overview

### Purpose

Give the user a command center.

### Modules

- welcome / workspace summary hero
- jobs needing review
- jobs ready to generate
- jobs ready to publish
- recent scheduled runs
- integration health
- quick actions

### Key actions

- review inbox
- open publish queue
- continue latest active job

## 2. Inbox

### Purpose

Single place for newly received extension submissions.

### Modules

- filter chips:
  - new
  - reviewing
  - ready for generation
  - failed
- intake cards/table
- bulk actions
- quick preview pane

### UX rule

This page is where the user starts each work session.

## 3. Jobs Board

### Purpose

Full operational index of jobs.

### Views

- board view
- list/table view
- optionally timeline later

### Card content

- article title
- domain
- created date
- status
- image count
- plans count
- generated pins count
- publish state
- next action button

### Quick actions on each job

- review
- open plans
- publish

## 4. Job Detail

### Purpose

One workspace for all pre-publish decisions.

### Internal sections

- `Review`
- `Plans`
- `Generated Pins`
- `Publish`

These should be reachable as tabs or anchored sub-navigation, not separate hidden actions.

### Review section

- article summary
- keyword inputs
- tone/style controls
- source image grid
- selection/preference controls

### Plans section

- assisted planning module
- manual planning module
- saved plans list
- visual preset control
- render title/subtitle/item-number fields

### Generated pins section

- generated pin gallery
- per-pin metadata
- re-render / open publish actions

### Right rail

- milestone stack
- job health
- quick next step
- workflow navigation

## 5. Publishing Workspace

### Purpose

Make publishing accessible without hunting through a job page.

### Main views

- `Queue`
  - pins ready to upload or schedule
- `Scheduled`
  - completed/queued schedule runs
- `Failed`
  - failed uploads or schedule submissions

### Benefits

- publish becomes top-level
- failed publishing items become operationally visible
- users can continue work from where they left off

## 6. Job Publish Detail

### Purpose

Focused execution page for one job’s media, copy, and scheduling.

### UX improvements needed

- stepper / stage nav at top
- sticky summary rail
- progress indicators
- selected pin count
- workspace/account/board summary visible without scrolling
- compact board selection
- per-pin upload / copy / schedule state

### Key structure

- step 1: upload media
- step 2: titles
- step 3: descriptions
- step 4: scheduling

This sequence should remain, but the page should feel more app-like:
- stage pills
- persistent action bar
- compact pin inspector

## 7. Library

### Purpose

A real internal asset library, not only a preview list.

### Modules

- template cards
- preset gallery
- usage guidance
- slot count
- subtitle-aware / number-aware flags
- style family labels

### Future utility

This becomes the design system catalog for templates and presets.

## 8. Integrations

### Purpose

Separate operational integrations from general settings.

### Sections

- Publer
- AI providers
- storage
- future analytics / webhooks

### Page behavior

- left mini-nav
- right-side configuration panels
- connection health chips
- test connection actions

## 9. API Keys

### Purpose

Extension auth management.

### Improvements

- table layout with search/filter
- created/revoked state
- usage context
- extension onboarding notes in a clean side panel

## Navigation Model

## Click depth rules

### Must be 1 click from sidebar

- overview
- inbox
- jobs
- publishing
- library
- integrations

### Must be 2 clicks max

- any specific job publish page
- failed publish queue item
- API key creation
- template preview

## Search Model

Global search in top bar should support:
- article title
- domain
- job ID
- template ID
- status

## Design Tokens To Define Before Build

Create dashboard-specific tokens in CSS variables:

- background
- panel
- panel-2
- border
- text
- text-muted
- accent
- accent-soft
- success
- warning
- danger
- shadow-sm
- shadow-md
- radius-panel
- radius-card
- sidebar-width
- topbar-height

## Component Inventory

These components should be created before page rewrites accelerate.

### Shell

- `DashboardShell`
- `SidebarNav`
- `Topbar`
- `Breadcrumbs`
- `WorkspaceSwitcher`

### Surfaces

- `AppPanel`
- `AppCard`
- `StatCard`
- `StatusBadge`
- `SectionHeader`

### Navigation

- `TabNav`
- `SegmentedViewSwitch`
- `QuickActionButton`

### Workflow

- `MilestoneRail`
- `JobSummaryRail`
- `WorkflowStepper`
- `EmptyState`

### Data / controls

- `FilterBar`
- `SearchInput`
- `CommandPaletteTrigger`
- `ActionToolbar`

## Rollout Plan

## Phase 1: App shell

- create sidebar + topbar
- convert dashboard layout to full-width shell
- add primary nav
- unify page spacing and surface language

Status: In progress

Implemented so far:
- persistent sidebar navigation under `/dashboard`
- sticky top bar with route-aware heading copy
- full-width dashboard shell
- new top-level routes:
  - `/dashboard/inbox`
  - `/dashboard/publishing`
  - `/dashboard/library`
  - `/dashboard/integrations`
- existing major dashboard pages moved inside the new shell

Still remaining in this phase:
- replace remaining legacy warm-beige page modules with the new shell design language
- standardize component primitives across job review, publish, settings, and key management screens
- improve breadcrumb specificity for job detail and publish detail pages

## Phase 2: Overview + Jobs + Inbox

- redesign overview
- redesign jobs board
- add inbox workspace
- add quick links to publish queue

Status: In progress

Implemented so far:
- overview now acts as a real command center with focus cards and a "continue where you left off" panel instead of repeating shell actions
- inbox guidance copy was tightened and duplicate publish links were removed from intake cards
- jobs board cards now expose direct operational actions on each job instead of relying on page-level duplicate buttons
- single-job detail and publish pages no longer repeat shell back-links and primary actions at the top of the page
- the publishing workflow surface now uses the dashboard visual system instead of the older warm/beige module styling
- noisy pills and weak placeholders were reduced across the shell and workflow pages

Still remaining in this phase:
- add stronger segmented views or filters for the publishing queue itself
- introduce more deliberate empty states and context rails on the overview and jobs workspaces
- continue standardizing status badges and table/card primitives across every remaining dashboard page

## Phase 3: Job detail workspace

- convert job page into tabbed/staged workspace
- add right-side summary rail
- integrate review + plans + generated pins cleanly

Status: In progress

Implemented so far:
- job detail now uses a denser two-column workspace with a sticky summary rail
- compact internal section navigation was added for review, plans, generated pins, and publish
- noisy duplicate copy was reduced across the review/plans workflow
- generated pins now sit in a dedicated end-of-flow section with a direct handoff into publish
- the render queue now uses a focused plan-selection workspace instead of one long stack of expanded plan cards
- source-image slot previews now open in full-size review instead of showing cropped strip previews
- generated outputs can now be discarded safely to reset the job back to a fresh render state without losing intake data or plan assignments

Still remaining in this phase:
- break review and plan tools into more reusable primitives instead of large composite sections
- add stronger active-section feedback while scrolling
- keep trimming verbose helper copy where controls are already self-explanatory

## Phase 4: Publishing workspace

- add top-level publishing routes
- improve single-job publish experience
- add queue/scheduled/failed views

Status: In progress

Implemented so far:
- publishing queue now has compact ready / scheduled / failed lane navigation
- single-job publish now includes step jump navigation for destination, upload, titles, descriptions, scheduling, and pins
- publish surfaces were compacted to save vertical space and remove repeated helper text
- publish header status was compressed into inline badges instead of repeating large top cards
- integration readiness moved out of its own card into a compact tinted state strip
- publishing queue now includes client-side lane filters, search, and sort controls
- single-job publish now has a sticky action bar for upload, title generation, description generation, and scheduling
- destination controls were compacted so workspace, account, distribution, and board selection fit into a denser operations layout
- integration states now distinguish saved credentials from usable credentials, so publish surfaces can show missing vs unavailable vs verified instead of labeling everything as configured
- the single-job publish page now surfaces Publer destination/auth failures inline in the destination module and removed the separate action-targeting card to save space
- publish action feedback is now section-local, so upload/title/description/schedule results appear next to the workflow step that triggered them instead of in a detached page-level banner

Still remaining in this phase:
- add richer queue filtering and sorting beyond the current lane/query/sort set
- continue compressing dense forms like board selection without hiding useful controls

## Phase 5: Library + Integrations + API keys

- move library under dashboard shell
- redesign settings into integrations workspace
- modernize API keys page

## Phase 6: polish

- keyboard shortcuts
- command palette
- richer search
- motion tuning
- responsive refinement

## Acceptance Criteria

The redesign is successful when:

- the app uses full desktop width without feeling stretched
- the primary workflow is reachable from a persistent sidebar
- publishing is reachable in one click from the main nav
- job detail is organized into clear workflow sections
- visual hierarchy is app-like and premium
- no important destination requires hunting through page-local buttons
- the shell can support future pages without redesign

## Execution Notes

- keep the existing backend workflow intact
- do not redesign the template engine in this phase
- prioritize information architecture and shell usability before visual polish
- preserve functional progress on pin generation and publishing while moving pages into the new shell

## Recommendation

Build the shell and route architecture first. Do not begin isolated page restyling until the sidebar, topbar, full-width layout, design tokens, and component primitives are established.
