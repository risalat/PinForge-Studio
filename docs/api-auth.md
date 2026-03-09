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

## Local dev vs production

- In local development, the dashboard API key management UI assumes a trusted single-user setup.
- The current dashboard itself is not backed by user login/session auth yet.
- Before public deployment, wrap dashboard routes and dashboard key-management APIs in real app
  authentication.
- Extension-facing routes are already protected by bearer API key validation.

## Protected routes

Currently protected:

- `POST /api/generate`
- `POST /api/uploads/temp`

Prepared for future protection:

- any additional extension-ingestion routes should reuse `src/lib/auth/apiKeyAuth.ts`
