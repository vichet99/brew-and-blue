"use server";

/*
  How this works (Next.js Server Functions)
  -----------------------------------------
  "use server" (above) turns every exported async function in this file into a Server Function: the
  browser imports and calls it like a normal function, but Next.js sends the call to the server as a POST
  request and runs it there. That means:
    - the code and any secrets here never reach the browser;
    - we can read the user's session cookie (getLive → createClient in src/lib/supabase/server.ts);
    - every argument comes from the browser, so treat it as untrusted: the database re-checks everything.
  Pattern used by each function: check who is signed in → call a Postgres function with supabase.rpc()
  → on error return a readable message → revalidatePath() so pages show fresh data.
*/

// Server Functions for the reporting workflow. Each one acts as the signed-in
// user: the database checks the role, the ministry and the workflow rules and
// returns a readable error when something is not allowed.

import { revalidatePath } from "next/cache";
import { toAnswerColumns } from "@/lib/access";
import { actionIndicators } from "@/lib/cashew";
import { getLive } from "@/lib/live";

export interface Result {
  ok: boolean;
  error?: string;
  code?: string;
}

const REVIEW_CHECKS = ["reasonable", "consistent", "evidence", "assignment"];

function fail(message: string): Result {
  // Postgres messages from our functions are written for people; strip the prefix.
  return { ok: false, error: message.replace(/^.*?ERROR:\s*/, "") };
}

async function signedIn() {
  const live = await getLive();
  if (!live) return { live: null, error: fail("Your session has ended. Sign in again.") };
  if (!live.account) return { live: null, error: fail("You don't have access to this workspace.") };
  return { live, error: null };
}

export async function decideSubmission(
  code: string,
  revisionId: string,
  decision: "approved" | "returned" | "rejected",
  reason: string,
  checks: string[],
): Promise<Result> {
  const { live, error } = await signedIn();
  if (!live) return error!;
  const { error: e } = await live.supabase.rpc("decide_revision", {
    rev: revisionId,
    decision,
    reason: reason.trim() || null,
    checks: decision === "approved" ? REVIEW_CHECKS.filter((c) => checks.includes(c)) : null,
    indicator_codes: null,
  });
  if (e) return fail(e.message);
  revalidatePath("/reviews");
  revalidatePath("/submissions");
  revalidatePath(`/reviews/${code}`);
  return { ok: true };
}

export async function startReview(code: string, revisionId: string): Promise<Result> {
  const { live, error } = await signedIn();
  if (!live) return error!;
  const { error: e } = await live.supabase.rpc("start_review", { rev: revisionId });
  if (e) return fail(e.message);
  revalidatePath(`/reviews/${code}`);
  return { ok: true };
}

export interface DraftAnswer {
  id: string; // Indicator_xxx
  value: string;
  narrative: string;
  feedback: string;
}

/** Opens (or creates, or starts correcting) the ministry's report for the year. */
export async function openReport(ministry: string, year: number): Promise<Result> {
  const { live, error } = await signedIn();
  if (!live) return error!;
  const { error: e } = await live.supabase.rpc("open_submission", { ministry_code: ministry, report_year: year });
  if (e) return fail(e.message);
  revalidatePath("/collect/cashew-indicator-report");
  revalidatePath("/submissions");
  return { ok: true };
}

async function saveInto(live: NonNullable<Awaited<ReturnType<typeof getLive>>>, ministry: string, year: number, answers: DraftAnswer[]) {
  const { data: revisionId, error: e1 } = await live.supabase.rpc("open_submission", { ministry_code: ministry, report_year: year });
  if (e1) return { error: e1.message, revisionId: null };

  const own = actionIndicators.filter((i) => i.ministry === ministry);
  const { data: rows, error: e2 } = await live.supabase
    .from("indicators")
    .select("id, external_id, active_version_id, workspace_id")
    .in("external_id", own.map((i) => i.id));
  if (e2) return { error: e2.message, revisionId: null };

  const byExternal = new Map((rows ?? []).map((r) => [r.external_id as string, r]));
  const payload = answers
    .filter((a) => own.some((i) => i.id === a.id))
    .map((a) => {
      const meta = own.find((i) => i.id === a.id)!;
      const row = byExternal.get(a.id);
      if (!row) throw new Error(`${a.id} is not set up in the database`);
      return {
        workspace_id: row.workspace_id,
        revision_id: revisionId,
        indicator_id: row.id,
        indicator_version_id: row.active_version_id,
        ...toAnswerColumns(meta.method, a.value),
        narrative: a.narrative.trim() || null,
        challenges: a.feedback.trim() || null,
      };
    });
  if (payload.length) {
    const { error: e3 } = await live.supabase.from("answers").upsert(payload, { onConflict: "revision_id,indicator_id" });
    if (e3) return { error: e3.message, revisionId: null };
  }
  return { error: null, revisionId: revisionId as string };
}

export async function saveReport(ministry: string, year: number, answers: DraftAnswer[]): Promise<Result> {
  const { live, error } = await signedIn();
  if (!live) return error!;
  const saved = await saveInto(live, ministry, year, answers);
  if (saved.error) return fail(saved.error);
  revalidatePath("/submissions");
  return { ok: true };
}

export async function submitReport(ministry: string, year: number, answers: DraftAnswer[]): Promise<Result> {
  const { live, error } = await signedIn();
  if (!live) return error!;
  const saved = await saveInto(live, ministry, year, answers);
  if (saved.error || !saved.revisionId) return fail(saved.error ?? "Could not save the report.");
  const { error: e } = await live.supabase.rpc("submit_revision", { rev: saved.revisionId });
  if (e) return fail(e.message);
  const { data } = await live.supabase.from("submission_overview").select("code, revision_no").eq("revision_id", saved.revisionId).maybeSingle();
  revalidatePath("/submissions");
  revalidatePath("/reviews");
  return { ok: true, code: data ? `${data.code} r${data.revision_no}` : undefined };
}
