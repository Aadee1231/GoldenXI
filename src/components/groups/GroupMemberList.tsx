"use client";

import Image from "next/image";
import { Crown, User } from "lucide-react";
import type { GroupMemberWithProfile } from "@/src/types";

interface GroupMemberListProps {
  members: GroupMemberWithProfile[];
  creatorId: string;
  currentUserId: string;
}

export default function GroupMemberList({ 
  members, 
  creatorId, 
  currentUserId 
}: GroupMemberListProps) {
  return (
    <ul className="space-y-3">
      {members.map((member) => {
        const isCreator = member.user_id === creatorId;
        const isCurrentUser = member.user_id === currentUserId;

        return (
          <li
            key={member.id}
            className={`flex items-center gap-3 rounded-lg p-2 ${
              isCurrentUser ? "bg-yellow-400/10" : "bg-black/30"
            }`}
          >
            {/* Avatar */}
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-zinc-800">
              {member.profile.avatar_url ? (
                <Image
                  src={member.profile.avatar_url}
                  alt={member.profile.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-white">
                  {member.profile.username}
                </span>
                {isCreator && (
                  <Crown className="h-3 w-3 flex-shrink-0 text-yellow-400" />
                )}
                {isCurrentUser && (
                  <span className="text-xs text-zinc-500">(you)</span>
                )}
              </div>
              {member.bracket && (
                <p className="text-xs text-zinc-500">
                  {member.bracket.points_earned} points
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
