import { Trophy, Flame } from "lucide-react";
import { fetchLeaderboard } from "@/src/lib/supabase/queries/leaderboard";
import LeaderboardRow from "@/src/components/leaderboard/LeaderboardRow";
import LeaderboardEmpty from "@/src/components/leaderboard/LeaderboardEmpty";
import TeamFlag from "@/src/components/ui/TeamFlag";

export const metadata = {
  title: "Leaderboard | GoldenXI",
};

export default async function LeaderboardPage() {
  const { data: entries, error } = await fetchLeaderboard(50);

  return (
    <div className="relative min-h-screen px-4 py-24">
      {/* Background tournament energy */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-yellow-500/8 blur-3xl" />
      </div>
      
      <div className="relative mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-gradient-to-r from-blue-400/15 to-blue-500/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-blue-400 shadow-lg shadow-blue-400/10 ring-1 ring-blue-400/20">
            <Flame className="h-4 w-4" />
            Global Rankings
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Leader<span className="relative">
              <span className="absolute inset-0 blur-xl bg-gradient-to-r from-blue-400 to-yellow-400 opacity-30" />
              <span className="relative bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">board</span>
            </span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-zinc-400">
            Scoring begins when tournament results are entered.<br className="hidden sm:inline" />
            Correct picks earn more points in later rounds.
          </p>
          {error && (
            <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-xs font-semibold text-red-400 ring-1 ring-red-400/20">
              Error loading leaderboard: {error}
            </p>
          )}
        </div>

        {/* Top-3 podium strip */}
        {entries.length >= 3 && (
          <div className="mb-10 grid grid-cols-3 gap-3">
            {[entries[1], entries[0], entries[2]].map((entry, i) => {
              const heights = ["h-28", "h-36", "h-28"];
              const medals = ["🥈", "🥇", "🥉"];
              return (
                <div
                  key={entry.bracket_id}
                  className={[
                    "flex flex-col items-center justify-end gap-2 rounded-xl border px-3 pb-5 pt-4 transition-all duration-300 hover:scale-105",
                    i === 1
                      ? "border-yellow-400/40 bg-gradient-to-b from-yellow-400/10 to-yellow-400/5 ring-1 ring-yellow-400/20"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20",
                    heights[i],
                  ].join(" ")}
                >
                  <span className="text-3xl">{medals[i]}</span>
                  <p className="max-w-full truncate text-xs font-bold text-white">
                    {entry.username}
                  </p>
                  {entry.champion_name && (
                    <TeamFlag
                      name={entry.champion_name}
                      code={entry.champion_code || ""}
                      flag_emoji={entry.champion_flag}
                      flag_code={entry.champion_code}
                      size="md"
                    />
                  )}
                  <p
                    className={[
                      "text-base font-extrabold tabular-nums",
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
          <div className="mt-10 rounded-lg border border-blue-400/10 bg-blue-400/5 p-4 text-center">
            <p className="text-xs leading-relaxed text-zinc-500">
              Scoring begins when tournament results are entered. Correct picks earn more points in later rounds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
