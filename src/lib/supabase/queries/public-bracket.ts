"use server";

import { createClient } from "../server";
import type { PublicBracketData, GroupRankingInput, Match, Team } from "@/src/types";
import { reconstructKnockoutBracket } from "@/src/lib/world-cup-2026/reconstruct-bracket";
import type { ReconstructedRound } from "@/src/lib/world-cup-2026/reconstruct-bracket";
import type { TeamsDataByGroup } from "@/src/lib/world-cup-2026/bracket-resolver";

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

/**
 * Reconstruct the full knockout bracket for a public user. Requires the
 * optional `get_public_bracket_picks` RPC (see supabase/step9-public-bracket-picks.sql).
 * Returns null (and the page falls back to the summary view) if the RPC is not
 * installed or the bracket can't be reconstructed.
 */
export async function getPublicBracketRounds(
  username: string,
  tournamentId: string
): Promise<ReconstructedRound[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_bracket_picks", {
    username_param: username,
    tournament_id_param: tournamentId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0] as {
    group_rankings: GroupRankingInput[] | null;
    third_place_picks: string[] | null;
    knockout_picks: Record<string, string | null> | null;
  };

  const groupRankings = row.group_rankings || [];
  const thirdPlacePicks = row.third_place_picks || [];
  const knockoutPicks = row.knockout_picks || {};

  if (groupRankings.length === 0 || thirdPlacePicks.length !== 8) {
    return null;
  }

  // Teams grouped by group label (public-readable).
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId)
    .not("group_label", "is", null);

  if (!teams) return null;

  const teamsData: TeamsDataByGroup = {};
  (teams as Team[]).forEach((t) => {
    if (!t.group_label) return;
    if (!teamsData[t.group_label]) teamsData[t.group_label] = [];
    teamsData[t.group_label].push(t);
  });

  // Knockout matches (public-readable), ordered the same way the wizard reads them.
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .in("round", ["r32", "r16", "qf", "sf", "final"])
    .order("round", { ascending: true })
    .order("match_date", { ascending: true });

  if (!matches) return null;

  return reconstructKnockoutBracket(
    groupRankings,
    thirdPlacePicks,
    knockoutPicks,
    teamsData,
    matches as Match[]
  );
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
