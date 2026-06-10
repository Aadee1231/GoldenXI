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
 * Reconstruct the full knockout bracket for a public user. First tries the
 * optional `get_public_bracket_picks` RPC (see supabase/step9-public-bracket-picks.sql).
 * If the RPC is not available, falls back to direct queries. Returns null if
 * the bracket can't be reconstructed.
 */
export async function getPublicBracketRounds(
  username: string,
  tournamentId: string
): Promise<ReconstructedRound[] | null> {
  const supabase = await createClient();

  let groupRankings: GroupRankingInput[] = [];
  let thirdPlacePicks: string[] = [];
  let knockoutPicks: Record<string, string | null> = {};

  // Try RPC first (more efficient)
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_public_bracket_picks", {
    username_param: username,
    tournament_id_param: tournamentId,
  });

  if (!rpcError && rpcData && rpcData.length > 0) {
    const row = rpcData[0] as {
      group_rankings: GroupRankingInput[] | null;
      third_place_picks: string[] | null;
      knockout_picks: Record<string, string | null> | null;
    };
    groupRankings = row.group_rankings || [];
    thirdPlacePicks = row.third_place_picks || [];
    knockoutPicks = row.knockout_picks || {};
  } else {
    // Fallback: fetch data directly without RPC
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, public_bracket")
      .eq("username", username)
      .single();

    if (!profile || !profile.public_bracket) {
      return null;
    }

    const { data: bracket } = await supabase
      .from("brackets")
      .select("id")
      .eq("user_id", profile.id)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!bracket) {
      return null;
    }

    const [groupResult, thirdResult, knockoutResult] = await Promise.all([
      supabase
        .from("group_picks")
        .select("group_label, team_id, position")
        .eq("bracket_id", bracket.id),
      supabase
        .from("third_place_picks")
        .select("team_id")
        .eq("bracket_id", bracket.id),
      supabase
        .from("bracket_picks")
        .select("match_id, picked_team_id")
        .eq("bracket_id", bracket.id),
    ]);

    groupRankings = (groupResult.data || []).map((p: any) => ({
      group_label: p.group_label,
      team_id: p.team_id,
      position: p.position,
    }));
    thirdPlacePicks = (thirdResult.data || []).map((p: any) => p.team_id);
    knockoutPicks = (knockoutResult.data || []).reduce((acc: Record<string, string | null>, p: any) => {
      acc[p.match_id] = p.picked_team_id;
      return acc;
    }, {});
  }

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
