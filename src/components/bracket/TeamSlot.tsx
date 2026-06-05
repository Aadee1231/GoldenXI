"use client";

import type { MockTeam } from "@/src/lib/mock-data/tournament";

type Props = {
  team: MockTeam | null;
  isWinner: boolean;
  isEliminated: boolean;
  isClickable: boolean;
  onClick: () => void;
};

export default function TeamSlot({
  team,
  isWinner,
  isEliminated,
  isClickable,
  onClick,
}: Props) {
  if (!team) {
    return (
      <div className="flex h-10 items-center rounded-md border border-dashed border-white/10 bg-white/[0.03] px-3">
        <span className="text-xs text-zinc-600 italic">TBD</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={[
        "group flex h-10 w-full items-center gap-2.5 rounded-md border px-3 text-left transition-all duration-150",
        isWinner
          ? "border-yellow-400/70 bg-yellow-400/10 ring-1 ring-yellow-400/30"
          : isEliminated
          ? "border-white/5 bg-white/[0.02] opacity-40"
          : isClickable
          ? "border-white/15 bg-white/5 hover:border-yellow-400/50 hover:bg-yellow-400/5 cursor-pointer"
          : "border-white/10 bg-white/[0.03] cursor-default",
      ].join(" ")}
    >
      <span className="text-base leading-none">{team.flag}</span>
      <span
        className={[
          "flex-1 truncate text-sm font-medium",
          isWinner
            ? "text-yellow-300"
            : isEliminated
            ? "text-zinc-600"
            : "text-zinc-200",
        ].join(" ")}
      >
        {team.name}
      </span>
      <span
        className={[
          "text-[10px] font-bold tracking-wider",
          isWinner ? "text-yellow-500" : "text-zinc-600",
        ].join(" ")}
      >
        {team.code}
      </span>
      {isWinner && (
        <span className="text-yellow-400 text-xs">›</span>
      )}
    </button>
  );
}
