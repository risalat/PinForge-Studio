# PinForge Studio — Workflow, Feature, and Performance Upgrade PRD

## Document status
- Status: Draft for implementation
- Audience: Codex / engineering implementation
- Product: PinForge Studio
- Deployment target: Coolify / VPS
- Primary goal: Speed up Studio without removing the manual quality control that is central to the current workflow

---

## 1. Executive summary

PinForge Studio should evolve from a largely synchronous, job-centric workflow into a **human-in-the-loop, exception-driven production system**.

The current Studio already supports the right broad stages:
- intake
- plan creation
- bulk pin rendering
- publishing copy generation
- scheduling

However, the current implementation still has three major mismatches with the real operator workflow:

1. **Manual review is essential, but the workflow does not optimize for it.**
   The user bulk-renders 20–30 pins, skims them in a grid, and only edits the 4–5 questionable ones.

2. **Long-running work is still too foreground-oriented.**
   Even on VPS, long operations should not behave like request/response work.

3. **The product should optimize for exception handling, not mandatory approval of every item.**
   Good pins should flow through with minimal friction. Only questionable pins should create extra work.

This PRD proposes a new Studio model:

- **Grid-first render review**
- **Exception-based artwork fixes**
- **Single-pin background rerendering**
- **Batch-based publish-title and description generation** to preserve Koala API cost efficiency
- **Warning, not blocking**, when some rendered pins are still unresolved
- **Background workers** for all long-running tasks
- **Query slimming and dashboard read models** for performance and reliability

This is not a full-autopilot system. It is a **fast operator console**.

---

## 2. Grounded current-state observations

This PRD is based on the current repository structure and behavior.

### 2.1 Intake route behavior
The intake API route already only creates or reuses an intake job. It does **not** run the full render/publish pipeline. This matches the current route implementation and README notes.

Relevant files:
- `src/app/api/generate/route.ts`
- `README.md`

### 2.2 Core orchestration is still concentrated in one workflow module
A single module currently handles most workflow stages:
- intake reuse
- source image review save
- assisted and manual plan creation
- render-copy generation
- pin rendering
- Publer upload
- publishing title generation
- description generation
- scheduling
- job status sync

Relevant file:
- `src/lib/jobs/generatePins.ts`

### 2.3 Heavy detail reads are reused in many actions
The current `jobDetailInclude` is very large and powers `getJobForUser()` and `getOwnedJobOrThrow()`. That makes sense for page rendering, but it is too heavy for simple workflow actions.

Relevant file:
- `src/lib/jobs/generatePins.ts`

### 2.4 Rendering is still browser-per-pin and still carries serverless-specific logic
The renderer currently launches and closes a Playwright browser for each pin render and still includes Vercel/serverless Chromium branching.

Relevant files:
- `src/lib/renderer/renderPin.ts`
- `package.json`

### 2.5 Post Pulse is computed by loading nested graphs and reducing in memory
The Post Pulse dashboard currently loads posts with nested jobs, generated pins, schedule items, and publication records, then computes freshness and activity in application code.

Relevant files:
- `src/lib/dashboard/postPulse.ts`
- `src/app/dashboard/post-pulse/page.tsx`

### 2.6 Publer upload serialization is only in-process
Current Publer upload serialization uses an in-memory queue map. This works only inside one Node process.

Relevant file:
- `src/lib/publer/uploadQueue.ts`

### 2.7 Publish copy model already exists and should be reused
Current schema already stores:
- publishing title
- multiple title options
- description
- title status
- description status

Relevant file:
- `prisma/schema.prisma`

### 2.8 The publishing queue capacity logic already exists and is useful
There is already logic for queue-aware scheduling and capacity-aware slot preview. This should be preserved and improved, not replaced.

Relevant files:
- `src/lib/jobs/publishQueueCapacity.ts`
- `src/lib/jobs/publishScheduleContext.ts`

---

## 3. Real operator workflow to optimize for

The product must optimize for the following real usage pattern.

### 3.1 Intake source
The user picks a new article from:
- inbox
- opportunity list on dashboard

### 3.2 Bulk rendering workflow
The user renders **20–30 pins in one batch**.

### 3.3 Render review behavior
The user does **not** want to manually approve every pin.

Instead:
- user skims the rendered batch in a **grid first**
- only the questionable pins are opened in detail
- on average, only **4–5 pins out of 25** need rework
- fixes include:
  - editing artwork title
  - editing artwork subtitle
  - regenerating artwork copy with AI
  - rerendering one pin at a time

### 3.4 Transition to publishing
The user may continue to publishing even while some pins remain unresolved.

Desired behavior:
- show warning if some pins are still flagged or rerendering
- allow user to continue anyway
- schedule the currently usable pins now
- return later to fix and publish the remaining ones

### 3.5 Publish title generation
Publishing titles and descriptions are currently generated in **batches of 4 or 5** to reduce token cost for Koala Writer API.

This must be preserved.

Desired behavior:
- do **not** generate titles/descriptions immediately per pin when one pin becomes ready
- generate publish titles in background **chunks of 4–5 ready pins**
- title selection remains manual

### 3.6 Description behavior
Descriptions are usually good enough.

Desired behavior:
- keep description workflow low-friction
- surface only when generation fails or manual edit is needed

### 3.7 Scheduling
Scheduling behavior is already acceptable:
- user selects publish gap and jitter
- times are auto spaced properly
- no major UX change needed beyond handling subsets cleanly

---

## 4. Product principles

1. **Optimize for exception handling, not mandatory approval.**
2. **Do not remove human judgment where it protects quality.**
3. **Move slow machine work to background.**
4. **Preserve Koala cost efficiency with chunked generation.**
5. **Let publish-ready pins move forward even if some pins are still unresolved.**
6. **Favor minimal schema changes where current models already fit.**
7. **Improve operator speed more than theoretical automation.**

---

## 5. Product goals

### 5.1 Primary goals
- Reduce waiting and blocking during render review and publish preparation
- Make single-pin rerendering fast and non-disruptive
- Keep bulk review efficient via grid-first workflow
- Preserve manual title selection quality in the publishing stage
- Keep Koala token usage efficient via chunked generation
- Allow partial progression through the workflow without forcing all pins into the same state

### 5.2 Secondary goals
- Improve overall app responsiveness
- Reduce CPU waste in rendering
- Reduce heavy DB reads on common actions and dashboards
- Prepare Studio for stable VPS-based background processing

### 5.3 Non-goals
- Full end-to-end autopilot without review
- Mandatory approval clicks for every pin
- Immediate per-pin title/description generation after artwork fixes
- Over-engineering with unnecessary new infrastructure before needed

---

## 6. Target future workflow

## 6.1 Stage A — Intake
User selects article from inbox/opportunity list.

System creates or reuses job.

No major UX change required here.

## 6.2 Stage B — Bulk plans and bulk rendering
User prepares plans and starts bulk rendering.

System behavior:
- enqueue background render task(s)
- render pins without blocking page interaction
- update progress incrementally in UI

## 6.3 Stage C — Render review (grid-first, exception-based)
This becomes the main review stage.

### Desired UX
Default view is a **grid of rendered pins**.

Each card shows:
- preview image
- template name
- current artwork title
- current artwork subtitle if present
- lightweight state chip

Card actions:
- Flag for fix
- Open editor
- Rerender
- Discard / hide from current batch (optional)

Filtering options:
- All
- Flagged
- Rerendering
- Failed
- Fixed this session

### Key rule
Rendered pins are treated as **usable by default unless flagged**.

There is no mandatory approval click for every pin.

## 6.4 Stage D — Single-pin edit and rerender
For questionable pins only, user opens detail editor.

Detail editor supports:
- large preview
- editable artwork title
- editable artwork subtitle
- AI regenerate artwork copy
- rerender this pin only
- return to grid

### Key rule
Single-pin rerender must:
- run in background
- affect only that pin/plan
- not block other pins
- not reset the entire batch workflow

## 6.5 Stage E — Move to publishing with warning, not blocking
If unresolved pins still exist, the system shows a warning banner such as:

> 5 pins still need artwork fixes or are rerendering. You can continue with the 20 usable pins now and fix the rest later.

Desired behavior:
- user can continue anyway
- publish page defaults to usable pins only
- unresolved pins remain visible in a separate section

## 6.6 Stage F — Publish title generation in cost-efficient chunks
Publish titles are generated in **background batches of 4–5 ready pins**.

Desired behavior:
- batch generation is triggered for selected/eligible pins
- titles appear as they become ready
- user selects best title per pin
- user may regenerate alternatives per pin or per selected subset

## 6.7 Stage G — Description generation in chunks
Descriptions are generated in chunked background jobs as well.

Desired behavior:
- low-visibility by default
- auto-generate for pins whose final publishing title is selected
- chunk size remains cost-efficient for Koala
- surface description editor only on failure or manual override

## 6.8 Stage H — Scheduling
Scheduling operates on the subset of pins that are actually ready.

Pins are schedulable when:
- artwork is usable (not unresolved-flagged)
- media uploaded
- final publishing title selected
- description available

User can schedule subset now and return later for remainder.

---

## 7. UX requirements in detail

## 7.1 Render Review Board

### Functional requirements
- Show rendered pins in responsive grid
- Load grid quickly even for 20–30 pins
- Allow quick skim and spot-checking
- Allow exception marking without opening each pin
- Support pin detail drawer/modal for edits
- Show rerender progress per pin
- Support continuing to publishing with unresolved warnings

### UX requirements
- Grid-first by default
- Large preview on detail open
- Fast next/previous navigation inside questionable subset
- Avoid modal friction where possible; drawer preferred if practical
- Keyboard shortcuts desirable but not mandatory in first iteration

### States per card
- Normal
- Flagged
- Rerender queued
- Rerendering
- Rerender failed
- Discarded (optional)

## 7.2 Publishing Title Picker

### Functional requirements
For each publish-ready pin:
- show pin preview
- show 2–3 title options
- allow one-click selection of final title
- allow manual override
- allow regeneration of title options for one pin or selected pins

### UX requirements
- title options should be visual choice cards, not a raw textarea-first workflow
- selection should feel faster than manual copy-paste
- final chosen title should be clearly marked
- unresolved artwork pins should be separated from ready pins

## 7.3 Description UX
- hide by default
- auto-expand only on error
- allow manual edit when needed
- do not force review when successful

## 7.4 Warning-not-blocking publish transition
- show warning banner with unresolved count
- show ready count
- default selection to publishable pins only
- allow user to continue immediately

---

## 8. Background task architecture

## 8.1 Why background tasks are required
Moving to VPS removes serverless time limits, but it does not remove:
- reverse proxy timeouts
- user frustration from long waits
- DB bottlenecks
- Publer queue limits
- Node memory pressure

Therefore, long work must become asynchronous.

## 8.2 Recommended queue strategy
Use a **Postgres-backed task queue** first.

Rationale:
- no additional infrastructure required
- easier deployment in Coolify
- easier operations and debugging
- sufficient for current scale
- easy to evolve later if Redis/BullMQ becomes necessary

## 8.3 Target services
### Web app container
Handles:
- UI
- request validation
- enqueueing tasks
- reading status
- polling / optional SSE later

### Worker container
Handles:
- bulk render
- single-pin rerender
- media upload
- title generation
- description generation
- scheduling
- sync jobs
- cleanup jobs

### Scheduler container / cron process
Handles recurring jobs:
- publication sync
- orphan task recovery
- temp asset cleanup
- canonical repair
- dashboard snapshot refresh if needed

## 8.4 Suggested task table
Introduce a `BackgroundTask` table.

Suggested fields:
- `id`
- `kind`
- `status` (`queued`, `running`, `succeeded`, `failed`, `cancelled`)
- `userId`
- `jobId` (optional)
- `planId` (optional)
- `generatedPinId` (optional)
- `workspaceId` (optional)
- `priority`
- `dedupeKey`
- `payloadJson`
- `progressJson`
- `attempts`
- `maxAttempts`
- `runAfter`
- `lockedAt`
- `lockedBy`
- `startedAt`
- `finishedAt`
- `lastError`
- `createdAt`
- `updatedAt`

## 8.5 Initial task kinds
Recommended first task kinds:
- `RENDER_PLANS_BULK`
- `RERENDER_PLAN`
- `UPLOAD_MEDIA_BATCH`
- `GENERATE_PUBLISH_TITLES_BATCH`
- `GENERATE_DESCRIPTIONS_BATCH`
- `SCHEDULE_PINS`
- `SYNC_PUBLICATIONS`
- `CLEAN_TEMP_ASSETS`

## 8.6 Dedupe rules
Examples:
- `render-plan:{planId}`
- `rerender-plan:{planId}`
- `upload-batch:{jobId}:{workspaceId}:{hash(pinIds)}`
- `title-batch:{jobId}:{hash(pinIds)}`
- `description-batch:{jobId}:{hash(pinIds)}`
- `schedule-run:{scheduleRunId}`
- `sync-workspace:{userId}:{workspaceId}:{mode}:{page}`

Prevent double-click duplicates.

## 8.7 Worker concurrency recommendations
Initial conservative limits:
- rendering: 2 concurrent tasks
- AI generation: 2–4 concurrent tasks depending on provider rate/behavior
- Publer upload: 1 per workspace
- Publer schedule submit: 1 per workspace
- sync: 1 per workspace

---

## 9. Schema and data model changes

## 9.1 Guiding principle
Keep schema changes minimal where the current schema already models the publishing workflow adequately.

## 9.2 Reuse current publish-copy model
Keep using `PinCopy` for:
- chosen publishing title
- `titleOptions`
- description
- title/description field statuses

No major redesign required here.

## 9.3 Add lightweight artwork exception state
The render review lifecycle belongs more naturally to `GenerationPlan` than `GeneratedPin`, because:
- artwork title/subtitle are stored in plan render context
- rerender updates the plan and regenerates its output
- non-scheduled pins for that plan are already replaced during rerender logic

### Recommended additions to `GenerationPlan`
Suggested enum: `ArtworkReviewState`
- `NORMAL`
- `FLAGGED`
- `RERENDER_QUEUED`
- `RERENDERING`
- `RERENDER_FAILED`

Suggested fields:
- `artworkReviewState`
- `artworkReviewNote` (optional)
- `lastRerenderRequestedAt` (optional)
- `lastRerenderCompletedAt` (optional)
- `lastRerenderError` (optional)

This is enough to power exception-based review without forcing explicit approval of every pin.

## 9.4 Optional task metadata model
If task progress needs to be attached to UI cards efficiently, either:
- store latest task IDs directly on `GenerationPlan` / `GeneratedPin`, or
- resolve through `BackgroundTask` table relations

Prefer minimal denormalization at first.

## 9.5 Optional dashboard read models
Later phases may add:
- `PostPulseSnapshot`
- optional `PublishQueueSnapshot`

These are not required for first workflow rewrite, but are recommended for performance.

---

## 10. Query and performance enhancements

## 10.1 Split action reads from detail reads
Current heavy detail includes should remain for detail pages only.

Introduce lighter selectors such as:
- `getOwnedJobHeaderOrThrow(jobId, userId)`
- `getOwnedJobSourceImages(jobId, userId)`
- `getOwnedJobPlansForRender(jobId, userId, planIds?)`
- `getOwnedGeneratedPinsForPublish(jobId, userId, generatedPinIds?)`
- `getJobDetailForPage(jobId, userId)`

### Goal
Stop using the large `jobDetailInclude` for small actions.

## 10.2 Rendering performance
### Current issue
`renderPin.ts` launches a browser per pin and still carries serverless branching.

### Required changes
- move rendering into worker
- reuse long-lived Playwright browser in worker
- create fresh context/page per render or render batch
- recycle browser periodically for memory hygiene
- keep retries for crash conditions
- simplify native Playwright path for Coolify/VPS once validated

### Later cleanup
After stable native Playwright deployment:
- remove serverless-only Chromium path
- remove `@sparticuz/chromium` if no longer needed
- remove stale Vercel/serverless branches

## 10.3 Publer coordination performance and correctness
### Current issue
Upload serialization is only in-process.

### Required changes
Replace in-memory queue with **Postgres advisory locks** or DB-backed locking keyed by workspace.

Use for:
- media upload serialization per workspace
- schedule submission serialization per workspace
- sync serialization per workspace

### Important note
Do not aggressively parallelize Publer uploads. Conservative serialized behavior is preferred for reliability.

## 10.4 Post Pulse optimization
### Current issue
Post Pulse loads nested graphs and computes in memory.

### Required changes
Phase 1:
- add indexes
- trim queries where possible

Phase 2:
- add `PostPulseSnapshot` read model keyed by `(userId, postId, workspaceId)`
- update snapshot on:
  - job creation
  - pin render completion
  - scheduling
  - publication sync
  - fresh cycle creation

### Snapshot fields
Suggested:
- `userId`
- `postId`
- `workspaceId`
- `latestJobId`
- `totalJobs`
- `totalGeneratedPins`
- `publishedCount`
- `scheduledCount`
- `lastGeneratedAt`
- `lastPublishedAt`
- `lastScheduledAt`
- `lastSyncedAt`
- `freshnessStatus`
- `freshnessAgeDays`
- `recentActivityDotsJson`

## 10.5 Publish queue capacity performance
Current queue capacity logic is useful and should remain, but it repeatedly reconstructs state from publication records and local schedule items.

### Phase 1
Keep current logic and improve with indexes.

### Phase 2 optional
Introduce summary/snapshot model if capacity queries become hot.

## 10.6 Settings and metadata caching
Cache low-churn data such as:
- Publer workspaces
- Publer accounts
- Publer boards
- integration summaries if needed

Suggested cache table:
- `userId`
- `workspaceId`
- `kind`
- `key`
- `label`
- `rawJson`
- `fetchedAt`
- `expiresAt`

This avoids repeated discovery requests.

## 10.7 Instrumentation and observability
Add timing and counters around:
- bulk render duration
- single-pin rerender duration
- title generation batch duration
- description generation batch duration
- Publer upload wait time
- Publer upload duration
- schedule submission duration
- job detail query duration
- Post Pulse load duration

Log dimensions:
- userId
- jobId
- task kind
- provider/model
- templateId
- batch size

This is required before and after rollout to validate improvement.

---

## 11. Indexing recommendations

Add or review composite indexes for real query patterns.

Recommended additions / review targets:
- `GenerationJob(userId, postId, status, createdAt)`
- `GenerationJob(userId, postId, createdAt)`
- `PublicationRecord(userId, state, scheduledAt)`
- `PublicationRecord(userId, postId, providerWorkspaceId, publishedAt)`
- `ScheduleRunItem(status, scheduledFor)`
- `BackgroundTask(status, runAfter, priority)`
- `BackgroundTask(dedupeKey)` unique where appropriate
- `GenerationPlan(jobId, artworkReviewState, sortOrder)` if artwork state is added

Implementation should confirm exact Prisma/index support shape.

---

## 12. Detailed functional requirements

## 12.1 Bulk render tasking
When user starts render:
- enqueue background render task(s)
- show progress in UI
- update pins/plans as completed incrementally
- page refresh must not lose status

## 12.2 Render review exception marking
User can flag a rendered plan/pin without opening all pins.

Required behaviors:
- set `artworkReviewState = FLAGGED`
- include optional note if useful
- allow later filtering by flagged state

## 12.3 Single-pin rerender
When user edits artwork copy and rerenders:
- save updated render context
- enqueue single-pin rerender task
- set artwork review state to queued/rerendering
- replace current usable output for that plan when completed
- preserve other pins unaffected
- preserve already scheduled pins and avoid destructive replacement for scheduled assets

## 12.4 Continue-to-publish behavior
If unresolved pins exist:
- show warning banner
- allow continue
- publish UI should default to usable pins only
- unresolved pins shown separately

## 12.5 Title generation batching
Rules:
- operate on chunk size 4–5 by default for Koala economy
- chunks should be created only from publish-eligible pins
- generation can be triggered:
  - for all eligible pins
  - for selected subset
  - optionally for missing-only pins

## 12.6 Title selection
Required behaviors:
- show title options visually
- user can choose one as final
- final title persists in `PinCopy.title`
- title status becomes finalized
- user can manually edit chosen title
- user can request more options for specific pin(s)

## 12.7 Description generation batching
Rules:
- description generation remains chunked
- can be run for selected pins or missing-only pins
- should prefer pins whose titles are finalized
- descriptions remain low-friction in UI

## 12.8 Scheduling subset behavior
Scheduling screen should:
- operate on publish-ready pins only by default
- support partial scheduling of current subset
- leave unresolved pins for later
- preserve existing gap/jitter UX

---

## 13. State model

## 13.1 Job-level state
Keep current job-level status model for broad lifecycle visibility.

Do not rely on job state alone for operational truth.

## 13.2 Plan-level artwork state
Add artwork exception state on `GenerationPlan`.

Meaning:
- `NORMAL` = usable unless user says otherwise
- `FLAGGED` = user identified as needing work
- `RERENDER_QUEUED` = rerender requested
- `RERENDERING` = worker in progress
- `RERENDER_FAILED` = worker failed

## 13.3 Pin-level publish readiness
Derived from existing records.

A pin is publish-ready when:
- source plan not unresolved-flagged/rerendering/failed
- pin asset exists
- media uploaded or uploadable
- final title selected
- description exists

## 13.4 Unresolved render warnings
Any pins/plans in these artwork states count as unresolved:
- `FLAGGED`
- `RERENDER_QUEUED`
- `RERENDERING`
- `RERENDER_FAILED`

These create warnings, not hard blocks.

---

## 14. API / server action direction

The implementation may use server actions and/or route handlers depending on current code style, but the following design rules apply:

- short foreground actions should validate input and enqueue tasks
- long-running work must not stay inside request/response loop
- task status must be queryable by UI
- retries should be explicit and deduplicated

Examples:
- `enqueueBulkRender(jobId, planIds?)`
- `flagPlanForArtworkFix(planId)`
- `enqueueSinglePlanRerender(planId)`
- `enqueueTitleGeneration(jobId, pinIds)`
- `selectFinalPublishTitle(pinId, title)`
- `enqueueDescriptionGeneration(jobId, pinIds)`
- `enqueueScheduling(jobId, pinIds, scheduleConfig)`

Exact API shape can be chosen by implementation.

---

## 15. Rollout plan

## Phase 1 — Safe groundwork
- add instrumentation
- add or improve indexes
- split action reads from detail reads
- define background task schema

## Phase 2 — Worker foundation
- add worker container/process
- implement task polling/locking
- move bulk render into worker
- move single-pin rerender into worker

## Phase 3 — Render review UX
- build grid-first review board
- add flag-for-fix workflow
- add detail editor + single-pin rerender UX
- add warning-not-blocking transition to publishing

## Phase 4 — Publish batching workflow
- move title generation into chunked worker tasks
- improve title selection UI
- move description generation into chunked worker tasks
- de-emphasize description review UX

## Phase 5 — Publer coordination hardening
- replace in-memory upload serialization with DB/advisory lock
- cache low-churn Publer metadata
- keep scheduling and sync reliable across processes

## Phase 6 — Dashboard performance
- optimize Post Pulse queries
- add Post Pulse snapshot model if necessary
- optimize queue capacity read paths if necessary

## Phase 7 — Rendering cleanup
- move fully to native Playwright path in production once validated
- remove stale serverless branches and dependencies if safe

---

## 16. Acceptance criteria

### Workflow acceptance
- user can bulk render 20–30 pins without blocking UI
- user can skim a grid and flag only problematic pins
- user is not forced to approve every pin individually
- user can rerender one pin at a time in background
- other pins remain usable while rerender happens
- user can continue to publishing with unresolved pins after seeing a warning
- publish page defaults to usable pins only
- title generation works in cost-efficient chunks of 4–5
- title selection remains manual and fast
- description workflow stays low-friction
- user can schedule the ready subset now and come back later for remaining pins

### Performance acceptance
- long-running render and publish-prep steps no longer hold open slow foreground requests
- single-pin rerender does not reload or recompute the full batch unnecessarily
- detail pages remain rich, but common actions use lighter queries
- repeated browser launches are eliminated or greatly reduced in worker rendering path
- Publer serialization works correctly across multiple processes/containers
- Post Pulse remains responsive as data volume grows

### Reliability acceptance
- refreshing the page does not lose task progress
- task retries do not duplicate work unnecessarily
- double-clicking major actions does not create duplicate tasks
- web restart does not lose queued work
- worker restart can recover uncompleted tasks safely

---

## 17. Risks and mitigations

### Risk: Worker complexity adds implementation weight
Mitigation:
- start with Postgres-backed queue
- keep task types small and practical
- instrument heavily

### Risk: Rerender replacement logic may accidentally disrupt scheduled pins
Mitigation:
- explicitly preserve scheduled outputs
- only replace unscheduled current artifacts for targeted plan
- add regression tests around rerender flow

### Risk: Chunk-based generation may create awkward leftovers (e.g., 1–3 pins)
Mitigation:
- allow user to run remaining pins manually
- optionally support delayed batching window for leftover ready pins
- keep explicit “generate remaining now” action

### Risk: Publer coordination across processes may create duplicates
Mitigation:
- advisory locks per workspace
- dedupe keys on task table
- idempotent task handlers where possible

### Risk: Post Pulse snapshot can drift from source of truth
Mitigation:
- keep rebuild function from source tables
- add periodic reconciliation job

---

## 18. Open implementation choices left to engineering

The following can be decided during implementation as long as requirements are met:

- exact API shape (server actions vs routes)
- exact task polling method (polling now, SSE later optional)
- whether artwork review state fields are stored directly on `GenerationPlan` or in a small adjacent workflow table
- whether title generation leftovers under chunk size threshold are delayed, immediate, or user-triggered
- whether render detail editor is drawer, modal, or dedicated panel

Preferred bias:
- choose the option with lower operator friction and lower implementation overhead

---

## 19. Summary for implementation

Build Studio into a **grid-first, exception-based, background-powered workflow**.

### Core implementation theme
- good pins should flow through with little friction
- only questionable pins should create manual work
- machine work should happen in the background
- batch economics for Koala must be preserved
- unresolved pins should warn, not block

### If only a few things get done first, do these
1. Postgres-backed worker queue
2. Grid-first render review with exception marking
3. Single-pin background rerender
4. Chunked title generation with faster title picker
5. Query slimming and browser reuse

That combination will deliver the biggest product and performance gains with the least workflow disruption.
