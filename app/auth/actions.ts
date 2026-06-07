"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { ensureProfile } from "@/src/lib/supabase/queries/profiles";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    const errorUrl = redirectTo
      ? `/auth?error=${encodeURIComponent(error.message)}&tab=signup&redirect=${encodeURIComponent(redirectTo)}`
      : `/auth?error=${encodeURIComponent(error.message)}&tab=signup`;
    return redirect(errorUrl);
  }

  const messageUrl = redirectTo
    ? `/auth?message=Check+your+email+to+confirm+your+account&tab=signup&redirect=${encodeURIComponent(redirectTo)}`
    : "/auth?message=Check+your+email+to+confirm+your+account&tab=signup";
  return redirect(messageUrl);
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const errorUrl = redirectTo
      ? `/auth?error=${encodeURIComponent(error.message)}&tab=login&redirect=${encodeURIComponent(redirectTo)}`
      : `/auth?error=${encodeURIComponent(error.message)}&tab=login`;
    return redirect(errorUrl);
  }

  // Ensure profile exists for this user
  await ensureProfile();

  return redirect(redirectTo || "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
}
