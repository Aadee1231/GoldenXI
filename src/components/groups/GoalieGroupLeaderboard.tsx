import Link from "next/link";
import { Shield, Zap } from "lucide-react";
import type { GoalieCameraLeaderboardRow } from "@/src/lib/supabase/queries/goalie-leaderboard";

const MEDAL_CLASS: Record<number, string> = {
  0: "bg-yellow-400/20 border-yellow-400/50",
  1: "bg-zinc-300/10 border-zinc-300/50",
  2: "bg-amber-700/20 border-amber-700/50",
};

const MEDAL_ICON: Record<number, string> = {
  0: "🥇",
  1: "🥈",
  2: "🥉",
};

function formatReaction(ms: number | null): string {
  if (ms === null) return "—";
  return `${ms}ms`;
}

function formatAccuracy(saves: number, shotsFaced: number | null): string {
  if (!shotsFaced || shotsFaced === 0) return "0%";
  return `${Math.round((saves / shotsFaced) * 100)}%`;
}

interface Props {
  entries: GoalieCameraLeaderboardRow[];
  currentUserId: string;
}

export default function GoalieGroupLeaderboard({ entries, currentUserId }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-xl border border-white/10 bg-white/5 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-400/5">
          <Shield className="h-8 w-8 text-yellow-400/50" />
        </div>
        <div>
          <p className="font-semibold text-zinc-300">No one in this group has played Goalie Reaction yet.</p>
          <p className="mt-1 text-sm text-zinc-500">Be the first to set a score!</p>
        </div>
        <Link
          href="/goalie"
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-black shadow shadow-yellow-400/20 transition hover:bg-yellow-300"
        >
          <Zap className="h-4 w-4" />
          Play Goalie Reaction
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/5">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.user_id === currentUserId;
          const rankClass = MEDAL_CLASS[index] ?? "bg-white/5 border-white/10";
          const medal = MEDAL_ICON[index];

          return (
            <li
              key={entry.id}
              className={`flex items-center gap-4 p-4 ${isCurrentUser ? "bg-yellow-400/5" : ""}`}
            >
              {/* Rank */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${rankClass}`}>
                {medal ?? (
                  <span className="font-medium text-zinc-500">{index + 1}</span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {entry.display_name || "Unknown Player"}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-zinc-500">(you)</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {entry.saves} saves · {formatAccuracy(entry.saves, entry.shots_faced)} accuracy
                </p>
              </div>

              {/* Stats — hidden on mobile */}
              <div className="hidden sm:flex items-center gap-4 text-right text-xs text-zinc-400">
                <div>
                  <p className="font-semibold text-orange-400">{entry.best_streak}🔥</p>
                  <p className="text-zinc-600">streak</p>
                </div>
                <div>
                  <p className="font-semibold text-sky-400">{formatReaction(entry.avg_reaction_ms)}</p>
                  <p className="text-zinc-600">avg react</p>
                </div>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className={`text-lg font-bold tabular-nums ${
                  index === 0 ? "text-yellow-400" : "text-white"
                }`}>
                  {entry.score.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">pts</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* CTA */}
      <div className="flex items-center justify-between rounded-xl border border-yellow-400/10 bg-yellow-400/5 px-5 py-3.5">
        <p className="text-sm text-zinc-400">Challenge your group in Goalie Reaction</p>
        <Link
          href="/goalie"
          className="flex items-center gap-1.5 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-black transition hover:bg-yellow-300"
        >
          <Zap className="h-3.5 w-3.5" />
          Play Now
        </Link>
      </div>
    </div>
  );
}
