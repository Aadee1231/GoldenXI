"use server";

import { createClient } from "../server";
import type { Match, Team } from "@/src/types";

export type BracketMatch = Match & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

export type BracketData = {
  r16: BracketMatch[];
  qf: BracketMatch[];
  sf: BracketMatch[];
  final: BracketMatch[];
};

/**
 * Load all bracket matches for the active tournament
 * Returns matches grouped by round with team data
 */
export async function getBracketMatches(): Promise<{
  data: BracketData | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Get active tournament
  const { data: tournaments, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id")
    .eq("is_active", true)
    .limit(1);

  if (tournamentError || !tournaments || tournaments.length === 0) {
    return { data: null, error: "No active tournament found" };
  }

  const tournamentId = tournaments[0].id;

  // Get all bracket matches (r16, qf, sf, final)
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .in("round", ["r16", "qf", "sf", "final"])
    .order("match_date", { ascending: true });

  if (matchesError) {
    return { data: null, error: matchesError.message };
  }

  if (!matches || matches.length === 0) {
    return { data: null, error: "No bracket matches found. Please run the seed SQL first." };
  }

  // Get all teams for this tournament
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (teamsError) {
    return { data: null, error: teamsError.message };
  }

  const teamsMap = new Map<string, Team>();
  (teams || []).forEach((team) => {
    teamsMap.set(team.id, team as Team);
  });

  // Attach teams to matches
  const bracketMatches: BracketMatch[] = matches.map((match) => ({
    ...match,
    homeTeam: match.home_team_id ? teamsMap.get(match.home_team_id) || null : null,
    awayTeam: match.away_team_id ? teamsMap.get(match.away_team_id) || null : null,
  })) as BracketMatch[];

  // Group by round
  const r16 = bracketMatches.filter((m) => m.round === "r16");
  const qf = bracketMatches.filter((m) => m.round === "qf");
  const sf = bracketMatches.filter((m) => m.round === "sf");
  const final = bracketMatches.filter((m) => m.round === "final");

  return {
    data: { r16, qf, sf, final },
    error: null,
  };
}

/**
 * Get all teams for the active tournament
 */
export async function getTournamentTeams(): Promise<{
  teams: Team[];
  error: string | null;
}> {
  const supabase = await createClient();

  // Get active tournament
  const { data: tournaments, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id")
    .eq("is_active", true)
    .limit(1);

  if (tournamentError || !tournaments || tournaments.length === 0) {
    return { teams: [], error: "No active tournament found" };
  }

  const tournamentId = tournaments[0].id;

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (teamsError) {
    return { teams: [], error: teamsError.message };
  }

  return { teams: (teams || []) as Team[], error: null };
}
