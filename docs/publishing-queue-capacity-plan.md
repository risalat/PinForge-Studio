# Publishing Queue Capacity Plan

## Goal

Keep the Pinterest publishing queue filled against a configurable daily target, while preserving full manual control during scheduling.

The first use case is a target of `20` pins per day, but this target must remain editable over time and should not be hardcoded into the scheduling flow.

## Product Requirements

- Show how many pins are scheduled for today and upcoming days in the dashboard.
- Make schedule suggestions aware of a per-day queue target.
- If a day is already at capacity, suggest the next day with remaining room.
- Do not block manual overrides. Users must still be able to schedule on a full day.
- Store the target so it can be changed later.
- Reuse the existing publishing queue data already synced from Publer and the local schedule runs.

## Constraints

- Current schedule recommendations are based on post freshness spacing, not queue capacity.
- Queue data already exists in:
  - `PublicationRecord.scheduledAt`
  - `ScheduleRunItem.scheduledFor`
- Workspace scope already exists and should remain the main unit for queue tracking.
- Free-plan deployment constraints favor coarse summaries over chatty realtime systems.

## Implementation Phases

### Phase 1. Persist a workspace-level daily publish target

Add a configurable `dailyPublishTarget` to `WorkspaceProfile`.

Why:
- Publishing is already workspace scoped.
- Different workspaces may need different queue targets later.
- This avoids introducing a separate settings model.

Deliverables:
- Prisma schema update
- migration
- settings API schema update
- settings save/load logic
- settings UI field per workspace profile

Fallback behavior:
- If unset, default to `20`

### Phase 2. Build shared queue-capacity logic

Create one reusable helper that summarizes scheduled queue load by day for a workspace.

Inputs:
- `userId`
- `workspaceId`
- optional window start
- optional number of future days

Outputs:
- `targetPerDay`
- `todayScheduledCount`
- `upcomingDays[]`
- `nextAvailableDate`

Data sources:
- future scheduled `PublicationRecord` rows
- future scheduled `ScheduleRunItem` rows

Rules:
- count Publer-synced scheduled records
- count local scheduled items not yet represented by synced publication records
- group counts by day
- mark days as full when count meets or exceeds target

### Phase 3. Extend schedule recommendation context

Make the publish schedule context aware of both:
- post freshness spacing
- queue capacity

Current logic:
- recommend next date based on latest scheduled/published pin for that post

New logic:
- compute freshness-based recommendation first
- if that date is already full, shift the suggestion to the next day under target
- return both the spacing recommendation and the queue-aware suggestion

Deliverables:
- extend `PublishScheduleContext`
- extend schedule-context API route
- include upcoming queue days and target metadata

Important:
- recommendation only, not enforcement

### Phase 4. Add dashboard queue-capacity section

Add a dashboard section that shows queue load for:
- today
- the next upcoming days

Suggested UI:
- summary card: `Today 14 / 20`
- list or compact strip for next 7 to 14 days
- status labels:
  - under target
  - nearly full
  - full
- next available day summary

Purpose:
- this becomes the main operational view for keeping the queue filled

### Phase 5. Add publish-screen queue-aware scheduling guidance

Use the new schedule context in the publish screen.

Suggested behavior:
- prefill the first publish datetime from the queue-aware suggestion
- show the daily target and upcoming day counts near scheduling controls
- if the currently selected day is already full:
  - show warning text
  - show quick action to move to the next suggested day

Manual override rule:
- user can still keep the full day selected
- schedule submission must still work

### Phase 6. Optional Later Upgrades

These are intentionally deferred until the base workflow is stable.

1. Timezone-aware queue capacity
- store a workspace scheduling timezone
- group day counts using that timezone instead of server or UTC assumptions

2. Auto-respect daily target toggle
- optional switch that automatically pushes previewed pins to the next open day
- keep manual mode as default

3. Over-capacity preview highlighting
- show schedule preview rows that land on full or over-capacity days

4. Weekend and blackout-day rules
- allow skip days or preferred publish days

5. Board-level or account-level capacity targets
- useful if one workspace posts to multiple accounts with different cadences

6. Capacity pressure badges in publishing queue page
- surface full and nearly full days directly on `/dashboard/publishing`

7. Audit trail for manual overrides
- record when a user intentionally schedules above target

## Rollout Order

1. Phase 1: settings + schema
2. Phase 2: shared queue helper
3. Phase 3: schedule context
4. Phase 4: dashboard section
5. Phase 5: publish UI guidance
6. Phase 6: optional upgrades later

## Success Criteria

- dashboard clearly shows queue load for today and upcoming days
- schedule suggestion avoids full days by default
- users can still manually schedule on a full day
- daily target can be changed without code changes
- queue counting logic is shared, not duplicated across screens
