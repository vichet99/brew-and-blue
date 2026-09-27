import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { liveEnabled, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Refreshes the Supabase session cookie before pages render. It does not decide
// access: the database's row-level security does that on every query.
//
// How this works: Next.js runs proxy() before every request that matches `config.matcher` (all pages,
// not images or build files). Sign-in sessions expire after about an hour; getClaims() checks the
// session and, if needed, gets a fresh one from Supabase. setAll() then copies the new cookies onto
// both the request (so this render sees them) and the response (so the browser stores them).
// Visitors without a Supabase cookie ("sb-…") skip all of this, so the demo stays fast.
export async function proxy(request: NextRequest) {
  if (!liveEnabled || !request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list, headers) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};
