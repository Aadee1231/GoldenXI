"use server";

import { createClient } from "@/src/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GoalieCameraLeaderboardRow = {
  id: string;
  user_id: string;
  display_name: string;
  score: number;
  saves: number;
  goals_allowed: number;
  shots_faced: number;
  best_streak: number;
  avg_reaction_ms: number | null;
  fastest_reaction_ms: number | null;
  accuracy: number | null;
  created_at: string;
  rank?: number;
  group_id?: string;
};

// ---------------------------------------------------------------------------
// Global camera leaderboard
// ---------------------------------------------------------------------------

/**
 * Fetch the top N camera-mode scores from the
 * public.goalie_camera_global_leaderboard view.
 *
 * The view already enforces one row per user (via the unique constraint on
 * goalie_scores(user_id, mode)) and orders by the canonical ranking:
 *   score DESC, saves DESC, best_streak DESC, avg_reaction_ms ASC, created_at ASC
 */
export async function fetchGlobalGoalieLeaderboard(
  limit = 50,
): Promise<{ data: GoalieCameraLeaderboardRow[]; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("goalie_camera_global_leaderboard")
      .select("*")
      .order("rank", { ascending: true })
      .limit(limit);

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as GoalieCameraLeaderboardRow[], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Per-group camera leaderboard
// ---------------------------------------------------------------------------

/**
 * Fetch camera-mode scores for members of a specific group from the
 * public.goalie_camera_group_leaderboard view, sorted by canonical ranking.
 *
 * Only members who have played camera mode appear in the result.
 * Members who have not played are omitted (caller shows "no score yet").
 */
export async function fetchGroupGoalieLeaderboard(
  groupId: string,
): Promise<{ data: GoalieCameraLeaderboardRow[]; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("goalie_camera_group_leaderboard")
      .select("*")
      .eq("group_id", groupId);

    if (error) return { data: [], error: error.message };

    const rows = (data ?? []) as GoalieCameraLeaderboardRow[];

    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.saves !== a.saves) return b.saves - a.saves;
      if (b.best_streak !== a.best_streak) return b.best_streak - a.best_streak;
      const aR = a.avg_reaction_ms ?? Infinity;
      const bR = b.avg_reaction_ms ?? Infinity;
      if (aR !== bR) return aR - bR;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return { data: rows, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
