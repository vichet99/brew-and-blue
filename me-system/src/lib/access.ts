// Turns the database's view of the signed-in person (my_access rows) into what the
// interface needs. Pure functions, shared by server pages and the browser.

import type { RoleId } from "./roles.ts";

export interface AccessRow {
  user_id: string;
  full_name: string;
  email: string;
  workspace_id: string;
  workspace_name: string;
  ministry_code: string;
  ministry_short: string;
  role: RoleId | null;
  scope_ministry_code: string | null;
}

export interface Account {
  userId: string;
  name: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  roles: RoleId[];
  /** The role the interface uses: the broadest one held. */
  role: RoleId | null;
  /** The ministry a focal point reports for (otherwise the person's own ministry). */
  ministry: string;
  ministryShort: string;
}

const ORDER: RoleId[] = ["admin", "reviewer", "focal", "viewer"];

export function buildAccount(rows: AccessRow[]): Account | null {
  if (!rows.length) return null;
  const first = rows[0];
  const roles = ORDER.filter((r) => rows.some((x) => x.role === r));
  const focal = rows.find((x) => x.role === "focal" && x.scope_ministry_code);
  return {
    userId: first.user_id,
    name: first.full_name,
    email: first.email,
    workspaceId: first.workspace_id,
    workspaceName: first.workspace_name,
    roles,
    role: roles[0] ?? null,
    ministry: focal?.scope_ministry_code ?? first.ministry_code,
    ministryShort: first.ministry_short,
  };
}

/** Database workflow states as the interface labels them. */
export const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  returned: "Returned",
  approved: "Approved",
  rejected: "Rejected",
  superseded: "Superseded",
};

export function stateLabel(state: string | null | undefined) {
  return state ? STATE_LABEL[state] ?? state : "—";
}

/** Form value to database answer columns, by the indicator's calculation method. */
export function toAnswerColumns(method: string, raw: string): { value_number: number | null; value_choice: string | null } {
  const v = raw.trim();
  if (!v) return { value_number: null, value_choice: null };
  if (method === "milestone") return { value_number: null, value_choice: v };
  const n = Number(v);
  return { value_number: Number.isFinite(n) ? n : null, value_choice: null };
}
