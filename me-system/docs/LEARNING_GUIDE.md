# Learning guide: how this system is built

This guide walks through the real code, one technology at a time, so you can learn by reading and changing
it. Each section says **what the technology does here**, shows **a real excerpt**, points to **files to read**,
and ends with **try it** exercises. Run the demo first (`docs/LOCAL_SETUP.md`, level 1) so you can see your
changes. Excerpts here are trimmed and annotated for teaching; open the real files to see them in full. Key files
start with a "How this works" comment and carry notes on the tricky lines.

Suggested reading order: 1 → 2 → 3 → 4 → 5, then 9 (one journey through every layer), then 6–8.

---

## The big picture

```
 You (browser)                         Vercel (server, Singapore)                Supabase (Singapore)
 ─────────────                         ──────────────────────────                ────────────────────
 HTML + CSS + JavaScript   ── HTTP ──►  Next.js (Node.js)            ── SQL ──►   PostgreSQL database
 React components                       • proxy.ts (every request)                 • tables, rules, RLS
 • show pages                           • pages rendered to HTML                   • workflow functions
 • handle clicks, forms                 • Server Functions (save/submit)          Supabase Auth
                                                                                   • email + password
```

- **HTML** is the structure of a page, **CSS** its look, **JavaScript** its behaviour.
- **TypeScript** is JavaScript with types: the editor catches mistakes before you run the code.
- **React** lets you build the page out of reusable components written in **JSX** (HTML-like syntax inside JS).
- **Next.js** is a React framework: it maps folders to URLs, renders pages on the server, and runs server code.
- **Node.js** runs JavaScript outside the browser: the dev server, the build, the tests, the server functions.
- **PostgreSQL** stores the data and enforces the rules; **Supabase** hosts it and adds sign-in and an API.

---

## 1. HTML (through JSX)

You rarely write `.html` files in a React app. Components return **JSX**, which becomes HTML. Look at any page and
you'll see ordinary HTML elements: `<main>`, `<h1>`, `<table>`, `<form>`, `<label>`, `<button>`.

From `src/app/signin/page.tsx`: a labelled input, the way accessible forms should be built.

```tsx
<div className={`field ${errors.email ? "field--error" : ""}`}>
  <label htmlFor="email">Email address</label>            {/* htmlFor = HTML's for="…": clicking the label focuses the input */}
  {errors.email && <p className="error-message" id="email-error">{errors.email}</p>}
  <input id="email" type="email" autoComplete="email" value={email}
         onChange={(e) => setEmail(e.target.value)}
         aria-describedby={errors.email ? "email-error" : undefined} />   {/* screen readers read the error too */}
</div>
```

JSX differences from HTML: `className` instead of `class`, `htmlFor` instead of `for`, `{…}` inserts JavaScript,
and every tag must be closed (`<input />`).

**Read:** `src/app/layout.tsx` (the frame of every page: header, banner, side menu, `<main>`, footer).
**Try it:** in `layout.tsx` change the footer text; change a heading on `src/app/roles/page.tsx`.

---

## 2. CSS

All styles are in one file, `src/app/globals.css`, with no framework, so everything is visible.

**Design tokens.** Colours and spacing are CSS variables defined once on `:root` and reused everywhere:

```css
:root {
  --blue: #1d70b8;          /* GOV.UK 2025 palette */
  --green: #0f7a52;
  --s3: 16px;               /* spacing scale: 4 / 8 / 16 / 24 / 32 */
}
.btn { background: var(--green); padding: var(--s2) var(--s3); }
```

Change `--blue` and the whole site follows.

**Responsive design.** `@media (max-width: 800px) { … }` applies rules only on narrow screens. The clever part
is how tables become cards on phones. `ResponsiveTables.tsx` copies each column heading into
`data-label` on every cell, and CSS shows it with `::before`:

```css
@media (max-width: 800px) {
  table.stackable tr { display: block; border: 1px solid var(--border); }   /* each row becomes a card */
  table.stackable thead { position: absolute; clip: rect(0 0 0 0); }        /* hide header, keep it for screen readers */
  table.stackable td::before { content: attr(data-label); float: left; }    /* print the column name */
}
```

**Read:** `globals.css` top to bottom, noticing the section comments (`/* ---------- Header ---------- */`).
**Try it:** open the site, press F12 → toggle the device toolbar → 360 px wide, and watch Submissions turn into
cards. Change `--lw: 116px` and see the label column change.

---

## 3. JavaScript and TypeScript

Pure logic lives in `src/lib/`. Start with `src/lib/rules.ts`: the % of target calculation, the heart of the
monitoring rules.

```ts
export function koboPercentage(i: { method: Method; target: number | null }, value: string | number | null): number | null {
  if (value === null || value === "") return null;                          // no answer ⇒ no %, never 0
  if (i.method === "milestone")                                            // Completed / In progress / Not started
    return ({ completed: 100, in_progress: 50, not_started: 0 } as Record<string, number>)[String(value)] ?? null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (i.method === "percent_complete") return Math.min(n, 100);
  if (i.method === "inverse_time") return n > 0 && i.target ? Math.round((i.target / n) * 100) : null; // fewer days is better
  return i.target ? Math.round((n / i.target) * 100) : null;               // count toward a target
}
```

Things to notice: **types** after the colon (`number | null` means "a number or null"); **early returns**;
**`??`** gives a fallback when the left side is `null`/`undefined`; `Record<string, number>` is an object type.

**Tests** prove the rules. `tests/cashew.test.ts` uses Node's built-in runner and checks the same cases
as the Kobo form:

```ts
test("Kobo percentage mirrors the XLSForm calculations", () => {
  assert.equal(koboPercentage(getActionIndicator("Indicator_002")!, 4), 57);            // round(4/7*100)
  assert.equal(koboPercentage(getActionIndicator("Indicator_004")!, "in_progress"), 50); // milestone
  assert.equal(koboPercentage(getActionIndicator("Indicator_103")!, 6), 50);            // 3 days target / 6 days
  assert.equal(koboPercentage(getActionIndicator("Indicator_001")!, ""), null);         // blank is not zero
});
```

**Read:** `src/lib/rules.ts`, `src/lib/access.ts`, `src/lib/roles.ts`, and their tests in `tests/`.
**Try it:** add a line to that test for `Indicator_015` (percent complete) with the value 60, expecting 60. Run `npm test`, then change 60 to 40 on one side only and watch the test fail.

---

## 4. React

A **component** is a function that returns JSX. **Props** are its inputs; **state** is data that changes and
re-draws the component.

`StatusTag` in `src/components/ui.tsx` is a small, reusable component with props:

```tsx
export function StatusTag({ status, label }: { status: string; label?: string }) {
  const s = statusMap[status] ?? { tone: "grey", icon: "dot" };   // colour + icon for this status
  return <span className={`tag tag--${s.tone}`}><Icon name={s.icon} />{label ?? status}</span>;
}
// used as: <StatusTag status="Approved" />
```

**State and events** in the report form (`src/app/collect/[code]/CashewReportForm.tsx`):

```tsx
const [answers, setAnswers] = useState<Record<string, Answer>>({});   // current form values
function set(id: string, patch: Partial<Answer>) {
  setAnswers((a) => ({ ...a, [id]: { ...(a[id] ?? EMPTY), ...patch } }));  // copy, never mutate
}
<input value={a.value} onChange={(e) => set(i.id, { value: e.target.value })} />
const p = koboPercentage(i, a.value);   // recalculated on every keystroke ⇒ live % as you type
```

**Context** shares data with the whole page without passing props down every level. `RoleProvider.tsx` holds
"who is signed in"; any component calls `useRole()` to read it.

**Effects** (`useEffect`) run code after the component appears: `RoleProvider` uses one to ask Supabase who is
signed in, and `ResponsiveTables` uses one to label table cells.

**Read:** `ui.tsx`, `Tabs.tsx`, `RoleProvider.tsx`, then `CashewReportForm.tsx`.
**Try it:** add a new status, "On hold", to `statusMap` with tone `"orange"`, and use it somewhere.

---

## 5. Next.js

**Folders are URLs** (App Router):

| File | URL |
|---|---|
| `src/app/page.tsx` | `/` |
| `src/app/submissions/page.tsx` | `/submissions` |
| `src/app/reviews/[id]/page.tsx` | `/reviews/RY2025-MAFF` (`[id]` is a variable part) |
| `src/app/layout.tsx` | wraps every page |

**Server vs client components.** By default a component runs on the **server** (it can read the database; its code
never reaches the browser). Adding `"use client"` at the top makes it run in the **browser** too (needed for
`useState`, clicks, effects). The pattern used throughout: a server `page.tsx` loads data, then passes it as props
to a client component that handles interaction (e.g. `reviews/[id]/page.tsx` → `ReviewPanel.tsx`).

**Static vs dynamic.** Most pages are built once at build time into HTML (fast, free). The four workflow pages set
`export const dynamic = "force-dynamic"` because they depend on who is signed in.

**Server Functions** (`"use server"`) are functions that run on the server but can be called from the browser like
a normal function. See `src/app/actions/workflow.ts`:

```ts
"use server";
export async function submitReport(ministry: string, year: number, answers: DraftAnswer[]): Promise<Result> {
  const { live, error } = await signedIn();                       // who is calling? (from the session cookie)
  if (!live) return error!;
  const saved = await saveInto(live, ministry, year, answers);    // upsert answers into the draft revision
  if (saved.error || !saved.revisionId) return fail(saved.error ?? "Could not save the report.");
  const { error: e } = await live.supabase.rpc("submit_revision", { rev: saved.revisionId });  // database does the rest
  if (e) return fail(e.message);
  revalidatePath("/submissions");                                 // tell Next.js the page's data changed
  return { ok: true, code: /* e.g. "RY2026-MAFF r1" */ "" };
}
```

**Proxy** (`src/proxy.ts`, called "middleware" before Next 16) runs before every request; here it refreshes the
sign-in cookie.

**Read:** `layout.tsx`, `submissions/page.tsx`, `reviews/[id]/page.tsx`, `actions/workflow.ts`, `proxy.ts`.
**Try it:** create `src/app/hello/page.tsx` returning `<h1>Hello</h1>`, then open http://localhost:3000/hello.

---

## 6. Node.js and npm

- `package.json` lists dependencies (exact versions) and **scripts**: `npm run dev` runs `next dev`, etc.
- `npm install` downloads everything into `node_modules/` (never edit or commit it).
- `node --test` runs the tests; `tsc --noEmit` type-checks.
- Environment variables (`process.env.NEXT_PUBLIC_SUPABASE_URL`) come from `.env.local` locally and from Vercel
  settings in production. Variables starting with `NEXT_PUBLIC_` are copied into browser code at build time, so only
  public values may use that prefix.

**Read:** `package.json`, `next.config.ts` (adds security headers to every response), `tsconfig.json`.

---

## 7. PostgreSQL

The database files are in `supabase/migrations/`, applied in filename order. They are heavily commented.

**Tables and constraints** (`…100_schema.sql`): the database refuses bad data by itself.

```sql
create table submissions (
  id           uuid primary key default gen_random_uuid(),      -- unique id, generated
  ministry_id  uuid not null,
  reporting_year_id uuid not null,
  form_id      uuid not null,
  state        submission_state not null default 'draft',       -- an enum: only allowed values
  unique (ministry_id, reporting_year_id, form_id),             -- one report per ministry per year
  foreign key (workspace_id, ministry_id) references ministries (workspace_id, id)  -- must point to a real ministry
);
```

**Functions and triggers** (`…200_rules.sql`): code that runs inside the database. `answers_guard` runs before
every change to `answers`. It refuses edits to submitted revisions, checks that the indicator belongs to the
ministry, and calculates `pct_of_target` itself, so nobody can type a different %.

**Row-level security** (`…300_access.sql`): every query is filtered by who is asking.

```sql
create policy read_submissions on submissions for select to authenticated
  using (can_see_ministry(workspace_id, ministry_id));   -- focal point: own ministry; reviewer: all; viewer: none
```

**Views** (`…500_read_models.sql`) are saved queries the website reads, such as `submission_overview`.

**Read:** the four migrations in order, then `supabase/checks/10_roles_and_workflow.sql`, which tests them.
**Try it (local database):** `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres`, then
`select code, state from submission_overview;` and `select * from action_status where year = 2025 limit 5;`

---

## 8. Supabase

- **Auth:** `supabase.auth.signInWithPassword(...)` in `signin/page.tsx`. The session is stored in cookies so both
  the browser and the server know who you are.
- **Data API:** `supabase.from("submission_overview").select("*")` becomes an SQL query, with RLS applied.
- **RPC:** `supabase.rpc("decide_revision", {...})` calls a database function.
- **Clients:** `src/lib/supabase/browser.ts` (in the browser), `server.ts` (in server components and functions,
  reads cookies).
- **Local stack:** `npx supabase start` runs all of this in Docker from `supabase/config.toml`.

---

## 9. One journey through every layer: a focal point submits a report

1. **Browser, HTML/CSS/React.** `/collect/cashew-indicator-report` shows `CashewReportForm`. Each keystroke
   updates React state and recalculates the % with `koboPercentage` (`src/lib/rules.ts`).
2. **Click "Submit annual report".** `submit()` validates in the browser, then calls the Server Function
   `submitReport(...)` imported from `src/app/actions/workflow.ts`.
3. **Network.** Next.js sends that call to the server as a POST request, with the session cookie.
4. **Vercel, Node.js.** `src/proxy.ts` refreshes the session. `submitReport` creates a Supabase client with the
   user's cookie (`src/lib/supabase/server.ts`) and checks who is signed in (`getLive`, `src/lib/live.ts`).
5. **Supabase, Postgres.** `rpc("open_submission")` finds or creates the draft (checking the focal point's role).
   `upsert` into `answers` fires the `answers_guard` trigger, which calculates % of target. RLS policy
   `write_draft_answers` allows it only because the revision is a draft of the caller's ministry.
6. `rpc("submit_revision")` locks the revision, stores a fingerprint of the answers (`payload_hash`), runs the
   automatic quality checks, and writes an `audit_events` row, all in one transaction.
7. **Back in the browser.** The function returns `{ ok: true, code: "RY2026-MAFF r1" }` and the form shows the receipt.
8. **Reviewer.** `/reviews/RY2026-MAFF` reads `submission_overview`, `revision_answers`, `quality_flags` and
   `review_history`. "Approve" calls `decide_revision`, which refuses if the reviewer entered the report themselves
   (trigger `review_events_guard`) and otherwise creates the official `results`.

Follow it yourself with the file names above: it's the best way to understand how the parts connect.

---

## Glossary

| Term | Meaning |
|---|---|
| Component | A function returning JSX; a reusable piece of UI |
| Props / state | A component's inputs / its changing data |
| Hook | A React function starting with `use` (`useState`, `useEffect`, `useRole`) |
| SSR / static | Page rendered on each request / built once ahead of time |
| Server Function | A server-side function the browser can call (`"use server"`) |
| Migration | A numbered SQL file that changes the database schema |
| RLS | Row-level security: database rules that filter rows per user |
| RPC | Remote procedure call: calling a database function through the API |
| Trigger | Database code that runs automatically before/after a change |
| Environment variable | A setting outside the code (`.env.local`, Vercel settings) |

## Where to learn more

- HTML/CSS/JS basics: MDN Web Docs https://developer.mozilla.org
- React: https://react.dev/learn
- Next.js: https://nextjs.org/learn (and `node_modules/next/dist/docs/` for the exact installed version)
- TypeScript: https://www.typescriptlang.org/docs/handbook/intro.html
- PostgreSQL: https://www.postgresql.org/docs/current/tutorial.html
- Supabase: https://supabase.com/docs (Auth, Row Level Security, Database Functions)
- GOV.UK Design System (the visual and accessibility patterns used): https://design-system.service.gov.uk
