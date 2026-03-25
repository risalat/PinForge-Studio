# Phase 0 Baseline Notes

This document is the Phase 0 baseline capture sheet for the workflow upgrade plan in:

- `pinforge-studio-prd-upgrade.md`
- `pinforge-studio-phase-checklist.md`

## What Phase 0 added

Structured observability now logs timing and failure data for these hotspots:

- `workflow.bulk_render`
- `workflow.single_pin_rerender`
- `workflow.publish_title_generation`
- `workflow.description_generation`
- `workflow.publer_media_upload`
- `workflow.schedule_submission`
- `dashboard.post_pulse.load`
- `query.job_detail_load`

All events are logged through the `pinforge.obs` structured logger and include a correlation ID.

## Correlation and log fields

Each structured event includes some or all of:

- `correlationId`
- `action`
- `userId`
- `jobId`
- `planId`
- `generatedPinId`
- `workspaceId`
- operation-specific metadata such as `pinCount`, `planCount`, `intervalMinutes`, `jitterMinutes`, `aiCredentialId`

Event shapes:

- `<operation>.started`
- `<operation>.succeeded`
- `<operation>.failed`

## Manual baseline capture procedure

Use a production-like environment on Coolify/VPS and collect timings from server logs.

### 1. Bulk render baseline

- Open a job with a representative bulk set of ready plans.
- Start bulk render.
- Capture the `durationMs` from `workflow.bulk_render.succeeded`.

### 2. Single-pin rerender baseline

- Rerender exactly one plan from an existing job.
- Capture the `durationMs` from `workflow.single_pin_rerender.succeeded`.

### 3. Publish title generation baseline

- Generate publish titles for 20 rendered pins.
- Capture the `durationMs` from `workflow.publish_title_generation.succeeded`.
- Note whether Koala batch generation is used for that run.

### 4. Post Pulse baseline

- Load `/dashboard/post-pulse` for a representative user.
- Capture the `durationMs` from `dashboard.post_pulse.load.succeeded`.

### 5. Job detail baseline

- Open `/dashboard/jobs/[jobId]` for a representative job with multiple plans and generated pins.
- Capture the `durationMs` from `query.job_detail_load.succeeded`.

## Baseline table

Captured so far from production-style Coolify logs on 2026-03-25.

| Operation | Sample size | Average ms | Notes |
| --- | --- | ---: | --- |
| Bulk render representative batch | Pending | Pending | No representative bulk render timing captured yet |
| Single-pin rerender | Pending | Pending | No single-pin rerender timing captured yet |
| Publish title generation | 2 runs, chunk sizes 4 and 3 | 6944 | Observed `7918ms` for 4 pins and `5969ms` for 3 pins with Koala batching |
| Description generation | 3 runs, chunk size 5 | 9760 | Observed `12111ms`, `8510ms`, and `8660ms` |
| Publer media upload | 1 run, pin count 1 | 681 | Successful single-pin media upload |
| Schedule submission | 1 run, pin count 15 | 24352 | Full schedule submit including Publer job polling |
| Post Pulse load | Pending | Pending | No `dashboard.post_pulse.load.succeeded` event captured yet |
| Job detail page load | Many repeated samples | 1230 | Most runs were around `1150ms` to `1300ms`, with a slower observed case at `1607ms` |

## Notes

- This phase intentionally does not change workflow behavior.
- These timings are the pre-refactor baseline for later phases.
- If multiple runs vary widely, record both average and worst-case values in rollout notes.
- The `20-30` bulk example in the PRD/checklist is not a hard rule; future baseline captures should note the actual batch size used.
