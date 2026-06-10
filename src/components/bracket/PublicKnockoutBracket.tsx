import TeamFlag from "@/src/components/ui/TeamFlag";
import type {
  ReconstructedRound,
  ReconstructedMatch,
  ReconstructedTeam,
} from "@/src/lib/world-cup-2026/reconstruct-bracket";

function TeamRow({
  team,
  isWinner,
}: {
  team: ReconstructedTeam | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-2 px-2.5 py-1.5",
        isWinner ? "bg-yellow-400/15" : "",
      ].join(" ")}
    >
      {team ? (
        <>
          <TeamFlag
            name={team.name}
            code={team.code}
            flag_emoji={team.flag_emoji}
            flag_code={team.flag_code}
            size="sm"
          />
          <span
            className={[
              "truncate text-xs",
              isWinner ? "font-bold text-yellow-300" : "font-medium text-zinc-300",
            ].join(" ")}
          >
            {team.name}
          </span>
        </>
      ) : (
        <span className="text-xs italic text-zinc-600">TBD</span>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: ReconstructedMatch }) {
  return (
    <div className="w-40 overflow-hidden rounded-md border border-white/10 bg-black/40 ring-1 ring-black/20">
      <TeamRow team={match.homeTeam} isWinner={!!match.winnerId && match.winnerId === match.homeTeam?.id} />
      <div className="h-px bg-white/10" />
      <TeamRow team={match.awayTeam} isWinner={!!match.winnerId && match.winnerId === match.awayTeam?.id} />
    </div>
  );
}

export default function PublicKnockoutBracket({
  rounds,
}: {
  rounds: ReconstructedRound[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">
        Knockout Bracket
      </h2>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-4">
          {rounds.map((round, roundIndex) => (
            <div key={round.round} className="flex flex-col">
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {round.label}
              </p>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {round.matches.map((match) => (
                  <div key={match.id} className="flex items-center">
                    <MatchCard match={match} />
                    {roundIndex < rounds.length - 1 && (
                      <div className="h-px w-4 bg-white/15" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
