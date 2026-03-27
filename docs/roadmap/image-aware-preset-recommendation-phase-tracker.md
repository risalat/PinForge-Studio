# Image-Aware Preset Recommendation Tracker

## Phase 1
Status: Implemented

Included:
- provisional text-context preset selection during assisted plan creation
- background `RECOMMEND_PLAN_PRESETS` task
- protection against overwriting manual preset changes
- review UI chips for queued / tuned / failed preset recommendation state

Deferred to next phase:
- deeper preset scoring improvements
- admin diagnostics for preset recommendation quality

## Phase 2
Status: Implemented

Included:
- `GET /api/dashboard/jobs/[jobId]/plans` task-status polling for preset tuning
- automatic review-page refresh when preset tuning completes
- per-plan `Retune preset` action
- worker-side protection against overwriting newer manual preset choices

Deferred to next phase:
- richer per-plan recommendation reasoning/debug info
- admin diagnostics for recommendation quality

## Phase 3
Status: Implemented locally

Included:
- stronger style-family scoring
- stronger room-type scoring
- stronger theme-family scoring
- weighted headline context so article/pin titles influence the preset choice more than weak metadata

Deferred to next phase:
- admin diagnostics for recommendation quality
- explicit recommendation reasoning/debug views
