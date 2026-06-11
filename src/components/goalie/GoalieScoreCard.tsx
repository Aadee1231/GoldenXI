import { useRef } from "react";
import { Flame, Hand, Heart, Target, Trophy, Volume2, VolumeX } from "lucide-react";

type GoalieScoreCardProps = {
  /** Current shot number (1-indexed). */
  shot: number;
  /** Remaining lives. */
  lives: number;
  saves: number;
  streak: number;
  score: number;
  best: number;
  /** Optional audio controls rendered inside the card header. */
  muted?: boolean;
  onToggleMute?: () => void;
};

function LivesDisplay({ lives, max = 3 }: { lives: number; max?: number }) {
  const prevRef = useRef(lives);
  const lostThisRender = prevRef.current > lives;
  prevRef.current = lives;

  return (
    <span className="flex items-center justify-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const active = i < lives;
        const justLost = !active && lostThisRender && i === lives;
        return (
          <Heart
            key={i}
            className={[
              "h-4 w-4",
              active
                ? "fill-red-400 text-red-400" + (lives === 1 ? " animate-pulse" : "")
                : "fill-transparent text-zinc-600",
              justLost ? "goalie-life-lost" : "",
            ].join(" ")}
          />
        );
      })}
    </span>
  );
}

export default function GoalieScoreCard({
  shot,
  lives,
  saves,
  streak,
  score,
  best,
  muted,
  onToggleMute,
}: GoalieScoreCardProps) {
  const prevScoreRef = useRef(score);
  const scoreJustPopped = score > prevScoreRef.current;
  prevScoreRef.current = score;

  const stats = [
    {
      label: "Shot",
      value: shot,
      icon: Target,
      accent: "text-blue-400",
      custom: null,
    },
    {
      label: "Saves",
      value: saves,
      icon: Hand,
      accent: "text-green-400",
      custom: null,
    },
    {
      label: "Lives",
      value: lives,
      icon: Heart,
      accent: "text-red-400",
      custom: <LivesDisplay lives={lives} />,
    },
    {
      label: "Streak",
      value: streak,
      icon: Flame,
      accent:
        streak >= 3
          ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.9)]"
          : "text-orange-400",
      custom: null,
    },
  ];

  return (
    <div className="w-full">
      {/* Score / best row */}
      <div
        className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-yellow-400/25 px-5 py-3"
        style={{
          background:
            "linear-gradient(135deg,rgba(250,204,21,0.12) 0%,rgba(250,204,21,0.05) 50%,transparent 100%)",
          boxShadow: "inset 0 1px 0 rgba(250,204,21,0.12)",
        }}
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Score
          </div>
          <div
            key={`score-${score}`}
            className={[
              "text-3xl font-extrabold tabular-nums text-yellow-400",
              scoreJustPopped ? "goalie-score-pop" : "",
            ].join(" ")}
          >
            {score}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onToggleMute !== undefined && (
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="rounded-full p-1.5 text-zinc-500 transition hover:text-zinc-200 active:scale-90"
            >
              {muted
                ? <VolumeX className="h-4 w-4" />
                : <Volume2 className="h-4 w-4" />}
            </button>
          )}
          <div className="flex items-center gap-1.5 text-right">
            <Trophy className="h-4 w-4 text-yellow-400/60" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Best
              </div>
              <div className="text-lg font-extrabold tabular-nums text-white">
                {best}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {stats.map(({ label, value, icon: Icon, accent, custom }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/5 px-1 py-3"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
          >
            <Icon className={`h-3.5 w-3.5 ${accent}`} />
            {custom ?? (
              <span
                key={
                  label === "Streak"
                    ? `streak-${value}`
                    : label === "Shot"
                      ? `shot-${value}`
                      : label
                }
                className={[
                  "text-lg font-bold tabular-nums text-white sm:text-xl",
                  label === "Streak" && (value as number) >= 2 ? "goalie-streak" : "",
                ].join(" ")}
              >
                {value}
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
