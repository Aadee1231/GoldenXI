import { createClient } from "@/src/lib/supabase/client";
import type { Match, MatchRound, BracketPick } from "@/src/types";
import { groupStandings } from "@/src/data/groupStandings";

/**
 * BRACKET SCORING LOGIC
 * =====================
 * 
 * Knockout round points per correct pick:
 * - Round of 32 (r32):   4 points
 * - Round of 16 (r16):   6 points
 * - Quarterfinals (qf):  8 points
 * - Semifinals (sf):    12 points
 * - Final (final):      20 points
 * 
 * Group-stage points per group (max 3 pts, non-cumulative):
 * - 3 pts: exact full 1–4 order correct
 * - 2 pts: correct top-2 teams in any order
 * - 1 pt:  correct top-3 teams in any order
 * - 0 pts: none of the above
 * Max group-stage score: 12 groups × 3 pts = 36 pts
 */

/** Maps each knockout round to its point value */
const ROUND_POINTS: Record<MatchRound, number> = {
  group: 0,    // Group stage: scored via bracket_group_picks, not matches
  r32: 4,      // Round of 32: 4 point
  r16: 6,      // Round of 16: 6 points
  qf: 8,       // Quarterfinals: 8 points
  sf: 12,      // Semifinals: 12 points
  final: 20,   // Final/Champion: 20 points
};

/**
 * Calculate points for a single pick based on the match round.
 * Returns 0 if the match is not completed or the pick is incorrect.
 */
export function calculatePickPoints(
  pick: BracketPick,
  match: Match
): { isCorrect: boolean; points: number } {
  // Match must be completed with a winner
  if (!match.completed || !match.winner_id) {
    return { isCorrect: false, points: 0 };
  }

  // User must have made a pick
  if (!pick.picked_team_id) {
    return { isCorrect: false, points: 0 };
  }

  // Check if pick matches the actual winner
  const isCorrect = pick.picked_team_id === match.winner_id;
  
  // Award points based on round if correct, otherwise 0
  const points = isCorrect ? ROUND_POINTS[match.round] : 0;

  return { isCorrect, points };
}

/**
 * Score all picks for a single bracket against the actual match results.
 * Updates each pick's is_correct and points_awarded, then recalculates bracket total.
 * 
 * @param bracketId - The bracket to score
 * @returns The total points earned and array of updated picks
 */
export async function scoreBracket(
  bracketId: string
): Promise<{ totalPoints: number; updatedPicks: BracketPick[] }> {
  const supabase = createClient();

  // Fetch all picks for this bracket with their associated matches
  const { data: picks, error: picksError } = await supabase
    .from("bracket_picks")
    .select(`
      *,
      match:matches(*)
    `)
    .eq("bracket_id", bracketId);

  if (picksError) {
    throw new Error(`Failed to fetch bracket picks: ${picksError.message}`);
  }

  if (!picks || picks.length === 0) {
    return { totalPoints: 0, updatedPicks: [] };
  }

  // Calculate scores for each pick
  const scoredPicks: BracketPick[] = [];
  let totalPoints = 0;

  for (const pick of picks) {
    const match = pick.match as Match;
    const { isCorrect, points } = calculatePickPoints(pick, match);

    // Update the pick in database
    const { error: updateError } = await supabase
      .from("bracket_picks")
      .update({
        is_correct: isCorrect,
        points_awarded: points,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pick.id);

    if (updateError) {
      throw new Error(`Failed to update pick ${pick.id}: ${updateError.message}`);
    }

    scoredPicks.push({
      ...pick,
      is_correct: isCorrect,
      points_awarded: points,
    });

    totalPoints += points;
  }

  // Update bracket total points
  const { error: bracketError } = await supabase
    .from("brackets")
    .update({
      points_earned: totalPoints,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bracketId);

  if (bracketError) {
    throw new Error(`Failed to update bracket points: ${bracketError.message}`);
  }

  return { totalPoints, updatedPicks: scoredPicks };
}

/**
 * Score all brackets in a tournament.
 * Use this after updating match results to recalculate all user scores.
 * 
 * @param tournamentId - The tournament to score all brackets for
 * @returns Summary of scoring results per bracket
 */
export async function scoreTournament(
  tournamentId: string
): Promise<{ bracketId: string; totalPoints: number }[]> {
  const supabase = createClient();

  // Get all brackets for this tournament
  const { data: brackets, error } = await supabase
    .from("brackets")
    .select("id")
    .eq("tournament_id", tournamentId);

  if (error) {
    throw new Error(`Failed to fetch brackets: ${error.message}`);
  }

  if (!brackets || brackets.length === 0) {
    return [];
  }

  // Score each bracket
  const results: { bracketId: string; totalPoints: number }[] = [];

  for (const bracket of brackets) {
    const { totalPoints } = await scoreBracket(bracket.id);
    results.push({ bracketId: bracket.id, totalPoints });
  }

  return results;
}

/**
 * Get point value for a specific round (for UI display).
 */
export function getRoundPoints(round: MatchRound): number {
  return ROUND_POINTS[round];
}

/**
 * Get a human-readable label for a round's point value.
 */
export function getRoundPointsLabel(round: MatchRound): string {
  const points = ROUND_POINTS[round];
  if (points === 0) return "No points";
  if (points === 1) return "1 point";
  return `${points} points`;
}

/**
 * Calculate group-stage points for a single bracket.
 * Compares predicted positions against the live standings in groupStandings.ts.
 *
 * Per-group scoring (non-cumulative — only highest tier is awarded):
 * - 3 pts: exact full 1–4 order correct
 * - 2 pts: predicted top-2 set matches actual top-2 set (any order)
 * - 1 pt:  predicted top-3 set matches actual top-3 set (any order)
 * - 0 pts: none of the above
 * Max per group: 3 pts. Max total: 12 × 3 = 36 pts.
 */
export function calculateGroupScore(
  groupPicks: Array<{ group_label: string; position: number; team_code: string }>
): number {
  let score = 0;

  const byGroup: Record<string, Array<{ position: number; team_code: string }>> = {};
  for (const p of groupPicks) {
    if (!byGroup[p.group_label]) byGroup[p.group_label] = [];
    byGroup[p.group_label].push({ position: p.position, team_code: p.team_code });
  }

  for (const [groupLabel, picks] of Object.entries(byGroup)) {
    const standing = groupStandings[groupLabel];
    if (!standing || standing.standings.length === 0) continue;

    // Build actual ranking: position (1–4) → team code
    const actualByPos: Record<number, string> = {};
    for (const s of standing.standings) {
      actualByPos[s.position] = s.teamCode;
    }

    // Build predicted ranking: position (1–4) → team code
    const predictedByPos: Record<number, string> = {};
    for (const pick of picks) {
      predictedByPos[pick.position] = pick.team_code;
    }

    // Require complete data for all 4 positions on both sides
    if (![1, 2, 3, 4].every(p => actualByPos[p] && predictedByPos[p])) continue;

    // 3 pts: exact full 1–4 order
    if ([1, 2, 3, 4].every(p => predictedByPos[p] === actualByPos[p])) {
      score += 3;
      continue;
    }

    // 2 pts: predicted top-2 set matches actual top-2 set (any order)
    const predTop2 = new Set([predictedByPos[1], predictedByPos[2]]);
    const actuTop2 = new Set([actualByPos[1], actualByPos[2]]);
    if (predTop2.size === 2 && actuTop2.size === 2 &&
        [...actuTop2].every(t => predTop2.has(t))) {
      score += 2;
      continue;
    }

    // 1 pt: predicted top-3 set matches actual top-3 set (any order)
    const predTop3 = new Set([predictedByPos[1], predictedByPos[2], predictedByPos[3]]);
    const actuTop3 = new Set([actualByPos[1], actualByPos[2], actualByPos[3]]);
    if (predTop3.size === 3 && actuTop3.size === 3 &&
        [...actuTop3].every(t => predTop3.has(t))) {
      score += 1;
      continue;
    }

    // 0 pts: none of the above
  }

  return score;
}

/**
 * Calculate total score and correct picks for a bracket (read-only, no DB updates).
 * Includes both knockout scoring (from matches) and group-stage scoring (from groupStandings.ts).
 * Used for leaderboard display.
 */
export function calculateBracketScore(
  picks: Array<{ picked_team_id: string | null; match_id: string }>,
  matches: Array<{ id: string; round: MatchRound; completed: boolean; winner_id: string | null }>,
  groupPicks?: Array<{ group_label: string; position: number; team_code: string }>
): {
  totalScore: number;
  correctPicks: number;
  possibleScore: number;
  maxScore: number;
  groupScore: number;
} {
  const matchMap = new Map(matches.map(m => [m.id, m]));
  
  let knockoutScore = 0;
  let correctPicks = 0;
  let possibleScore = 0;

  for (const pick of picks) {
    const match = matchMap.get(pick.match_id);
    if (!match) continue;

    if (match.completed && match.winner_id) {
      const roundPoints = ROUND_POINTS[match.round];
      possibleScore += roundPoints;

      if (pick.picked_team_id === match.winner_id) {
        knockoutScore += roundPoints;
        correctPicks++;
      }
    }
  }

  const groupScore = groupPicks ? calculateGroupScore(groupPicks) : 0;
  const totalScore = knockoutScore + groupScore;

  // Max knockout: 16×r32 + 8×r16 + 4×qf + 2×sf + 1×final
  // = 16×4 + 8×6 + 4×8 + 2×12 + 1×20 = 64+48+32+24+20 = 188
  // Max group stage: 12 groups × 3 pts = 36
  // Total max: 188 + 36 = 224
  const maxScore = 224;

  return {
    totalScore,
    correctPicks,
    possibleScore,
    maxScore,
    groupScore,
  };
}
