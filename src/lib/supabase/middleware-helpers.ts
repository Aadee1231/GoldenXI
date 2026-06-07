"use server";

import { createClient } from "@/src/lib/supabase/server";

/**
 * Check if the current user needs to complete profile setup
 * Returns the redirect path if needed, or null if profile is complete
 */
export async function checkProfileSetup(
  currentPath: string
): Promise<string | null> {
  // Don't redirect on these paths to avoid loops
  const allowedPaths = [
    "/",
    "/auth",
    "/profile/setup",
    "/profile",
  ];

  if (allowedPaths.some((path) => currentPath.startsWith(path))) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!profile?.username) {
    return "/profile/setup";
  }

  return null;
}
