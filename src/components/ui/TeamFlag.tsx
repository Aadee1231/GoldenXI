"use client";

import { useState } from "react";
import { resolveFlagCode, flagImageUrl, flagBadgeText } from "@/src/lib/flags";

type TeamFlagProps = {
  name: string;
  code: string;
  flag_emoji?: string | null;
  flag_code?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

// Bigger, clearer, consistent flag rendering. Sizes are real pixel boxes so
// flags read the same everywhere (group stage, knockout, review, leaderboard,
// share pages) regardless of platform emoji support.
const SIZE_MAP: Record<
  NonNullable<TeamFlagProps["size"]>,
  { box: string; badge: string }
> = {
  sm: { box: "h-4 w-6", badge: "text-[8px]" },
  md: { box: "h-6 w-9", badge: "text-[10px]" },
  lg: { box: "h-8 w-12", badge: "text-xs" },
  xl: { box: "h-12 w-[4.5rem]", badge: "text-sm" },
};

export default function TeamFlag({
  name,
  code,
  flag_emoji,
  flag_code,
  size = "md",
  className = "",
}: TeamFlagProps) {
  const [imgError, setImgError] = useState(false);
  const resolved = resolveFlagCode(flag_code, code);
  const sizing = SIZE_MAP[size];

  // Primary: a real flag image (reliable cross-platform, no tofu/mojibake).
  if (resolved && !imgError) {
    return (
      <img
        // eslint-disable-next-line @next/next/no-img-element
        src={flagImageUrl(resolved)}
        alt={`${name} flag`}
        title={`${name} (${code})`}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`${sizing.box} shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/20 ${className}`}
      />
    );
  }

  // Fallback: clean country-code badge (never a broken image / gray box).
  return (
    <span
      title={`${name} (${code})`}
      aria-label={`${name} flag`}
      className={`${sizing.box} ${sizing.badge} inline-flex shrink-0 items-center justify-center rounded-[3px] bg-zinc-700 font-bold uppercase tracking-tight text-zinc-200 ring-1 ring-black/20 ${className}`}
    >
      {flagBadgeText(code, flag_code)}
    </span>
  );
}
