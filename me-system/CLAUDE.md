# CLAUDE.md

Guidance for Claude Code (and people) working in `me-system/`, the **Monitoring and Evaluation System**:
a policy → programme → project M&E platform, shown with MoC's National Cashew Policy 2022–2027 as the
example workspace.

## Commands

Run from `me-system/`. Node.js 22+.

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (versions are pinned exactly in package.json) |
| `npm run dev` | Dev server on http://localhost:3000 (demo mode unless `.env.local` has Supabase settings) |
| `npm test` | 29 unit tests with Node's built-in runner (`tests/*.test.ts`) |
| `npm run typecheck` | TypeScript check, no output files |
| `npm run build` / `npm start` | Production build / serve it |
| `supabase/checks/run_local.sh` | 35 database checks on a plain local Postgres (needs `PGHOST/PGPORT/PGUSER`) |
| `npx supabase start -x studio,imgproxy,realtime,storage-api,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit` | Local Supabase in Docker: applies `supabase/migrations/` and `supabase/seed/` |
| `node supabase/checks/live_e2e.mjs` | 18-step browser test of the live workflow (see supabase/README.md) |
| `python3 scripts/build_supabase_seed.py` | Regenerate `supabase/seed/*.sql` from `src/data/cashew.json` |
| `python3 scripts/build_data_dictionary.py` | Regenerate `docs/data-dictionary.xlsx` and `docs/DATA_DICTIONARY.md` |

Before pushing: `npm test && npm run typecheck && npm run build`, and `run_local.sh` if SQL changed.

## Architecture in one screen

```
Browser ──► Vercel (Next.js 16, region sin1) ──► Supabase (Postgres 17 + Auth, Singapore)
            │ src/proxy.ts refreshes the session cookie
            │ static pages: built from src/data/cashew.json (demo/example data)
            │ dynamic pages: /submissions /reviews /reviews/[id] /collect/[code]
            │   read with src/lib/live.ts, write with Server Functions in src/app/actions/workflow.ts
            └ RoleProvider (browser) reads my_access to show the signed-in account
```

- **Two modes.** Without `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` the site is the demo
  (roles simulated in the browser, nothing saved). With them, signing in makes the four workflow routes live.
  Signed-out visitors always see the demo. Keep both modes working.
- **The database is the security boundary.** Row-level security (`supabase/migrations/…300_access.sql`) and the
  workflow functions (`…200_rules.sql`, `…600_open_submission.sql`) enforce every rule. UI checks (`src/lib/roles.ts`)
  only hide buttons; never rely on them for access.
- **Writes go through database functions** (`submit_revision`, `start_review`, `decide_revision`, `new_revision`,
  `open_submission`), called with `supabase.rpc(...)` from `src/app/actions/workflow.ts`. Direct UPDATEs of workflow
  state are not granted to users.
- **% of target and status are calculated in Postgres** (`compute_pct`, `status_for`), mirroring `src/lib/rules.ts`.
  If you change one, change both and the tests.

## Where things live

| Path | Contents |
|---|---|
| `src/app/` | Next.js App Router: one folder per URL; `layout.tsx` is the page frame; `globals.css` all styles |
| `src/app/actions/workflow.ts` | Server Functions (`"use server"`) for save / submit / review / correction |
| `src/components/` | Shared React components; `RoleProvider.tsx` = who is signed in / demo role |
| `src/lib/cashew.ts` | Typed access to the example data and the status rules |
| `src/lib/rules.ts` | Pure scoring rules (% of target, status) shared by server and browser |
| `src/lib/roles.ts` | The four pilot roles and what the interface shows each |
| `src/lib/access.ts` | Turns database access rows into the signed-in `Account`; state labels |
| `src/lib/live.ts` | Server-side reads from Supabase for the live pages |
| `src/lib/supabase/` | Supabase clients: `server.ts` (cookies), `browser.ts`, `config.ts` (env) |
| `src/proxy.ts` | Next 16 "proxy" (formerly middleware): session refresh |
| `src/data/cashew.json` | Generated example data (do not hand-edit; see scripts/build_cashew_data.py) |
| `supabase/migrations/` | Database schema, rules, RLS, views, functions: applied in filename order |
| `supabase/seed/` | Cashew workspace data (generated; five parts, run in order) |
| `supabase/checks/` | SQL checks, local test accounts, browser test |
| `docs/` | Data dictionary, local setup, project details, learning guide |

## Conventions

- TypeScript strict, React Server Components by default; add `"use client"` only for state/effects/events.
- Imports use `@/` for `src/`. Pure logic files (`rules.ts`, `access.ts`, `roles.ts`) import with `.ts`
  extensions so Node's test runner can load them directly.
- Plain CSS with tokens on `:root` in `globals.css` (GOV.UK 2025 palette). No UI framework. Status colours always
  come with a text label.
- Accessibility: every input has a `<label>`; errors appear in a summary with links; tables turn into labelled
  cards under 800 px (`ResponsiveTables`). Test at 360 / 768 / 1440 px with no horizontal page scroll.
- Writing style in the UI: sentence case, plain English, British spelling.
- Database: new change = new migration file `supabase/migrations/<timestamp>_<name>.sql`; never edit an applied one.
  Every table has `workspace_id` (except `workspaces`); archive instead of delete; `review_events` and
  `audit_events` are insert-only. New functions: `set search_path`, revoke EXECUTE from `anon`, grant only what is needed.
- Generated files (`src/data/cashew.json`, `supabase/seed/*.sql`, `docs/data-dictionary.xlsx`) come from scripts.

## Gotchas learned the hard way

- `supabase/config.toml` → `[auth.email] enable_signup = false` turns off **email sign-in entirely**. Block
  self sign-up with `[auth] enable_signup = false` instead (already set).
- Supabase grants EXECUTE on new functions to `anon`/`authenticated` directly (not via PUBLIC): revoke explicitly.
- A row inserted by a function isn't visible to the same SQL statement that called it (snapshot rules) –
  call the function first, then query.
- Playwright `text=…` matches any element containing the text; use `button:has-text('…')` for buttons.
- Next 16: `middleware.ts` is now `proxy.ts`; `params` / `searchParams` / `cookies()` are async (`await`).

## Live environment

See `docs/PROJECT_INFO.md` for project IDs, URLs and settings. Production: https://monitoring-evaluation-system.vercel.app
(Vercel project `monitoring-evaluation-system`, root directory `me-system`, team ACME `acme-265e`).
Database: Supabase project `cvutbidnazfgfbeptnbz` (Singapore). Never commit secret keys; only the publishable key
and URL are public.
