// Single source for the navigation and the /sitemap page.
// Pages are grouped by the level of the results chain a person works at:
// policy -> programme -> project, plus cross-cutting services.

export type Release = "R1" | "R2" | "R3";

export interface SitePage {
  title: string;
  href: string;
  ui?: string; // screen ID from spec section 10.2
  release: Release;
  who: string;
  purpose: string;
  contains: string[];
  live?: boolean; // clickable in this prototype
}

export interface SiteTier {
  id: "policy" | "programme" | "project" | "cross";
  number: string;
  title: string;
  question: string;
  audience: string;
  pages: SitePage[];
}

export const sitemap: SiteTier[] = [
  {
    id: "policy",
    number: "1",
    title: "Policy level",
    question: "Are our policy outcomes progressing, and where is evidence missing?",
    audience: "Policy managers, senior officials, viewers",
    pages: [
      {
        title: "Policies and programmes",
        href: "/policies",
        ui: "UI-03",
        release: "R1",
        who: "Policy manager, viewer",
        purpose: "Portfolio list of policies with their owned programmes.",
        contains: ["Policy status and dates", "Owned programmes", "Accountable organisation"],
        live: true,
      },
      {
        title: "Policy detail",
        href: "/policies/POL-01",
        ui: "UI-03",
        release: "R1",
        who: "Policy manager",
        purpose: "Objectives, programmes, contribution links and impact results.",
        contains: ["Objectives", "Owned programmes and contributions", "Impact-level results", "Access and permissions"],
        live: true,
      },
      {
        title: "Policy dashboard",
        href: "/reports",
        ui: "UI-11",
        release: "R1",
        who: "Policy manager, viewer",
        purpose: "Approved outcome indicators with completeness and overdue reports.",
        contains: ["Approved values only (official mode)", "Completeness and last refresh", "Drill-down to evidence"],
        live: true,
      },
      {
        title: "Evaluation register",
        href: "/sitemap#roadmap",
        release: "R3",
        who: "M&E lead, policy manager",
        purpose: "Studies, findings, recommendations and management responses.",
        contains: ["Study scope and method", "Findings kept separate from monitoring", "Action tracking with evidence"],
      },
    ],
  },
  {
    id: "programme",
    number: "2",
    title: "Programme level",
    question: "Are results on track against agreed targets, and who owes us a report?",
    audience: "Programme managers, M&E reviewers",
    pages: [
      {
        title: "Programme detail",
        href: "/programmes/PRG-A",
        ui: "UI-03",
        release: "R1",
        who: "Programme manager",
        purpose: "Owned projects, contributing projects, results and obligations.",
        contains: ["Owned vs contributing projects", "Outcome indicators", "Reporting obligations"],
        live: true,
      },
      {
        title: "Results framework",
        href: "/results",
        ui: "UI-05",
        release: "R1",
        who: "Programme manager, M&E reviewer",
        purpose: "Impact → outcome → output chain with linked indicators.",
        contains: ["Result tree", "Assumptions and risks", "Linked indicators"],
        live: true,
      },
      {
        title: "Indicator catalogue",
        href: "/indicators",
        ui: "UI-06",
        release: "R1",
        who: "M&E reviewer",
        purpose: "Versioned definitions, baselines, targets and methods.",
        contains: ["Definition contract", "Aggregation rules", "Baselines and target revisions"],
        live: true,
      },
      {
        title: "Reports and snapshots",
        href: "/reports",
        ui: "UI-11",
        release: "R1",
        who: "Programme manager",
        purpose: "Freeze and publish immutable internal reports; CSV exports.",
        contains: ["Report versions and supersession", "Snapshot manifest", "CSV export with manifest"],
        live: true,
      },
    ],
  },
  {
    id: "project",
    number: "3",
    title: "Project level",
    question: "What is due from us, and what do we need to submit or correct?",
    audience: "Project officers, data collectors",
    pages: [
      {
        title: "Projects",
        href: "/projects",
        ui: "UI-04",
        release: "R1",
        who: "Project officer",
        purpose: "Projects in your scope with status and due reporting.",
        contains: ["Owning programme", "Period and status", "Due obligations"],
        live: true,
      },
      {
        title: "Project overview",
        href: "/projects/PRJ-A1",
        ui: "UI-04",
        release: "R1",
        who: "Project officer",
        purpose: "Tasks first, then Indicators, Activities, Forms and Reports tabs.",
        contains: ["Due reporting and reviews", "Indicator progress", "Activities and forms"],
        live: true,
      },
      {
        title: "Forms and designer",
        href: "/forms",
        ui: "UI-07",
        release: "R1",
        who: "Project officer, M&E reviewer",
        purpose: "Build, preview and publish immutable form versions.",
        contains: ["Question palette", "Keyboard reordering", "Publish checks"],
        live: true,
      },
      {
        title: "Collect data",
        href: "/collect/FRM-ACT",
        ui: "UI-08",
        release: "R1",
        who: "Data collector",
        purpose: "Fill a form with save status, evidence and a receipt.",
        contains: ["Conditional questions", "Saved / Unsaved / Sending", "Durable receipt ID"],
        live: true,
      },
      {
        title: "Offline device queue",
        href: "/sitemap#roadmap",
        ui: "UI-13",
        release: "R3",
        who: "Data collector",
        purpose: "Queued, uploading, synced and conflict states on prepared devices.",
        contains: ["Pinned form versions", "Retry and conflict handling"],
      },
    ],
  },
  {
    id: "cross",
    number: "4",
    title: "Review, quality and administration",
    question: "Is each figure traceable, reviewed and properly controlled?",
    audience: "M&E reviewers, administrators, operators",
    pages: [
      {
        title: "Overview (my work)",
        href: "/",
        ui: "UI-02",
        release: "R1",
        who: "Everyone",
        purpose: "Due reports, reviews waiting and approved indicator highlights.",
        contains: ["My tasks", "Overdue obligations", "Approved headline indicators"],
        live: true,
      },
      {
        title: "Submissions",
        href: "/submissions",
        ui: "UI-09",
        release: "R1",
        who: "M&E reviewer, project officer",
        purpose: "Filterable table of submissions and their review state.",
        contains: ["Filters by state, form, period", "Quality flags", "Revision numbers"],
        live: true,
      },
      {
        title: "Reviews",
        href: "/reviews",
        ui: "UI-10",
        release: "R1",
        who: "M&E reviewer",
        purpose: "Inspect answers and evidence; return, approve or reject a revision.",
        contains: ["Revision changes", "Reason required to return", "No self-approval"],
        live: true,
      },
      {
        title: "Administration",
        href: "/admin",
        ui: "UI-12",
        release: "R1",
        who: "Workspace administrator",
        purpose: "Members, scoped role grants, organisations and audit trail.",
        contains: ["Invite / deactivate", "Scoped grants", "Append-only audit events"],
        live: true,
      },
      {
        title: "Kobo integration",
        href: "/sitemap#roadmap",
        release: "R2",
        who: "Workspace administrator",
        purpose: "Read-only import with reconciliation and field mapping.",
        contains: ["Server and asset registration", "Sync runs and quarantine"],
      },
      {
        title: "Sign in",
        href: "/signin",
        ui: "UI-01",
        release: "R1",
        who: "Everyone",
        purpose: "Sign in, recover access and choose a workspace.",
        contains: ["Error and expired-link states", "No-workspace state"],
        live: true,
      },
      {
        title: "Brand and design tokens",
        href: "/brand",
        release: "R1",
        who: "Designers, developers",
        purpose: "Colour palette, type and status rules this site uses.",
        contains: ["GOV.UK 2025 palette", "Status tags with icons", "Accessibility rules"],
        live: true,
      },
    ],
  },
];

// Desktop navigation order from spec section 10.1.
export const primaryNav: { label: string; href: string; match: string[] }[] = [
  { label: "Overview", href: "/", match: ["/"] },
  { label: "Policies and programmes", href: "/policies", match: ["/policies", "/programmes"] },
  { label: "Projects", href: "/projects", match: ["/projects"] },
  { label: "Results framework", href: "/results", match: ["/results"] },
  { label: "Indicators", href: "/indicators", match: ["/indicators"] },
  { label: "Forms", href: "/forms", match: ["/forms", "/collect"] },
  { label: "Submissions", href: "/submissions", match: ["/submissions"] },
  { label: "Reviews", href: "/reviews", match: ["/reviews"] },
  { label: "Reports", href: "/reports", match: ["/reports"] },
  { label: "Administration", href: "/admin", match: ["/admin"] },
];

export const secondaryNav: { label: string; href: string; match: string[] }[] = [
  { label: "Sitemap", href: "/sitemap", match: ["/sitemap"] },
  { label: "Brand guide", href: "/brand", match: ["/brand"] },
  { label: "Sign in", href: "/signin", match: ["/signin"] },
];
