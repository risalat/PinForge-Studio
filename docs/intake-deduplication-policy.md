# Intake Deduplication Policy

## Goal

Keep Studio intake clean by allowing only one unresolved job per article URL at a time, while still
allowing a new intake cycle after a post has already completed scheduling.

## Standard rule

- One `Post` record can have many `GenerationJob` records over time.
- Only one unresolved `GenerationJob` for the same `postUrl` may exist at a time for a user.
- If the same URL is pushed again while an unresolved job already exists, Studio must return the
  existing job instead of creating a duplicate.
- If the latest cycle for that URL is completed, Studio may create a new intake job. That new job
  is treated as a fresh-pin intake cycle.

## Unresolved statuses

The following job statuses block duplicate intake:

- `RECEIVED`
- `REVIEWING`
- `READY_FOR_GENERATION`
- `PINS_GENERATED`
- `MEDIA_UPLOADED`
- `TITLES_GENERATED`
- `DESCRIPTIONS_GENERATED`
- `READY_TO_SCHEDULE`
- `SCHEDULED`
- `FAILED`

These represent work that is still actionable or operationally unresolved.

## Completed-cycle behavior

If the previous job for the URL is `COMPLETED`, a new intake is allowed.

This is the approved path for:

- creating fresh pins later from the extension
- starting a new cycle for an article that already has scheduled or published pins

## API behavior

`POST /api/generate` must return a deterministic intake disposition:

- `created`
  - a normal new intake job was created
- `reused_existing_job`
  - a duplicate intake was prevented and the existing unresolved job is returned
- `created_fresh_intake`
  - the previous cycle was completed, so a new intake was created for fresh pins

The response still includes:

- `jobId`
- `status`
- `dashboardUrl`

## Operating procedure

### Same URL pushed again while still in Inbox / review / generation / publishing

- Do not create a new job
- Return the existing unresolved job
- Resume work from that job

### Same URL pushed again after a failed job

- Do not create a new job automatically
- Return the failed job so the user can inspect, retry, or intentionally restart later

### Same URL pushed again after scheduling is fully completed

- Create a new intake job
- Treat it as a fresh-pin cycle
- Let the normal review and publishing workflow proceed again

## Notes

- This policy applies at the Studio intake boundary.
- `Post Pulse` remains the higher-level freshness and timing surface.
- Extension-side UX can use the intake disposition to show clearer messages like:
  - `Existing job reopened`
  - `Fresh-pin cycle created`
