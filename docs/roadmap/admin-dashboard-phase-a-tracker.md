# Admin Dashboard Tracker

## Scope

This tracker now covers:

- Phase A read-only ops visibility
- Phase B workspace diagnostics
- single-user-safe Phase C admin actions

It remains:

- internal
- single-user friendly for the current deployment
- future-ready for later admin-role / multi-user hardening

## Implemented

### Route and access

- Added `/dashboard/admin`
- Added `requireDashboardAdminUser()`
- Added optional `DASHBOARD_ADMIN_EMAILS` env gate
- Current fallback behavior remains practical for the single-user setup when the allowlist is empty

### Persisted health data

- Added `RuntimeHeartbeat`
- Added `OperationMetric`
- Worker heartbeats now persist
- Scheduler heartbeats now persist
- Dashboard web heartbeat now persists
- `timeAsyncOperation()` now stores success/failure timings in `OperationMetric`

### Admin surface

- Separate admin sub-app shell
- Back-to-Studio button instead of the normal Studio sidebar
- Dedicated admin navigation panel
- Overview page
- Runtime page
- Workspaces page
- Tasks page
- Performance page
- Publer page
- Storage page
- Actions page

### Workspace diagnostics

- per-workspace operational cards
- workspace sync-state visibility
- workspace queue/load counters
- copy backlog visibility
- publish/schedule activity summaries
- metadata cache freshness by workspace
- active workspace-lock visibility

### Safe admin actions

- retry safe failed tasks
- queue temp cleanup from admin
- trigger publication sync by workspace

## Deferred for later phases

- richer Publer diagnostics by workspace/account/board
- storage audit history and trend views
- task timelines and deeper failure drilldowns
- manual snapshot rebuilds
- manual lock release / stronger repair tools
- stronger permission boundaries once multi-user support begins

## Multi-user follow-up notes

When Studio becomes multi-user:

- enforce non-empty `DASHBOARD_ADMIN_EMAILS` or real admin roles
- add workspace/user filtering to the admin UI
- add tenant fairness / queue pressure views
- consider audit logging for admin actions before enabling write operations

## Current recommendation

Use this dashboard as the internal control room for day-to-day operations. Keep the write actions narrow until the read path and the current retry/sync/cleanup actions prove stable in production.
