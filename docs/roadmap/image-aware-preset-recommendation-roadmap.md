# Image-Aware Preset Recommendation Roadmap

## Goal
Keep assisted plan creation fast while preserving high-quality image-aware preset selection.

## Phase 1
- Create assisted plans immediately with a provisional text-context preset.
- Queue `RECOMMEND_PLAN_PRESETS` in the background for image-aware refinement.
- Never overwrite a plan if the user manually changed the preset.
- Surface preset tuning state in the review UI.

## Phase 2
- Add live polling/status for active preset recommendation tasks in the review screen.
- Show when preset tuning finishes without requiring a manual refresh.
- Add a lightweight per-plan "retune preset" action.

## Phase 3
- Improve the recommendation model:
  - stronger room/style keyword mapping
  - better color-family matching
  - template-specific scoring rules
  - optional deeper image feature analysis for render-safe templates
- Add admin diagnostics for preset recommendation success/failure rates.

## Multi-user Follow-up
- Add queue fairness if many users are tuning presets simultaneously.
- Add per-workspace/per-user throttles only if queue contention appears in production.
