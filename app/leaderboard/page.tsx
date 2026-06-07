import { Trophy, Flame } from "lucide-react";
import { fetchLeaderboard } from "@/src/lib/supabase/queries/leaderboard";
import LeaderboardRow from "@/src/components/leaderboard/LeaderboardRow";
import LeaderboardEmpty from "@/src/components/leaderboard/LeaderboardEmpty";

export const metadata = {
  title: "Leaderboard | GoldenXI",
};

export default async function LeaderboardPage() {
  const { data: entries, error } = await fetchLeaderboard(50);

  return (
    <div className="min-h-screen px-4 py-24">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-yellow-400">
            <Flame className="h-3.5 w-3.5" />
            Global Rankings
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Leader<span className="text-yellow-400">board</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            Rankings update as tournament results come in. Points are awarded
            for correct picks in each round.
          </p>
          {error && (
            <p className="mt-2 text-xs text-red-400/70">
              Error loading leaderboard: {error}
            </p>
          )}
        </div>

        {/* Top-3 podium strip */}
        {entries.length >= 3 && (
          <div className="mb-8 grid grid-cols-3 gap-3">
            {[entries[1], entries[0], entries[2]].map((entry, i) => {
              const heights = ["h-24", "h-32", "h-24"];
              const medals = ["🥈", "🥇", "🥉"];
              return (
                <div
                  key={entry.bracket_id}
                  className={[
                    "flex flex-col items-center justify-end gap-1.5 rounded-xl border px-3 pb-4 pt-3 transition",
                    i === 1
                      ? "border-yellow-400/40 bg-yellow-400/10"
                      : "border-white/10 bg-white/[0.04]",
                    heights[i],
                  ].join(" ")}
                >
                  <span className="text-2xl">{medals[i]}</span>
                  <p className="max-w-full truncate text-xs font-bold text-white">
                    {entry.username}
                  </p>
                  {entry.champion_flag && (
                    <span className="text-base">{entry.champion_flag}</span>
                  )}
                  <p
                    className={[
                      "text-sm font-extrabold tabular-nums",
                      i === 1 ? "text-yellow-400" : "text-zinc-300",
                    ].join(" ")}
                  >
                    {entry.total_score} pts
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Table header */}
        {entries.length > 0 && (
          <div className="mb-2 flex items-center gap-4 px-5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            <div className="w-8 shrink-0 text-center">#</div>
            <div className="w-9 shrink-0" />
            <div className="flex-1">Player / Bracket</div>
            <div className="hidden min-w-[110px] sm:block">Champion</div>
            <div className="w-14 shrink-0 text-right">Points</div>
            <div className="hidden w-16 shrink-0 text-right lg:block">Date</div>
          </div>
        )}

        {/* Rows */}
        {entries.length === 0 ? (
          <LeaderboardEmpty />
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <LeaderboardRow
                key={entry.bracket_id}
                entry={entry}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        {entries.length > 0 && (
          <p className="mt-8 text-center text-xs text-zinc-600">
            Points are calculated based on correct picks per round. Scoring
            activates once matches are marked complete.
          </p>
        )}
      </div>
    </div>
  );
}
