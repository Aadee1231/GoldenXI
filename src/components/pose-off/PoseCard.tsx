"use client";

/**
 * PoseCard — displays the target celebration pose.
 * Uses pure CSS/emoji silhouettes, no real player images or copyrighted assets.
 */

import type { PoseTemplate } from "@/src/lib/pose/templates";
import type { MatchTier } from "@/src/lib/pose/scoring";

type Props = {
  pose: PoseTemplate;
  tier: MatchTier | null;
  score: number | null;
};

const TIER_STYLES: Record<MatchTier, { label: string; color: string; ring: string; bg: string }> = {
  PERFECT: { label: "PERFECT",  color: "text-yellow-300", ring: "ring-yellow-400/60",  bg: "bg-yellow-400/15" },
  GREAT:   { label: "GREAT",    color: "text-green-300",  ring: "ring-green-400/60",   bg: "bg-green-400/15"  },
  CLOSE:   { label: "CLOSE",    color: "text-blue-300",   ring: "ring-blue-400/60",    bg: "bg-blue-400/15"   },
  MISS:    { label: "MISS",     color: "text-zinc-500",   ring: "ring-zinc-600/40",    bg: "bg-zinc-800/30"   },
};

/** Pure-CSS silhouette illustrations for each pose id */
function PoseSilhouette({ id }: { id: string }) {
  const base = "relative flex flex-col items-center justify-center select-none";

  switch (id) {
    case "arms-wide":
      return (
        <div className={`${base} gap-1`}>
          <div className="text-6xl">🙌</div>
          <div className="flex items-center gap-0">
            <div className="h-1 w-10 rounded-full bg-yellow-400/60" />
            <div className="h-8 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-1 w-10 rounded-full bg-yellow-400/60" />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-400/60">
            Arms out wide
          </p>
        </div>
      );
    case "hands-on-hips":
      return (
        <div className={`${base} gap-1`}>
          <div className="text-6xl">💪</div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-yellow-400/60 rotate-45" />
            <div className="h-8 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-5 w-1 rounded-full bg-yellow-400/60 -rotate-45" />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-400/60">
            Hands on hips
          </p>
        </div>
      );
    case "point-sky":
      return (
        <div className={`${base} gap-1`}>
          <div className="text-6xl">☝️</div>
          <div className="flex items-end gap-2">
            <div className="h-6 w-1 rounded-full bg-yellow-400/40" />
            <div className="h-8 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-12 w-1 rounded-full bg-yellow-400/60 -rotate-12" />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-400/60">
            One arm up!
          </p>
        </div>
      );
    case "crossed-arms":
      return (
        <div className={`${base} gap-1`}>
          <div className="text-6xl">🤞</div>
          <div className="relative flex items-center justify-center w-16 h-8">
            <div className="absolute h-1 w-14 rounded-full bg-yellow-400/60 rotate-30" />
            <div className="absolute h-1 w-14 rounded-full bg-yellow-400/60 -rotate-30" />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-400/60">
            Arms crossed
          </p>
        </div>
      );
    case "phone-call":
      return (
        <div className={`${base} gap-1`}>
          <div className="text-6xl">🤙</div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-yellow-400/40" />
            <div className="h-8 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-7 w-1 rounded-full bg-yellow-400/60 rotate-45" />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-400/60">
            Phone to ear
          </p>
        </div>
      );
    case "shush":
    default:
      return (
        <div className={`${base} gap-1`}>
          <div className="text-6xl">🤫</div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-yellow-400/40" />
            <div className="h-8 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-8 w-1 rounded-full bg-yellow-400/60 rotate-12" />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-400/60">
            Finger to lips
          </p>
        </div>
      );
  }
}

export default function PoseCard({ pose, tier, score }: Props) {
  const ts = tier ? TIER_STYLES[tier] : null;

  return (
    <div
      className={[
        "relative flex flex-col items-center justify-between rounded-2xl border px-4 pt-4 pb-3 transition-all duration-200",
        ts
          ? `${ts.ring} ${ts.bg} ring-2`
          : "border-white/10 bg-white/[0.04] ring-0",
      ].join(" ")}
      style={{ minWidth: 180, minHeight: 220 }}
    >
      {/* Tier badge */}
      {ts && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest ${ts.color} bg-[#080808] ring-1 ${ts.ring}`}
        >
          {ts.label}
        </div>
      )}

      {/* Score */}
      {score !== null && (
        <div className="absolute top-2 right-3 text-xs font-bold tabular-nums text-zinc-500">
          {score}%
        </div>
      )}

      {/* Pose name */}
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
        Match this pose
      </p>

      {/* Illustration */}
      <div className="flex flex-1 items-center justify-center py-3">
        <PoseSilhouette id={pose.id} />
      </div>

      {/* Name + cue */}
      <div className="mt-1 text-center">
        <p className="text-base font-extrabold text-white">{pose.name}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">{pose.cue}</p>
      </div>
    </div>
  );
}
