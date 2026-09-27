"use client";

/*
  How this works: the Supabase client used in the browser. It keeps the session in cookies (not
  localStorage) so the server sees the same sign-in. `??=` creates the client once and then reuses it.
*/

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** One shared browser client; the session lives in cookies so the server sees it too. */
export function browserClient() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
