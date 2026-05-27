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
src/app/        # App Router routes
src/app/page.tsx
src/app/layout.tsx
public/         # static assets
```

## Deploy

`main` is the production branch. Pushes deploy automatically to Vercel.
