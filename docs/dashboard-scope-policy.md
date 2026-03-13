# Dashboard Scope Policy

Last updated: March 13, 2026

## Active-profile scoped

These areas should follow the selected workspace profile and its allowed domains:
- Overview
- Inbox
- Jobs board
- Job review
- Job publishing flow
- Publishing queue
- Post Pulse

## Global

These areas remain shared across workspace profiles unless a stronger use case appears:
- Template library
- Template previews
- API keys
- Integrations

## Guardrails

- List pages should filter by the active profile domains.
- Deep-link job pages should block access when the job domain is outside the active profile.
- Publishing should never silently operate under a workspace profile that does not include the job domain.
