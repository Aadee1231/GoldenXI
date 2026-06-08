import { createClient } from "../client";
import type { ThirdPlacePick } from "@/src/types";

export async function getThirdPlacePicks(bracketId: string): Promise<{
  data: ThirdPlacePick[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("bracket_third_place_picks")
    .select("*")
    .eq("bracket_id", bracketId)
    .order("created_at", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data || []) as ThirdPlacePick[], error: null };
}

export async function saveThirdPlacePicks(
  bracketId: string,
  teamIds: string[],
  options?: { validateComplete?: boolean }
): Promise<{
  success: boolean;
  data?: ThirdPlacePick[];
  error?: string;
}> {
  const supabase = createClient();

  if (teamIds.length > 8) {
    return {
      success: false,
      error: `Cannot select more than 8 third-place teams. Got ${teamIds.length}.`,
    };
  }

  if (options?.validateComplete && teamIds.length !== 8) {
    return {
      success: false,
      error: `Complete bracket requires exactly 8 third-place teams. Got ${teamIds.length}.`,
    };
  }

  const uniqueTeamIds = new Set(teamIds);
  if (uniqueTeamIds.size !== teamIds.length) {
    return {
      success: false,
      error: "Cannot select the same team multiple times",
    };
  }

  const { error: deleteError } = await supabase
    .from("bracket_third_place_picks")
    .delete()
    .eq("bracket_id", bracketId);

  if (deleteError) {
    return {
      success: false,
      error: `Failed to clear existing third-place picks: ${deleteError.message}`,
    };
  }

  // Cascade delete: When third-place picks change, clear knockout picks
  // since the qualified teams (32 teams total) have changed
  await supabase
    .from("bracket_picks")
    .delete()
    .eq("bracket_id", bracketId);

  if (teamIds.length === 0) {
    return { success: true, data: [] };
  }

  const insertData = teamIds.map((team_id) => ({
    bracket_id: bracketId,
    team_id,
  }));

  const { data, error: insertError } = await supabase
    .from("bracket_third_place_picks")
    .insert(insertData)
    .select();

  if (insertError) {
    return {
      success: false,
      error: `Failed to save third-place picks: ${insertError.message}`,
    };
  }

  return { success: true, data: (data || []) as ThirdPlacePick[] };
}

export async function validateThirdPlacePicksComplete(teamIds: string[]): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (teamIds.length !== 8) {
    errors.push(`Expected exactly 8 third-place teams, got ${teamIds.length}`);
  }

  const uniqueTeamIds = new Set(teamIds);
  if (uniqueTeamIds.size !== teamIds.length) {
    errors.push("Duplicate teams found in third-place selections");
  }

  return { valid: errors.length === 0, errors };
}
