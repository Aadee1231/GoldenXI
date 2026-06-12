"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Trophy, Lock, CheckCircle, AlertCircle } from "lucide-react";
import type { InvitePreview } from "@/src/types";
import { joinGroupByCode } from "@/src/lib/supabase/queries/invites";
import { useRouter } from "next/navigation";

interface InvitePageContentProps {
  preview: InvitePreview;
  joinCode: string;
  isAuthenticated: boolean;
  isMember: boolean;
}

export default function InvitePageContent({
  preview,
  joinCode,
  isAuthenticated,
  isMember,
}: InvitePageContentProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);

    console.log("[JoinGroup] Attempting to join with code:", joinCode);

    let result;
    try {
      result = await joinGroupByCode(joinCode);
      console.log("[JoinGroup] RPC result:", result);
    } catch (err) {
      console.error("[JoinGroup] Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsJoining(false);
      return;
    }

    if (result.success && result.groupId) {
      console.log("[JoinGroup] Success, redirecting to /groups/" + result.groupId);
      router.push(`/groups/${result.groupId}`);
    } else {
      console.error("[JoinGroup] Failed:", result.errorCode, result.errorMessage);
      setError(result.errorMessage || "Failed to join group");
      setIsJoining(false);
    }
  };

  const isLocked = preview.is_locked && !preview.allow_late_join;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white">
              <span className="text-yellow-400">GoldenXI</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              World Cup Bracket Challenge
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/20">
                <Users className="h-8 w-8 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                You've been invited!
              </h2>
              <p className="mt-2 text-zinc-300">
                Join <span className="font-semibold text-white">{preview.group_name}</span>
              </p>
            </div>

            <div className="space-y-3 rounded-lg bg-black/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Tournament</span>
                <span className="font-medium text-white">
                  {preview.tournament_name}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Members</span>
                <span className="font-medium text-white">
                  {preview.member_count}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href={`/auth?redirect=/join/${joinCode}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3 text-sm font-medium text-black transition hover:bg-yellow-500"
              >
                Sign In to Join
              </Link>
              <Link
                href={`/auth?tab=signup&redirect=/join/${joinCode}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/20">
            <Lock className="h-8 w-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Group Locked</h1>
          <p className="mt-3 text-zinc-300">
            This group is locked and no longer accepting new members.
          </p>
          <Link
            href="/groups"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            Browse Other Groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white">
            <span className="text-yellow-400">GoldenXI</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            World Cup Bracket Challenge
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/20">
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Join Group</h2>
            <p className="mt-2 text-lg font-semibold text-white">
              {preview.group_name}
            </p>
          </div>

          <div className="space-y-3 rounded-lg bg-black/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Tournament</span>
              <span className="font-medium text-white">
                {preview.tournament_name}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Members</span>
              <span className="font-medium text-white">
                {preview.member_count}
              </span>
            </div>
            {preview.is_locked && preview.allow_late_join && (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-400/10 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-yellow-400">
                  Group is locked but late joins are allowed
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3 text-sm font-medium text-black transition hover:bg-yellow-500 disabled:opacity-50"
            >
              {isJoining ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Joining...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Join Group
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
