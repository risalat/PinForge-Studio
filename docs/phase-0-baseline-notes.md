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

Fill this after capturing real timings in staging or production.

| Operation | Sample size | Average ms | Notes |
| --- | --- | ---: | --- |
| Bulk render representative batch | Pending | Pending | Capture `workflow.bulk_render.succeeded` and note actual plan count |
| Single-pin rerender | Pending | Pending | Capture `workflow.single_pin_rerender.succeeded` |
| Publish title generation for 20 pins | Pending | Pending | Capture `workflow.publish_title_generation.succeeded` |
| Post Pulse load | Pending | Pending | Capture `dashboard.post_pulse.load.succeeded` |
| Job detail page load | Pending | Pending | Capture `query.job_detail_load.succeeded` |

## Notes

- This phase intentionally does not change workflow behavior.
- These timings are the pre-refactor baseline for later phases.
- If multiple runs vary widely, record both average and worst-case values in rollout notes.
