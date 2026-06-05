"use client";

import { useState, useCallback } from "react";
import { RotateCcw, Save, Trophy } from "lucide-react";
import {
  createInitialBracket,
  type BracketState,
  type MockTeam,
} from "@/src/lib/mock-data/tournament";
import BracketRound from "./BracketRound";

const ROUNDS: Array<{ key: keyof Omit<BracketState, "champion">; label: string }> = [
  { key: "r16",   label: "Round of 16"  },
  { key: "qf",    label: "Quarterfinals" },
  { key: "sf",    label: "Semifinals"    },
  { key: "final", label: "Final"         },
];

function getTeamById(
  bracket: BracketState,
  teamId: string
): MockTeam | undefined {
  for (const round of [bracket.r16, bracket.qf, bracket.sf, bracket.final]) {
    for (const match of round) {
      if (match.homeTeam?.id === teamId) return match.homeTeam;
      if (match.awayTeam?.id === teamId) return match.awayTeam;
    }
  }
  return undefined;
}

export default function BracketPage() {
  const [bracket, setBracket] = useState<BracketState>(createInitialBracket);
  const [saveFlash, setSaveFlash] = useState(false);

  const handlePick = useCallback(
    (matchId: string, teamId: string) => {
      setBracket((prev) => {
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
    []
  );

  const handleReset = () => setBracket(createInitialBracket());

  const handleSave = () => {
    const picks = [
      ...bracket.r16,
      ...bracket.qf,
      ...bracket.sf,
      ...bracket.final,
    ]
      .filter((m) => m.winnerId !== null)
      .map((m) => ({
        matchId: m.id,
        round: m.round,
        pickedTeamId: m.winnerId,
        pickedTeamName:
          getTeamById(bracket, m.winnerId!)?.name ?? "Unknown",
      }));

    console.log("💾 Bracket picks:", picks);
    console.log("🏆 Champion:", bracket.champion);

    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  };

  const pickedCount =
    bracket.r16.filter((m) => m.winnerId).length +
    bracket.qf.filter((m) => m.winnerId).length +
    bracket.sf.filter((m) => m.winnerId).length +
    bracket.final.filter((m) => m.winnerId).length;

  const totalMatches = 8 + 4 + 2 + 1;

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
      <div className="mt-10 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Bracket
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={[
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition",
            saveFlash
              ? "bg-green-400 text-black"
              : "bg-yellow-400 text-black hover:bg-yellow-300",
          ].join(" ")}
        >
          <Save className="h-4 w-4" />
          {saveFlash ? "Saved to Console!" : "Save Bracket"}
        </button>
      </div>

      {bracket.champion && (
        <p className="mt-4 text-center text-xs text-zinc-500">
          Picks logged to browser console — Supabase save coming soon.
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
  let matchIdx = fromMatchIdx;
  for (let ri = fromRoundIdx; ri < roundOrder.length; ri++) {
    const roundKey = roundOrder[ri];
    const matches = bracket[roundKey];
    if (matchIdx >= matches.length) break;
    const m = matches[matchIdx];
    m.winnerId = null;

    if (ri === roundOrder.length - 1) {
      bracket.champion = null;
    }

    matchIdx = Math.floor(matchIdx / 2);
  }
}
