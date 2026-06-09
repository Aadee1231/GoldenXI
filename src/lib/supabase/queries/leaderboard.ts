"use server";

import { createClient } from "@/src/lib/supabase/server";
import type { LeaderboardEntry } from "@/src/types";
import { calculateBracketScore } from "@/src/lib/bracket/scoring";

/**
 * Get the active tournament ID
 */
async function getActiveTournamentId(): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();

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
    return { id: null, error: "No active tournament found" };
  }

  return { id: tournaments[0].id, error: null };
}

/**
 * Fetch global leaderboard for the active tournament
 * Uses RPC function for safe data access and calculates scores client-side
 */
export async function fetchLeaderboard(
  limit = 50
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get active tournament
    const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
    if (tournamentError || !tournamentId) {
      return { data: [], error: tournamentError || "No active tournament found" };
    }

    // Get leaderboard data using RPC function
    const { data: leaderboardData, error: rpcError } = await supabase
      .rpc("get_global_leaderboard", {
        tournament_id_param: tournamentId,
        limit_param: limit,
      });

    if (rpcError) {
      return { data: [], error: rpcError.message };
    }

    if (!leaderboardData || leaderboardData.length === 0) {
      return { data: [], error: null };
    }

    // Get all bracket IDs to fetch picks and matches
    const bracketIds = leaderboardData.map((row: { bracket_id: string }) => row.bracket_id);

    // Fetch all picks for these brackets
    const { data: picks, error: picksError } = await supabase
      .from("bracket_picks")
      .select("bracket_id, match_id, picked_team_id")
      .in("bracket_id", bracketIds);

    if (picksError) {
      console.error("Error fetching picks:", picksError);
    }

    // Fetch all matches for the tournament
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, round, completed, winner_id")
      .eq("tournament_id", tournamentId);

    if (matchesError) {
      console.error("Error fetching matches:", matchesError);
    }

    // Fetch which users have a public bracket so we can link their rows to the
    // public bracket page. Profiles' public fields are publicly readable.
    const userIds = leaderboardData.map((row: { user_id: string }) => row.user_id);
    const { data: publicProfiles } = await supabase
      .from("profiles")
      .select("id, public_bracket")
      .in("id", userIds);

    const publicByUser = new Map<string, boolean>(
      (publicProfiles || []).map((p: { id: string; public_bracket: boolean }) => [
        p.id,
        p.public_bracket,
      ])
    );

    // Calculate scores for each bracket
    const entries: LeaderboardEntry[] = leaderboardData.map((row: {
      bracket_id: string;
      user_id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
      bracket_name: string;
      submitted_at: string | null;
      champion_name: string | null;
      champion_code: string | null;
      champion_flag: string | null;
    }) => {
      const bracketPicks = (picks || []).filter(p => p.bracket_id === row.bracket_id);
      
      const { totalScore, correctPicks } = calculateBracketScore(
        bracketPicks,
        matches || []
      );

      return {
        rank: 0, // Will be set after sorting
        bracket_id: row.bracket_id,
        bracket_name: row.bracket_name,
        user_id: row.user_id,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        total_score: totalScore,
        correct_picks: correctPicks,
        champion_name: row.champion_name,
        champion_flag: row.champion_flag,
        champion_code: row.champion_code,
        submitted_at: row.submitted_at,
        is_public: publicByUser.get(row.user_id) ?? false,
      };
    });

    // Sort by: 1) total_score desc, 2) correct_picks desc, 3) submitted_at asc
    entries.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      if (b.correct_picks !== a.correct_picks) {
        return b.correct_picks - a.correct_picks;
      }
      // Earlier submission wins
      if (a.submitted_at && b.submitted_at) {
        return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      }
      return 0;
    });

    // Assign ranks
    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return { data: entries, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Fetch group leaderboard for a specific group with eligibility status
 * Shows all members, even if they haven't submitted
 */
export async function fetchGroupLeaderboard(
  groupId: string
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get active tournament
    const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
    if (tournamentError || !tournamentId) {
      return { data: [], error: tournamentError || "No active tournament found" };
    }

    // Get group leaderboard data with eligibility using new RPC function
    const { data: leaderboardData, error: rpcError } = await supabase
      .rpc("get_group_leaderboard_with_eligibility", {
        group_id_param: groupId,
        tournament_id_param: tournamentId,
      });

    if (rpcError) {
      return { data: [], error: rpcError.message };
    }

    if (!leaderboardData || leaderboardData.length === 0) {
      return { data: [], error: null };
    }

    // Get bracket IDs (filter out nulls for members without brackets)
    const bracketIds = leaderboardData
      .map((row: { bracket_id: string | null }) => row.bracket_id)
      .filter((id: string | null): id is string => id !== null);

    // Fetch picks for brackets that exist
    const { data: picks, error: picksError } = await supabase
      .from("bracket_picks")
      .select("bracket_id, match_id, picked_team_id")
      .in("bracket_id", bracketIds);

    if (picksError) {
      console.error("Error fetching picks:", picksError);
    }

    // Fetch all matches for the tournament
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, round, completed, winner_id")
      .eq("tournament_id", tournamentId);

    if (matchesError) {
      console.error("Error fetching matches:", matchesError);
    }

    // Get group lock time to determine eligibility status
    const { data: groupData } = await supabase
      .from("groups")
      .select("lock_at")
      .eq("id", groupId)
      .single();

    const groupLockAt = groupData?.lock_at;

    // Calculate scores for each member
    const entries: LeaderboardEntry[] = leaderboardData.map((row: {
      user_id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
      bracket_id: string | null;
      bracket_name: string | null;
      bracket_status: string | null;
      submitted_at: string | null;
      updated_at: string | null;
      locked_at: string | null;
      champion_name: string | null;
      champion_code: string | null;
      champion_flag: string | null;
      is_eligible: boolean;
    }) => {
      // Determine eligibility status
      let eligibilityStatus: "eligible" | "not_submitted" | "submitted_late" | "edited_after_lock" = "eligible";
      
      if (!row.bracket_id) {
        eligibilityStatus = "not_submitted";
      } else if (groupLockAt && row.submitted_at) {
        const lockTime = new Date(groupLockAt).getTime();
        const submittedTime = new Date(row.submitted_at).getTime();
        const updatedTime = row.updated_at ? new Date(row.updated_at).getTime() : submittedTime;

        if (submittedTime > lockTime) {
          eligibilityStatus = "submitted_late";
        } else if (updatedTime > lockTime) {
          eligibilityStatus = "edited_after_lock";
        }
      }

      // If no bracket, score is 0
      if (!row.bracket_id) {
        return {
          rank: 0,
          bracket_id: "",
          bracket_name: "Not submitted",
          user_id: row.user_id,
          username: row.username,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
          total_score: 0,
          correct_picks: 0,
          champion_name: null,
          champion_flag: null,
          champion_code: null,
          submitted_at: null,
          is_eligible: false,
          eligibility_status: eligibilityStatus,
        };
      }

      const bracketPicks = (picks || []).filter(p => p.bracket_id === row.bracket_id);
      
      const { totalScore, correctPicks } = calculateBracketScore(
        bracketPicks,
        matches || []
      );

      // Ineligible members get 0 score for ranking
      const displayScore = row.is_eligible ? totalScore : 0;

      return {
        rank: 0, // Will be set after sorting
        bracket_id: row.bracket_id,
        bracket_name: row.bracket_name || "My Bracket",
        user_id: row.user_id,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        total_score: displayScore,
        correct_picks: row.is_eligible ? correctPicks : 0,
        champion_name: row.champion_name,
        champion_flag: row.champion_flag,
        champion_code: row.champion_code,
        submitted_at: row.submitted_at,
        is_eligible: row.is_eligible,
        eligibility_status: eligibilityStatus,
      };
    });

    // Sort by: 1) eligibility, 2) total_score desc, 3) correct_picks desc, 4) submitted_at asc
    entries.sort((a, b) => {
      // Eligible members always rank above ineligible
      if (a.is_eligible !== b.is_eligible) {
        return a.is_eligible ? -1 : 1;
      }
      
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      if (b.correct_picks !== a.correct_picks) {
        return b.correct_picks - a.correct_picks;
      }
      // Earlier submission wins
      if (a.submitted_at && b.submitted_at) {
        return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      }
      // Members without brackets go last
      if (a.submitted_at && !b.submitted_at) return -1;
      if (!a.submitted_at && b.submitted_at) return 1;
      return 0;
    });

    // Assign ranks
    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return { data: entries, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
