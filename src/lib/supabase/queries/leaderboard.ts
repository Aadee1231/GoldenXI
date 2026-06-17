"use server";

import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import type { LeaderboardEntry } from "@/src/types";
import { calculateBracketScore, calculateGroupScore } from "@/src/lib/bracket/scoring";

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
): Promise<{ data: LeaderboardEntry[]; error: string | null; knockoutStarted: boolean }> {
  try {
    // Use session client for the RPC (SECURITY DEFINER anyway) and admin client
    // for all direct table reads so RLS never silently hides any submitted bracket's data.
    const supabase = await createClient();
    const admin = createAdminClient();

    // Get active tournament
    const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
    if (tournamentError || !tournamentId) {
      return { data: [], error: tournamentError || "No active tournament found", knockoutStarted: false };
    }

    // Get leaderboard roster via RPC (SECURITY DEFINER — returns all submitted brackets)
    const { data: leaderboardData, error: rpcError } = await supabase
      .rpc("get_global_leaderboard", {
        tournament_id_param: tournamentId,
        limit_param: limit,
      });

    if (rpcError) {
      return { data: [], error: rpcError.message, knockoutStarted: false };
    }

    if (!leaderboardData || leaderboardData.length === 0) {
      return { data: [], error: null, knockoutStarted: false };
    }

    // Get all bracket IDs to fetch picks and matches
    const bracketIds = leaderboardData.map((row: { bracket_id: string }) => row.bracket_id);

    // --- All scoring queries use the admin client to bypass RLS ---
    // This ensures every submitted bracket's picks are always visible,
    // regardless of public_bracket flag or the current user's session.

    const { data: picks, error: picksError } = await admin
      .from("bracket_picks")
      .select("bracket_id, match_id, picked_team_id")
      .in("bracket_id", bracketIds)
      .limit(10000);

    if (picksError) {
      console.error("[leaderboard] Error fetching bracket_picks:", picksError.message);
    }

    const { data: matches, error: matchesError } = await admin
      .from("matches")
      .select("id, round, completed, winner_id")
      .eq("tournament_id", tournamentId);

    if (matchesError) {
      console.error("[leaderboard] Error fetching matches:", matchesError.message);
    }

    const { data: teamsData, error: teamsError } = await admin
      .from("teams")
      .select("id, code")
      .eq("tournament_id", tournamentId);

    if (teamsError) {
      console.error("[leaderboard] Error fetching teams:", teamsError.message);
    }

    const teamCodeMap = new Map<string, string>(
      (teamsData || []).map((t: { id: string; code: string | null }) => [t.id, t.code || ""])
    );

    const { data: groupPicksData, error: groupPicksError } = await admin
      .from("bracket_group_picks")
      .select("bracket_id, group_label, team_id, position")
      .in("bracket_id", bracketIds)
      .limit(10000);

    if (groupPicksError) {
      console.error("[leaderboard] Error fetching bracket_group_picks:", groupPicksError.message);
    }

    // [TEMP DEBUG] Log row counts to verify the row-limit fix
    console.log(`[leaderboard][DEBUG] brackets=${bracketIds.length} bracket_picks_rows=${picks?.length ?? 0} group_picks_rows=${groupPicksData?.length ?? 0}`);

    type ResolvedGroupPick = { group_label: string; position: number; team_code: string };
    const groupPicksByBracket = new Map<string, ResolvedGroupPick[]>();
    for (const p of (groupPicksData || [])) {
      const code = teamCodeMap.get(p.team_id) || "";
      if (!groupPicksByBracket.has(p.bracket_id)) {
        groupPicksByBracket.set(p.bracket_id, []);
      }
      groupPicksByBracket.get(p.bracket_id)!.push({
        group_label: p.group_label,
        position: p.position,
        team_code: code,
      });
    }

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
      const bracketGroupPicks = groupPicksByBracket.get(row.bracket_id) || [];

      const { totalScore, correctPicks } = calculateBracketScore(
        bracketPicks,
        matches || [],
        bracketGroupPicks
      );

      // [TEMP DEBUG] Log per-bracket score so it can be compared with score-details page
      console.log(`[leaderboard][DEBUG] bracket_id=${row.bracket_id} display=${row.display_name || row.username} group_picks=${bracketGroupPicks.length} leaderboard_score=${totalScore}`);

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
        is_public: true,
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

    const knockoutStarted = (matches || []).some(
      (m) => m.round !== "group" && m.completed
    );

    return { data: entries, error: null, knockoutStarted };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Unknown error",
      knockoutStarted: false,
    };
  }
}

// ---------------------------------------------------------------------------
// Bracket seed entries (public.leaderboard_seed_entries)
// ---------------------------------------------------------------------------

type BracketSeedEntry = {
  id: string;
  username: string | null;
  avatar_initial: string | null;
  bracket_name: string | null;
  champion_name: string | null;
  champion_flag: string | null;
  points: number | null;
  created_at: string;
};

/**
 * Fetch active bracket seed entries from public.leaderboard_seed_entries.
 * Returns an empty array on any error so the real leaderboard is never blocked.
 */
export async function fetchBracketSeedEntries(): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("leaderboard_seed_entries")
      .select("id,username,avatar_initial,bracket_name,champion_name,champion_flag,points,created_at")
      .eq("leaderboard_type", "bracket")
      .eq("is_active", true);

    if (error) {
      console.warn("[leaderboard] fetchBracketSeedEntries:", error.message);
      return [];
    }

    return ((data ?? []) as BracketSeedEntry[]).map((row) => ({
      rank: 0,
      bracket_id: `seed:${row.id}`,
      bracket_name: row.bracket_name || "My Bracket",
      user_id: `seed:${row.id}`,
      username: null,
      display_name: row.username ?? "Demo Player",
      avatar_url: null,
      total_score: row.points ?? 0,
      correct_picks: 0,
      champion_name: row.champion_name ?? null,
      champion_flag: row.champion_flag ?? null,
      champion_code: null,
      submitted_at: row.created_at,
      is_public: false,
      isSeeded: true,
      source: "seed" as const,
    }));
  } catch (err) {
    console.warn(
      "[leaderboard] fetchBracketSeedEntries exception:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

/**
 * Merges real bracket leaderboard rows with seeded rows.
 * Sort order mirrors fetchLeaderboard: total_score DESC → correct_picks DESC → submitted_at ASC.
 * Recalculates rank after merge.
 *
 * Seed rows are identifiable via `isSeeded: true` / `source: 'seed'`.
 * To disable seeds, set `is_active = false` in public.leaderboard_seed_entries.
 */
export async function mergeBracketLeaderboard(
  real: LeaderboardEntry[],
  seeded: LeaderboardEntry[],
): Promise<LeaderboardEntry[]> {
  const merged = [...real, ...seeded];

  merged.sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    if (b.correct_picks !== a.correct_picks) return b.correct_picks - a.correct_picks;
    if (a.submitted_at && b.submitted_at) {
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    }
    if (a.submitted_at && !b.submitted_at) return -1;
    if (!a.submitted_at && b.submitted_at) return 1;
    return 0;
  });

  merged.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  return merged;
}

/**
 * Fetch bracket data for score details page
 */
export async function fetchBracketForScoreDetails(
  bracketId: string
): Promise<{ data: { bracket: any; groupPicks: any[]; champion: any } | null; error: string | null }> {
  try {
    const admin = createAdminClient();

    // Get active tournament
    const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
    if (tournamentError || !tournamentId) {
      return { data: null, error: tournamentError || "No active tournament found" };
    }

    // Get bracket basic info
    const { data: bracket, error: bracketError } = await admin
      .from("brackets")
      .select(`
        id,
        name,
        user_id,
        submitted_at,
        points_earned
      `)
      .eq("id", bracketId)
      .single();

    if (bracketError) {
      return { data: null, error: bracketError.message };
    }

    // Get user profile
    const { data: profile } = await admin
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", bracket.user_id)
      .single();

    // Get group picks
    const { data: groupPicksData, error: groupPicksError } = await admin
      .from("bracket_group_picks")
      .select("group_label, team_id, position")
      .eq("bracket_id", bracketId);

    if (groupPicksError) {
      console.error("[score details] Error fetching group picks:", groupPicksError.message);
    }

    // Get teams to resolve team codes
    const { data: teamsData, error: teamsError } = await admin
      .from("teams")
      .select("id, code, name")
      .eq("tournament_id", tournamentId);

    if (teamsError) {
      console.error("[score details] Error fetching teams:", teamsError.message);
    }

    const teamMap = new Map(
      (teamsData || []).map((t: { id: string; code: string; name: string }) => [t.id, { code: t.code, name: t.name }])
    );

    // Resolve group picks with team codes
    const groupPicks = (groupPicksData || []).map((p: { group_label: string; team_id: string; position: number }) => {
      const team = teamMap.get(p.team_id);
      return {
        group_label: p.group_label,
        team_code: team?.code || "",
        team_name: team?.name || "",
        position: p.position,
      };
    });

    // Get champion pick (from bracket_picks where match round is 'final')
    const { data: finalMatch } = await admin
      .from("matches")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("round", "final")
      .single();

    let champion = null;
    if (finalMatch) {
      const { data: championPick } = await admin
        .from("bracket_picks")
        .select("picked_team_id")
        .eq("bracket_id", bracketId)
        .eq("match_id", finalMatch.id)
        .single();

      if (championPick?.picked_team_id) {
        const championTeam = teamMap.get(championPick.picked_team_id);
        champion = championTeam || null;
      }
    }

    // [TEMP DEBUG] Log score-details total so it can be compared with leaderboard log
    const scoreDetailsTotal = calculateGroupScore(groupPicks);
    console.log(`[score-details][DEBUG] bracket_id=${bracketId} group_picks=${groupPicks.length} score_details_total=${scoreDetailsTotal}`);

    return {
      data: {
        bracket: {
          ...bracket,
          username: profile?.username,
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
        },
        groupPicks,
        champion,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
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
    const admin = createAdminClient();

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

    // --- All scoring queries use admin client to bypass RLS ---

    const { data: picks, error: picksError } = await admin
      .from("bracket_picks")
      .select("bracket_id, match_id, picked_team_id")
      .in("bracket_id", bracketIds)
      .limit(10000);

    if (picksError) {
      console.error("[group leaderboard] Error fetching bracket_picks:", picksError.message);
    }

    const { data: matches, error: matchesError } = await admin
      .from("matches")
      .select("id, round, completed, winner_id")
      .eq("tournament_id", tournamentId);

    if (matchesError) {
      console.error("[group leaderboard] Error fetching matches:", matchesError.message);
    }

    const { data: groupTeamsData, error: teamsError } = await admin
      .from("teams")
      .select("id, code")
      .eq("tournament_id", tournamentId);

    if (teamsError) {
      console.error("[group leaderboard] Error fetching teams:", teamsError.message);
    }

    const groupTeamCodeMap = new Map<string, string>(
      (groupTeamsData || []).map((t: { id: string; code: string | null }) => [t.id, t.code || ""])
    );

    const { data: memberGroupPicksData, error: groupPicksError } = bracketIds.length > 0
      ? await admin
          .from("bracket_group_picks")
          .select("bracket_id, group_label, team_id, position")
          .in("bracket_id", bracketIds)
          .limit(10000)
      : { data: [] as Array<{ bracket_id: string; group_label: string; team_id: string; position: number }>, error: null };

    if (groupPicksError) {
      console.error("[group leaderboard] Error fetching bracket_group_picks:", groupPicksError.message);
    }

    type ResolvedGroupPickG = { group_label: string; position: number; team_code: string };
    const memberGroupPicksByBracket = new Map<string, ResolvedGroupPickG[]>();
    for (const p of (memberGroupPicksData || [])) {
      const code = groupTeamCodeMap.get(p.team_id) || "";
      if (!memberGroupPicksByBracket.has(p.bracket_id)) {
        memberGroupPicksByBracket.set(p.bracket_id, []);
      }
      memberGroupPicksByBracket.get(p.bracket_id)!.push({
        group_label: p.group_label,
        position: p.position,
        team_code: code,
      });
    }

    // Get group lock time to determine eligibility status
    const { data: groupData } = await admin
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
      const bracketGroupPicks = memberGroupPicksByBracket.get(row.bracket_id) || [];

      const { totalScore, correctPicks } = calculateBracketScore(
        bracketPicks,
        matches || [],
        bracketGroupPicks
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
