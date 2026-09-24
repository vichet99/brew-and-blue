# Monitoring and Evaluation System

A clickable UI prototype (milestone **M1**) for a policy / programme / project
monitoring and evaluation platform, built from the *ME Platform Blueprint v1*
(specification, engineering contracts, playbook, sources and decisions, 24 Sep 2026).

**Live demo: https://monitoring-evaluation-system.vercel.app**

> **Prototype:** all names, figures and dates are fictional test data. Actions
> (saving drafts, submitting, approving, publishing) are simulated in the browser
> and are **not** saved to a server. Real persistence, sign-in and access control
> come in milestone M2.

## Run it

```bash
cd me-system
npm install
npm run dev        # http://localhost:3000
npm test           # worked calculation examples from spec section 6.3
npm run build      # production build (all pages are static)
```

Requires Node.js 22+. Stack: Next.js 16 (App Router), React 19, TypeScript, plain CSS tokens.
No UI framework, no database yet.

## Sitemap

Organised by the level of the results chain a person manages. Each level answers one question.
The live version is at `/sitemap`.

| Level | Question it answers | Pages (route · screen ID) |
|---|---|---|
| **1 Policy** | Are policy outcomes progressing, and where is evidence missing? | Policies and programmes `/policies` · UI-03 · Policy detail `/policies/POL-01` · UI-03 · Policy dashboard `/reports` · UI-11 · Evaluation register *(R3)* |
| **2 Programme** | Are results on track against targets, and who owes a report? | Programme detail `/programmes/PRG-A` · UI-03 · Results framework `/results` · UI-05 · Indicator catalogue `/indicators` · UI-06 · Reports and snapshots `/reports` · UI-11 |
| **3 Project** | What is due from us, and what must we submit or correct? | Projects `/projects` · UI-04 · Project overview `/projects/PRJ-A1` · UI-04 · Forms and designer `/forms` · UI-07 · Collect data `/collect/FRM-ACT` · UI-08 · Offline queue *(R3, UI-13)* |
| **4 Review and admin** | Is each figure traceable, reviewed and controlled? | Overview `/` · UI-02 · Submissions `/submissions` · UI-09 · Reviews `/reviews` · UI-10 · Administration `/admin` · UI-12 · Sign in `/signin` · UI-01 · Brand guide `/brand` · Kobo integration *(R2)* |

## Click-through journey to try

1. **Overview** `/`: tasks first (reviews waiting, returned, overdue, due).
2. **Collect data** `/collect/FRM-ACT`: submit empty to see the error summary; answer *Yes* to feedback, then
   switch to *No* to see the “this will clear an answer” warning; save a draft; attach a file; submit to get a receipt.
3. **Review** `/reviews/SUB-1061`: see the r1 → r2 change; try approving as the original submitter (blocked);
   return without a reason (blocked); return with a reason.
4. **Indicator** `/indicators/IND-03`: pooled percentage (50 of 150 = 33.33 %, not the average of 60 % and 20 %).
5. **Form designer** `/forms/FRM-ACT`: reorder with ↑ ↓, type an invalid ID, run publish checks.

## Branding

Colours follow the **GOV.UK brand refresh (June 2025)**, one of the most detailed public-sector brand guidelines
published in 2025–26, and a close match to the specification’s “white background, charcoal text, restrained blue”
direction and its WCAG 2.2 AA target. Hex values were taken from the published `govuk-frontend@6.5.1` package.

| Role | Token | Hex |
|---|---|---|
| Brand / header | `--blue` | `#1d70b8` |
| Links | `--blue-shade-10` | `#1a65a6` |
| Policy level | `--blue-shade-50` | `#0f385c` |
| Project level | `--teal-shade-25` | `#106165` |
| Accent (logo dot only) | `--teal-accent` | `#00ffe0` |
| Text | `--black` | `#0b0c0c` |
| Secondary text | `--black-tint-25` | `#484949` |
| Surface | `--blue-tint-95` | `#f4f8fb` |
| Focus | `--yellow` | `#ffdd00` |
| Success / main button | `--green` | `#0f7a52` |
| Error / overdue | `--red` | `#ca3535` |

The crown logo and the GDS Transport typeface are reserved for UK government services and are **not** used.
This site has its own bar-chart mark and a system font stack with a Khmer fallback.

Sources: [GOV.UK Brand Guidelines – colour](https://brand.design-system.service.gov.uk/colour) ·
[How GDS refreshed its brand (Apr 2025)](https://designnotes.blog.gov.uk/2025/04/04/how-we-refreshed-the-government-digital-service-brand-and-what-were-doing-differently) ·
[New colour palette decision record](https://github.com/alphagov/govuk-design-system/discussions/5048)

## Structure

```
me-system/
├── src/app/            one folder per route (see sitemap)
├── src/components/     layout nav, status tags, indicator cards, tabs
├── src/lib/data.ts     fictional seed data (policy P1, programmes A/B, projects A1/A2/B1)
├── src/lib/calc.ts     indicator calculations: never fabricate zero, never clip progress
├── src/lib/sitemap.ts  single source for navigation and the /sitemap page
└── tests/calc.test.ts  worked examples from spec 6.3 and playbook 23.2
```

## What is real and what is mocked

| Implemented and verified | Mocked (simulated in browser) | Not yet built |
|---|---|---|
| Screens UI-01 to UI-12, responsive at 360 / 768 / 1440 px with no page-level horizontal scroll | Sign-in, draft saving, submission receipt, evidence upload and scan | Database, authentication, tenant isolation (M2) |
| Calculation rules (11 unit tests passing) | Review return / approve / reject, form publishing, report snapshots | Persistence of policies, indicators, targets (M3) |
| Keyboard tabs, button reordering, status tags with icon + text | CSV export of fictional submissions (runs locally) | Real forms and review workflow (M4), dashboards from approved data (M5) |

## Deployment

Deployed on Vercel as a separate project (`monitoring-evaluation-system`) whose **root directory is `me-system`**,
so it does not affect the Brew & Blue site in the same repository.
Production URL: https://monitoring-evaluation-system.vercel.app. Vercel production follows the `main` branch;
until this branch is merged, push previews build automatically and production is redeployed from the branch by hand.
