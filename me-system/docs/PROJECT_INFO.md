# Project details

Everything needed to find, run and manage the Monitoring and Evaluation System. Last updated 27 Sep 2026.
Secret keys are **not** in this file on purpose; get them from the dashboards when you need them.

## Where it lives

| What | Value |
|---|---|
| Live site | https://monitoring-evaluation-system.vercel.app |
| Source code | https://github.com/vichet99/brew-and-blue, folder `me-system/` |
| Working branch | `claude/me-platform-design-6pfdjl` (PR https://github.com/vichet99/brew-and-blue/pull/1) |
| Owner account | vichet99 (GitHub, Vercel, Supabase) |

## Vercel (hosting)

| Setting | Value |
|---|---|
| Team | ACME (`acme-265e`, id `team_HItogRZBu8YY1HQ9DmzQa0WO`), Hobby plan |
| Project | `monitoring-evaluation-system` (id `prj_rhMs1Ej7R9pa4rZCnHMSSz9IQbZ4`) |
| Root directory | `me-system` (the coffee-shop site at the repo root is a separate project, `brew-and-blue-coffee`) |
| Framework | Next.js, Node 22 |
| Function region | `sin1` Singapore (set in `me-system/vercel.json`, next to the database) |
| Production branch | `main` (until the PR is merged, production is deployed from the working branch by hand) |
| Environment variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (production, preview, development) |

## Supabase (database and sign-in)

| Setting | Value |
|---|---|
| Organisation | vichet99 (free plan) |
| Project | `monitoring-evaluation-system`, ref `cvutbidnazfgfbeptnbz` |
| Region | `ap-southeast-1` Singapore, Postgres 17 |
| API URL | https://cvutbidnazfgfbeptnbz.supabase.co |
| Publishable key (public) | `sb_publishable_Uyd1j90H7_LXQ4IDO8cXqw_KP0YTASC` |
| Secret / service_role key | Dashboard → Project Settings → API keys. Server-side only, never in the browser or git |
| Database password | Dashboard → Project Settings → Database (reset it there if unknown) |
| Migrations applied | `20260927000100_schema` … `20260927000600_open_submission` (6) |
| Seed | `supabase/seed/01…05` (Cashew workspace, RY2025 approved) |
| First administrator | tepvichet_prak@hotmail.com (Administrator + Reviewer, MoC) |

Settings to keep: Authentication → Sign In / Providers → "Allow new users to sign up" **off**, Email provider **on**;
URL Configuration → Site URL `https://monitoring-evaluation-system.vercel.app`.

## Other resources

| What | Where |
|---|---|
| Data schema diagram (Levels 1–2) | FigJam https://www.figma.com/board/myUgqANlU4u1dBQ94efJmW (claim it into your Figma account) |
| Data dictionary (Level 3) | `docs/data-dictionary.xlsx`, `docs/DATA_DICTIONARY.md` |
| Database guide | `supabase/README.md` |
| Local setup | `docs/LOCAL_SETUP.md` |
| Learning guide | `docs/LEARNING_GUIDE.md` |
| Claude Code guidance | `CLAUDE.md` |

## Stack and versions

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 7.0.2 |
| UI | React | 19.3.0 |
| Framework | Next.js (App Router) | 16.3.6 |
| Runtime | Node.js | 22 |
| Database client | @supabase/supabase-js, @supabase/ssr | 2.117.2, 0.12.7 |
| Database | PostgreSQL (Supabase) | 17 |
| Local database tooling | Supabase CLI (Docker) | 2.118.0 |
| Styles | Plain CSS, GOV.UK Design System 2025 colour palette | – |
| Data scripts | Python 3 + openpyxl | 3.11 |
