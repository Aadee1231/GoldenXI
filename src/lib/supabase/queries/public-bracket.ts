"use server";

import { createClient } from "../server";
import type { PublicBracketData } from "@/src/types";

export async function getPublicBracket(
  username: string,
  tournamentId: string
): Promise<{ bracket: PublicBracketData | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_bracket", {
    username_param: username,
    tournament_id_param: tournamentId,
  });

  if (error) {
    console.error("Error fetching public bracket:", error);
    return { bracket: null, error: error.message };
  }

  if (!data || data.length === 0) {
    return { bracket: null, error: null };
  }

  return { bracket: data[0] as PublicBracketData, error: null };
}

export async function updatePublicBracketSetting(
  enabled: boolean
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ public_bracket: enabled })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating public bracket setting:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function getCurrentUserProfile(): Promise<{
  profile: { username: string | null; public_bracket: boolean } | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("username, public_bracket")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return { profile: null, error: error.message };
  }

  return { profile: data, error: null };
}
