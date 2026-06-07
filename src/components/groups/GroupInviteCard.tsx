"use client";

import { useState } from "react";
import { UserPlus, Copy, Share2, Check, Lock } from "lucide-react";
import { getInviteUrl, getGroupInviteShareText, copyToClipboard, nativeShare, canUseNativeShare } from "@/src/lib/utils/share";
import CopyButton from "@/src/components/share/CopyButton";
import ShareButton from "@/src/components/share/ShareButton";

interface GroupInviteCardProps {
  groupName: string;
  joinCode: string;
  invitePolicy: "admin_only" | "members";
  isCreator: boolean;
}

export default function GroupInviteCard({
  groupName,
  joinCode,
  invitePolicy,
  isCreator,
}: GroupInviteCardProps) {
  const canInvite = invitePolicy === "members" || isCreator;
  const inviteUrl = getInviteUrl(joinCode);
  const shareText = getGroupInviteShareText(groupName);

  if (!canInvite) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
            <Lock className="h-5 w-5 text-zinc-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Invite Friends</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Only the group admin can invite new members.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/20">
          <UserPlus className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">Invite Friends</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Share this link or code to invite others to join
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Join Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-black/50 px-4 py-3">
              <code className="font-mono text-lg font-bold text-yellow-400">
                {joinCode}
              </code>
            </div>
            <CopyButton text={joinCode} label="Copy" variant="secondary" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Invite Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-lg bg-black/50 px-4 py-3">
              <div className="truncate text-sm text-zinc-300">{inviteUrl}</div>
            </div>
            <CopyButton text={inviteUrl} label="Copy" variant="secondary" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <ShareButton
            url={inviteUrl}
            title={`Join ${groupName}`}
            text={shareText}
            label="Share Invite"
            variant="primary"
          />
        </div>

        <div className="rounded-lg bg-black/30 p-3">
          <p className="text-xs text-zinc-400">
            <strong className="text-zinc-300">Share text:</strong>
            <br />
            {shareText}
          </p>
        </div>
      </div>
    </div>
  );
}
