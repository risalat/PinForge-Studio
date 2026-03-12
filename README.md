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

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```powershell
Copy-Item .env.example .env
```

3. Set `DATABASE_URL` to your Supabase/Postgres connection string.

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

## Notes

- Publer and AI credentials are configured in the dashboard, not in `.env`.
- Dashboard access is protected by Supabase Auth. Set the same auth env vars in Vercel before using the production deployment.
- Local file storage defaults to `./storage` when R2 is not configured.
- The upload endpoint stores temporary source assets at `temp/uploads/{tempId}/source.ext`.
- `POST /api/generate` now creates an intake job only; it does not render, generate copy, or schedule automatically.
- The render pipeline stores generated PNGs at `temp/jobs/{jobId}/{planId}-{templateId}.png`.
- Generated pin records store a Studio asset URL in `exportPath`, not a machine-local file path.
- When `R2_PUBLIC_BASE_URL` is configured, R2 uploads return direct public asset URLs and Publer receives those URLs for scheduling.
- On Vercel, rendering uses a serverless Chromium binary instead of relying on `npx playwright install`.
- The publishing flow is manual and staged: upload media, generate titles, review titles, generate descriptions, then schedule.
- The dashboard can auto-discover provider models for Gemini, OpenAI, and OpenRouter after you enter the provider API key.
