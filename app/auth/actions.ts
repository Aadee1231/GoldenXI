"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { ensureProfile } from "@/src/lib/supabase/queries/profiles";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return redirect(`/auth?error=${encodeURIComponent(error.message)}&tab=signup`);
  }

  return redirect("/auth?message=Check+your+email+to+confirm+your+account&tab=signup");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect(`/auth?error=${encodeURIComponent(error.message)}&tab=login`);
  }

  // Ensure profile exists for this user
  await ensureProfile();

  return redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
}
