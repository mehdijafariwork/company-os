# Company Os

Codebase for the company. Bootstrapped per [COM-2](#).

## Stack

- TypeScript + Next.js 16 (App Router)
- Tailwind CSS v4
- ESLint (`eslint-config-next`)
- Postgres via Drizzle ORM (`postgres-js` driver); managed on Supabase (free tier)
- Deployed on Vercel; `main` auto-deploys
- CI on GitHub Actions: typecheck + lint + drizzle migration check on every push and PR

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate a new Drizzle migration from `src/lib/db/schema.ts` |
| `npm run db:check` | Verify migration journal/snapshot consistency (runs in CI) |
| `npm run db:migrate` | Apply pending migrations to `$DATABASE_URL` |

## Layout

```
src/app/             # App Router routes
src/app/page.tsx
src/app/layout.tsx
src/app/api/debug/throw/route.ts  # deliberate-error endpoint for telemetry test
src/app/api/items/route.ts        # GET/POST against the items table — smoke route for the data layer
src/proxy.ts          # request/response JSON logs + x-request-id propagation
src/instrumentation.ts # onRequestError + Node uncaughtException/unhandledRejection
src/lib/logger.ts     # structured JSON logger used by app code
src/lib/db/           # Drizzle schema + lazy client (getDb)
drizzle/              # generated SQL migrations + snapshot/journal
scripts/migrate.ts    # `npm run db:migrate` entrypoint
public/              # static assets
```

## Deploy

`main` is the production branch. Pushes deploy automatically to Vercel.

## Database

Managed Postgres on Supabase (free tier). All access goes through Drizzle ORM (`src/lib/db/`).

### Connection string

`DATABASE_URL` is the single env var the app reads. Use the **pooler** URL (Supabase Supavisor on port 6543, transaction mode) — the serverless runtime spins up many short-lived connections and the pooler is what survives that pattern. `src/lib/db/client.ts` already sets `prepare: false` for that reason.

- **Local**: copy `.env.example` to `.env.local` and paste the pooler URL. `.env*` is gitignored.
- **Vercel**: set `DATABASE_URL` in Project → Settings → Environment Variables for Production, Preview, and Development. Never paste it into code or commit it.
- **CI**: not needed. `npm run db:check` is offline (validates the snapshot/journal); migrations only run in real environments via `npm run db:migrate`.

If you ever spot a `DATABASE_URL` in a diff, stop and rotate the credential in Supabase before merging.

### Migration workflow

1. Edit `src/lib/db/schema.ts`.
2. `npm run db:generate` — drizzle-kit writes a new SQL file under `drizzle/` and updates the snapshot/journal. Commit both the SQL and the meta files.
3. `npm run db:check` — fails CI if the snapshot drifts from the schema; run locally before pushing.
4. `DATABASE_URL=... npm run db:migrate` — applies pending migrations against the target env. Run before the first deploy that needs the new schema, then re-run on every env (preview, prod).

### First table

`items` (`id uuid pk`, `name text not null`, `created_at timestamptz default now()`) — placeholder per COM-3 until the v0 domain object is specified. Smoke route: `GET /api/items` lists, `POST /api/items {name}` inserts.

## Telemetry & logs

All server logs are structured single-line JSON written to stdout (info) or stderr (warn/error). Vercel captures every line and surfaces them in the project's runtime logs.

### Where to look

- **Live tail** — Vercel dashboard → project `company-os` → **Logs** tab (or `vercel logs --follow` from the CLI). New log lines appear within seconds.
- **Per-deployment** — Vercel dashboard → deployment → **Runtime Logs**. Filter by path, status, or free-text JSON keys (e.g. `requestId`, `errorName`).
- **Local dev** — JSON lines print to the terminal running `npm run dev`.

### Log shapes

```json
{"ts":"...","level":"info","msg":"http.request","requestId":"...","method":"GET","path":"/","userAgent":"...","ip":"..."}
{"ts":"...","level":"info","msg":"http.response","requestId":"...","method":"GET","path":"/","status":200,"durationMs":4}
{"ts":"...","level":"error","msg":"next.onRequestError","requestId":"...","method":"GET","path":"/api/debug/throw","routePath":"/api/debug/throw","errorName":"Error","errorMessage":"...","errorStack":"..."}
```

Every request gets an `x-request-id` (generated if absent) that is echoed back on the response header and is the join key between request, response, and error lines.

### Test the error pipeline

```bash
curl -i "https://<deploy-url>/api/debug/throw?tag=manual-check"
```

Returns HTTP 500. Within ~5s the error appears in Vercel runtime logs as a `next.onRequestError` line tagged with the same `x-request-id` from the response header.

### When to upgrade

Vercel runtime logs are the source of truth today. Move to Sentry (free tier) or a log drain when we need: cross-deploy historical search > Vercel's retention, real-time alerting, or release-tracked error grouping. None of that is required for the current product surface.
