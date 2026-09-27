/*
  How this works (server-side data access)
  ----------------------------------------
  Only imported by Server Components and Server Functions. createClient() builds a Supabase client that
  carries the signed-in user's session cookie, so every query below runs AS THAT USER and Postgres
  row-level security filters the results. supabase.from("view").select("*") is turned into SQL by
  Supabase's API (PostgREST); .eq("code", x) adds a WHERE clause; .maybeSingle() returns one row or null.
*/

// Server-side access to the live database for pages that can show real data.
// Returns null when Supabase is not configured or nobody is signed in, so the
// page falls back to the demo data.

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAccount, type AccessRow, type Account } from "./access";
import { liveEnabled } from "./supabase/config";
import { createClient } from "./supabase/server";

export interface Live {
  supabase: SupabaseClient;
  account: Account | null; // null: signed in but no workspace access
}

export async function getLive(): Promise<Live | null> {
  if (!liveEnabled) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: rows, error } = await supabase.from("my_access").select("*");
  if (error) throw new Error(`Could not read your access: ${error.message}`);
  return { supabase, account: buildAccount((rows ?? []) as AccessRow[]) };
}

export interface SubmissionOverview {
  submission_id: string;
  code: string;
  year: number;
  ministry_code: string;
  ministry_short: string;
  state: string;
  is_illustrative: boolean;
  revision_id: string | null;
  revision_no: number | null;
  revision_state: string | null;
  submitted_at: string | null;
  entered_by_me: boolean;
  assigned: number;
  reported: number;
  evidence: number;
  blocking: number;
  warnings: number;
}

export interface RevisionAnswer {
  revision_id: string;
  indicator_code: string;
  external_id: string | null;
  value_number: number | null;
  value_choice: string | null;
  pct_of_target: number | null;
  narrative: string | null;
  challenges: string | null;
  evidence: string | null;
}

export async function listSubmissions(live: Live): Promise<SubmissionOverview[]> {
  const { data, error } = await live.supabase.from("submission_overview").select("*").order("year", { ascending: false }).order("code");
  if (error) throw new Error(`Could not load submissions: ${error.message}`);
  return (data ?? []) as SubmissionOverview[];
}

export async function getSubmission(live: Live, code: string): Promise<SubmissionOverview | null> {
  const { data, error } = await live.supabase.from("submission_overview").select("*").eq("code", code).maybeSingle();
  if (error) throw new Error(`Could not load ${code}: ${error.message}`);
  return (data as SubmissionOverview) ?? null;
}

export async function getAnswers(live: Live, revisionId: string): Promise<RevisionAnswer[]> {
  const { data, error } = await live.supabase.from("revision_answers").select("*").eq("revision_id", revisionId);
  if (error) throw new Error(`Could not load answers: ${error.message}`);
  return (data ?? []) as RevisionAnswer[];
}

/** YYYY-MM-DD in Phnom Penh time, for display next to demo dates. */
export function localDate(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}
