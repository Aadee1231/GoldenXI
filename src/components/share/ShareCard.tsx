import { Trophy } from "lucide-react";
import TeamFlag from "@/src/components/ui/TeamFlag";

interface ShareCardProps {
  username: string;
  displayName?: string | null;
  championName?: string | null;
  championFlag?: string | null;
  championCode?: string | null;
  totalScore?: number;
  variant?: "bracket" | "group";
}

export default function ShareCard({
  username,
  displayName,
  championName,
  championFlag,
  championCode,
  totalScore,
  variant = "bracket",
}: ShareCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 via-yellow-500/5 to-yellow-600/5 p-8 ring-1 ring-yellow-400/20 shadow-lg shadow-yellow-400/10">
      <div className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 opacity-[0.07]">
        <Trophy className="h-full w-full text-yellow-400" />
      </div>

      <div className="relative space-y-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-400 ring-1 ring-yellow-400/20">
            <Trophy className="h-3 w-3" />
            GoldenXI
          </div>
          <h3 className="mt-2 text-3xl font-extrabold text-white">
            {displayName || username}
          </h3>
        </div>

        {variant === "bracket" && championName && (
          <div className="space-y-2 rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Champion Pick</div>
            <div className="flex items-center gap-3">
              <TeamFlag
                name={championName}
                code={championCode || ""}
                flag_emoji={championFlag}
                flag_code={championCode}
                size="md"
              />
              <span className="text-xl font-bold text-white">
                {championName}
              </span>
            </div>
          </div>
        )}

        {totalScore !== undefined && totalScore > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Score</div>
            <div className="text-3xl font-extrabold text-yellow-400">{totalScore} pts</div>
          </div>
        )}

        <div className="pt-2 text-sm font-medium text-zinc-400">
          {variant === "bracket"
            ? "World Cup 2026 Bracket"
            : "World Cup 2026 Group"}
        </div>
      </div>
    </div>
  );
}
