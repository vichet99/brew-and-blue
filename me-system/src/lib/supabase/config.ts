// Supabase connection settings. Both values are public by design (the key is the
// publishable key; row-level security in the database decides what a user sees).
// Without them the site runs as the demo with simulated roles.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const liveEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);
