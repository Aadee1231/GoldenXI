"use server";

import { createClient } from "@/src/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GoalieCameraLeaderboardRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
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
  /** Present only on demo/seed rows — never set on real user rows. */
  isSeeded?: boolean;
};

// ---------------------------------------------------------------------------
// Seed entry shape (public.leaderboard_seed_entries)
// ---------------------------------------------------------------------------

type LeaderboardSeedEntry = {
  id: string;
  leaderboard_type: string;
  username: string | null;
  avatar_initial: string | null;
  goalie_score: number;
  saves: number;
  streak: number;
  avg_react_ms: number | null;
  created_at: string;
  is_active: boolean;
  seed_batch: string | null;
};

// ---------------------------------------------------------------------------
// Seed entries for Goalie leaderboard
// ---------------------------------------------------------------------------

/**
 * Fetch active goalie seed entries from public.leaderboard_seed_entries.
 * Returns an empty array on any error so the real leaderboard is never blocked.
 */
export async function fetchGoalieSeedEntries(): Promise<GoalieCameraLeaderboardRow[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("leaderboard_seed_entries")
      .select(
        "id,leaderboard_type,username,avatar_initial,goalie_score,saves,streak,avg_react_ms,created_at,is_active,seed_batch",
      )
      .eq("leaderboard_type", "goalie")
      .eq("is_active", true);

    if (error) {
      console.warn("[goalie-leaderboard] fetchGoalieSeedEntries:", error.message);
      return [];
    }

    return ((data ?? []) as LeaderboardSeedEntry[]).map((row) => ({
      id: row.id,
      user_id: `seed:${row.id}`,
      display_name: row.username ?? "Demo Player",
      username: row.username ?? null,
      score: row.goalie_score ?? 0,
      saves: row.saves ?? 0,
      goals_allowed: 0,
      shots_faced: 0,
      best_streak: row.streak ?? 0,
      avg_reaction_ms: row.avg_react_ms ?? null,
      fastest_reaction_ms: null,
      accuracy: null,
      created_at: row.created_at,
      isSeeded: true,
    }));
  } catch (err) {
    console.warn(
      "[goalie-leaderboard] fetchGoalieSeedEntries exception:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Merge helper: real + seeded → sorted + re-ranked
// ---------------------------------------------------------------------------

/**
 * Merges real leaderboard rows with seeded rows, sorts by the canonical
 * ranking order (score DESC, saves DESC, avg_reaction_ms ASC),
 * and recalculates the rank field starting from 1.
 *
 * Real rows are never modified. Seed rows are identifiable via `isSeeded: true`.
 * To disable seed rows, set their `is_active = false` in the DB table.
 */
export async function mergeGoalieLeaderboard(
  real: GoalieCameraLeaderboardRow[],
  seeded: GoalieCameraLeaderboardRow[],
): Promise<GoalieCameraLeaderboardRow[]> {
  const merged = [...real, ...seeded];

  merged.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.saves !== a.saves) return b.saves - a.saves;
    const aR = a.avg_reaction_ms ?? Infinity;
    const bR = b.avg_reaction_ms ?? Infinity;
    return aR - bR;
  });

  return merged.map((row, i) => ({ ...row, rank: i + 1 }));
}

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
