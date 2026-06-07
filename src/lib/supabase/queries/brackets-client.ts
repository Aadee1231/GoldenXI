import { createClient } from "../client";
import type { Bracket, BracketPick } from "@/src/types";

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

  const { data: newBracket, error: insertError } = await supabase
    .from("brackets")
    .insert({
      user_id: user.id,
      tournament_id: tournamentId,
      name: bracketName,
      points_earned: 0,
      is_locked: false,
      status: "draft",
    })
    .select()
    .single();

  if (insertError) {
    return { bracket: null, error: insertError.message };
  }

  return { bracket: newBracket as Bracket, error: null };
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
