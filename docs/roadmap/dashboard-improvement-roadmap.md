# Dashboard Improvement Roadmap

Last updated: March 13, 2026
Status: This roadmap is fully implemented.

## Purpose

This document defines the remaining dashboard and operations improvements after:
- `Post Pulse`
- Publer publication sync
- workspace profiles
- active workspace scoping

It is the execution order for the next rounds of work.

Status:
- completed

## Current baseline

Already implemented:
- `Post Pulse` post-level tracker
- Publer sync with local publication ledger
- resumable sync flow
- first-party domain filtering
- workspace profiles under a single saved Publer API key
- active workspace selector in the dashboard shell
- active workspace/domain scoping across overview, inbox, jobs, publishing, and `Post Pulse`
- profile-backed default account/board data model

Still missing:
- no open items in this roadmap version

## Product principles

These rules should guide all follow-up work:

1. One source of truth per concern
- Publer is the source of truth for scheduled/published activity.
- workspace profiles are the source of truth for workspace/domain/account/board defaults.

2. Lean UI
- avoid helper-heavy screens
- prefer defaults and quiet state over explanatory copy
- expose only the controls needed for the current workflow step

3. Safe incremental rollout
- avoid large rewrites
- use migrations only when they create lasting operational value
- keep every phase independently shippable

4. First-party focus
- the dashboard should default to the active workspace profile and its allowed domains
- external/repinned content may still exist in storage, but should not dominate primary workflows

## Workstreams

### 1. Profile-level publishing UX

#### Problem

The data model now supports workspace-profile defaults, but the publish flow does not make those defaults explicit enough, and the user cannot update them naturally while publishing.

#### Goal

Make publishing feel workspace-native:
- the selected account/board should clearly come from the active profile
- changing them in the publish flow should optionally update the profile defaults

#### Scope

In scope:
- show current active workspace profile at the top of publish flow
- label account/board fields as profile defaults when prefilled
- add a compact action such as `Save as profile default`
- persist account/board back into the active workspace profile

Out of scope:
- profile editing from many screens
- multi-key Publer auth

#### UX rules

- no extra helper paragraphs
- use small inline cues:
  - `Default from profile`
  - `Saved to profile`
- keep the publish page as the operational workspace, not a settings page

#### Technical approach

- read active profile on page load
- expose a profile-default save action in publish flow
- update `WorkspaceProfile.defaultAccountId` and `WorkspaceProfile.defaultBoardId`
- refresh the publish page state after save

#### Acceptance criteria

- publish flow clearly identifies the active workspace profile
- prefilled account/board are visibly recognized as defaults
- user can save current account/board back to the profile in one action
- next publish session for that profile uses the saved defaults

#### Recommended sequence

This is the next implementation phase.

---

### 2. Smart schedule spacing

#### Problem

Studio can now see real scheduled and published activity from Publer, but the publish queue still behaves like a local scheduling surface. It does not yet use existing Publer history to intelligently space new pins for the same post.

#### Goal

Make scheduling aware of already scheduled or published pins for the active post so Studio does not crowd the queue or create accidental overlap.

#### Initial rule

If a post already has scheduled or published pin activity in Publer/Pinterest, newly scheduled pins for that same post should be placed at least 25 to 30 days after the latest relevant scheduled date.

Recommended version 1 operating rule:
- find the latest future scheduled pin date for the post in the active workspace
- if no future scheduled pin exists, use the latest published-like date
- schedule the first new pin no earlier than:
  - `latest existing activity date + 25 days`
- optionally allow a bounded randomization window up to 30 days

#### Scope

In scope:
- surface existing Publer activity context inside the publish flow
- detect latest existing schedule/publication date for the active post
- auto-seed the first publish date based on the spacing rule
- clearly show the anchor date used for spacing
- prevent naive immediate scheduling if the post already has recent or future pins

Out of scope:
- global cadence optimization across all posts
- board-level calendar balancing
- fully automated long-horizon campaign planning

#### Data source

Primary source:
- local `PublicationRecord` ledger synced from Publer

Secondary fallback:
- local `ScheduleRunItem.scheduledFor` for Studio-origin scheduled pins when Publer sync is not yet current

#### UX rules

- keep it quiet and operational
- do not add large explanatory blocks
- show one compact line near schedule controls:
  - `Last scheduled in Publer: Apr 12, 2026`
  - `Next recommended slot: May 7, 2026`

- when the user manually overrides:
  - allow it
  - but show a small warning if they are scheduling too close to an existing pin

#### Technical approach

Phase 1:
- add a server-side helper that computes:
  - latest scheduled date
  - latest published date
  - recommended next eligible date
- pass that schedule context into the publish flow
- seed `firstPublishAt` with the recommended date when available

Phase 2:
- use the same helper in the publishing queue so queue items display whether they are already cadence-safe

#### Acceptance criteria

- if a post already has Publer activity, the publish flow pre-fills the next recommended schedule date using the spacing rule
- the user can see which existing date the recommendation was based on
- same-post scheduling no longer defaults to an immediate or conflicting date when prior schedule history exists

#### Recommended sequence

This should come immediately after profile-level publishing UX, because it builds directly on the publish flow and workspace-profile context.

---

### 3. Publer sync optimization

#### Problem

Backfill and resumable sync now work, but the system still does more work than necessary after initial history is loaded.

#### Goal

Move from repeated broad sync to profile-scoped incremental sync.

#### Scope

In scope:
- incremental sync cursor/state per workspace profile
- bounded reconciliation window for recent records
- clear distinction between:
  - initial backfill
  - incremental sync
  - periodic reconciliation

Out of scope:
- background cron worker unless needed immediately
- webhook/event architecture

#### Design decisions

Primary model:
- keep `PublicationSyncState` as the sync-state table
- continue scoping sync state by `userId + workspaceId`

Sync behavior:
- first run: backfill through history in batches
- steady state: incremental pull over recent pages/date window
- safety net: periodic wider reconciliation window to catch edits/state transitions

#### Risks

- Publer may not offer a perfect “updated since” signal
- published state changes may require a rolling recent-window scan

#### Acceptance criteria

- repeated `Sync Publer now` after backfill should only touch recent data
- sync duration should be materially lower than full backfill
- scheduled/published state changes still reconcile correctly

#### Recommended sequence

This should be phase immediately after publishing UX.

---

### 4. Post Pulse actions

#### Problem

`Post Pulse` is now informative, but the user still has to manually jump into other flows to act on stale posts.

#### Goal

Turn `Post Pulse` into an operating surface, not just a report.

#### Scope

In scope:
- `Create fresh pins` action for rows in `Needs fresh pins`
- action should reuse the existing post context
- optional quick link to latest Publer record if a useful URL exists

Out of scope:
- one-click full autonomous generation with no review
- destructive automation

#### Design decisions

`Create fresh pins` should:
- create a new job linked to the same `Post`
- seed from the latest known article/post context
- open in review/planning state, not bypass review

Optional `Open in Publer`:
- only show if `providerPostLink` exists and is stable/useful

#### Acceptance criteria

- stale rows expose a direct fresh-pin action
- action creates a new usable Studio job
- user does not need to re-enter the article URL manually

#### Recommended sequence

Implement after incremental sync, because freshness should already be efficient and trustworthy first.

---

### 5. Stronger workspace segregation

#### Problem

Main dashboard surfaces are scoped, but some product areas still need a final decision on whether they should be profile-aware or remain global.

#### Goal

Finish the segregation policy so future domains/workspaces do not blur together.

#### Decision areas

1. Overview metrics
- recommended rule: overview should stay active-profile scoped by default

2. Library/templates/presets
- recommended rule: keep global for now
- reason: templates and presets are production assets, not workspace-owned records
- only add profile-awareness later if profiles truly need distinct template availability or branding packs

3. Future publishing analytics
- should be profile-scoped by default

#### Scope

In scope:
- confirm and codify which screens are:
  - profile-scoped
  - global
- apply any missing filters where a screen should be profile-scoped

Out of scope:
- duplicating template/preset libraries per profile without a real use case

#### Acceptance criteria

- each dashboard area has an explicit scope policy
- no ambiguous mix of global and profile-scoped metrics within the same view

#### Recommended sequence

This can be done alongside or immediately after `Post Pulse` actions.

---

### 6. Data hygiene and housekeeping

#### Problem

The app handles direct workflow deletes, but general storage hygiene and missing-asset audits are still incomplete.

#### Goal

Make storage trustworthy and cost-aware.

#### Scope

In scope:
- admin or maintenance script to detect DB pin records whose storage object is missing
- stale temp asset cleanup policy and script
- R2 retention behavior documentation
- dashboard-safe handling for missing asset states

Out of scope:
- aggressive automatic deletion of published assets without policy approval

#### Storage policy direction

Recommended model:
- temporary source/download/render artifacts: eligible for cleanup
- published/generated assets referenced by records: retain unless explicitly discarded or archived by policy
- missing-object audit should report, not silently mutate data

#### Acceptance criteria

- one repeatable way to audit missing `storageKey` objects
- one repeatable way to clean stale temp assets
- retention policy documented in repo docs

#### Recommended sequence

Run after the workflow/product phases above. This is operational hardening, not feature unlock.

---

### 7. UI cleanup pass

#### Problem

A few dashboard screens still carry extra copy or uneven density from earlier implementation passes.

#### Goal

Finish the dashboard as a tighter operations UI.

#### Scope

In scope:
- trim leftover helper copy
- align empty states
- keep summary cards and control bars compact
- reduce noisy secondary text where labels already provide context

Out of scope:
- broad visual redesign
- changing established page information architecture without a strong reason

#### Acceptance criteria

- each page reads as an operations surface, not a tutorial
- controls remain understandable without repeated explanatory paragraphs

#### Recommended sequence

Last. This is polish after the behavior is settled.

## Recommended implementation order

### Phase A
- Profile-level publishing UX
- completed

### Phase B
- Smart schedule spacing
- completed

### Phase C
- Publer sync optimization
- completed

### Phase D
- Post Pulse actions
- completed

### Phase E
- Stronger workspace segregation policy completion
- completed

### Phase F
- Data hygiene and housekeeping
- completed

### Phase G
- UI cleanup pass
- completed

## Rollout notes

- Each phase should ship in its own commit/PR-sized unit.
- Run `npm run build` for every phase.
- Run `npx prisma migrate deploy` only on phases with schema changes.
- Avoid combining feature work with cleanup-only UI changes in the same phase unless tightly coupled.

## Immediate next execution target

This roadmap is fully implemented.
