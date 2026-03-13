# Workspace Profiles

## Goal

Keep one saved Publer API key, but separate Studio behavior by saved workspace profile.

## Phase 1

- Replace the duplicated `Settings` / `Integrations` split with `Integrations` only.
- Add saved workspace profiles per user.
- Each profile stores:
  - `workspaceId`
  - `workspaceName`
  - `allowedDomains[]`
  - `defaultAccountId`
  - `defaultBoardId`
  - `isDefault`
- Sidebar workspace selection uses saved profiles, not the raw Publer workspace list.
- `Post Pulse`, overview, inbox, jobs, and publishing scope to the active profile.

## Why

- One Publer key can serve multiple workspaces.
- Domain filtering should follow the active workspace instead of being global.
- Publishing defaults should come from the active workspace profile.
- The app should present one clear configuration surface.

## Follow-up

- Incremental Publer sync per workspace profile.
- `Create fresh pins` action from `Post Pulse`.
- Optional profile labels or visual tags if the number of workspaces grows.
