"use client";

import { Medal } from "lucide-react";
import type { GroupMemberWithProfile } from "@/src/types";

interface GroupLeaderboardProps {
  members: GroupMemberWithProfile[];
  currentUserId: string;
}

export default function GroupLeaderboard({ 
  members, 
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
      {members.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-zinc-400">No members with brackets yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {members.map((member, index) => {
            const isCurrentUser = member.user_id === currentUserId;
            const points = member.bracket?.points_earned || 0;
            const hasBracket = !!member.bracket;

            return (
              <li
                key={member.id}
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
                    {member.profile.username}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-zinc-500">(you)</span>
                    )}
                  </p>
                  {!hasBracket && (
                    <p className="text-xs text-zinc-500">No bracket submitted</p>
                  )}
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    points > 0 ? "text-yellow-400" : "text-zinc-500"
                  }`}>
                    {points}
                  </p>
                  <p className="text-xs text-zinc-500">points</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
