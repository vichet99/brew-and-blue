# Running the project on your computer

Three levels, from easiest to most complete. Each works on Windows, macOS and Linux.

| Level | What you get | You need |
|---|---|---|
| 1. Demo | The whole website with example data and simulated roles | Node.js |
| 2. Local database | Real sign-in, saving, reviewing, on a private copy of the database | + Docker Desktop |
| 3. Live database | Your computer talking to the real Supabase project | Level 1 + care (real data) |

## 0. Install the tools (once)

1. **Node.js 22 LTS**: https://nodejs.org → download "LTS". Check in a terminal: `node -v` (v22.x) and `npm -v`.
2. **Git**: https://git-scm.com/downloads. Check: `git --version`.
3. **VS Code** (recommended editor): https://code.visualstudio.com. Useful extensions: ESLint, Prettier,
   "PostgreSQL" (by Chris Kolkman or Microsoft), "Claude Code".
4. For level 2: **Docker Desktop** https://www.docker.com/products/docker-desktop (start it before step 2).
5. Optional, for the data scripts: **Python 3.11+** with `pip install openpyxl`.

On Windows use PowerShell or "Git Bash". The `.sh` scripts need Git Bash or WSL.

## 1. Get the code and run the demo

```bash
git clone https://github.com/vichet99/brew-and-blue.git
cd brew-and-blue
git checkout claude/me-platform-design-6pfdjl     # or main, once the PR is merged
cd me-system
npm install                                       # downloads packages into node_modules/ (a few minutes)
npm run dev                                       # starts http://localhost:3000
```

Open http://localhost:3000. Change a file in `src/` and the page reloads by itself. Stop with `Ctrl+C`.
If you got the code as a zip instead, unzip it and start from `cd me-system`.

Check that everything is healthy:

```bash
npm test            # 29 unit tests
npm run typecheck   # TypeScript errors, if any
npm run build       # the same build Vercel runs
```

## 2. Local database (recommended for development)

This runs Supabase (Postgres + sign-in + API) in Docker on your computer, built from the files in
`supabase/`. Nothing you do here touches the real project.

```bash
# in me-system/, with Docker Desktop running
npx supabase start -x studio,imgproxy,realtime,storage-api,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit
```

The first start downloads images (several minutes). It applies all migrations and the seed, then prints
the local URLs and keys. Keep this terminal output; you need `API_URL` and `PUBLISHABLE_KEY`.
Drop `studio` from the `-x` list if you want the Supabase dashboard locally at http://127.0.0.1:54323.

Create three test accounts (lead = Administrator + Reviewer, reviewer, MAFF focal point):

```bash
supabase/checks/local_test_users.sh
# passwords: Test-lead-2026!  Test-reviewer-2026!  Test-focal-2026!   (emails: lead@, reviewer@, focal@example.org)
```

Connect the website to it: copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from `npx supabase status`>
```

Restart `npm run dev`, go to http://localhost:3000/signin and sign in as `focal@example.org`.

Useful commands:

| Command | Does |
|---|---|
| `npx supabase status` | Show URLs and keys again |
| `npx supabase db reset` | Wipe and rebuild the local database from migrations + seed (then rerun the test-account script) |
| `npx supabase stop` | Stop the containers (data is kept) |
| `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres` | Open a SQL prompt on the local database |
| `npx supabase migration new <name>` | Create a new empty migration file |

Run the database checks (plain Postgres, no Docker needed): see `supabase/README.md` → "Testing locally".

## 3. Pointing at the live database (only when needed)

Put the live values from `docs/PROJECT_INFO.md` in `.env.local`. Sign in with your real account. Everything you
save goes into the real database and the audit trail, so prefer level 2 for experiments.

To change the live database schema, write a new migration, test it locally (`npx supabase db reset` + checks),
then apply it: either paste it in the Supabase SQL Editor, or

```bash
npx supabase login
npx supabase link --project-ref cvutbidnazfgfbeptnbz
npx supabase db push        # applies migrations the live project doesn't have yet
```

## 4. Deploying

Vercel builds automatically on every push to GitHub:

- push to any branch → a **preview** deployment (its own URL; see the Vercel dashboard or the PR)
- merge into `main` → **production** (https://monitoring-evaluation-system.vercel.app)

Environment variables are set in Vercel → Project → Settings → Environment Variables. After changing them,
redeploy (Deployments → ⋯ → Redeploy) because `NEXT_PUBLIC_` values are built into the code.

## 5. Working with Claude Code

Open the `me-system` folder in Claude Code (terminal: `claude`, or the VS Code extension). It reads
`CLAUDE.md` automatically, which explains the architecture, commands and rules. Good first prompts:

- "Explain how a focal point's report gets saved, file by file."
- "Add a user management page for the Administrator" (the next feature on the list).

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails | Check `node -v` is 22+. Delete `node_modules` and `package-lock.json` only as a last resort |
| Port 3000 in use | `npm run dev -- -p 3001` |
| Sign-in says "Email logins are disabled" | `[auth.email] enable_signup` must be `true` in `supabase/config.toml`, then `npx supabase stop && npx supabase start` |
| Sign-in works but "no access to any workspace" | The account has no membership/role: rerun `local_test_users.sh` (local) or add a role grant (live) |
| Site still shows "Viewing as" after sign-in | `.env.local` missing or dev server not restarted after editing it |
| Docker errors on `supabase start` | Start Docker Desktop; on Windows enable WSL 2 in Docker settings |
