/**
 * goalieScores.ts — Client-side Supabase helpers for the Goalkeeper mini-game.
 *
 * Uses the anon-key browser client only. No service_role key is used here.
 * Row-Level Security on public.goalie_scores enforces:
 *   · SELECT: open to all (leaderboard)
 *   · INSERT: authenticated users may only insert rows where user_id = auth.uid()
 */

import { createClient } from "@/src/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GoalieGameMode = "keyboard" | "camera";

/** Payload the caller passes in — raw game stats. */
export type SubmitScorePayload = {
  mode: GoalieGameMode;
  score: number;
  saves: number;
  goalsAllowed: number;
  /** Total shots faced during the endless game (replaces the old fixed totalRounds). */
  shotsFaced: number;
  /** Raw reaction times in ms for each successful save (used to derive avg/fastest). */
  reactionTimes: number[];
  bestStreak: number;
  /** Any extra per-mode metadata (e.g. camera calibration info). */
  metadata?: Record<string, unknown>;
};

/** One row from the leaderboard query. */
export type GoalieLeaderboardRow = {
  id: string;
  user_id: string;
  display_name: string;
  mode: GoalieGameMode;
  score: number;
  saves: number;
  goals_allowed: number;
  total_rounds: number;
  lives_used: number;
  avg_reaction_ms: number | null;
  fastest_reaction_ms: number | null;
  best_streak: number;
  accuracy: number | null;
  game_version: string;
  ended_reason: string;
  created_at: string;
};

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Submit a score
// ---------------------------------------------------------------------------

/**
 * Upsert a completed game's stats into public.goalie_scores.
 *
 * Each user has at most ONE row per mode.  The row is created on the first
 * submission and updated only when the new score beats the stored best.
 *
 * Returns { ok: false, error: "Sign in to save your score." } when the user
 * is not authenticated — the caller should surface this gracefully without
 * treating it as an application error.
 */
export async function submitGoalieScore(
  payload: SubmitScorePayload,
): Promise<SubmitResult> {
  const supabase = createClient();

  // Verify auth — anon users cannot upsert (RLS rejects it anyway, but
  // failing early gives a friendlier message than a Postgres RLS error).
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Sign in to save your score to the leaderboard." };
  }

  // Check the user's current best for this mode so we only overwrite
  // when the new run is strictly better.
  const { data: existing } = await supabase
    .from("goalie_scores")
    .select("id, score")
    .eq("user_id", user.id)
    .eq("mode", payload.mode)
    .maybeSingle();

  const currentBest: number = (existing as { id: string; score: number } | null)?.score ?? -1;

  // If there is already a row and this run didn't beat it, skip the write.
  if (existing && payload.score <= currentBest) {
    return { ok: true, id: (existing as { id: string; score: number }).id };
  }

  // Derive display name from auth metadata (set during sign-up).
  const displayName: string =
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Keeper";

  // Compute aggregate stats from the raw reaction-time list.
  const avgReactionMs =
    payload.reactionTimes.length > 0
      ? Math.round(
          payload.reactionTimes.reduce((a, b) => a + b, 0) /
            payload.reactionTimes.length,
        )
      : null;

  const fastestReactionMs =
    payload.reactionTimes.length > 0
      ? Math.min(...payload.reactionTimes)
      : null;

  // Accuracy: saves / shotsFaced, expressed as a percentage (e.g. 70.00).
  const accuracy =
    payload.shotsFaced > 0
      ? Math.round((payload.saves / payload.shotsFaced) * 10000) / 100
      : null;

  // Enrich metadata with standard game-context fields.
  const enrichedMetadata: Record<string, unknown> = {
    game_version:   "goalie_reaction_v2_endless",
    starting_lives: 3,
    lives_used:     payload.goalsAllowed,
    difficulty_ramp: "progressive_flight_ms",
    shots_faced:    payload.shotsFaced,
    ...(payload.metadata ?? {}),
  };

  const row = {
    user_id:             user.id,
    display_name:        displayName,
    mode:                payload.mode,
    score:               payload.score,
    saves:               payload.saves,
    goals_allowed:       payload.goalsAllowed,
    total_rounds:        payload.shotsFaced,
    lives_used:          payload.goalsAllowed,
    avg_reaction_ms:     avgReactionMs,
    fastest_reaction_ms: fastestReactionMs,
    best_streak:         payload.bestStreak,
    accuracy,
    game_version:        "goalie_reaction_v2_endless",
    ended_reason:        "lives_lost",
    metadata:            enrichedMetadata,
  };

  const { data, error } = await supabase
    .from("goalie_scores")
    .upsert(row, { onConflict: "user_id,mode" })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

// ---------------------------------------------------------------------------
// Fetch top scores (leaderboard)
// ---------------------------------------------------------------------------

/**
 * Fetch the top N scores from public.goalie_scores, ordered by score DESC.
 *
 * @param mode   Optional filter: "keyboard" | "camera". Omit for all-time.
 * @param limit  Number of rows to fetch (default 10).
 */
export async function fetchTopGoalieScores(
  mode?: GoalieGameMode,
  limit = 10,
): Promise<GoalieLeaderboardRow[]> {
  const supabase = createClient();

  let query = supabase
    .from("goalie_scores")
    .select(
      "id,user_id,display_name,mode,score,saves,goals_allowed,total_rounds,lives_used,avg_reaction_ms,fastest_reaction_ms,best_streak,accuracy,game_version,ended_reason,created_at",
    )
    .order("score",           { ascending: false })
    .order("saves",           { ascending: false })
    .order("avg_reaction_ms", { ascending: true,  nullsFirst: false })
    .limit(limit);

  if (mode) {
    query = query.eq("mode", mode);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[goalieScores] fetchTopGoalieScores:", error.message);
    return [];
  }
  return (data ?? []) as GoalieLeaderboardRow[];
}

// ---------------------------------------------------------------------------
// Fetch the current user's best score
// ---------------------------------------------------------------------------

/**
 * Returns the highest CAMERA score the authenticated user has ever achieved,
 * or null if they are not signed in / have no camera scores yet.
 *
 * Safe to call on mount — returns null quickly if unauthenticated.
 */
export async function fetchUserGoalieBest(): Promise<number | null> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from("goalie_scores")
    .select("score")
    .eq("user_id", user.id)
    .eq("mode", "camera")
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { score: number }).score;
}

// ---------------------------------------------------------------------------
// Convenience aliases for camera-only flows
// ---------------------------------------------------------------------------

/**
 * Alias: returns the current user's best camera-mode score.
 * Identical to fetchUserGoalieBest() but named explicitly for camera context.
 */
export const getCurrentUserBestGoalieScore = fetchUserGoalieBest;

/**
 * Submit a camera-mode score, forcing mode = "camera" regardless of the
 * payload's mode field.  Prevents keyboard scores from appearing in the
 * camera leaderboard via an accidental call.
 */
export async function saveGoalieCameraScore(
  payload: Omit<SubmitScorePayload, "mode">,
): Promise<SubmitResult> {
  return submitGoalieScore({ ...payload, mode: "camera" });
}
