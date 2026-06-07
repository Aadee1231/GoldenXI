"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCcw, Save, Trophy, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getBracketMatches } from "@/src/lib/supabase/queries/matches-client";
import { saveBracket, submitBracket, getUserBracket } from "@/src/lib/supabase/queries/brackets-client";
import type { BracketPickInput } from "@/src/lib/supabase/queries/brackets-client";
import type { Team } from "@/src/types";
import BracketRound from "./BracketRound";

// Match structure compatible with existing UI components
type UITeam = {
  id: string;
  name: string;
  code: string;
  flag: string;
  seed: number;
};

type UIMatch = {
  id: string; // Real UUID from database
  homeTeam: UITeam | null;
  awayTeam: UITeam | null;
  winnerId: string | null;
  round: "r16" | "qf" | "sf" | "final";
  matchIndex: number;
};

type BracketState = {
  r16: UIMatch[];
  qf: UIMatch[];
  sf: UIMatch[];
  final: UIMatch[];
  champion: UITeam | null;
};

const ROUNDS: Array<{ key: keyof Omit<BracketState, "champion">; label: string }> = [
  { key: "r16",   label: "Round of 16"  },
  { key: "qf",    label: "Quarterfinals" },
  { key: "sf",    label: "Semifinals"    },
  { key: "final", label: "Final"         },
];

function convertTeamToUI(team: Team | null, seed: number = 0): UITeam | null {
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    code: team.code,
    flag: team.flag_emoji || "🏳️",
    seed,
  };
}

function getTeamById(
  bracket: BracketState,
  teamId: string
) {
  for (const round of [bracket.r16, bracket.qf, bracket.sf, bracket.final]) {
    for (const match of round) {
      if (match.homeTeam?.id === teamId) return match.homeTeam;
      if (match.awayTeam?.id === teamId) return match.awayTeam;
    }
  }
  return undefined;
}

export default function BracketPageV2() {
  const [bracket, setBracket] = useState<BracketState | null>(null);
  const [bracketId, setBracketId] = useState<string | null>(null);
  const [bracketStatus, setBracketStatus] = useState<"draft" | "submitted" | "scored">("draft");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBracket, setIsLoadingBracket] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load bracket matches and existing picks on mount
  useEffect(() => {
    async function loadBracket() {
      console.log("🔄 Starting to load bracket...");
      setIsLoadingBracket(true);

      try {
        // Load matches from database
        console.log("📡 Fetching bracket matches...");
        const { data: matchesData, error: matchesError } = await getBracketMatches();
      
      console.log("📊 Matches data:", matchesData);
      console.log("❌ Matches error:", matchesError);
      
      if (matchesError || !matchesData) {
        console.error("Failed to load matches:", matchesError);
        setMessage({ type: "error", text: matchesError || "Failed to load matches. Please run the seed SQL." });
        setIsLoadingBracket(false);
        return;
      }

      // Convert to UI format
      const initialBracket: BracketState = {
        r16: matchesData.r16.map((m, i) => ({
          id: m.id,
          homeTeam: convertTeamToUI(m.homeTeam, i * 2 + 1),
          awayTeam: convertTeamToUI(m.awayTeam, i * 2 + 2),
          winnerId: null,
          round: "r16" as const,
          matchIndex: i,
        })),
        qf: matchesData.qf.map((m, i) => ({
          id: m.id,
          homeTeam: convertTeamToUI(m.homeTeam, 0),
          awayTeam: convertTeamToUI(m.awayTeam, 0),
          winnerId: null,
          round: "qf" as const,
          matchIndex: i,
        })),
        sf: matchesData.sf.map((m, i) => ({
          id: m.id,
          homeTeam: convertTeamToUI(m.homeTeam, 0),
          awayTeam: convertTeamToUI(m.awayTeam, 0),
          winnerId: null,
          round: "sf" as const,
          matchIndex: i,
        })),
        final: matchesData.final.map((m, i) => ({
          id: m.id,
          homeTeam: convertTeamToUI(m.homeTeam, 0),
          awayTeam: convertTeamToUI(m.awayTeam, 0),
          winnerId: null,
          round: "final" as const,
          matchIndex: i,
        })),
        champion: null,
      };

      // Load existing bracket picks
      console.log("📡 Fetching user bracket...");
      const { bracket: existingBracket, picks, error: picksError } = await getUserBracket();
      console.log("📥 User bracket result:", { existingBracket, picks, picksError });

      if (existingBracket && picks.length > 0) {
        console.log("📥 Loaded existing bracket:", existingBracket);
        console.log("📥 Loaded picks:", picks);

        setBracketId(existingBracket.id);
        setBracketStatus(existingBracket.status);

        // Apply picks to matches
        picks.forEach((pick) => {
          // Find match by UUID
          for (const roundKey of ["r16", "qf", "sf", "final"] as const) {
            const match = initialBracket[roundKey].find((m) => m.id === pick.match_id);
            if (match && pick.picked_team_id) {
              const team = getTeamById(initialBracket, pick.picked_team_id);
              if (team) {
                match.winnerId = pick.picked_team_id;

                // Advance to next round
                const roundOrder: Array<keyof Omit<BracketState, "champion">> = ["r16", "qf", "sf", "final"];
                const ri = roundOrder.indexOf(roundKey);
                const matchIdx = initialBracket[roundKey].findIndex((m) => m.id === pick.match_id);
                const nextRoundKey = roundOrder[ri + 1];

                if (nextRoundKey && matchIdx >= 0) {
                  const nextMatches = initialBracket[nextRoundKey];
                  const nextMatchIdx = Math.floor(matchIdx / 2);
                  const isHome = matchIdx % 2 === 0;

                  if (nextMatchIdx < nextMatches.length) {
                    if (isHome) {
                      nextMatches[nextMatchIdx].homeTeam = team;
                    } else {
                      nextMatches[nextMatchIdx].awayTeam = team;
                    }
                  }
                }

                // Set champion if final
                if (roundKey === "final") {
                  initialBracket.champion = team;
                }
              }
            }
          }
        });
      }

        console.log("✅ Bracket loaded successfully:", initialBracket);
        setBracket(initialBracket);
        setIsLoadingBracket(false);
      } catch (err) {
        console.error("💥 Error in loadBracket:", err);
        setMessage({ type: "error", text: `Error loading bracket: ${err instanceof Error ? err.message : String(err)}` });
        setIsLoadingBracket(false);
      }
    }

    loadBracket();
  }, []);

  const handlePick = useCallback(
    (matchId: string, teamId: string) => {
      if (bracketStatus === "submitted") {
        setMessage({ type: "error", text: "Cannot modify a submitted bracket" });
        return;
      }

      if (!bracket) return;

      setBracket((prev) => {
        if (!prev) return prev;

        const next: BracketState = {
          r16:      prev.r16.map((m) => ({ ...m })),
          qf:       prev.qf.map((m) => ({ ...m })),
          sf:       prev.sf.map((m) => ({ ...m })),
          final:    prev.final.map((m) => ({ ...m })),
          champion: prev.champion,
        };

        const roundOrder: Array<keyof Omit<BracketState, "champion">> = [
          "r16", "qf", "sf", "final",
        ];

        for (let ri = 0; ri < roundOrder.length; ri++) {
          const roundKey = roundOrder[ri];
          const matches = next[roundKey];
          const matchIdx = matches.findIndex((m) => m.id === matchId);
          if (matchIdx === -1) continue;

          const match = matches[matchIdx];
          const prevWinnerId = match.winnerId;

          match.winnerId = teamId;

          const winner = getTeamById(next, teamId);
          if (!winner) break;

          const nextRoundKey = roundOrder[ri + 1];
          const isLastRound = roundKey === "final";

          if (isLastRound) {
            next.champion = winner ?? null;
            break;
          }

          if (!nextRoundKey) break;
          const nextMatches = next[nextRoundKey];
          const nextMatchIdx = Math.floor(matchIdx / 2);
          const isHome = matchIdx % 2 === 0;

          const nextMatch = nextMatches[nextMatchIdx];

          if (isHome) {
            if (prevWinnerId && prevWinnerId !== teamId) {
              nextMatch.homeTeam = winner;
              nextMatch.winnerId = null;
              clearDownstream(next, roundOrder, ri + 1, nextMatchIdx);
            } else {
              nextMatch.homeTeam = winner;
            }
          } else {
            if (prevWinnerId && prevWinnerId !== teamId) {
              nextMatch.awayTeam = winner;
              nextMatch.winnerId = null;
              clearDownstream(next, roundOrder, ri + 1, nextMatchIdx);
            } else {
              nextMatch.awayTeam = winner;
            }
          }

          break;
        }

        return next;
      });
    },
    [bracketStatus, bracket]
  );

  const handleReset = async () => {
    if (bracketStatus === "submitted") {
      setMessage({ type: "error", text: "Cannot reset a submitted bracket" });
      return;
    }

    // Reload fresh matches
    setIsLoadingBracket(true);
    const { data: matchesData, error } = await getBracketMatches();
    
    if (error || !matchesData) {
      setMessage({ type: "error", text: "Failed to reset bracket" });
      setIsLoadingBracket(false);
      return;
    }

    const freshBracket: BracketState = {
      r16: matchesData.r16.map((m, i) => ({
        id: m.id,
        homeTeam: convertTeamToUI(m.homeTeam),
        awayTeam: convertTeamToUI(m.awayTeam),
        winnerId: null,
        round: "r16" as const,
        matchIndex: i,
      })),
      qf: matchesData.qf.map((m, i) => ({
        id: m.id,
        homeTeam: null,
        awayTeam: null,
        winnerId: null,
        round: "qf" as const,
        matchIndex: i,
      })),
      sf: matchesData.sf.map((m, i) => ({
        id: m.id,
        homeTeam: null,
        awayTeam: null,
        winnerId: null,
        round: "sf" as const,
        matchIndex: i,
      })),
      final: matchesData.final.map((m, i) => ({
        id: m.id,
        homeTeam: null,
        awayTeam: null,
        winnerId: null,
        round: "final" as const,
        matchIndex: i,
      })),
      champion: null,
    };

    setBracket(freshBracket);
    setMessage(null);
    setIsLoadingBracket(false);
  };

  const getPicksFromBracket = (): BracketPickInput[] => {
    if (!bracket) return [];

    const picks: BracketPickInput[] = [];

    ROUNDS.forEach(({ key }) => {
      bracket[key].forEach((match) => {
        if (match.winnerId) {
          picks.push({
            match_id: match.id, // Real UUID
            picked_team_id: match.winnerId,
            round: key as "r16" | "qf" | "sf" | "final",
          });
        }
      });
    });

    return picks;
  };

  const handleSave = async () => {
    if (bracketStatus === "submitted") {
      setMessage({ type: "error", text: "Cannot modify a submitted bracket" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const picks = getPicksFromBracket();
    const result = await saveBracket(picks, "My Bracket");

    if (result.success && result.bracket) {
      setBracketId(result.bracket.id);
      setMessage({ type: "success", text: "Bracket saved successfully!" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to save bracket" });
    }

    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (bracketStatus === "submitted") {
      setMessage({ type: "error", text: "Bracket already submitted" });
      return;
    }

    const picks = getPicksFromBracket();
    const totalMatches = 8 + 4 + 2 + 1;

    if (picks.length < totalMatches) {
      setMessage({ type: "error", text: `Please complete all ${totalMatches} picks before submitting` });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const result = await submitBracket(picks, "My Bracket");

    if (result.success && result.bracket) {
      setBracketId(result.bracket.id);
      setBracketStatus("submitted");
      setMessage({ type: "success", text: "Bracket submitted successfully! Good luck!" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to submit bracket" });
    }

    setIsLoading(false);
  };

  if (isLoadingBracket || !bracket) {
    return (
      <div className="min-h-screen px-4 py-24">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
          <span className="ml-3 text-zinc-400">Loading bracket...</span>
        </div>
      </div>
    );
  }

  const pickedCount =
    bracket.r16.filter((m) => m.winnerId).length +
    bracket.qf.filter((m) => m.winnerId).length +
    bracket.sf.filter((m) => m.winnerId).length +
    bracket.final.filter((m) => m.winnerId).length;

  const totalMatches = 8 + 4 + 2 + 1;
  const isComplete = pickedCount === totalMatches;

  return (
    <div className="min-h-screen px-4 py-24">
      {/* Header */}
      <div className="mx-auto mb-10 max-w-fit text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Build Your <span className="text-yellow-400">Bracket</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Click a team to advance them. Pick all {totalMatches} matches to crown your champion.
        </p>

        {/* Status badge */}
        {bracketStatus === "submitted" && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-1 text-sm font-medium text-green-400">
            <CheckCircle className="h-4 w-4" />
            Bracket Submitted
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-5 h-1.5 w-64 overflow-hidden rounded-full bg-white/10 mx-auto">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${(pickedCount / totalMatches) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          {pickedCount} / {totalMatches} picks made
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-auto mb-6 max-w-fit rounded-lg border px-4 py-3 ${
          message.type === "success"
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Bracket grid */}
      <div className="mx-auto w-full max-w-[1100px] overflow-x-auto pb-4">
        <div className="flex min-w-[820px] items-start justify-between gap-4 px-2">
          {ROUNDS.map(({ key }) => (
            <BracketRound
              key={key}
              roundKey={key}
              matches={bracket[key]}
              onPick={handlePick}
            />
          ))}

          {/* Champion column */}
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-400">
                Champion
              </span>
            </div>
            <div className="flex min-h-[90px] items-center justify-center">
              {bracket.champion ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-yellow-400/50 bg-yellow-400/10 px-5 py-4 ring-1 ring-yellow-400/20">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  <span className="text-2xl">{bracket.champion.flag}</span>
                  <span className="text-sm font-bold text-yellow-300">
                    {bracket.champion.name}
                  </span>
                </div>
              ) : (
                <div className="flex h-24 w-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                  <Trophy className="h-5 w-5 text-zinc-600" />
                  <span className="text-xs text-zinc-600 italic">TBD</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading || bracketStatus === "submitted"}
          className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Bracket
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || bracketStatus === "submitted"}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Bracket
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || bracketStatus === "submitted" || !isComplete}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
            bracketStatus === "submitted"
              ? "bg-green-500 text-white"
              : isComplete
              ? "bg-green-500 text-white hover:bg-green-400"
              : "bg-zinc-600 text-zinc-300"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : bracketStatus === "submitted" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {bracketStatus === "submitted" ? "Submitted" : "Submit Bracket"}
        </button>
      </div>

      {/* Help text */}
      {bracketStatus !== "submitted" && !isComplete && (
        <p className="mt-4 text-center text-xs text-zinc-500">
          Complete all {totalMatches} picks to enable submission
        </p>
      )}

      {bracketId && (
        <p className="mt-2 text-center text-xs text-zinc-600">
          Bracket ID: {bracketId}
        </p>
      )}
    </div>
  );
}

function clearDownstream(
  bracket: BracketState,
  roundOrder: Array<keyof Omit<BracketState, "champion">>,
  fromRoundIdx: number,
  fromMatchIdx: number
) {
  for (let ri = fromRoundIdx; ri < roundOrder.length; ri++) {
    const roundKey = roundOrder[ri];
    const matches = bracket[roundKey];

    if (ri === fromRoundIdx) {
      const match = matches[fromMatchIdx];
      match.winnerId = null;

      const nextRoundKey = roundOrder[ri + 1];
      if (nextRoundKey) {
        const nextMatches = bracket[nextRoundKey];
        const nextMatchIdx = Math.floor(fromMatchIdx / 2);
        const isHome = fromMatchIdx % 2 === 0;

        if (nextMatchIdx < nextMatches.length) {
          const nextMatch = nextMatches[nextMatchIdx];
          if (isHome) {
            nextMatch.homeTeam = null;
          } else {
            nextMatch.awayTeam = null;
          }
        }
      }
    } else {
      matches.forEach((m) => {
        m.winnerId = null;
        m.homeTeam = null;
        m.awayTeam = null;
      });
    }
  }

  bracket.champion = null;
}
