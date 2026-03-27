# Admin Dashboard Phase A Tracker

## Scope

Phase A is the first internal operations dashboard for Pin Forge Studio.

It is intentionally:

- read-only
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

- System overview cards
- Runtime health section
- Background task queue section
- Performance timing section
- Publer operations section
- Storage / cleanup section
- Left-side internal control rail with section jumps

## Deferred for later phases

### Phase B

- workspace-level drilldowns
- richer Publer diagnostics by workspace
- storage audit history
- queue fairness / heavier tenant-level visibility

### Phase C

- retry safe failed tasks
- trigger manual rebuild/cleanup/sync actions
- explicit confirmation and stronger permission boundaries

## Multi-user follow-up notes

When Studio becomes multi-user:

- enforce non-empty `DASHBOARD_ADMIN_EMAILS` or real admin roles
- add workspace/user filtering to the admin UI
- add tenant fairness / queue pressure views
- consider audit logging for admin actions before enabling write operations

## Current recommendation

Use this dashboard as an internal read-only control room first. Validate it in production, then extend it only after the read path and persisted metrics prove stable.
