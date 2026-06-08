import { createClient } from "../client";
import type { Team, GroupPick, GroupRankingInput } from "@/src/types";

const GROUP_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export type TeamsByGroup = Record<string, Team[]>;

export async function getActiveTournamentId(): Promise<{ id: string | null; error: string | null }> {
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
    return { id: null, error: "No active tournament found" };
  }

  return { id: tournaments[0].id, error: null };
}

export async function getTeamsByGroup(tournamentId?: string): Promise<{
  data: TeamsByGroup | null;
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

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tid)
    .not("group_label", "is", null)
    .order("group_label", { ascending: true })
    .order("name", { ascending: true });

  if (teamsError) {
    return { data: null, error: teamsError.message };
  }

  if (!teams || teams.length === 0) {
    return { data: null, error: "No teams found for this tournament" };
  }

  const teamsByGroup: TeamsByGroup = {};
  GROUP_LABELS.forEach((label) => {
    teamsByGroup[label] = [];
  });

  teams.forEach((team) => {
    if (team.group_label && team.group_label in teamsByGroup) {
      teamsByGroup[team.group_label].push(team as Team);
    }
  });

  return { data: teamsByGroup, error: null };
}

export async function getGroupRankings(bracketId: string): Promise<{
  data: GroupPick[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("bracket_group_picks")
    .select("*")
    .eq("bracket_id", bracketId)
    .order("group_label", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data || []) as GroupPick[], error: null };
}

export async function saveGroupRankings(
  bracketId: string,
  rankings: GroupRankingInput[],
  options?: { validateComplete?: boolean }
): Promise<{
  success: boolean;
  data?: GroupPick[];
  error?: string;
}> {
  const supabase = createClient();

  if (options?.validateComplete) {
    if (rankings.length !== 48) {
      return {
        success: false,
        error: `Complete bracket requires 48 group rankings (12 groups × 4 positions). Got ${rankings.length}.`,
      };
    }

    const groupCounts: Record<string, number> = {};
    GROUP_LABELS.forEach((label) => {
      groupCounts[label] = 0;
    });

    rankings.forEach((r) => {
      if (r.group_label in groupCounts) {
        groupCounts[r.group_label]++;
      }
    });

    for (const label of GROUP_LABELS) {
      if (groupCounts[label] !== 4) {
        return {
          success: false,
          error: `Group ${label} must have exactly 4 ranked teams. Got ${groupCounts[label]}.`,
        };
      }
    }

    for (const ranking of rankings) {
      if (ranking.position < 1 || ranking.position > 4) {
        return {
          success: false,
          error: `Position must be between 1 and 4. Got ${ranking.position} for group ${ranking.group_label}.`,
        };
      }
    }
  }

  const { error: deleteError } = await supabase
    .from("bracket_group_picks")
    .delete()
    .eq("bracket_id", bracketId);

  if (deleteError) {
    return {
      success: false,
      error: `Failed to clear existing rankings: ${deleteError.message}`,
    };
  }

  // Cascade delete: When group rankings change, clear downstream picks
  // since the qualified teams (1st, 2nd, 3rd place) have changed
  await supabase
    .from("bracket_third_place_picks")
    .delete()
    .eq("bracket_id", bracketId);

  await supabase
    .from("bracket_picks")
    .delete()
    .eq("bracket_id", bracketId);

  if (rankings.length === 0) {
    return { success: true, data: [] };
  }

  const insertData = rankings.map((r) => ({
    bracket_id: bracketId,
    group_label: r.group_label,
    team_id: r.team_id,
    position: r.position,
  }));

  const { data, error: insertError } = await supabase
    .from("bracket_group_picks")
    .insert(insertData)
    .select();

  if (insertError) {
    return {
      success: false,
      error: `Failed to save rankings: ${insertError.message}`,
    };
  }

  return { success: true, data: (data || []) as GroupPick[] };
}

export async function validateGroupRankingsComplete(rankings: GroupRankingInput[]): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (rankings.length !== 48) {
    errors.push(`Expected 48 rankings (12 groups × 4 positions), got ${rankings.length}`);
  }

  const groupCounts: Record<string, Set<number>> = {};
  const teamUsage: Record<string, Set<string>> = {};

  GROUP_LABELS.forEach((label) => {
    groupCounts[label] = new Set();
    teamUsage[label] = new Set();
  });

  rankings.forEach((r) => {
    if (!GROUP_LABELS.includes(r.group_label as typeof GROUP_LABELS[number])) {
      errors.push(`Invalid group label: ${r.group_label}`);
      return;
    }

    if (r.position < 1 || r.position > 4) {
      errors.push(`Invalid position ${r.position} for group ${r.group_label}`);
      return;
    }

    if (groupCounts[r.group_label].has(r.position)) {
      errors.push(`Duplicate position ${r.position} in group ${r.group_label}`);
    }
    groupCounts[r.group_label].add(r.position);

    if (teamUsage[r.group_label].has(r.team_id)) {
      errors.push(`Team ${r.team_id} used multiple times in group ${r.group_label}`);
    }
    teamUsage[r.group_label].add(r.team_id);
  });

  GROUP_LABELS.forEach((label) => {
    if (groupCounts[label].size !== 4) {
      errors.push(`Group ${label} must have exactly 4 positions filled, got ${groupCounts[label].size}`);
    }
  });

  return { valid: errors.length === 0, errors };
}
