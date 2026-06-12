import Link from "next/link";
import { Shield, Zap } from "lucide-react";
import type { GoalieCameraLeaderboardRow } from "@/src/lib/supabase/queries/goalie-leaderboard";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function formatReaction(ms: number | null): string {
  if (ms === null) return "—";
  return `${ms}ms`;
}


type Props = {
  entries: GoalieCameraLeaderboardRow[];
  error: string | null;
};

export default function GoalieLeaderboardSection({ entries, error }: Props) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-6 text-center">
        <p className="text-sm text-red-400">Error loading leaderboard: {error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-xl border border-white/10 bg-white/5 py-20 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-yellow-400/20 bg-gradient-to-b from-yellow-400/10 to-yellow-400/5 ring-4 ring-yellow-400/5">
          <Shield className="h-12 w-12 text-yellow-400/60" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-white">No goalie scores yet</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Be the first to play Goalie Reaction and claim the top spot.
          </p>
        </div>
        <Link
          href="/goalie"
          className="mt-2 flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
        >
          <Zap className="h-4 w-4" />
          Play Goalie Reaction
        </Link>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);

  return (
    <div>
      {/* Podium strip — top 3 */}
      {top3.length >= 3 && (
        <div className="mb-10 grid grid-cols-3 gap-3">
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            const heights = ["h-40", "h-44", "h-40"];
            const medals = ["🥈", "🥇", "🥉"];
            return (
              <div
                key={entry.id}
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
                  {entry.display_name || entry.username || "Unknown Player"}
                </p>
                <p
                  className={[
                    "text-base font-extrabold tabular-nums",
                    i === 1 ? "text-yellow-400" : "text-zinc-300",
                  ].join(" ")}
                >
                  {entry.score.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Table header */}
      <div className="mb-2 grid grid-cols-[2rem_1fr_5rem_4rem_5rem_5rem_4rem] items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        <div className="text-center">#</div>
        <div>Player</div>
        <div className="text-right">Score</div>
        <div className="hidden text-right sm:block">Saves</div>
        <div className="hidden text-right lg:block">Streak</div>
        <div className="hidden text-right lg:block">Avg React</div>
        <div className="hidden text-right lg:block">Date</div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {entries.map((entry) => {
          const rank = entry.rank ?? 0;
          const isTop3 = rank <= 3;
          const displayName = entry.display_name || entry.username || "Unknown Player";
          const initial = displayName.slice(0, 1).toUpperCase();

          return (
            <div
              key={entry.id}
              className={[
                "grid grid-cols-[2rem_1fr_5rem_4rem_5rem_5rem_4rem] items-center gap-2 rounded-xl border px-4 py-3.5 transition-all",
                isTop3
                  ? "border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10"
                  : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]",
              ].join(" ")}
            >
              {/* Rank */}
              <div className="text-center">
                {MEDAL[rank] ? (
                  <span className="text-lg">{MEDAL[rank]}</span>
                ) : (
                  <span className="text-xs font-bold text-zinc-500">#{rank}</span>
                )}
              </div>

              {/* Avatar + Name */}
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    isTop3
                      ? "bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/40"
                      : "bg-white/10 text-zinc-300",
                  ].join(" ")}
                >
                  {initial}
                </div>
                <p className="truncate text-sm font-semibold text-white">
                  {entry.display_name || entry.username || "Unknown Player"}
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p
                  className={[
                    "text-sm font-extrabold tabular-nums",
                    isTop3 ? "text-yellow-400" : "text-white",
                  ].join(" ")}
                >
                  {entry.score.toLocaleString()}
                </p>
              </div>

              {/* Saves */}
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold tabular-nums text-green-400">
                  {entry.saves}
                </p>
              </div>

              {/* Best streak */}
              <div className="hidden text-right lg:block">
                <p className="text-sm tabular-nums text-orange-400">{entry.best_streak}🔥</p>
              </div>

              {/* Avg reaction */}
              <div className="hidden text-right lg:block">
                <p className="text-xs tabular-nums text-sky-400">
                  {formatReaction(entry.avg_reaction_ms)}
                </p>
              </div>

              {/* Date */}
              <div className="hidden text-right lg:block">
                <p className="text-xs text-zinc-600">{timeAgo(entry.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-6 text-center">
        <p className="text-sm text-zinc-400">
          Think you can beat the top keepers? Step up and test your reflexes.
        </p>
        <Link
          href="/goalie"
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-7 py-3 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
        >
          <Zap className="h-4 w-4" />
          Play Goalie Reaction
        </Link>
      </div>
    </div>
  );
}
