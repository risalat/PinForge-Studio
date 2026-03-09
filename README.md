# PinForge Studio

PinForge Studio is a local-first Pinterest pin rendering app built from the product blueprint in `PinForge-Studio-PRD.md`.

It provides:

- Next.js App Router foundation
- Prisma schema for posts, jobs, templates, and generated pins
- A React-based template system
- A Playwright screenshot renderer for 1080x1920 exports
- Local disk storage with an R2 provider stub
- A basic generation API, dashboard, and integration settings UI

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

5. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Supabase Auth.

6. Generate the Prisma client:

```bash
npm run prisma:generate
```

7. Run your first migration:

```bash
npm run prisma:migrate -- --name init
```

8. In the Supabase dashboard, create your first email/password user under `Authentication -> Users`.

9. Install the Playwright Chromium browser:

```bash
npm run playwright:install
```

10. Start the dev server:

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
- `/preview/split-vertical-title` live template preview
- `/render/split-vertical-title` render route used by Playwright

## Notes

- Publer and AI credentials are configured in the dashboard, not in `.env`.
- Dashboard access is protected by Supabase Auth. Set the same auth env vars in Vercel before using the production deployment.
- Local file storage defaults to `./storage`.
- The render pipeline writes PNGs under `storage/temp/jobs/{jobId}/`.
- `R2StorageProvider` is intentionally stubbed for later production wiring.
- The dashboard stores the Publer API key only; workspace/account/board selection can happen later in the publishing flow.
- The dashboard can auto-discover provider models for Gemini, OpenAI, and OpenRouter after you enter the provider API key.
