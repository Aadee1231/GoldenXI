import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

/**
 * Server-side admin guard.
 *
 * Protected by the ADMIN_EMAILS environment variable (server-only, no NEXT_PUBLIC_ prefix).
 * Format: comma-separated list of lowercase email addresses.
 * Example Vercel env var:  ADMIN_EMAILS=you@example.com,other@example.com
 *
 * Any request that does not come from a signed-in user whose email is in that
 * list is redirected away before the page ever renders — no client-side tricks
 * can bypass this guard.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const rawEmails = process.env.ADMIN_EMAILS ?? "";
  const allowedEmails = rawEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length === 0 || !allowedEmails.includes((user.email ?? "").toLowerCase())) {
    redirect("/");
  }

  return <>{children}</>;
}
