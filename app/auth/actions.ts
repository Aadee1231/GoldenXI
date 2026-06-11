"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { ensureProfile } from "@/src/lib/supabase/queries/profiles";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;
  const destination = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/bracket";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    const errorUrl = redirectTo
      ? `/auth?error=${encodeURIComponent(error.message)}&tab=signup&redirect=${encodeURIComponent(redirectTo)}`
      : `/auth?error=${encodeURIComponent(error.message)}&tab=signup`;
    return redirect(errorUrl);
  }

  if (data.session) {
    await ensureProfile();
    return redirect(destination);
  }

  // Fallback: email confirmation may still be on for this account — try signing in
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!loginError && loginData.session) {
    await ensureProfile();
    return redirect(destination);
  }

  return redirect(
    `/auth?error=${encodeURIComponent("Account created but automatic sign-in failed. Please log in.")}&tab=login`
  );
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
