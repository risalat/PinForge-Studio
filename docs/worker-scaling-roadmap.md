# Worker Scaling Roadmap

## Status

- Status: Future roadmap
- Audience: internal engineering / ops
- Current production baseline: `1` worker service

## Why this roadmap exists

Pin Forge Studio now uses:

- a shared Postgres-backed background task queue
- one worker process per worker service
- one task executed at a time per worker
- DB-backed workspace locks for Publer operations

This is correct for current scale, but as user volume grows, worker strategy must become more intentional.

The goal is to scale safely without:

- spawning wasteful numbers of identical workers
- overloading the database
- causing Publer collisions
- letting one heavy workflow starve everyone else

## Current model

Right now the system behaves like this:

- all users share the same `BackgroundTask` table
- each worker claims one task at a time
- with `1` worker:
  - only `1` task runs at a time
- with `2` workers:
  - up to `2` tasks run at a time

This is acceptable for early production and small user counts.

## Important current limitation

The queue is global and priority-based.

That means:

- one user can occupy worker time with many high-priority tasks
- heavy render work can compete with lighter AI/upload tasks
- fairness between users is limited

This is acceptable for now, but should not be the final strategy for a larger user base.

## What not to do

Do not scale by blindly deploying very large numbers of identical workers.

Examples of bad scaling:

- `20`, `50`, or `100` identical workers without task separation

Why this is bad:

- increases DB polling and lock contention
- increases memory usage sharply
- wastes CPU on idle processes
- makes queue behavior harder to predict
- does not improve fairness by itself

## Resource expectations

Exact resource usage depends on workload, but approximate expectations are:

### Idle worker

- low CPU
- roughly `100–250 MB` RAM

### AI / upload / sync / schedule worker task

- moderate CPU
- roughly `150–400 MB` RAM

### Render worker during Playwright work

- high CPU spikes
- roughly `500 MB–1.5 GB+` RAM depending on page complexity and browser state

These are operational estimates, not guaranteed ceilings.

## Recommended scaling path

### Stage 1: Current baseline

- `1` web
- `1` worker
- `1` scheduler

Use this while:

- user count is low
- queue wait time is acceptable
- render throughput is acceptable

### Stage 2: Add one more general worker

Recommended next step:

- `1` web
- `2` workers
- `1` scheduler

Use this when:

- uploads and AI generation are waiting too often
- render tasks create visible queue delay

Expected effect:

- two background tasks can run simultaneously
- one task may be render/upload while another is AI generation

### Stage 3: Split worker pools by role

When queue contention becomes meaningful, split worker types.

Recommended pools:

#### Render workers

Handle only:

- `RENDER_PLANS`
- `RERENDER_PLAN`

Why:

- Playwright rendering is the heaviest workload
- isolating render jobs prevents them from starving other ops tasks

#### Ops workers

Handle:

- `UPLOAD_MEDIA_BATCH`
- `GENERATE_TITLE_BATCH`
- `GENERATE_DESCRIPTION_BATCH`
- `SCHEDULE_PINS`
- `SYNC_PUBLICATIONS`
- `CLEAN_TEMP_ASSETS`

Why:

- these tasks are generally lighter than rendering
- they benefit from parallelism without full browser overhead

### Stage 4: Add fairness controls

If multiple external users/workspaces become active, add queue fairness controls such as:

- per-user max active tasks
- per-workspace caps
- task-kind concurrency caps
- optional reserved worker capacity for render vs ops

This prevents one tenant from dominating the queue.

## Recommended future topology

For a moderate multi-user setup, a more practical topology is:

- `1` web
- `1` scheduler
- `1–2` render workers
- `1–2` ops workers

This is usually far better than `4` identical general workers.

## Concurrency guidance by task type

### Rendering

Suggested concurrency:

- low
- usually `1` render task per render worker process

Reason:

- Playwright is memory and CPU heavy

### AI generation

Suggested concurrency:

- moderate
- safe to parallelize more than rendering

Reason:

- mostly network-bound relative to rendering
- lower memory footprint than browser tasks

### Publer upload

Suggested concurrency:

- `1` active upload per workspace

Reason:

- Publer media import is sensitive and already workspace-locked

### Scheduling

Suggested concurrency:

- `1` active scheduling task per workspace

Reason:

- prevents duplicate/conflicting submissions

### Sync

Suggested concurrency:

- `1` active sync per workspace

Reason:

- avoids overlapping incremental/backfill sync flows

## Signals that it is time to scale

Scale worker strategy when you see:

- frequent queue backlog
- long waits before title generation starts
- long waits before render tasks start
- users reporting “queued for too long”
- worker CPU staying saturated
- worker RAM pressure during render-heavy periods

## Signals that it is time to split worker pools

Split render vs ops workers when:

- render tasks block title/description/upload work too often
- worker memory usage spikes mainly during Playwright tasks
- average non-render task wait time rises because render is busy

## What to monitor later

Useful operational metrics:

- queue length by task kind
- average wait time before claim
- average execution time by task kind
- worker memory usage
- worker CPU usage
- task failure rate
- Publer lock wait frequency

These metrics are a good future fit for the planned internal admin dashboard.

## Current recommendation

For now:

- keep `1` worker if it is acceptable
- add a second general worker when queue delay becomes annoying

Do not introduce worker pool splitting until real queue contention justifies it.

## Future implementation note

When worker pool splitting is implemented later, the queue claim path should support task-kind filtering so that:

- render workers only claim render tasks
- ops workers only claim non-render tasks

That is the cleanest long-term scaling direction for Pin Forge Studio.
