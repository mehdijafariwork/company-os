# Company Os

Codebase for the company. Bootstrapped per [COM-2](#).

## Stack

- TypeScript + Next.js 16 (App Router)
- Tailwind CSS v4
- ESLint (`eslint-config-next`)
- Deployed on Vercel; `main` auto-deploys
- CI on GitHub Actions: typecheck + lint on every push and PR

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

```
src/app/             # App Router routes
src/app/page.tsx
src/app/layout.tsx
src/app/api/debug/throw/route.ts  # deliberate-error endpoint for telemetry test
src/proxy.ts          # request/response JSON logs + x-request-id propagation
src/instrumentation.ts # onRequestError + Node uncaughtException/unhandledRejection
src/lib/logger.ts     # structured JSON logger used by app code
public/              # static assets
```

## Deploy

`main` is the production branch. Pushes deploy automatically to Vercel.

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
