"use client";

import { useState, useEffect } from "react";
import { getTeamsByGroup } from "@/src/lib/supabase/queries/group-picks-client";
import { getKnockoutMatches } from "@/src/lib/supabase/queries/brackets-client";
import { createClient } from "@/src/lib/supabase/client";
import TeamFlag from "@/src/components/ui/TeamFlag";
import type { GroupRankingInput, Match } from "@/src/types";
import { buildOfficialRoundOf32 } from "@/src/lib/world-cup-2026";
import type { QualifiedTeam } from "@/src/lib/world-cup-2026";

type KnockoutBracketStepProps = {
  groupRankings: GroupRankingInput[];
  thirdPlacePicks: string[];
  picks: Record<string, string | null>;
  onChange: (picks: Record<string, string | null>) => void;
  onRegisterSave: (callback: () => Promise<void>) => void;
  onRegisterAutoPick: (callback: () => void) => void;
  onRoundChange?: (round: "r32" | "r16" | "qf" | "sf" | "final", canAdvance: boolean) => void;
};

type MatchDisplay = {
  id: string;
  round: string;
  matchNumber?: number;
  homeTeam: QualifiedTeam | null;
  awayTeam: QualifiedTeam | null;
  winnerId: string | null;
  date?: string;
  displayDate?: string;
  stadium?: string;
  city?: string;
  templateDebug?: string;
};

export default function KnockoutBracketStep({
  groupRankings,
  thirdPlacePicks,
  picks,
  onChange,
  onRegisterSave,
  onRegisterAutoPick,
  onRoundChange,
}: KnockoutBracketStepProps) {
  const [qualifiedTeams, setQualifiedTeams] = useState<QualifiedTeam[]>([]);
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [bracketId, setBracketId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<"r32" | "r16" | "qf" | "sf" | "final">("r32");

  useEffect(() => {
    loadData();
  }, [groupRankings, thirdPlacePicks]);

  useEffect(() => {
    onRegisterSave(handleSave);
    onRegisterAutoPick(handleAutoPick);
    // matches & currentRound are included so auto-pick targets the round the
    // user is viewing and works as soon as matchups are built (clean state).
  }, [picks, matches, currentRound, bracketId]);

  useEffect(() => {
    rebuildMatches();
  }, [picks, qualifiedTeams]);

  useEffect(() => {
    if (!onRoundChange) return;
    
    const currentRoundMatches = matches.filter((m) => m.round === currentRound);
    const isCurrentRoundComplete = currentRoundMatches.length > 0 && currentRoundMatches.every((m) => picks[m.id]);
    
    onRoundChange(currentRound, isCurrentRoundComplete);
  }, [currentRound, picks, matches, onRoundChange]);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tournaments } = await supabase
      .from("tournaments")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    if (!tournaments || tournaments.length === 0) {
      setLoading(false);
      return;
    }

    const tournamentId = tournaments[0].id;

    const { data: brackets } = await supabase
      .from("brackets")
      .select("id")
      .eq("user_id", user.id)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (brackets && brackets.length > 0) {
      setBracketId(brackets[0].id);

      const { data: existingPicks } = await supabase
        .from("bracket_picks")
        .select("*")
        .eq("bracket_id", brackets[0].id);

      if (existingPicks && existingPicks.length > 0) {
        const picksMap: Record<string, string | null> = {};
        existingPicks.forEach((pick) => {
          picksMap[pick.match_id] = pick.picked_team_id;
        });
        onChange(picksMap);
      }
    }

    const { data: teamsData } = await getTeamsByGroup(tournamentId);
    const { data: knockoutMatches } = await getKnockoutMatches(tournamentId);

    if (teamsData && knockoutMatches) {
      try {
        const { matches: r32Matches, qualifiedTeams: qualified, annexCMode, annexCKey } = buildOfficialRoundOf32(
          groupRankings,
          teamsData,
          thirdPlacePicks
        );

        if (process.env.NODE_ENV === "development") {
          console.log("[GoldenXI] Annex C Key:", annexCKey);
          console.log("[GoldenXI] Annex C Mode:", annexCMode);
        }

        setQualifiedTeams(qualified);

        const r32DbMatches = knockoutMatches.filter((m) => m.round === "r32");
        const r16Matches = knockoutMatches.filter((m) => m.round === "r16");
        const qfMatches = knockoutMatches.filter((m) => m.round === "qf");
        const sfMatches = knockoutMatches.filter((m) => m.round === "sf");
        const finalMatches = knockoutMatches.filter((m) => m.round === "final");

        const r32Display: MatchDisplay[] = r32Matches.map((templateMatch, index) => {
          const dbMatch = r32DbMatches[index];
          return {
            id: dbMatch?.id || `r32-${index}`,
            round: "r32",
            matchNumber: templateMatch.matchNumber,
            homeTeam: templateMatch.homeTeam,
            awayTeam: templateMatch.awayTeam,
            winnerId: dbMatch ? picks[dbMatch.id] || null : null,
            date: templateMatch.date,
            displayDate: templateMatch.displayDate,
            stadium: templateMatch.stadium,
            city: templateMatch.city,
            templateDebug: templateMatch.templateDebug,
          };
        });

        const buildNextRound = (
          prevRoundMatches: MatchDisplay[],
          nextRoundDbMatches: Match[],
          round: string
        ): MatchDisplay[] => {
          const nextRoundDisplays: MatchDisplay[] = [];
          const numMatches = nextRoundDbMatches.length;

          for (let i = 0; i < numMatches; i++) {
            const match1 = prevRoundMatches[i * 2];
            const match2 = prevRoundMatches[i * 2 + 1];

            const homeTeam =
              match1 && match1.winnerId
                ? qualified.find((t) => t.id === match1.winnerId) || null
                : null;
            const awayTeam =
              match2 && match2.winnerId
                ? qualified.find((t) => t.id === match2.winnerId) || null
                : null;

            const dbMatch = nextRoundDbMatches[i];

            if (dbMatch) {
              nextRoundDisplays.push({
                id: dbMatch.id,
                round,
                homeTeam,
                awayTeam,
                winnerId: picks[dbMatch.id] || null,
              });
            }
          }

          return nextRoundDisplays;
        };

        const r16Display = buildNextRound(r32Display, r16Matches, "r16");
        const qfDisplay = buildNextRound(r16Display, qfMatches, "qf");
        const sfDisplay = buildNextRound(qfDisplay, sfMatches, "sf");
        const finalDisplay = buildNextRound(sfDisplay, finalMatches, "final");

        setMatches([...r32Display, ...r16Display, ...qfDisplay, ...sfDisplay, ...finalDisplay]);
      } catch (error) {
        console.error("Error building official bracket:", error);
      }
    }

    setLoading(false);
  };

  const rebuildMatches = () => {
    if (qualifiedTeams.length === 0 || matches.length === 0) return;

    const r32Matches = matches.filter((m) => m.round === "r32");
    const r16Matches = matches.filter((m) => m.round === "r16");
    const qfMatches = matches.filter((m) => m.round === "qf");
    const sfMatches = matches.filter((m) => m.round === "sf");
    const finalMatches = matches.filter((m) => m.round === "final");

    const buildNextRound = (
      prevRoundMatches: MatchDisplay[],
      nextRoundMatches: MatchDisplay[]
    ): MatchDisplay[] => {
      return nextRoundMatches.map((match, i) => {
        const match1 = prevRoundMatches[i * 2];
        const match2 = prevRoundMatches[i * 2 + 1];

        const homeTeam =
          match1 && match1.winnerId
            ? qualifiedTeams.find((t) => t.id === match1.winnerId) || null
            : null;
        const awayTeam =
          match2 && match2.winnerId
            ? qualifiedTeams.find((t) => t.id === match2.winnerId) || null
            : null;

        return {
          ...match,
          homeTeam,
          awayTeam,
          winnerId: picks[match.id] || null,
        };
      });
    };

    const updatedR32 = r32Matches.map((m) => ({ ...m, winnerId: picks[m.id] || null }));
    const updatedR16 = buildNextRound(updatedR32, r16Matches);
    const updatedQF = buildNextRound(updatedR16, qfMatches);
    const updatedSF = buildNextRound(updatedQF, sfMatches);
    const updatedFinal = buildNextRound(updatedSF, finalMatches);

    setMatches([...updatedR32, ...updatedR16, ...updatedQF, ...updatedSF, ...updatedFinal]);
  };

  const handlePickWinner = (matchId: string, teamId: string | null) => {
    const updated = { ...picks, [matchId]: teamId };
    onChange(updated);
  };

  const handleSave = async () => {
    if (!bracketId) return;

    const supabase = createClient();
    await supabase.from("bracket_picks").delete().eq("bracket_id", bracketId);

    const picksToInsert = Object.entries(picks)
      .filter(([, teamId]) => teamId !== null)
      .map(([matchId, teamId]) => ({
        bracket_id: bracketId,
        match_id: matchId,
        picked_team_id: teamId,
      }));

    if (picksToInsert.length > 0) {
      await supabase.from("bracket_picks").insert(picksToInsert);
    }
  };

  const handleAutoPick = () => {
    const newPicks = { ...picks };
    
    const currentRoundMatches = matches.filter((m) => m.round === currentRound);
    
    currentRoundMatches.forEach((match) => {
      if (match.homeTeam && match.awayTeam) {
        const randomWinner = Math.random() < 0.5 ? match.homeTeam.id : match.awayTeam.id;
        newPicks[match.id] = randomWinner;
      }
    });

    onChange(newPicks);
  };

  const getRoundMatches = (round: string) => matches.filter((m) => m.round === round);

  const r32Matches = getRoundMatches("r32");
  const r16Matches = getRoundMatches("r16");
  const qfMatches = getRoundMatches("qf");
  const sfMatches = getRoundMatches("sf");
  const finalMatches = getRoundMatches("final");

  const totalPicks = Object.values(picks).filter((p) => p !== null).length;
  const r32Complete = r32Matches.every((m) => picks[m.id]);
  const r16Complete = r16Matches.every((m) => picks[m.id]);
  const qfComplete = qfMatches.every((m) => picks[m.id]);
  const sfComplete = sfMatches.every((m) => picks[m.id]);
  const finalComplete = finalMatches.every((m) => picks[m.id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading knockout bracket...</div>
      </div>
    );
  }

  if (qualifiedTeams.length < 32) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">
          Please complete group rankings and third-place selections first.
        </div>
      </div>
    );
  }

  const rounds = [
    { id: "r32", label: "Round of 32", matches: r32Matches, complete: r32Complete },
    { id: "r16", label: "Round of 16", matches: r16Matches, complete: r16Complete },
    { id: "qf", label: "Quarter Finals", matches: qfMatches, complete: qfComplete },
    { id: "sf", label: "Semi Finals", matches: sfMatches, complete: sfComplete },
    { id: "final", label: "Final", matches: finalMatches, complete: finalComplete },
  ];

  const currentRoundData = rounds.find((r) => r.id === currentRound);

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-400 mb-4">
          Pick the winner of each match from Round of 32 through to the Final.
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-gray-400">Total picks: </span>
            <span className="font-semibold text-white">{totalPicks} / 31</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {rounds.map((round) => (
            <button
              key={round.id}
              onClick={() => setCurrentRound(round.id as typeof currentRound)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                currentRound === round.id
                  ? "bg-yellow-400 text-black"
                  : round.complete
                  ? "bg-green-900/30 text-green-400 border border-green-600"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {round.label}
              {round.complete && " ✓"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentRoundData?.matches.map((match, index) => (
          <div
            key={match.id}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4 relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-400">
                {match.matchNumber ? `Match ${match.matchNumber}` : `Match ${index + 1}`}
              </div>
              {match.stadium && match.city && (
                <div className="text-xs text-gray-500">
                  {match.stadium} · {match.city}
                </div>
              )}
            </div>

            {match.displayDate && (
              <div className="text-xs text-gray-400 mb-2">
                {match.displayDate}
              </div>
            )}

            <div className="space-y-2">
              {[match.homeTeam, match.awayTeam].map((team) => {
                if (!team) {
                  return (
                    <div
                      key={`tbd-${Math.random()}`}
                      className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-700 opacity-50"
                    >
                      <div className="text-xl">❓</div>
                      <div className="flex-1 text-sm text-gray-500">TBD</div>
                    </div>
                  );
                }

                const isWinner = match.winnerId === team.id;

                return (
                  <button
                    key={team.id}
                    onClick={() => handlePickWinner(match.id, team.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded border-2 transition-all ${
                      isWinner
                        ? "bg-green-900/30 border-green-600 shadow-lg"
                        : "bg-gray-900 border-gray-700 hover:border-yellow-400/50"
                    }`}
                  >
                    <TeamFlag
                      name={team.name}
                      code={team.code}
                      flag_emoji={team.flag_emoji}
                      flag_code={team.flag_code}
                      size="md"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white text-sm">{team.name}</div>
                      <div className="text-xs text-gray-400">{team.slotLabel}</div>
                    </div>
                    {isWinner && (
                      <div className="text-green-400 font-bold text-sm">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {process.env.NODE_ENV === "development" && match.templateDebug && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-500">
                  Template: {match.templateDebug}
                </div>
              </div>
            )}
            
            {match.winnerId && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-green-400 text-center">
                  Advances to next round
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
