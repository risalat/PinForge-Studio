# Publer Workspace Domain Segregation Plan

## Goal

Keep Publer as the source of truth for scheduled and published activity while ensuring Studio's `Post Pulse` focuses on first-party content for each managed workspace.

## Current problem

- Publer returns posts from the connected Pinterest account/workspace, including repins and third-party URLs.
- Studio currently stores those records and shows them in `Post Pulse`.
- This mixes first-party article tracking with unrelated external content.
- The current integration model supports only one saved Publer API key and one default workspace.

## Recommended architecture

### Phase 1

Implement first-party filtering without throwing away synced data.

- Keep syncing all Publer posts into the database.
- Add an allowed-domain list for the current Publer workspace settings.
- Default `Post Pulse` to those allowed domains only.
- If no explicit allowlist is saved yet, infer first-party domains from Studio-owned jobs for that user.

Why:

- No data loss.
- Immediate improvement for `Post Pulse`.
- Minimal disruption to the existing single-workspace setup.

### Phase 2

Replace the single saved Publer integration with explicit workspace connections.

- `PublerConnection`
  - `userId`
  - `label`
  - `workspaceId`
  - `workspaceName`
  - `apiKeyEnc`
  - `allowedDomains[]`
  - `isDefault`
  - sync metadata

This supports:

- one API key reused across multiple workspaces
- separate API keys per workspace when required
- clear domain segregation per workspace

## Phase 1 implementation rules

- `Post Pulse` shows only posts whose normalized domain is in the workspace allowlist.
- If the allowlist is empty, Studio infers domains from the user's own generated jobs.
- Sync still imports all Publer records for reconciliation and future audits.
- Later UI can add an `All synced posts` toggle if needed.

## Data rules

- Domain matching should normalize case and strip leading `www.`
- Allowed domains should be stored lowercase
- Filtering should happen at read time, not delete time

## Next step after Phase 1

Build the multi-connection model and migrate from `UserIntegrationSettings.publerApiKeyEnc` / `publerWorkspaceId` to first-class Publer workspace connections.
