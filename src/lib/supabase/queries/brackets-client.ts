import { createClient } from "../client";
import type { Bracket, BracketPick, CompleteBracketData, Match } from "@/src/types";
import { getGroupRankings } from "./group-picks-client";
import { getThirdPlacePicks } from "./third-place-picks-client";

export type BracketPickInput = {
  match_id: string;
  picked_team_id: string;
  round: "r16" | "qf" | "sf" | "final";
};

export type SaveBracketResult = {
  success: boolean;
  bracket?: Bracket;
  picks?: BracketPick[];
  error?: string;
};

/**
 * Get the active tournament ID from the database (client-side)
 */
async function getActiveTournamentId(): Promise<{ id: string | null; error: string | null }> {
  const supabase = createClient();

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return { id: null, error: error.message };
  }

  if (!tournaments || tournaments.length === 0) {
    return { id: null, error: "No active tournament found. Please create a tournament first." };
  }

  return { id: tournaments[0].id, error: null };
}

/**
 * Get or create a bracket for the current user (client-side)
 */
async function getOrCreateBracket(
  bracketName: string = "My Bracket"
): Promise<{ bracket: Bracket | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { bracket: null, error: "You must be logged in" };
  }

  const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
  if (tournamentError || !tournamentId) {
    return { bracket: null, error: tournamentError || "No active tournament found" };
  }

  const { data: existingBrackets, error: fetchError } = await supabase
    .from("brackets")
    .select("*")
    .eq("user_id", user.id)
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return { bracket: null, error: fetchError.message };
  }

  if (existingBrackets && existingBrackets.length > 0) {
    return { bracket: existingBrackets[0] as Bracket, error: null };
  }

  // Bracket submissions are closed — no new brackets can be created
  return { bracket: null, error: "Bracket submissions are closed." };
}

/**
 * Get existing bracket with picks for the current user (client-side)
 */
export async function getUserBracket(): Promise<{
  bracket: Bracket | null;
  picks: BracketPick[];
  error: string | null;
}> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { bracket: null, picks: [], error: "You must be logged in" };
  }

  const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
  if (tournamentError || !tournamentId) {
    return { bracket: null, picks: [], error: tournamentError || "No active tournament found" };
  }

  const { data: brackets, error: bracketError } = await supabase
    .from("brackets")
    .select("*")
    .eq("user_id", user.id)
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  if (bracketError) {
    return { bracket: null, picks: [], error: bracketError.message };
  }

  if (!brackets || brackets.length === 0) {
    return { bracket: null, picks: [], error: null };
  }

  const bracket = brackets[0] as Bracket;

  const { data: picks, error: picksError } = await supabase
    .from("bracket_picks")
    .select("*")
    .eq("bracket_id", bracket.id);

  if (picksError) {
    return { bracket, picks: [], error: picksError.message };
  }

  return { bracket, picks: picks || [], error: null };
}

/**
 * Save bracket picks (client-side)
 */
export async function saveBracket(
  picks: BracketPickInput[],
  bracketName: string = "My Bracket"
): Promise<SaveBracketResult> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const { bracket, error: bracketError } = await getOrCreateBracket(bracketName);
  if (bracketError || !bracket) {
    return { success: false, error: bracketError || "Failed to get or create bracket" };
  }

  if (bracket.status === "submitted" || bracket.is_locked) {
    return { success: false, error: "Cannot modify a submitted bracket" };
  }

  const { error: deleteError } = await supabase
    .from("bracket_picks")
    .delete()
    .eq("bracket_id", bracket.id);

  if (deleteError) {
    console.error("Error deleting old picks:", deleteError);
  }

  if (picks.length > 0) {
    const picksToInsert = picks.map((pick) => ({
      bracket_id: bracket.id,
      match_id: pick.match_id,
      picked_team_id: pick.picked_team_id,
      is_correct: null,
      points_awarded: null,
    }));

    console.log("💾 Saving picks with match UUIDs:", picksToInsert.map(p => ({
      match_id: p.match_id,
      picked_team_id: p.picked_team_id
    })));

    const { data: savedPicks, error: picksError } = await supabase
      .from("bracket_picks")
      .insert(picksToInsert)
      .select();

    if (picksError) {
      return { success: false, error: `Failed to save picks: ${picksError.message}` };
    }

    console.log("✅ Saved bracket:", bracket);
    console.log("✅ Saved picks:", savedPicks);

    return {
      success: true,
      bracket,
      picks: savedPicks as BracketPick[],
    };
  }

  console.log("✅ Saved bracket (no picks):", bracket);

  return {
    success: true,
    bracket,
    picks: [],
  };
}

/**
 * Submit bracket (client-side)
 */
export async function submitBracket(
  picks: BracketPickInput[],
  bracketName: string = "My Bracket"
): Promise<SaveBracketResult> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const { bracket, error: bracketError } = await getOrCreateBracket(bracketName);
  if (bracketError || !bracket) {
    return { success: false, error: bracketError || "Failed to get or create bracket" };
  }

  if (bracket.status === "submitted") {
    return { success: false, error: "Bracket already submitted" };
  }

  const { error: deleteError } = await supabase
    .from("bracket_picks")
    .delete()
    .eq("bracket_id", bracket.id);

  if (deleteError) {
    console.error("Error deleting old picks:", deleteError);
  }

  let savedPicks: BracketPick[] = [];

  if (picks.length > 0) {
    const picksToInsert = picks.map((pick) => ({
      bracket_id: bracket.id,
      match_id: pick.match_id,
      picked_team_id: pick.picked_team_id,
      is_correct: null,
      points_awarded: null,
    }));

    console.log("🚀 Submitting picks with match UUIDs:", picksToInsert.map(p => ({
      match_id: p.match_id,
      picked_team_id: p.picked_team_id
    })));

    const { data: insertedPicks, error: picksError } = await supabase
      .from("bracket_picks")
      .insert(picksToInsert)
      .select();

    if (picksError) {
      return { success: false, error: `Failed to save picks: ${picksError.message}` };
    }

    savedPicks = insertedPicks as BracketPick[];
  }

  const updateData: Record<string, unknown> = {
    status: "submitted",
    is_locked: true,
  };

  try {
    const { data: updatedBracket, error: updateError } = await supabase
      .from("brackets")
      .update(updateData)
      .eq("id", bracket.id)
      .select()
      .single();

    if (updateError) {
      const { data: retryBracket, error: retryError } = await supabase
        .from("brackets")
        .update({ status: "submitted" })
        .eq("id", bracket.id)
        .select()
        .single();

      if (retryError) {
        return { success: false, error: `Failed to submit bracket: ${retryError.message}` };
      }

      console.log("✅ Submitted bracket:", retryBracket);
      console.log("✅ Saved picks:", savedPicks);

      return {
        success: true,
        bracket: retryBracket as Bracket,
        picks: savedPicks,
      };
    }

    console.log("✅ Submitted bracket:", updatedBracket);
    console.log("✅ Saved picks:", savedPicks);

    return {
      success: true,
      bracket: updatedBracket as Bracket,
      picks: savedPicks,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to submit: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Lock a bracket (client-side)
 */
export async function lockBracket(
  bracketId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .select("*")
    .eq("id", bracketId)
    .eq("user_id", user.id)
    .single();

  if (bracketError || !bracket) {
    return { success: false, error: "Bracket not found" };
  }

  if (bracket.locked_at) {
    return { success: false, error: "Bracket is already locked" };
  }

  const validation = await validateBracketComplete(bracketId);

  const isLegacyBracket = validation.counts.knockoutPicks >= 15 && 
                          validation.counts.groupPicks === 0 && 
                          validation.counts.thirdPlacePicks === 0;

  const isNewFormatBracket = validation.counts.groupPicks === 48 && 
                             validation.counts.thirdPlacePicks === 8 && 
                             validation.counts.knockoutPicks === 31;

  if (!isLegacyBracket && !isNewFormatBracket) {
    const errorMessages = [
      "Cannot lock incomplete bracket.",
      `Current picks: ${validation.counts.groupPicks} group rankings, ${validation.counts.thirdPlacePicks} third-place selections, ${validation.counts.knockoutPicks} knockout picks.`,
      "",
      "World Cup 2026 format requires:",
      "• 48 group rankings (12 groups × 4 positions)",
      "• 8 third-place team selections",
      "• 31 knockout match picks (R32 + R16 + QF + SF + Final)",
      "Total: 87 picks",
    ];

    if (validation.errors.length > 0) {
      errorMessages.push("");
      errorMessages.push("Specific issues:");
      validation.errors.forEach((err) => errorMessages.push(`• ${err}`));
    }

    return { success: false, error: errorMessages.join("\n") };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("brackets")
    .update({
      locked_at: now,
      is_locked: true,
      status: "submitted",
      submitted_at: bracket.submitted_at || now,
    })
    .eq("id", bracketId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Unlock a bracket (client-side)
 */
export async function unlockBracket(
  bracketId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .select("tournament_id, user_id, locked_at")
    .eq("id", bracketId)
    .eq("user_id", user.id)
    .single();

  if (bracketError || !bracket) {
    return { success: false, error: "Bracket not found" };
  }

  if (!bracket.locked_at) {
    return { success: false, error: "Bracket is not locked" };
  }

  const { data: hasStarted, error: tournamentError } = await supabase
    .rpc("has_tournament_started", { tournament_id_param: bracket.tournament_id });

  if (tournamentError) {
    return { success: false, error: "Failed to check tournament status" };
  }

  if (hasStarted) {
    return { success: false, error: "Cannot unlock bracket after tournament has started" };
  }

  const { error: updateError } = await supabase
    .from("brackets")
    .update({
      locked_at: null,
      is_locked: false,
    })
    .eq("id", bracketId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Check if a bracket can be unlocked (client-side)
 */
export async function canUnlockBracket(
  bracketId: string
): Promise<{ canUnlock: boolean; reason?: string }> {
  const supabase = createClient();

  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .select("tournament_id, locked_at")
    .eq("id", bracketId)
    .single();

  if (bracketError || !bracket) {
    return { canUnlock: false, reason: "Bracket not found" };
  }

  if (!bracket.locked_at) {
    return { canUnlock: false, reason: "Bracket is not locked" };
  }

  const { data: hasStarted, error: tournamentError } = await supabase
    .rpc("has_tournament_started", { tournament_id_param: bracket.tournament_id });

  if (tournamentError) {
    return { canUnlock: false, reason: "Failed to check tournament status" };
  }

  if (hasStarted) {
    return { canUnlock: false, reason: "Tournament has started" };
  }

  return { canUnlock: true };
}

export async function getKnockoutMatches(tournamentId?: string): Promise<{
  data: Match[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  let tid = tournamentId;
  if (!tid) {
    const { id, error } = await getActiveTournamentId();
    if (error || !id) {
      return { data: null, error: error || "No active tournament found" };
    }
    tid = id;
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tid)
    .in("round", ["r32", "r16", "qf", "sf", "final"])
    .order("round", { ascending: true })
    .order("match_date", { ascending: true });

  if (matchesError) {
    return { data: null, error: matchesError.message };
  }

  return { data: (matches || []) as Match[], error: null };
}

export async function getAllBracketDataForUser(bracketId?: string): Promise<{
  data: CompleteBracketData | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: "You must be logged in" };
  }

  let bid = bracketId;
  if (!bid) {
    const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
    if (tournamentError || !tournamentId) {
      return { data: null, error: tournamentError || "No active tournament found" };
    }

    const { data: brackets, error: bracketError } = await supabase
      .from("brackets")
      .select("*")
      .eq("user_id", user.id)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (bracketError) {
      return { data: null, error: bracketError.message };
    }

    if (!brackets || brackets.length === 0) {
      return { data: null, error: "No bracket found for this tournament" };
    }

    bid = brackets[0].id;
  }

  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .select("*")
    .eq("id", bid)
    .eq("user_id", user.id)
    .single();

  if (bracketError || !bracket) {
    return { data: null, error: "Bracket not found" };
  }

  const finalBracketId = bracket.id;

  const [groupPicksResult, thirdPlacePicksResult, knockoutPicksResult] = await Promise.all([
    getGroupRankings(finalBracketId),
    getThirdPlacePicks(finalBracketId),
    supabase.from("bracket_picks").select("*").eq("bracket_id", finalBracketId),
  ]);

  if (groupPicksResult.error) {
    return { data: null, error: `Failed to load group picks: ${groupPicksResult.error}` };
  }

  if (thirdPlacePicksResult.error) {
    return { data: null, error: `Failed to load third-place picks: ${thirdPlacePicksResult.error}` };
  }

  if (knockoutPicksResult.error) {
    return { data: null, error: `Failed to load knockout picks: ${knockoutPicksResult.error.message}` };
  }

  return {
    data: {
      bracket: bracket as Bracket,
      groupPicks: groupPicksResult.data || [],
      thirdPlacePicks: thirdPlacePicksResult.data || [],
      knockoutPicks: (knockoutPicksResult.data || []) as BracketPick[],
    },
    error: null,
  };
}

export async function validateBracketComplete(bracketId: string): Promise<{
  valid: boolean;
  errors: string[];
  counts: {
    groupPicks: number;
    thirdPlacePicks: number;
    knockoutPicks: number;
    total: number;
  };
}> {
  const { data, error } = await getAllBracketDataForUser(bracketId);

  if (error || !data) {
    return {
      valid: false,
      errors: [error || "Failed to load bracket data"],
      counts: { groupPicks: 0, thirdPlacePicks: 0, knockoutPicks: 0, total: 0 },
    };
  }

  const errors: string[] = [];
  const groupPicksCount = data.groupPicks.length;
  const thirdPlacePicksCount = data.thirdPlacePicks.length;
  const knockoutPicksCount = data.knockoutPicks.length;

  if (groupPicksCount !== 48) {
    errors.push(`Expected 48 group rankings (12 groups × 4 positions), got ${groupPicksCount}`);
  }

  if (thirdPlacePicksCount !== 8) {
    errors.push(`Expected 8 third-place team selections, got ${thirdPlacePicksCount}`);
  }

  if (knockoutPicksCount !== 31) {
    errors.push(`Expected 31 knockout picks (16 R32 + 8 R16 + 4 QF + 2 SF + 1 Final), got ${knockoutPicksCount}`);
  }

  const totalPicks = groupPicksCount + thirdPlacePicksCount + knockoutPicksCount;

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      groupPicks: groupPicksCount,
      thirdPlacePicks: thirdPlacePicksCount,
      knockoutPicks: knockoutPicksCount,
      total: totalPicks,
    },
  };
}
