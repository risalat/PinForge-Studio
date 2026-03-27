# Admin Dashboard Roadmap

## Status

- Status: Phase A and Phase B implemented
- Status: single-user-safe subset of Phase C implemented
- Audience: internal operators / admins
- Not part of the current end-user workflow

## Purpose

Pin Forge Studio now has:

- background workers
- a scheduler
- Publer sync and upload coordination
- structured timing logs
- storage cleanup automation

That makes an internal admin dashboard a useful next-layer tool for operations, support, and product health monitoring, especially if Studio later becomes a shared service for multiple users.

This dashboard should be an internal control and observability surface, not a normal user-facing workspace page.

## Goals

- give fast visibility into system health
- make performance regressions easier to spot
- make worker/scheduler issues easier to debug
- show queue pressure and failure trends
- support future multi-user / multi-workspace operations

## Non-goals

- do not mix this into the normal dashboard flow
- do not expose internal ops metrics to standard users
- do not turn it into a generic analytics product

## Recommended surface

A separate internal route, for example:

- `/dashboard/admin`

Protected by:

- strict admin-only access
- not merely normal authenticated user access

## Proposed sections

### 1. System Overview

Show:

- web status
- worker status
- scheduler status
- latest heartbeat times
- background task queue counts
- failed task counts

Useful widgets:

- queued tasks
- running tasks
- failed tasks in last 24h
- stale tasks recovered

### 2. Performance

Use the structured timing events already added in Phase 0 and later phases.

Show rolling stats for:

- bulk render duration
- single-pin rerender duration
- publish title batch duration
- description batch duration
- Publer media upload duration
- scheduling duration
- Post Pulse load duration
- job detail load duration

Suggested views:

- latest 20 runs
- average by day
- p50 / p95 where practical

### 3. Background Tasks

Show:

- active tasks
- queued tasks
- failed tasks
- retry counts
- task kind distribution

Filters:

- task kind
- workspace
- user
- status
- date range

Actions:

- inspect task payload
- inspect last error
- retry safe failed tasks later if needed

### 4. Worker and Scheduler Health

Show:

- worker IDs seen recently
- scheduler IDs seen recently
- last heartbeat / last activity
- recent task throughput

Useful detection:

- worker not seen recently
- scheduler not seen recently
- task backlog increasing without processing

### 5. Publer Operations

Show:

- recent upload failures
- recent sync failures
- workspace lock waits
- repeated Publer queue contention

Useful for support questions like:

- why are uploads slow today?
- why is sync not moving?
- which workspace is hitting Publer issues?

### 6. Storage and Cleanup

Show:

- temp asset counts
- latest cleanup runs
- stale asset estimates
- storage audit summaries

This is especially useful because generated assets currently use temp paths and cleanup timing matters operationally.

### 7. Workspace / User Operations

Show aggregated operational data per:

- workspace
- user

Examples:

- jobs created
- pins rendered
- pins scheduled
- sync health
- failure counts

This becomes more important if external users are onboarded later.

## Suggested implementation phases

### Phase A: Read-only ops dashboard

Build first:

- route + admin gate
- system overview cards
- active/failed task tables
- recent timing summaries from structured logs or persisted rollups

### Phase B: Workspace diagnostics

Delivered:

- workspace-level Publer sync health
- per-workspace queue/load summaries
- copy backlog visibility
- publish/schedule activity summaries
- metadata cache freshness per workspace
- active workspace-lock visibility

### Phase C: Controlled admin actions

Delivered so far:

- retry safe failed tasks
- trigger manual cleanup
- trigger manual publication sync by workspace

Still deferred:

- manual snapshot rebuild
- manual lock release
- higher-risk repair actions

These remain explicit and heavily permissioned.

## Data source options

Short term:

- existing DB tables
- background task table
- scheduler/worker heartbeat events if persisted later
- structured logs summarized manually or via future persistence

Later:

- lightweight persisted metrics table
- periodic rollups for performance trends

## Access model

Recommended:

- explicit admin allowlist or admin role
- separate from normal signed-in dashboard users

Do not rely on:

- “if user knows the URL”
- general authenticated access

## Why this is worth doing later

As Studio grows, this dashboard will help with:

- supporting multiple users
- debugging performance complaints
- validating whether optimizations actually worked
- monitoring worker/scheduler health
- spotting Publer or storage issues before users report them

## Phase A now implemented

Current delivered surface:

- `/dashboard/admin` overview
- separate admin detail pages for:
  - runtime
  - workspaces
  - tasks
  - performance
  - Publer
  - storage
  - actions
- single-user internal admin access, with optional email allowlist support through `DASHBOARD_ADMIN_EMAILS`
- dedicated admin shell and navigation, separate from the normal Studio sidebar
- system overview cards
- persisted runtime heartbeats for:
  - web
  - worker
  - scheduler
- persisted operation timings from the existing workflow instrumentation
- background task queue and recent-failure visibility
- Publer lock/cache/operation visibility
- storage and cleanup snapshot cards

## Remaining roadmap

Next recommended work:

- richer failure drilldowns and task timelines
- storage audit history and trends
- snapshot rebuild and repair actions
- stronger admin-role enforcement once multi-user support starts

Keep write actions narrow until the current operational views prove stable in production.
