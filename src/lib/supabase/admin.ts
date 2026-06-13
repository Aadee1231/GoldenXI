import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client using the service role key.
 * Bypasses ALL Row Level Security — use ONLY in server-side code
 * (Server Actions, Server Components, API routes).
 * NEVER import this in client components or expose the key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase admin credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in environment variables."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
