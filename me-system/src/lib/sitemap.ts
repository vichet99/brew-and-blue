// Single source for the navigation and the /sitemap page.
// Pages are grouped by the level of the results chain a person works at:
// policy -> programme (one per ministry) -> project (one per policy action),
// plus cross-cutting collection, review and reporting services.

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
    question: "Is the National Cashew Policy reaching its three goals?",
    audience: "Inter-Ministerial M&E Committee, MoC leadership",
    pages: [
      {
        title: "Policy overview",
        href: "/policies/NCP-2022",
        ui: "UI-03",
        release: "R1",
        who: "Committee, MoC Secretariat",
        purpose: "Vision, 3 goals, 3 action clusters, 17 ministry programmes and headline results.",
        contains: ["Goals and clusters", "Programmes by ministry", "Outcome indicators", "MTR headline"],
        live: true,
      },
      {
        title: "Outcome dashboard",
        href: "/reports/outcome",
        ui: "UI-11",
        release: "R1",
        who: "Committee, partners",
        purpose: "13 sector indicators against the 2022 baseline, with export markets.",
        contains: ["Year selector 2022–2025", "Direction-aware trend", "Top 10 export markets"],
        live: true,
      },
      {
        title: "Results framework",
        href: "/results",
        ui: "UI-05",
        release: "R1",
        who: "Secretariat, Committee",
        purpose: "Vision → goals → clusters → 44 actions, with outcome indicators per goal.",
        contains: ["Goal-to-cluster pathway", "Outcome indicators", "Action status"],
        live: true,
      },
      {
        title: "Progress report 2025 and MTR",
        href: "/reports/progress-2025",
        ui: "UI-11",
        release: "R1",
        who: "Committee, Council of Ministers, partners",
        purpose: "Previous period: goal progress, action-by-action status and MTR recommendations.",
        contains: ["Goal progress", "44 action summaries", "OECD-DAC findings", "Recommendations"],
        live: true,
      },
    ],
  },
  {
    id: "programme",
    number: "2",
    title: "Programme level (one per ministry)",
    question: "Is each ministry delivering its assigned actions and indicators?",
    audience: "Ministry leadership, MoC Secretariat",
    pages: [
      {
        title: "Ministry programmes",
        href: "/programmes",
        ui: "UI-03",
        release: "R1",
        who: "Secretariat, ministry leadership",
        purpose: "17 ministries and institutions ranked by 2025 completion.",
        contains: ["Actions led and joined", "Assigned indicators", "Completion and status counts"],
        live: true,
      },
      {
        title: "Ministry programme detail",
        href: "/programmes/maff",
        ui: "UI-03",
        release: "R1",
        who: "Ministry focal point and leadership",
        purpose: "One ministry's actions, indicators, 2025 results and Kobo section.",
        contains: ["Led and joint actions", "Indicator results", "Its Kobo questions"],
        live: true,
      },
      {
        title: "Policy Actions Dashboard",
        href: "/reports/actions",
        ui: "UI-11",
        release: "R1",
        who: "Committee, Secretariat",
        purpose: "The one-page dashboard: status by cluster, ministry and action.",
        contains: ["KPI cards", "Status by cluster", "Completion by ministry", "Threshold what-if"],
        live: true,
      },
    ],
  },
  {
    id: "project",
    number: "3",
    title: "Project level (one per policy action)",
    question: "What was delivered for this action, and what is still missing?",
    audience: "Ministry focal points, Secretariat reviewers",
    pages: [
      {
        title: "Policy actions",
        href: "/projects",
        ui: "UI-04",
        release: "R1",
        who: "Secretariat, focal points",
        purpose: "All 44 actions, filterable by cluster, ministry and status.",
        contains: ["Lead and joint ministries", "2025 % and status", "MTR progress"],
        live: true,
      },
      {
        title: "Action detail",
        href: "/projects/ACT-02",
        ui: "UI-04",
        release: "R1",
        who: "Focal point, reviewer",
        purpose: "One action: indicators, targets, 2025 values, MTR summary and Kobo questions.",
        contains: ["Indicators and targets", "MTR progress summary", "Kobo questions EN/ខ្មែរ"],
        live: true,
      },
      {
        title: "Indicator catalogue",
        href: "/indicators",
        ui: "UI-06",
        release: "R1",
        who: "Secretariat",
        purpose: "13 outcome and 108 action indicators with definitions and methods.",
        contains: ["Outcome vs action level", "Calculation method", "Filters"],
        live: true,
      },
    ],
  },
  {
    id: "cross",
    number: "4",
    title: "Collect, review and administer",
    question: "Are the numbers collected on time, checked and traceable?",
    audience: "MoC Secretariat, focal points, processors",
    pages: [
      {
        title: "Overview (annual cycle)",
        href: "/",
        ui: "UI-02",
        release: "R1",
        who: "Everyone",
        purpose: "Where we are in the reporting calendar, tasks, and the 2025 headline.",
        contains: ["Reporting calendar", "Reviews waiting", "Data-quality gaps"],
        live: true,
      },
      {
        title: "Data forms",
        href: "/forms",
        ui: "UI-07",
        release: "R1",
        who: "Secretariat",
        purpose: "CASHEW INDICATOR REPORT structure and the processor survey.",
        contains: ["17 ministry sections", "Fields per indicator", "Khmer labels"],
        live: true,
      },
      {
        title: "Ministry annual report form",
        href: "/collect/cashew-indicator-report",
        ui: "UI-08",
        release: "R1",
        who: "Ministry focal point",
        purpose: "Fill the annual report for one ministry: value, auto %, narrative, evidence.",
        contains: ["Ministry filter", "Live % and status", "EN / ខ្មែរ"],
        live: true,
      },
      {
        title: "Submissions and reviews",
        href: "/submissions",
        ui: "UI-09 / UI-10",
        release: "R1",
        who: "Secretariat reviewers",
        purpose: "One submission per ministry per year; verify, return or approve.",
        contains: ["Quality flags", "Verification checklist", "No self-approval"],
        live: true,
      },
      {
        title: "Administration",
        href: "/admin",
        ui: "UI-12",
        release: "R1",
        who: "Workspace administrator",
        purpose: "Roles, organisations, status thresholds, calendar and audit.",
        contains: ["Roles from the manual", "Thresholds by year", "Audit trail"],
        live: true,
      },
      {
        title: "Kobo import connector",
        href: "/sitemap#roadmap",
        release: "R2",
        who: "Workspace administrator",
        purpose: "Import Kobo submissions directly instead of pasting exports into Excel.",
        contains: ["Scheduled sync", "Field mapping", "Reconciliation"],
      },
      {
        title: "Brand and design tokens",
        href: "/brand",
        release: "R1",
        who: "Designers, developers",
        purpose: "Colour palette, type and status rules this site uses.",
        contains: ["GOV.UK 2025 palette", "Status colours", "Accessibility rules"],
        live: true,
      },
    ],
  },
];

// Desktop navigation order from spec section 10.1, adapted to the example.
export const primaryNav: { label: string; href: string; match: string[] }[] = [
  { label: "Overview", href: "/", match: ["/"] },
  { label: "Policy", href: "/policies/NCP-2022", match: ["/policies"] },
  { label: "Ministry programmes", href: "/programmes", match: ["/programmes"] },
  { label: "Policy actions", href: "/projects", match: ["/projects"] },
  { label: "Results framework", href: "/results", match: ["/results"] },
  { label: "Indicators", href: "/indicators", match: ["/indicators"] },
  { label: "Data forms", href: "/forms", match: ["/forms", "/collect"] },
  { label: "Submissions", href: "/submissions", match: ["/submissions"] },
  { label: "Reviews", href: "/reviews", match: ["/reviews"] },
  { label: "Dashboards and reports", href: "/reports", match: ["/reports"] },
  { label: "Administration", href: "/admin", match: ["/admin"] },
];

export const secondaryNav: { label: string; href: string; match: string[] }[] = [
  { label: "Sitemap", href: "/sitemap", match: ["/sitemap"] },
  { label: "Roles and access", href: "/roles", match: ["/roles"] },
  { label: "Brand guide", href: "/brand", match: ["/brand"] },
  { label: "Sign in", href: "/signin", match: ["/signin"] },
];
