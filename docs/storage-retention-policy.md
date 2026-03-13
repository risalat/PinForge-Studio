# Storage Retention Policy

Last updated: March 13, 2026

## Scope

This policy covers generated pin assets, temporary uploads, and storage audits for both:
- local filesystem storage
- Cloudflare R2

## Retention rules

### Generated pin assets

Paths:
- persistent generated pin objects referenced by `GeneratedPin.storageKey`

Retention:
- keep by default
- delete only when the workflow explicitly discards the pin or replaces it

Reason:
- generated pins are product assets, not temporary render artifacts
- older job views and publish history depend on them staying available

### Temporary assets

Paths:
- `temp/uploads/*`
- `temp/jobs/*`

Retention:
- cleanup eligible after 7 days by default

Reason:
- these objects support intake, staging, and intermediate rendering
- they do not need to live indefinitely once the workflow has moved forward

## Operational tools

### Missing asset audit

Command:

```bash
npm run storage:audit
```

What it does:
- checks every `GeneratedPin.storageKey`
- reports which DB records point to missing storage objects

### Temp cleanup

Dry run:

```bash
npm run storage:cleanup-temp
```

Apply deletions:

```bash
npm run storage:cleanup-temp -- --apply
```

Custom age:

```bash
npm run storage:cleanup-temp -- --days=14 --apply
```

What it does:
- scans `temp/` objects only
- finds temp objects older than the configured age
- deletes them only when `--apply` is provided

## Dashboard behavior

If a generated pin asset is missing:
- review and publish surfaces should show a missing-asset state
- the user should discard and rerender instead of trying to publish a broken asset

## Policy notes

- Publer publication records should not be treated as a reason to delete generated pin assets automatically
- any future archive or TTL policy for generated pins should be deliberate and separate from temp cleanup
