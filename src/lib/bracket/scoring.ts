import { createClient } from "@/src/lib/supabase/client";
import type { Match, MatchRound, BracketPick } from "@/src/types";

/**
 * BRACKET SCORING LOGIC
 * =====================
 * 
 * Points are awarded based on the tournament round:
 * - Round of 16 (r16): 1 point per correct pick
 * - Quarterfinals (qf): 2 points per correct pick
 * - Semifinals (sf): 4 points per correct pick
 * - Final (final): 8 points for champion pick
 * 
 * Group stage matches do not award points (used for bracket progression only).
 */

/** Maps each round to its point value */
const ROUND_POINTS: Record<MatchRound, number> = {
  group: 0,   // Group stage: no points yet (will be scored via group_picks table)
  r32: 1,     // Round of 32: 1 point
  r16: 2,     // Round of 16: 2 points
  qf: 4,      // Quarterfinals: 4 points
  sf: 8,      // Semifinals: 8 points
  final: 16,  // Final/Champion: 16 points
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
 * Calculate total score and correct picks for a bracket (read-only, no DB updates)
 * Used for leaderboard display
 */
export function calculateBracketScore(
  picks: Array<{ picked_team_id: string | null; match_id: string }>,
  matches: Array<{ id: string; round: MatchRound; completed: boolean; winner_id: string | null }>
): {
  totalScore: number;
  correctPicks: number;
  possibleScore: number;
  maxScore: number;
} {
  const matchMap = new Map(matches.map(m => [m.id, m]));
  
  let totalScore = 0;
  let correctPicks = 0;
  let possibleScore = 0;

  for (const pick of picks) {
    const match = matchMap.get(pick.match_id);
    if (!match) continue;

    // Calculate possible score from completed matches
    if (match.completed && match.winner_id) {
      const roundPoints = ROUND_POINTS[match.round];
      possibleScore += roundPoints;

      // Check if pick is correct
      if (pick.picked_team_id === match.winner_id) {
        totalScore += roundPoints;
        correctPicks++;
      }
    }
  }

  // Max possible score (knockout only): 16 R32 + 8 R16 + 4 QF + 2 SF + 1 Final
  // = 16*1 + 8*2 + 4*4 + 2*8 + 1*16 = 16+16+16+16+16 = 80 points
  // Note: Group stage picks (44 points) scored separately via bracket_group_picks
  // Total max with groups: 80 + 44 = 124 points
  const maxScore = 80; // Knockout bracket only (legacy compatibility)

  return {
    totalScore,
    correctPicks,
    possibleScore,
    maxScore,
  };
}
