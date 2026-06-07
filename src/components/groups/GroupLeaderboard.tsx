import { Medal } from "lucide-react";
import type { LeaderboardEntry } from "@/src/types";

interface GroupLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export default function GroupLeaderboard({ 
  entries, 
  currentUserId 
}: GroupLeaderboardProps) {
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-400/20 border-yellow-400/50";
      case 1:
        return "bg-zinc-300/10 border-zinc-300/50";
      case 2:
        return "bg-amber-700/20 border-amber-700/50";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Medal className="h-5 w-5 text-yellow-400" />;
      case 1:
        return <Medal className="h-5 w-5 text-zinc-300" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center text-sm font-medium text-zinc-500">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      {entries.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-zinc-400">No members yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {entries.map((entry, index) => {
            const isCurrentUser = entry.user_id === currentUserId;
            const hasBracket = !!entry.bracket_id;

            return (
              <li
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 ${
                  isCurrentUser ? "bg-yellow-400/5" : ""
                }`}
              >
                {/* Rank */}
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${getRankStyle(index)}`}>
                  {getRankIcon(index)}
                </div>

                {/* User */}
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {entry.display_name || entry.username || "Unknown Player"}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-zinc-500">(you)</span>
                    )}
                  </p>
                  {!hasBracket && (
                    <p className="text-xs text-zinc-500">No bracket submitted</p>
                  )}
                  {hasBracket && entry.champion_name && (
                    <p className="text-xs text-zinc-500">
                      {entry.champion_flag} {entry.champion_name}
                    </p>
                  )}
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    entry.total_score > 0 ? "text-yellow-400" : "text-zinc-500"
                  }`}>
                    {entry.total_score}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {entry.correct_picks} correct
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
