// Pilot roles for the Cashew workspace (owner decision, 26 Sep 2026):
// four roles; the Administrator is also the M&E manager and may review;
// the Committee (Viewer) sees policy totals and each ministry's detail,
// approved figures only. Pure module: no data imports, safe in client code.
//
// PROTOTYPE: these rules drive what the interface shows. Real enforcement
// belongs on the server and in the database (milestone M2).

export type RoleId = "admin" | "reviewer" | "focal" | "viewer";

export type Permission =
  | "manage_setup" // policies, actions, indicators, targets, thresholds, forms
  | "manage_users"
  | "open_close_cycle"
  | "publish_reports"
  | "review" // verify, return, approve, reject submissions
  | "submit_report" // fill the annual ministry report
  | "view_all_submissions"
  | "view_own_submissions"
  | "view_drafts"
  | "view_evidence"
  | "view_dashboards" // approved figures, policy totals and ministry detail
  | "view_forms";

export interface Role {
  id: RoleId;
  name: string;
  who: string;
  summary: string;
  scope: string;
  permissions: Permission[];
  cannot: string[];
}

export const ROLES: Role[] = [
  {
    id: "admin",
    name: "Administrator (M&E manager)",
    who: "MoC M&E Secretariat lead",
    summary: "Sets up the policy, actions, indicators, targets and forms; manages users; runs the reporting cycle; publishes reports. May also review.",
    scope: "Whole workspace",
    permissions: [
      "manage_setup",
      "manage_users",
      "open_close_cycle",
      "publish_reports",
      "review",
      "submit_report",
      "view_all_submissions",
      "view_own_submissions",
      "view_drafts",
      "view_evidence",
      "view_dashboards",
      "view_forms",
    ],
    cannot: ["Approve a submission they entered themselves"],
  },
  {
    id: "reviewer",
    name: "Reviewer",
    who: "MoC Secretariat officers",
    summary: "Verifies ministry submissions: sends queries, approves or rejects, resolves data-quality flags.",
    scope: "Assigned ministries (pilot: all)",
    permissions: ["review", "view_all_submissions", "view_own_submissions", "view_drafts", "view_evidence", "view_dashboards", "view_forms"],
    cannot: ["Change a ministry's reported values", "Approve their own entries", "Change setup, users or published reports"],
  },
  {
    id: "focal",
    name: "Ministry focal point",
    who: "One named officer per ministry (17)",
    summary: "Fills and submits the ministry's annual report with evidence, answers queries, sees the ministry's results.",
    scope: "Own ministry only",
    permissions: ["submit_report", "view_own_submissions", "view_dashboards", "view_forms"],
    cannot: ["See other ministries' drafts or submissions", "Approve anything", "Change targets or indicators"],
  },
  {
    id: "viewer",
    name: "Viewer (Committee)",
    who: "Inter-Ministerial Committee members, ministry leadership",
    summary: "Reads approved dashboards and published reports: policy-level totals and each ministry's detail.",
    scope: "Whole policy, approved figures only",
    permissions: ["view_dashboards"],
    cannot: ["See drafts, raw submissions or evidence files", "Enter or approve data"],
  },
];

export const getRole = (id: RoleId) => ROLES.find((r) => r.id === id)!;

export function can(role: RoleId, permission: Permission): boolean {
  return getRole(role).permissions.includes(permission);
}

/**
 * What a page needs, by path. The first match wins; unlisted paths are open to everyone.
 * A prefix ending in "/" matches only sub-pages ("/reviews/" = one review, "/reviews" = the queue).
 */
const PAGE_RULES: { prefix: string; any: Permission[] }[] = [
  { prefix: "/admin", any: ["manage_users"] },
  { prefix: "/forms/processor-survey", any: ["manage_setup"] },
  { prefix: "/forms", any: ["view_forms"] },
  { prefix: "/collect/processor-survey", any: ["manage_setup"] },
  { prefix: "/collect", any: ["submit_report"] },
  { prefix: "/submissions", any: ["view_all_submissions", "view_own_submissions"] },
  { prefix: "/reviews/", any: ["view_all_submissions", "view_own_submissions"] },
  { prefix: "/reviews", any: ["review"] },
];

export function canOpen(role: RoleId, path: string): boolean {
  const matches = (prefix: string) => (prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix || path.startsWith(prefix + "/"));
  const rule = PAGE_RULES.find((r) => matches(r.prefix));
  return !rule || rule.any.some((p) => can(role, p));
}

/** Whether a role may see one ministry's submission. */
export function canSeeSubmission(role: RoleId, myMinistry: string | null, submissionMinistry: string): boolean {
  if (can(role, "view_all_submissions")) return true;
  return can(role, "view_own_submissions") && myMinistry === submissionMinistry;
}

/** Whether a role may decide on a submission; nobody approves their own entry. */
export function canDecide(role: RoleId, enteredByMe: boolean): { ok: boolean; reason?: string } {
  if (!can(role, "review")) return { ok: false, reason: `${getRole(role).name} cannot review submissions.` };
  if (enteredByMe) return { ok: false, reason: "You entered this submission, so another reviewer must decide." };
  return { ok: true };
}
