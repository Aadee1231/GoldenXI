"use client";

/**
 * ADMIN/DEV TESTING PAGE
 * ======================
 * 
 * This page is for development/testing only - not for production use.
 * Allows manual setting of match winners and triggering bracket scoring.
 * 
 * TODO: Remove or protect this page before production launch.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { scoreBracket, scoreTournament } from "@/src/lib/bracket/scoring";
import type { Match, Tournament, Team } from "@/src/types";
import { Trophy, CheckCircle, AlertCircle, Play, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [scoringResult, setScoringResult] = useState<string>("");

  const supabase = createClient();

  // Fetch tournaments on mount
  useEffect(() => {
    async function fetchTournaments() {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("is_active", true);
      
      if (error) {
        console.error("Failed to fetch tournaments:", error);
        return;
      }
      
      setTournaments(data || []);
      if (data && data.length > 0) {
        setSelectedTournament(data[0].id);
      }
    }

    fetchTournaments();
  }, []);

  // Fetch matches when tournament changes
  useEffect(() => {
    if (!selectedTournament) return;

    async function fetchData() {
      setLoading(true);
      
      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", selectedTournament)
        .order("round", { ascending: true })
        .order("match_date", { ascending: true });

      if (matchesError) {
        console.error("Failed to fetch matches:", matchesError);
      } else {
        setMatches(matchesData || []);
      }

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("tournament_id", selectedTournament);

      if (teamsError) {
        console.error("Failed to fetch teams:", teamsError);
      } else {
        setTeams(teamsData || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedTournament]);

  // Set winner for a match
  async function setMatchWinner(matchId: string, winnerId: string) {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("matches")
      .update({
        winner_id: winnerId,
        completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (error) {
      setMessage({ type: "error", text: `Failed to set winner: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Winner set successfully!" });
      // Refresh matches
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", selectedTournament)
        .order("round", { ascending: true })
        .order("match_date", { ascending: true });
      setMatches(data || []);
    }

    setLoading(false);
  }

  // Clear winner for a match (reset)
  async function clearMatchWinner(matchId: string) {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("matches")
      .update({
        winner_id: null,
        completed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (error) {
      setMessage({ type: "error", text: `Failed to clear winner: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Match reset successfully!" });
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", selectedTournament)
        .order("round", { ascending: true })
        .order("match_date", { ascending: true });
      setMatches(data || []);
    }

    setLoading(false);
  }

  // Score a single bracket
  async function handleScoreBracket(bracketId: string) {
    setLoading(true);
    setMessage(null);
    setScoringResult("");

    try {
      const { totalPoints, updatedPicks } = await scoreBracket(bracketId);
      const correctPicks = updatedPicks.filter(p => p.is_correct).length;
      
      setScoringResult(
        `Bracket scored! Total: ${totalPoints} points, ${correctPicks}/${updatedPicks.length} correct picks`
      );
      setMessage({ type: "success", text: "Bracket scored successfully!" });
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: `Scoring failed: ${err instanceof Error ? err.message : "Unknown error"}` 
      });
    }

    setLoading(false);
  }

  // Score entire tournament
  async function handleScoreTournament() {
    setLoading(true);
    setMessage(null);
    setScoringResult("");

    try {
      const results = await scoreTournament(selectedTournament);
      const totalPoints = results.reduce((sum, r) => sum + r.totalPoints, 0);
      
      setScoringResult(
        `Tournament scored! ${results.length} brackets updated. Total points awarded: ${totalPoints}`
      );
      setMessage({ type: "success", text: "Tournament scored successfully!" });
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: `Tournament scoring failed: ${err instanceof Error ? err.message : "Unknown error"}` 
      });
    }

    setLoading(false);
  }

  // Get team name by ID
  function getTeamName(teamId: string | null) {
    if (!teamId) return "TBD";
    const team = teams.find(t => t.id === teamId);
    return team ? `${team.flag_emoji || ""} ${team.name}` : "Unknown";
  }

  // Get round display name
  function getRoundName(round: string) {
    const names: Record<string, string> = {
      group: "Group Stage",
      r32: "Round of 32 (4 pts)",
      r16: "Round of 16 (6 pts)",
      qf: "Quarterfinals (8 pts)",
      sf: "Semifinals (12 pts)",
      final: "Final (20 pts)",
    };
    return names[round] || round;
  }

  return (
    <main className="min-h-screen bg-[#080808] pt-24 pb-16 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Admin / Dev Testing</h1>
          </div>
          <p className="text-zinc-400">
            Set match winners and test bracket scoring. Remove this page before production.
          </p>
        </div>

        {/* Alert Message */}
        {message && (
          <div className={`mb-6 rounded-lg border p-4 ${
            message.type === "success" 
              ? "border-green-500/30 bg-green-500/10 text-green-400" 
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Scoring Result */}
        {scoringResult && (
          <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-400">
            <p className="font-medium">{scoringResult}</p>
          </div>
        )}

        {/* Tournament Selector */}
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Select Tournament
          </label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.season})
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={handleScoreTournament}
            disabled={loading || !selectedTournament}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 font-medium text-black transition-colors hover:bg-yellow-300 disabled:opacity-50"
          >
            <RefreshCw className="h-5 w-5" />
            Score All Brackets
          </button>
        </div>

        {/* Matches List */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Matches</h2>
            <p className="text-sm text-zinc-400">
              Click a team to set them as the winner. Click &quot;Clear&quot; to reset.
            </p>
          </div>

          {loading && matches.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">Loading matches...</div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">No matches found</div>
          ) : (
            <div className="divide-y divide-white/10">
              {matches.map((match) => (
                <div key={match.id} className="px-6 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                      {getRoundName(match.round)}
                    </span>
                    {match.completed && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Home Team */}
                    <button
                      onClick={() => setMatchWinner(match.id, match.home_team_id!)}
                      disabled={loading || !match.home_team_id}
                      className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                        match.winner_id === match.home_team_id
                          ? "border-green-500/50 bg-green-500/20 text-green-400"
                          : "border-white/10 bg-white/5 text-white hover:border-yellow-400/50"
                      } disabled:opacity-50`}
                    >
                      <span className="text-sm text-zinc-400">Home</span>
                      <p className="font-medium">{getTeamName(match.home_team_id)}</p>
                    </button>

                    <span className="text-zinc-500">VS</span>

                    {/* Away Team */}
                    <button
                      onClick={() => setMatchWinner(match.id, match.away_team_id!)}
                      disabled={loading || !match.away_team_id}
                      className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                        match.winner_id === match.away_team_id
                          ? "border-green-500/50 bg-green-500/20 text-green-400"
                          : "border-white/10 bg-white/5 text-white hover:border-yellow-400/50"
                      } disabled:opacity-50`}
                    >
                      <span className="text-sm text-zinc-400">Away</span>
                      <p className="font-medium">{getTeamName(match.away_team_id)}</p>
                    </button>

                    {/* Clear Button */}
                    {match.completed && (
                      <button
                        onClick={() => clearMatchWinner(match.id)}
                        disabled={loading}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scoring Info */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Scoring Rules</h3>
          <ul className="space-y-2 text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Group stage (exact 1st or 2nd): 3 pts per team
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Group stage (both top-2, wrong exact position): 1 pt per team
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Group stage (exact 3rd or 4th): 2 pts per team
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Round of 32: 4 points per correct pick
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Round of 16: 6 points per correct pick
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Quarterfinals: 8 points per correct pick
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Semifinals: 12 points per correct pick
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Final/Champion: 20 points per correct pick
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
