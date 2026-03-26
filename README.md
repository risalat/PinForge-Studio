# PinForge Studio

PinForge Studio is a local-first Pinterest pin rendering app built from the product blueprint in `PinForge-Studio-PRD.md`.

It provides:

- Next.js App Router foundation
- Prisma schema for intake jobs, source images, generation plans, generated pins, and publishing state
- A React-based template system
- A Playwright screenshot renderer for 1080x1920 exports
- Local disk storage in development and Cloudflare R2 in production
- An intake API plus dashboard review, generation, and publishing workflow

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Playwright

## Deployment target

The current production target is:

- Coolify on VPS
- one web service
- one worker service
- one scheduler service

Studio no longer relies on Vercel-specific runtime behavior in production. Rendering is native
Playwright-based and expects Chromium to be installed in the container image.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```powershell
Copy-Item .env.example .env
```

3. Set `DATABASE_URL` to your runtime database connection string.

   - For local development, a normal Postgres URL is fine.
   - For Coolify/VPS with Supabase, use the runtime pooler path Studio expects at runtime.
   - Set `DIRECT_URL` to a direct Postgres URL or session-mode URL for Prisma CLI tasks such as migrations and introspection.
   - Optional: set `PRISMA_CONNECTION_LIMIT` to tune runtime pooler usage in production.

4. Set `APP_ENCRYPTION_KEY` to a long random secret. Studio uses this to encrypt stored Publer
   and AI credentials at rest.

   - Use the same `APP_ENCRYPTION_KEY` across every deployment that shares the same database.
   - If you rotate that key, set `APP_ENCRYPTION_KEY_FALLBACKS` to the previous key value(s)
     so older saved credentials can still be decrypted and re-saved safely.

5. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Supabase Auth.

6. For production storage, set Cloudflare R2 credentials:

- `R2_ACCOUNT_ID` or `R2_ENDPOINT`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL`

7. Generate the Prisma client:

```bash
npm run prisma:generate
```

8. Run your first migration:

```bash
npm run prisma:migrate -- --name init
```

9. In the Supabase dashboard, create your first email/password user under `Authentication -> Users`.

10. Install the Playwright Chromium browser for local development:

```bash
npm run playwright:install
```

11. Start the dev server:

```bash
npm run dev
```

## Prisma commands

- Create a migration: `npm run prisma:migrate -- --name init`
- Regenerate the client: `npm run prisma:generate`

## Useful routes

- `/` home
- `/login` dashboard login
- `/dashboard` dashboard overview
- `/dashboard/settings` Publer and AI integration settings
- `/dashboard/api-keys` extension API key management
- `/dashboard/jobs` intake job board
- `/preview/split-vertical-title` live template preview
- `/render/split-vertical-title` render route used by Playwright

## Production services

Pin Forge Studio is intended to run as three separate services in production.

### Web service

- Dockerfile: `Dockerfile`
- Command: `npm start`
- Purpose:
  - dashboard UI
  - APIs
  - task enqueueing
  - polling task status

### Worker service

- Dockerfile: `Dockerfile.worker`
- Command: `npm run worker`
- Purpose:
  - bulk render
  - single-pin rerender
  - publish title generation
  - description generation
  - Publer media upload
  - scheduling
  - queued publication sync and cleanup tasks

### Scheduler service

- Dockerfile: `Dockerfile.scheduler`
- Command: `npm run scheduler`
- Purpose:
  - recurring publication sync enqueue
  - temp cleanup enqueue
  - stale task recovery
  - task retention cleanup

## Production environment notes

Set the same core env vars on web, worker, and scheduler unless a service clearly does not need one.

Required/shared production envs:

- `APP_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `PRISMA_CONNECTION_LIMIT`
- `APP_ENCRYPTION_KEY`
- `APP_ENCRYPTION_KEY_FALLBACKS` if rotating keys
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL`
- `R2_ACCOUNT_ID` or `R2_ENDPOINT`

Optional worker/scheduler tuning envs:

- `PLAYWRIGHT_BROWSER_MAX_RENDERS`
- `PLAYWRIGHT_BROWSER_MAX_HEAP_MB`
- `BACKGROUND_WORKER_ID`
- `BACKGROUND_WORKER_POLL_MS`
- `BACKGROUND_WORKER_LEASE_TIMEOUT_MS`
- `BACKGROUND_SCHEDULER_ID`
- `BACKGROUND_SCHEDULER_INTERVAL_MS`
- `BACKGROUND_SYNC_INTERVAL_MINUTES`
- `BACKGROUND_TEMP_CLEANUP_DAYS`
- `BACKGROUND_TASK_RETENTION_DAYS`
- `BACKGROUND_FAILED_TASK_RETENTION_DAYS`
- `BACKGROUND_TASK_STALE_TIMEOUT_MS`

## Playwright and rendering notes

- Production rendering uses native Playwright with Chromium installed in the container image.
- `PLAYWRIGHT_EXECUTABLE_PATH` is optional and only needed if you want to point Studio at a custom browser binary.
- Worker rendering reuses a long-lived browser process and opens a fresh context/page per render.

## R2 expectations

- `R2_PUBLIC_BASE_URL` should point to the public asset base URL, not the S3 API endpoint.
- Generated pin assets should resolve to direct public URLs in production.
- Publer upload works best when it can fetch those direct public asset URLs.

## Scaling notes

- Start with:
  - 1 web service
  - 1 worker service
  - 1 scheduler service
- Publer operations are serialized per workspace through DB-backed locks.
- If you scale workers later, keep the scheduler single-instance unless you intentionally design otherwise.
- The worker is the CPU-heavy service because it handles Playwright rendering and publish execution.

## Notes

- Publer and AI credentials are configured in the dashboard, not in `.env`.
- Dashboard access is protected by Supabase Auth. Set the same auth env vars on all production services that access the shared database.
- On Supabase-backed Coolify deployments, Studio rewrites session-pooler runtime URLs to transaction mode automatically for persistent services.
- Local file storage defaults to `./storage` when R2 is not configured.
- The upload endpoint stores temporary source assets at `temp/uploads/{tempId}/source.ext`.
- `POST /api/generate` now creates an intake job only; it does not render, generate copy, or schedule automatically.
- The render pipeline stores generated PNGs at `temp/jobs/{jobId}/{planId}-{templateId}.png`.
- Generated pin records store a Studio asset URL in `exportPath`, not a machine-local file path.
- When `R2_PUBLIC_BASE_URL` is configured, R2 uploads return direct public asset URLs and Publer receives those URLs for scheduling.
- The publishing flow is manual and staged: upload media, generate titles, review titles, generate descriptions, then schedule.
- The dashboard can auto-discover provider models for Gemini, OpenAI, and OpenRouter after you enter the provider API key.
