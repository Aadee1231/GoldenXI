import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

/**
 * Auth callback handler for Supabase email confirmation / magic links.
 *
 * Supabase redirects here (via the `emailRedirectTo` set at sign-up time) with a
 * `code` (PKCE) or `token_hash` + `type` (older email links). We exchange it for
 * a session, then send the user somewhere useful:
 *   - /profile/setup when the profile is incomplete (no username)
 *   - the original `next` destination (or /bracket) when the profile is complete
 *
 * The redirect base is derived from the incoming request origin so confirmed
 * users always land on the same domain they clicked from (production, preview or
 * local) and never get a 404 on `/#?code=...`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || searchParams.get("redirect");

  const safeNext = next && next.startsWith("/") ? next : null;

  const supabase = await createClient();

  let authError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) authError = error.message;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
      token_hash: tokenHash,
    });
    if (error) authError = error.message;
  } else {
    authError = "Missing confirmation code";
  }

  if (authError) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(authError)}`
    );
  }

  // Determine where to send the confirmed user.
  let destination = safeNext || "/bracket";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (!profile?.username) {
      destination = "/profile/setup";
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
