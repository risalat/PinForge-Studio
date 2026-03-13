# Publer Publication Sync Plan

Last updated: March 13, 2026

## Goal

Use Publer as the source of truth for post scheduling and publication state so Studio can:
- track scheduled and published Pinterest activity at the post level
- avoid duplicate pinning decisions for the same article
- power `Post Pulse` with real publish data instead of only local workflow state

This replaces the need for a separate extension-to-Studio publish reporting layer, as long as both Studio and the extension use the same Publer workspace/account scope.

## Core decision

Use Publer sync, not extension callbacks, for publication tracking.

Reason:
- one source of truth
- covers both Studio-origin and extension-origin Publer activity
- reduces duplicate ingestion paths
- keeps `Post Pulse` based on actual scheduling/publication state

## Source model

Primary source:
- Publer `GET /posts`

Useful fields from Publer:
- `id`
- `state`
- `url`
- `post_link`
- `scheduled_at`

Version 1 normalized states:
- `scheduled`
- `published`
- `published_posted`
- fallback `other`

## Local storage design

Add a publication ledger table that stores normalized Publer post rows.

Proposed responsibilities:
- one row per Publer post record
- linked to a local `Post`
- optionally linked to a local `GeneratedPin` when the Publer post can be matched back to a Studio scheduled pin
- stores raw Publer state plus normalized local state

Why a ledger table is needed:
- Publer data must be queryable locally for dashboards
- sync should not require live API calls on every page view
- future duplicate-prevention logic needs fast local lookups

## Matching strategy

### Post matching

Primary key:
- `url` from Publer maps to Studio `Post.url`

If no matching `Post` exists:
- upsert a `Post` row using the URL
- set domain from the URL
- use the best available fallback title until Studio later knows the article title

### Generated pin matching

Best-effort match:
- match Publer post ID against `ScheduleRunItem.publerPostId`
- use that to backfill `generatedPinId` into the ledger when available

This allows Studio-origin pins and external pins to coexist in the same publication history.

## Freshness logic

Version 1 freshness source:
- use the latest Publer row in a published-like state
- effective freshness timestamp uses:
  - explicit publish timestamp if Publer exposes one later
  - otherwise `scheduled_at` as the best available published-time proxy

Version 1 rule:
- if the latest published-like pin is older than 30 days, mark the post as `Needs fresh pins`

Additional state:
- `Scheduled in flight` when the post has scheduled Publer rows but no published-like row yet

## Post Pulse UI updates

### Summary cards

- posts tracked
- needs fresh pins
- scheduled in flight
- fresh

### Row-level tracker

- generated count
- Publer activity counts
  - published
  - scheduled
- last live pin date
- freshness status
- compact progress dots

### Progress dots

Keep this minimal:
- green dot = published / published_posted
- blue dot = scheduled
- muted dot = other

Only show the latest few records per post to avoid visual noise.

## Sync behavior

Version 1:
- manual sync action from `Post Pulse`
- fetch recent Publer posts from the selected workspace
- upsert ledger rows
- refresh page

Later:
- periodic background sync
- delta sync using last sync timestamp or paging
- targeted sync after schedule completion

## Duplicate prevention direction

After the ledger is in place, intake/generation can check:
- does this post already have recent published-like records?
- does this post already have scheduled in-flight records?

That can power:
- warnings before generating fresh pins
- eventual blocking or confirmation for duplicate scheduling

## Scope for first implementation slice

- schema for publication ledger
- Publer client support for fetching posts
- dashboard API route to sync Publer posts on demand
- `Post Pulse` updated to read publication ledger
- compact progress dots in the tracker

## Deliberately deferred

- automatic sync jobs
- duplicate-prevention guardrails at intake time
- board-level freshness analytics
- user-configurable freshness windows
- full Publer pagination and historical backfill strategy
