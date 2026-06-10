"use client";

import { useState, useEffect } from "react";
import { Share2, Lock, Unlock } from "lucide-react";
import { getBracketShareUrl, getBracketShareText } from "@/src/lib/utils/share";
import { updatePublicBracketSetting, getCurrentUserProfile } from "@/src/lib/supabase/queries/public-bracket";
import CopyButton from "@/src/components/share/CopyButton";
import ShareButton from "@/src/components/share/ShareButton";
import ShareCard from "@/src/components/share/ShareCard";

interface BracketShareCardProps {
  username: string | null;
  displayName: string | null;
  championName?: string | null;
  championFlag?: string | null;
  championCode?: string | null;
  totalScore?: number;
  bracketComplete: boolean;
  isLocked?: boolean;
}

export default function BracketShareCard({
  username,
  displayName,
  championName,
  championFlag,
  championCode,
  totalScore,
  bracketComplete,
  isLocked = false,
}: BracketShareCardProps) {
  const [publicBracket, setPublicBracket] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { profile } = await getCurrentUserProfile();
      if (profile) {
        setPublicBracket(profile.public_bracket);
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleTogglePublic = async () => {
    setIsUpdating(true);
    const newValue = !publicBracket;
    const { success } = await updatePublicBracketSetting(newValue);
    if (success) {
      setPublicBracket(newValue);
    }
    setIsUpdating(false);
  };

  if (!username) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
            <Lock className="h-5 w-5 text-zinc-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Share Your Bracket</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Complete your profile setup to share your bracket.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const shareUrl = getBracketShareUrl(username);
  const shareText = getBracketShareText();

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/5" />
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/20">
          <Share2 className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">Share Your Bracket</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Let others see your picks and compete with you
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-white">Public Sharing</div>
            <div className="text-xs text-zinc-400">
              {publicBracket
                ? "Anyone with the link can view your bracket"
                : "Your bracket is private"}
            </div>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              publicBracket ? "bg-yellow-400" : "bg-zinc-700"
            } ${isUpdating ? "opacity-50" : ""}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                publicBracket ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {!bracketComplete ? (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
            <p className="text-xs text-yellow-400">
              Complete all picks (48 group rankings + 8 third-place + 31 knockout) for the best sharing experience.
            </p>
          </div>
        ) : !isLocked ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="text-xs text-green-400">
              Your bracket is complete and ready to share! Lock it to finalize your picks.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="text-xs text-green-400">
              Your bracket is complete and locked. Share it with friends!
            </p>
          </div>
        )}

        {publicBracket ? (
          <>
            <div className="mb-4">
              <ShareCard
                username={username}
                displayName={displayName}
                championName={championName}
                championFlag={championFlag}
                championCode={championCode}
                totalScore={totalScore}
                variant="bracket"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Share Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-lg bg-black/50 px-4 py-3">
                  <div className="truncate text-sm text-zinc-300">{shareUrl}</div>
                </div>
                <CopyButton text={shareUrl} label="Copy" variant="secondary" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <ShareButton
                url={shareUrl}
                title={`${displayName || username}'s Bracket`}
                text={shareText}
                label="Share Bracket"
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
          </>
        ) : (
          <div className="rounded-lg bg-black/30 p-4 text-center">
            <Lock className="mx-auto mb-2 h-8 w-8 text-zinc-500" />
            <p className="text-sm text-zinc-400">
              Enable public sharing to get your share link
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
