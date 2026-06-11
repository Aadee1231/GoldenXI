"use client";

import { ArrowLeft, ArrowRight, Shield } from "lucide-react";
import type { Direction } from "./types";

type ReactionControlsProps = {
  onSelect: (dir: Direction) => void;
  disabled: boolean;
  pick: Direction | null;
};

const BUTTONS: {
  dir: Direction;
  label: string;
  hint: string;
  icon: typeof ArrowLeft;
  accent: string;
}[] = [
  {
    dir: "left",
    label: "Left",
    hint: "A",
    icon: ArrowLeft,
    accent:
      "border-blue-400/30 text-blue-300 hover:border-blue-400/60 hover:bg-blue-400/10",
  },
  {
    dir: "center",
    label: "Center",
    hint: "W / Space",
    icon: Shield,
    accent:
      "border-green-400/30 text-green-300 hover:border-green-400/60 hover:bg-green-400/10",
  },
  {
    dir: "right",
    label: "Right",
    hint: "D",
    icon: ArrowRight,
    accent:
      "border-red-400/30 text-red-300 hover:border-red-400/60 hover:bg-red-400/10",
  },
];

export default function ReactionControls({
  onSelect,
  disabled,
  pick,
}: ReactionControlsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {BUTTONS.map(({ dir, label, hint, icon: Icon, accent }) => {
        const isPicked = pick === dir;
        return (
          <button
            key={dir}
            type="button"
            onClick={() => onSelect(dir)}
            onTouchStart={(e) => {
              e.preventDefault();
              if (!disabled) onSelect(dir);
            }}
            disabled={disabled}
            aria-label={`Dive ${label}`}
            className={[
              "group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border bg-white/5 px-2 py-4 font-bold backdrop-blur-sm transition-all",
              "active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
              isPicked ? "ring-2 ring-yellow-400/60 scale-105" : "",
              accent,
            ].join(" ")}
          >
            <Icon className={["h-6 w-6 sm:h-7 sm:w-7", isPicked ? "goalie-pop" : ""].join(" ")} />
            <span className="text-sm sm:text-base">{label}</span>
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
