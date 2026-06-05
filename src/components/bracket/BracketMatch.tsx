"use client";

import type { MockMatch } from "@/src/lib/mock-data/tournament";
import TeamSlot from "./TeamSlot";

type Props = {
  match: MockMatch;
  onPick: (matchId: string, teamId: string) => void;
};

export default function BracketMatch({ match, onPick }: Props) {
  const { homeTeam, awayTeam, winnerId } = match;
  const hasTeams = homeTeam !== null && awayTeam !== null;

  return (
    <div className="flex w-48 flex-col gap-0.5">
      <TeamSlot
        team={homeTeam}
        isWinner={winnerId === homeTeam?.id}
        isEliminated={winnerId !== null && winnerId !== homeTeam?.id}
        isClickable={hasTeams && winnerId !== homeTeam?.id}
        onClick={() => homeTeam && onPick(match.id, homeTeam.id)}
      />
      <div className="mx-3 h-px bg-white/10" />
      <TeamSlot
        team={awayTeam}
        isWinner={winnerId === awayTeam?.id}
        isEliminated={winnerId !== null && winnerId !== awayTeam?.id}
        isClickable={hasTeams && winnerId !== awayTeam?.id}
        onClick={() => awayTeam && onPick(match.id, awayTeam.id)}
      />
    </div>
  );
}
