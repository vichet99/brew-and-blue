/*
  How this works: the Supabase client used on the server. Next.js gives server code the request's cookies
  through cookies() (async in Next 16). @supabase/ssr reads the session from them (getAll) and may write a
  refreshed session back (setAll). Server Components can't set cookies, hence the try/catch; the proxy
  (src/proxy.ts) takes care of refreshing on the next request.
*/

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

/** Supabase client for Server Components and Server Functions, acting as the signed-in user. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only; the proxy refreshes the session.
        }
      },
    },
  });
}
