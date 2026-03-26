# API Authentication

## Overview

PinForge Studio uses bearer API keys for extension-to-Studio communication.

Requests from the extension must send:

```http
Authorization: Bearer pfs_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Key format

- Keys are generated inside the Studio dashboard at `/dashboard/api-keys`
- Plaintext keys are shown once only at creation time
- The database stores only:
  - `keyPrefix`
  - `keyHash`
  - metadata such as `name`, `createdAt`, `lastUsedAt`, `revokedAt`, `isActive`

Example prefix:

- `pfs_live_a1b2c3d4`

Example full key:

- `pfs_live_a1b2c3d4_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

## Storage model

API keys belong to a `User` and are stored in the `ApiKey` table.

Stored fields:

- `id`
- `userId`
- `name`
- `keyPrefix`
- `keyHash`
- `lastUsedAt`
- `revokedAt`
- `isActive`
- `createdAt`

## Validation flow

For protected extension-facing routes:

1. Read `Authorization: Bearer <api_key>`
2. Extract the visible key prefix
3. Load the matching active key record from the database
4. Verify the plaintext key against the stored hash
5. Reject revoked or invalid keys with `401`
6. Update `lastUsedAt` on successful authentication

## One-time display rule

Plaintext API keys are never stored after creation.

The dashboard shows the full key only in the creation response so you can copy it into the
extension settings. If lost, create a new key and revoke the old one.

## Revocation

Revoking a key:

- sets `revokedAt`
- marks `isActive` false
- immediately prevents new authenticated requests

## Dashboard authentication

- Dashboard pages and dashboard APIs are protected by Supabase Auth session cookies.
- Users must sign in at `/login` before they can create API keys or store Publer/AI credentials.
- API keys and encrypted integration settings are scoped to the signed-in Supabase user.
- Extension intake requests create jobs owned by the API key owner.
- To bootstrap access, create your first email/password user in the Supabase dashboard.

## Local dev vs production

- Use the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values in
  local `.env` and all production services that share the same database.
- In Coolify/VPS production, configure R2 with `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE_URL`, and either `R2_ENDPOINT` or `R2_ACCOUNT_ID`.
- Set the same `APP_ENCRYPTION_KEY` on web, worker, and scheduler so stored credentials remain readable.
- Extension-facing routes are protected by bearer API key validation.
- Dashboard routes are protected separately by Supabase Auth.

## Protected routes

Currently protected:

- `POST /api/generate`
- `POST /api/uploads/temp`
- `POST /api/dashboard/jobs/[jobId]/review`
- `POST /api/dashboard/jobs/[jobId]/plans`
- `POST /api/dashboard/jobs/[jobId]/generate`
- `POST /api/dashboard/jobs/[jobId]/publish`

Prepared for future protection:

- any additional extension-ingestion routes should reuse `src/lib/auth/apiKeyAuth.ts`
