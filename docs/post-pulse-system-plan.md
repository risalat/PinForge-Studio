# Post Pulse System Plan

Last updated: March 13, 2026

## Working name

`Post Pulse`

Why this name:
- short enough for the sidebar
- clearly post-centric instead of job-centric
- fits the freshness concept without sounding temporary
- leaves room for future scoring, alerts, and post health signals beyond one rule

Proposed sidebar label:
- `Post Pulse`

Proposed route:
- `/dashboard/post-pulse`

## Product goal

Post Pulse is the post-level operating view for Pinterest lifecycle health.

It answers:
- which articles have already been promoted on Pinterest
- how many pins each article has produced
- when the article last received a successful scheduled pin
- which articles now need fresh pins again

This fills the current gap between:
- job-by-job execution
- publishing queue status
- long-term post freshness tracking

## Initial rule

Version 1 freshness rule:
- if the most recent successfully scheduled pin date is older than 30 days, mark the post as `Needs fresh pins`

Additional version 1 states:
- `Fresh` when the most recent successful scheduled pin is within 30 days
- `Never published` when the post has jobs and generated pins but no successful scheduled pin
- `No pins yet` when the post has no generated pins

Assumption for version 1:
- “last published pin” is approximated by the most recent successful schedule record
- current code marks successful publish handoff with `ScheduleRunItemStatus.SCHEDULED`
- there is not yet a later Pinterest-delivered confirmation timestamp in the schema

## Scope

### In scope for version 1

- new dashboard page under Workspace
- post-level table / tracker view
- summary metrics:
  - posts tracked
  - posts needing fresh pins
  - never published posts
  - fresh posts
- freshness badge using 30-day rule
- last successful scheduled pin date
- total generated pins per post
- total scheduled pins per post
- quick actions back into existing workflow

### Out of scope for version 1

- automatic pin regeneration
- notification delivery
- editable freshness thresholds
- board-level freshness analysis
- Pinterest-side engagement metrics
- automated R2 asset audits

## Data model strategy

Version 1 should derive data from existing models rather than introducing new tables.

Current usable sources:
- `Post`
- `GenerationJob`
- `GeneratedPin`
- `ScheduleRunItem`

Derived fields per post:
- `totalJobs`
- `totalGeneratedPins`
- `totalScheduledPins`
- `lastGeneratedAt`
- `lastScheduledAt`
- `freshnessStatus`
- `freshnessAgeDays`
- `latestJobId`

Freshness source of truth:
- `ScheduleRunItem.status === SCHEDULED`
- use the most recent `scheduledFor` as `lastScheduledAt`

Reason:
- this aligns with current publish-flow semantics
- it avoids schema changes for version 1
- it keeps the first build low risk

## UX design

### Navigation

Add `Post Pulse` under the `Workspace` section in the sidebar:
- Overview
- Inbox
- Jobs
- Publishing
- Post Pulse

### Page structure

1. Hero / summary strip
- posts tracked
- needs fresh pins
- never published
- fresh

2. Filter bar
- search by title or domain
- freshness filter:
  - all
  - needs fresh pins
  - fresh
  - never published
  - no pins yet

3. Post tracker table / cards
- post title
- domain
- total generated pins
- total scheduled pins
- last scheduled date
- freshness status
- quick actions

4. Quick actions
- `Open latest job`
- `Open publish flow` when a latest job exists

### Freshness treatments

- `Needs fresh pins`
  - warning tone
  - show “Last scheduled 31+ days ago”
- `Fresh`
  - success tone
  - show relative age
- `Never published`
  - neutral or danger-adjacent tone
  - show “No successful scheduled pins yet”
- `No pins yet`
  - neutral tone
  - show “No generated pins for this post”

## Execution plan

### Phase 1

- add `Post Pulse` page and sidebar item
- build server-side aggregation from existing Prisma relations
- render summary metrics and tracker table
- compute freshness from successful scheduled pins

### Phase 2

- add sorting and filters
- add “needs refresh soon” pre-warning state
- add dashboard overview card for posts needing fresh pins

### Phase 3

- allow direct “create fresh pins” action from a post row
- optionally clone latest job settings as a fast rerun seed

### Phase 4

- add true published-date tracking if Publer or Pinterest confirmation is available
- add notification center / inbox reminders
- add historical trend charts per post

## Technical notes

- implement aggregation in a dedicated dashboard helper instead of bloating page files
- keep freshness logic centralized so overview and tracker use the same rule
- prefer derived data over schema changes for the first version
- keep naming post-oriented, not job-oriented

## Open follow-ups

- confirm whether the future “fresh pin” action should create a new intake job or clone an existing post/job context
- decide whether failed scheduled pins should count toward tracker visibility
- decide whether freshness should eventually use `scheduledFor` or an actual publish-confirmed timestamp
