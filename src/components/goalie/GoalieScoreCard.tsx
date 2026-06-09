import { Flame, Hand, Target, Trophy } from "lucide-react";
import { TOTAL_ROUNDS } from "./types";

type GoalieScoreCardProps = {
  round: number;
  saves: number;
  misses: number;
  streak: number;
  score: number;
  best: number;
};

export default function GoalieScoreCard({
  round,
  saves,
  misses,
  streak,
  score,
  best,
}: GoalieScoreCardProps) {
  const stats = [
    {
      label: "Round",
      value: `${Math.min(round, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}`,
      icon: Target,
      accent: "text-blue-400",
    },
    {
      label: "Saves",
      value: saves,
      icon: Hand,
      accent: "text-green-400",
    },
    {
      label: "Goals In",
      value: misses,
      icon: Target,
      accent: "text-red-400",
    },
    {
      label: "Streak",
      value: streak,
      icon: Flame,
      accent: "text-orange-400",
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-yellow-400/20 bg-gradient-to-r from-yellow-400/10 via-yellow-400/5 to-transparent px-5 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Score
          </div>
          <div className="text-3xl font-extrabold text-yellow-400 tabular-nums">
            {score}
          </div>
        </div>
        <div className="flex items-center gap-2 text-right">
          <Trophy className="h-5 w-5 text-yellow-400/70" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Best
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {best}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-1 py-3"
          >
            <Icon className={`h-4 w-4 ${accent}`} />
            <span className="text-lg font-bold text-white tabular-nums sm:text-xl">
              {value}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
