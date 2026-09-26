# Monitoring and Evaluation System

A clickable UI prototype (milestone **M1**) for a policy / programme / project
monitoring and evaluation platform, built from the *ME Platform Blueprint v1*
(specification, engineering contracts, playbook, sources and decisions, 24 Sep 2026).

**Live demo: https://monitoring-evaluation-system.vercel.app**

> **Prototype with an example workspace:** the demo is filled with the
> **National Cashew Policy 2022–2027** monitoring system (Ministry of Commerce),
> built from its M&E workbooks, Kobo form, manual and mid-term review. Records
> marked *Illustrative* are invented to show the workflow. Actions (saving,
> submitting, approving) are simulated in the browser and **not** saved to a
> server. Real persistence, sign-in and access control come in milestone M2.

## Run it

```bash
cd me-system
npm install
npm run dev        # http://localhost:3000
npm test           # spec 6.3 formula examples + checks against the Cashew workbooks
npm run build      # production build (all 226 pages are static)
```

Requires Node.js 22+. Stack: Next.js 16 (App Router), React 19, TypeScript, plain CSS tokens.
No UI framework, no database yet.

## How the Cashew example maps onto the platform

| Platform level | Cashew example | Count |
|---|---|---|
| Policy | National Cashew Policy 2022–2027 (3 goals, 3 action clusters) | 1 |
| Programme | One per ministry / institution (MAFF, MoC, MISTI, MPWT …) | 17 |
| Project | One per policy action; the lead ministry owns it, joint ministries contribute | 44 |
| Outcome indicators | Production, quality, processing, markets, socio-economic; 2022 baseline, no targets | 13 |
| Action indicators | 2027 target, 2025 value, % of target, status by year threshold | 108 |
| Kobo forms | CASHEW INDICATOR REPORT (17 ministry sections, EN/ខ្មែរ) and the processor survey | 2 |
| Previous period | Reporting year 2025 results and the MTR (final draft, 25 May 2026) | — |

Status rule (workbook sheet 10_STATUS_THRESHOLDS): fully achieved at 100% of the 2027
target; largely achieved from 40% (2025), 70% (2026), 90% (2027). The Policy Actions
Dashboard can re-grade the 2025 values with the 2026 or 2027 rule.

## Pilot roles

Decided 26 Sep 2026. Switch with **Viewing as** in the header (in the menu on phones) or the quick sign-in buttons on `/signin`.
Full matrix at `/roles`; rules in `src/lib/roles.ts` (tested in `tests/roles.test.ts`).

| Role | Scope | Can | Cannot |
|---|---|---|---|
| Administrator (M&E manager) | Whole workspace | Set up actions, indicators, targets, forms; manage users; run the cycle; publish; **may also review** | Approve a submission they entered themselves |
| Reviewer | Assigned ministries (pilot: all) | Verify, query, approve or reject submissions | Change reported values; approve own entries; change setup |
| Ministry focal point | Own ministry | Fill and submit the annual report; see own submissions and all approved dashboards | See other ministries' submissions; approve |
| Viewer (Committee) | Whole policy | Approved dashboards: policy totals **and** each ministry's detail | See drafts, submissions or evidence; enter or approve data |

In this prototype the role only changes what the interface shows. Real enforcement (sign-in, server checks, database rules) comes in milestone M2.

## Sitemap

Organised by the level a person manages. Each level answers one question. Live version: `/sitemap`.

| Level | Question it answers | Main pages |
|---|---|---|
| **1 Policy** | Is the policy reaching its three goals? | Policy overview `/policies/NCP-2022` · Outcome dashboard `/reports/outcome` · Results framework `/results` · Progress report 2025 and MTR `/reports/progress-2025` |
| **2 Programme (ministry)** | Is each ministry delivering its actions and indicators? | Ministry programmes `/programmes` · Ministry detail `/programmes/maff` · Policy Actions Dashboard `/reports/actions` |
| **3 Project (action)** | What was delivered for this action, and what is missing? | Policy actions `/projects` · Action detail `/projects/ACT-02` · Indicator catalogue `/indicators` |
| **4 Collect, review, administer** | Are numbers collected on time, checked and traceable? | Overview `/` · Kobo forms `/forms` · Ministry report form `/collect/cashew-indicator-report` · Submissions `/submissions` · Reviews `/reviews` · Administration `/admin` |

## Click-through journey to try

1. **Policy Actions Dashboard** `/reports/actions`: 44 actions, 11 / 27 / 6, 66% completion. Switch the threshold
   to 2027: the same values give 11 / 1 / 32.
2. **Ministry report form** `/collect/cashew-indicator-report?ministry=maff`: MAFF's 15 indicators; type a value and
   the % of target and status appear; switch to ខ្មែរ.
3. **Review** `/reviews/RY2026-MRD` *(illustrative)*: approval is blocked until the four MoC verification checks are ticked.
4. **Action detail** `/projects/ACT-02`: MTR summary, target, 2025 value, and the exact Kobo question and formula.
5. **Outcome dashboard** `/reports/outcome`: change the year; nut count and top-destination share improve when they fall.
6. **Progress report 2025** `/reports/progress-2025`: goal progress, all 44 action summaries, OECD-DAC findings, recommendations.

## Example data: sources and caveats

`src/data/cashew.json` is generated by `scripts/build_cashew_data.py` from the source files
(not committed). It contains aggregates, indicator definitions, form questions and report
text only; no respondent names or phone numbers.

```bash
pip install openpyxl python-docx
python3 scripts/build_cashew_data.py /path/to/folder-with-source-files
```

| Source file | Used for |
|---|---|
| Cashew_Dashboard & Database_Action Level_v5 (15 May 2026) | 108 indicators, 2025 values, %, status, thresholds |
| Outcome_Dashboard_v12 | 13 outcome indicators 2022–2025, export markets, production, income |
| CASHEW_INDICATOR_REPORT Kobo XLSForm v10 (12 May 2026) | Questions in English and Khmer, fields, constraints, calculations |
| Cashew Policy Monitoring System Manual v3 | Roles, calendar, verification rules, data-quality ranges |
| Cashew MTR Report, final draft (25 May 2026) | Action titles and progress summaries, goal progress, findings, recommendations |

Things to know (also shown on the site):

- Clusters follow the MTR (actions 1–17, 18–28, 29–44). Workbook v5 groups 1–16 / 17–32 / 33–44, so its pillar counts differ.
- The MTR counts 15 / 23 / 6 with a 50% cut-off (mid-2025); the workbook's 2025 rule (40%) gives 11 / 27 / 6.
- The 2025 workbook records no evidence files and "N/A" narratives, so narratives shown here come from the MTR.
- Outcome indicators Q1, Q2, PR1, PR2, S2, S3 are based on processor-survey test rows.
- Reporting year 2026 submissions (MRD, NBC, MISTI) are illustrative.

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
├── scripts/build_cashew_data.py   builds src/data/cashew.json from the source files
├── src/data/cashew.json           generated example data
├── src/lib/cashew.ts              typed access, status and trend rules
├── src/lib/rules.ts               pure scoring rules (shared with client forms)
├── src/lib/workflow.ts            submissions, quality flags, processor survey form
├── src/lib/calc.ts                generic indicator calculations (spec section 6)
├── src/lib/sitemap.ts             navigation and /sitemap
├── src/components/                layout, status tags, charts, tables, Kobo question viewer
├── src/app/                       one folder per route
└── tests/                         calc.test.ts, cashew.test.ts (17 tests)
```

## What is real and what is simulated

| Implemented and verified | Simulated in the browser | Not built yet |
|---|---|---|
| All screens, responsive at 360 / 768 / 1440 px with no page-level horizontal scroll | Draft saving, submission receipts, file uploads | Database, sign-in, access control (M2) |
| Status, completion and Kobo % rules, tested against the workbook (11 / 27 / 6, 66%) | Review approve / return / reject, form publishing, report drafts | Kobo import connector (R2) |
| Dashboards with hover tooltips, legends and data-table alternatives | CSV export (runs locally on the shown rows) | Offline collection and evaluation register (R3) |

## Deployment

Deployed on Vercel as a separate project (`monitoring-evaluation-system`) whose **root directory is `me-system`**,
so it does not affect the Brew & Blue site in the same repository.
Production URL: https://monitoring-evaluation-system.vercel.app. Vercel production follows the `main` branch;
until this branch is merged, push previews build automatically and production is redeployed from the branch by hand.
