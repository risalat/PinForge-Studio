# PinForge Studio — Phase Implementation Checklist

This checklist translates the PRD into a practical build order for Codex. It is intentionally execution-focused.

---

## Guiding rules

- Do not break existing workspace-scoped behavior.
- Do not remove current manual quality control for artwork titles or publish titles.
- Optimize for grid-first, exception-based review.
- Keep Koala title/description generation batched (4–5 items) for cost efficiency.
- Make long-running work asynchronous before trying to add too many new UX features.
- Prefer incremental schema changes and backward-compatible migrations.
- Preserve the current usable workflow while new systems are introduced behind feature flags where possible.

---

# Phase 0 — Baseline, instrumentation, and safety rails

## Goal
Measure current hotspots and reduce risk before refactors.

## Tasks

### 0.1 Add timing + structured logs
Track duration and success/failure for:
- bulk render
- single-pin rerender
- title generation
- description generation
- Publer media upload
- scheduling
- Post Pulse loading
- heavy job-detail loading

### 0.2 Add task correlation IDs
- Add per-request / per-action correlation ID
- Pass through server actions, worker runs, Publer operations, and AI generation

### 0.3 Add lightweight error reporting helpers
- Normalize error objects
- Store human-readable failure message plus raw diagnostic payload where safe

### 0.4 Capture current UX baseline
Document:
- average time to render 20–30 pins
- average time to rerender 1 pin
- average time to generate publish titles for 20 pins
- Post Pulse load time
- job detail page load time

## Deliverables
- Logging helpers
- Timed metrics in server logs
- Before/after benchmark notes

## Exit criteria
- Team can identify top 3 slowest operations with real measurements
- No functional changes yet

---

# Phase 1 — Query slimming and safe schema prep

## Goal
Reduce unnecessary DB load before adding async workers.

## Tasks

### 1.1 Split heavy detail reads from action reads
Current issue:
- action flows reuse the heavy job detail include

Create separate query helpers for:
- getOwnedJobHeaderOrThrow
- getOwnedJobSourceImages
- getOwnedJobPlansForRender
- getOwnedGeneratedPinsForPublish
- getJobDetailForPage (keep existing heavy include behavior for pages)

### 1.2 Add composite indexes
Add indexes for observed query patterns, including:
- GenerationJob(userId, postId, status, createdAt)
- GenerationJob(userId, postId, createdAt)
- PublicationRecord(userId, state, scheduledAt)
- PublicationRecord(userId, postId, providerWorkspaceId, publishedAt)
- ScheduleRunItem(status, scheduledFor)

Also review and add any needed supporting indexes discovered during EXPLAIN analysis.

### 1.3 Add minimal artwork exception state
Add lightweight render-review fields, preferably on GenerationPlan:
- artworkReviewState
- artworkFlagReason (nullable)
- rerenderRequestedAt (nullable)
- rerenderError (nullable)

Suggested enum values:
- NORMAL
- FLAGGED
- RERENDER_QUEUED
- RERENDERING
- RERENDER_FAILED

Do not introduce mandatory per-pin approval state.

### 1.4 Preserve backward compatibility
- Default old plans to NORMAL
- Existing jobs/pins remain usable without manual migration work

## Deliverables
- New Prisma migration
- Query helper refactor
- No visible UX change yet except maybe slightly faster page actions

## Exit criteria
- Action flows no longer hydrate full job graph unnecessarily
- Existing pages still render correctly
- Schema migration is safe in production

---

# Phase 2 — Postgres-backed background task system

## Goal
Stop doing long-running work in foreground request/response paths.

## Tasks

### 2.1 Add BackgroundTask model
Suggested fields:
- id
- kind
- status
- userId
- jobId
- planId
- generatedPinId
- workspaceId
- priority
- dedupeKey
- payloadJson
- progressJson
- attempts
- maxAttempts
- runAfter
- lockedAt
- lockedBy
- startedAt
- finishedAt
- lastError
- createdAt
- updatedAt

Enums:
- status: QUEUED / RUNNING / SUCCEEDED / FAILED / CANCELLED
- kind:
  - RENDER_PLANS
  - RERENDER_PLAN
  - UPLOAD_MEDIA_BATCH
  - GENERATE_TITLE_BATCH
  - GENERATE_DESCRIPTION_BATCH
  - SCHEDULE_PINS
  - SYNC_PUBLICATIONS
  - CLEAN_TEMP_ASSETS

### 2.2 Build worker runtime
Add a separate worker process/container that:
- polls queued tasks
- acquires DB lock / task lease
- runs task
- updates progress + result
- retries transient failures safely

### 2.3 Implement task dedupe
Examples:
- render-plans:{jobId}:{hashOfPlanIds}
- rerender-plan:{planId}
- upload-media:{jobId}:{workspaceId}:{hashOfPinIds}
- generate-title-batch:{jobId}:{hashOfPinIds}:{aiCredentialId}
- generate-description-batch:{jobId}:{hashOfPinIds}:{aiCredentialId}
- schedule-run:{scheduleRunId}
- sync-publications:{userId}:{workspaceId}:{mode}:{page}

### 2.4 Add worker-safe retry rules
- AI rate limits: retry
- Publer queue limit: retry
- browser/page crash: retry
- validation errors: fail without retry
- missing configuration: fail without retry

## Deliverables
- BackgroundTask schema + migration
- Worker entrypoint
- Task runner framework

## Exit criteria
- Worker can process a simple test task end-to-end
- Tasks survive page refresh and web container restart
- Duplicate clicks do not create duplicate long-running work

---

# Phase 3 — Async render pipeline + single-pin rerender

## Goal
Support bulk render and one-pin-at-a-time rerender without blocking the user.

## Tasks

### 3.1 Move bulk render to background task
- Queue render task instead of doing full render inline
- Render only selected plans
- Update progress as each plan finishes

### 3.2 Add single-pin rerender task
- For a flagged plan, queue only that plan’s rerender
- Replace old unscheduled generated pin asset for that plan
- Preserve other pins in the batch

### 3.3 Update artwork-review state automatically
- when user flags a plan -> FLAGGED
- when rerender queued -> RERENDER_QUEUED
- when worker starts -> RERENDERING
- on success -> NORMAL
- on failure -> RERENDER_FAILED

### 3.4 Keep non-flagged pins publishable
- flagged pins should not block job-level progress
- unresolved flags trigger warnings, not hard blocking

### 3.5 Add background progress endpoint / polling
Expose:
- queued
- running
- percent / item counts
- failed item details

## Deliverables
- render task flow
- rerender task flow
- plan exception state transitions

## Exit criteria
- User can rerender one pin while continuing other work
- Good pins are not reset just because one pin is being fixed
- No long render action blocks the browser session

---

# Phase 4 — Grid-first artwork review UX

## Goal
Match the real workflow: skim everything, fix only exceptions.

## Tasks

### 4.1 Build render review grid
Each card shows:
- preview
- template name
- artwork title
- subtitle if present
- status chip: normal / flagged / rerendering / failed

### 4.2 Add exception actions
Card-level actions:
- Flag for fix
- Open editor
- Rerender
- Discard / hide from current set

### 4.3 Add detail editor drawer/modal
- Large preview
- Editable artwork title/subtitle
- Optional AI regenerate artwork copy
- Save + rerender
- Back to grid

### 4.4 Add filters
- all
- flagged
- rerendering
- failed
- recently fixed

### 4.5 Warning-only transition to publishing
If flagged pins remain:
- show warning banner
- allow continue anyway
- carry only currently usable pins forward by default

## Deliverables
- grid review page/section
- detail editor
- warning banner behavior

## Exit criteria
- User can skim 20–30 pins quickly
- No mandatory approve click is required for every pin
- User can continue to publish with unresolved flagged pins

---

# Phase 5 — Playwright performance upgrade

## Goal
Reduce CPU and latency for rendering on VPS/Coolify.

## Tasks

### 5.1 Stop launching one browser per pin
Refactor renderer to:
- keep one long-lived browser per worker process
- create fresh context/page per render or batch
- recycle browser periodically

### 5.2 Add browser pool safeguards
- restart browser after N renders or memory threshold
- recover automatically from page crash
- log browser restart reason

### 5.3 Keep Docker/native Playwright as primary path
- Prefer native Playwright in persistent server environment
- Keep current serverless branch temporarily for compatibility until validated

### 5.4 Remove serverless-only rendering code later
After stable production validation:
- remove `@sparticuz/chromium`
- remove unused serverless branches
- simplify Playwright dependencies if safe

## Deliverables
- pooled/long-lived renderer
- render crash recovery
- lower average render time

## Exit criteria
- Average total render time for 20–30 pins materially improves
- CPU spikes are smoother
- Browser/page crashes recover without breaking the whole job

---

# Phase 6 — Publish page: batch title generation with manual selection

## Goal
Keep Koala cost efficient while making title selection faster.

## Tasks

### 6.1 Preserve batch generation model
Generate publish-title options in chunks of 4–5 pins:
- background only
- not one pin at a time automatically after artwork review
- allow explicit generation for selected pins or default eligible chunking

### 6.2 Define eligibility rules for title generation
Eligible pins:
- rendered
- not flagged or optionally included by manual override
- not currently rerendering
- not discarded
- not already finalized unless user explicitly regenerates

### 6.3 Build title picker UI
For each pin:
- preview image
- 2–3 title option cards
- one-click choose
- manual override field
- regenerate options for this pin
- optional multi-select bulk generate for eligible pins

### 6.4 Reuse existing PinCopy model
Use current fields:
- title
- titleOptions
- titleStatus
- description
- descriptionStatus

Do not introduce redundant publish-title models unless absolutely required.

### 6.5 Keep flagged pins separated
Publish page sections:
- Ready for title generation
- Titles ready for selection
- Not ready (flagged / rerendering / failed artwork)

## Deliverables
- async chunked title generation
- title selection UX
- cleaner publish readiness segmentation

## Exit criteria
- Titles are still generated in cost-efficient chunks
- User can choose best title per pin quickly
- Unresolved artwork pins do not clutter ready-to-publish pins

---

# Phase 7 — Description generation, low-friction mode

## Goal
Keep descriptions almost invisible unless something goes wrong.

## Tasks

### 7.1 Generate descriptions in chunks
Run description generation:
- after enough finalized titles are available
- in background chunks of 4–5
- optionally with “generate remaining descriptions now”

### 7.2 Collapse description UI by default
Only expand when:
- description missing
- generation failed
- user clicks edit

### 7.3 Retry path
Allow:
- regenerate descriptions for selected pins
- manual edit when necessary

## Deliverables
- chunked async description generation
- collapsed default UI
- minimal friction for successful cases

## Exit criteria
- Description handling does not dominate the publish workflow
- Most users can ignore descriptions completely unless needed

---

# Phase 8 — Media upload and scheduling via background tasks

## Goal
Make publish execution resilient and resumable.

## Tasks

### 8.1 Move Publer media upload to background batches
- Queue uploads for selected eligible pins
- Update pin/media status progressively
- Allow retry failed uploads only

### 8.2 Move scheduling to async task
- Queue schedule run
- Persist per-pin schedule outcomes
- Allow retry for failed schedule items without disturbing successful ones

### 8.3 Warning-only behavior for unresolved pins
When scheduling:
- preselect only publish-ready pins
- exclude flagged/rerendering/not-ready pins by default
- show warnings, not blockers

### 8.4 Keep current gap/jitter logic
Preserve current schedule spacing behavior unless explicitly improved later.

## Deliverables
- async upload flow
- async schedule flow
- per-item retry controls

## Exit criteria
- Scheduling 20 ready pins works even if 5 others are unresolved
- Page refresh does not lose schedule progress
- Successful pins are not resubmitted unnecessarily

---

# Phase 9 — Replace in-memory Publer serialization with DB-backed locking

## Goal
Make Publer coordination safe across worker/web processes and future replicas.

## Tasks

### 9.1 Remove dependency on in-memory workspace map
Current upload serialization is in-process only.

### 9.2 Add Postgres advisory lock or DB-backed lock helper
Lock scope:
- workspace-specific media upload
- workspace-specific scheduling
- workspace-specific sync

### 9.3 Keep conservative concurrency
Suggested limits:
- upload: 1 per workspace
- scheduling: 1 per workspace
- sync: 1 per workspace

## Deliverables
- cross-process workspace lock helper
- worker-safe Publer coordination

## Exit criteria
- Duplicate/parallel worker processes do not collide on Publer operations
- Behavior remains correct with future scaling

---

# Phase 10 — Workspace metadata caching

## Goal
Reduce repeated low-churn Publer metadata fetches.

## Tasks

### 10.1 Add cache table or DB-backed metadata store
Cache:
- workspaces
- Pinterest accounts
- boards

Suggested fields:
- userId
- workspaceId
- cacheKind
- cacheKey
- label
- rawJson
- fetchedAt
- expiresAt

### 10.2 Add refresh policy
- use cached value if fresh
- refresh in background on demand
- manual refresh action in settings if needed

## Deliverables
- workspace/account/board metadata cache
- lower settings/publish page latency

## Exit criteria
- Repeated visits no longer re-fetch Publer metadata unnecessarily
- Manual refresh still possible

---

# Phase 11 — Post Pulse and dashboard read-model optimization

## Goal
Stop computing freshness by loading big nested graphs on every request.

## Tasks

### 11.1 Add PostPulseSnapshot model
One row per:
- userId
- postId
- workspaceId

Suggested fields:
- latestJobId
- totalJobs
- totalGeneratedPins
- totalPublerRecords
- publishedCount
- scheduledCount
- lastGeneratedAt
- lastPublishedAt
- lastScheduledAt
- lastSyncedAt
- freshnessStatus
- freshnessAgeDays
- recentActivityDotsJson
- updatedAt

### 11.2 Update snapshot from workflow events
Refresh snapshot when:
- job created
- pins rendered
- media uploaded
- schedule created
- sync completes
- fresh cycle created

### 11.3 Refactor Post Pulse page to query snapshot
Keep old computation code as fallback/rebuild path only.

## Deliverables
- snapshot table + update hooks
- faster Post Pulse page

## Exit criteria
- Post Pulse no longer loads nested jobs/pins/records per page request
- Freshness numbers remain correct

---

# Phase 12 — Scheduler / recurring maintenance worker

## Goal
Move maintenance and sync into predictable recurring background jobs.

## Tasks

### 12.1 Add scheduled recurring worker jobs
- publication sync incremental
- publication sync backfill
- temp asset cleanup
- orphan task recovery
- optional canonical repair tasks

### 12.2 Add stale-task recovery
- detect RUNNING tasks with expired lock
- mark retryable or failed safely

### 12.3 Add cleanup retention rules
- temp render asset retention
- task log retention
- old snapshot rebuild retention if needed

## Deliverables
- scheduler container/command
- recurring maintenance jobs

## Exit criteria
- System can heal from interrupted worker runs
- Temp storage and orphan tasks remain under control

---

# Phase 13 — Remove leftover serverless assumptions

## Goal
Finish VPS-first simplification after production stability is proven.

## Tasks

### 13.1 Audit runtime assumptions
Remove or reduce:
- Vercel-specific maxDuration thinking where no longer useful
- serverless Chromium branches
- unnecessary serverless-only dependency paths

### 13.2 Update deployment docs
Document:
- web container
- worker container
- scheduler container
- Playwright install/runtime requirements
- env vars
- R2 expectations
- scaling notes

## Deliverables
- simplified VPS-first runtime docs
- cleaner renderer/runtime code

## Exit criteria
- Production path is clearly optimized for Coolify/VPS
- No hidden reliance on old Vercel assumptions

---

# Cross-phase acceptance criteria

The implementation is successful when:

- User can bulk render 20–30 pins without waiting on a long foreground request
- User can skim a grid and fix only the 4–5 questionable pins
- One pin can be rerendered without disrupting the rest of the batch
- Flagged pins warn but do not block publishing
- Publish titles are still generated in Koala-efficient chunks
- User can manually choose the best publish title quickly
- Descriptions stay mostly invisible unless needed
- Scheduling works for ready pins even while other pins remain unresolved
- Publer operations are coordinated safely across processes
- Post Pulse loads from a lightweight summary model
- Multiple workspace behavior remains intact

---

# Suggested implementation order for Codex

Recommended actual execution order:

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8
10. Phase 9
11. Phase 10
12. Phase 11
13. Phase 12
14. Phase 13

---

# Notes for Codex

- Do not redesign the product into a forced approval workflow.
- Do not auto-generate titles/descriptions one-by-one after each design approval.
- Do not let flagged pins block the rest of the workflow.
- Do not break multi-workspace support.
- Do not overcomplicate the schema when existing publish-copy models already cover most publish-stage needs.
