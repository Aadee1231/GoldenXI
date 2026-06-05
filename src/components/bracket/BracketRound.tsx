"use client";

import type { MockMatch } from "@/src/lib/mock-data/tournament";
import BracketMatch from "./BracketMatch";

const ROUND_LABELS: Record<string, string> = {
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  final: "Final",
};

type Props = {
  roundKey: string;
  matches: MockMatch[];
  onPick: (matchId: string, teamId: string) => void;
};

export default function BracketRound({ roundKey, matches, onPick }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-400">
          {ROUND_LABELS[roundKey] ?? roundKey}
        </span>
      </div>

      <div
        className="flex flex-col justify-around gap-2"
        style={{ minHeight: `${matches.length * 90}px` }}
      >
        {matches.map((match) => (
          <BracketMatch key={match.id} match={match} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}
