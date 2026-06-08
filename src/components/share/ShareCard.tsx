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
    <div className="relative overflow-hidden rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 p-6">
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 opacity-10">
        <Trophy className="h-full w-full text-yellow-400" />
      </div>

      <div className="relative space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            GoldenXI
          </div>
          <h3 className="mt-1 text-2xl font-bold text-white">
            {displayName || username}
          </h3>
        </div>

        {variant === "bracket" && championName && (
          <div className="space-y-1">
            <div className="text-xs text-zinc-400">Champion Pick</div>
            <div className="flex items-center gap-2">
              <TeamFlag
                name={championName}
                code={championCode || ""}
                flag_emoji={championFlag}
                flag_code={championCode}
                size="md"
              />
              <span className="text-lg font-semibold text-white">
                {championName}
              </span>
            </div>
          </div>
        )}

        {totalScore !== undefined && totalScore > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-zinc-400">Total Score</div>
            <div className="text-2xl font-bold text-yellow-400">{totalScore}</div>
          </div>
        )}

        <div className="pt-2 text-sm text-zinc-300">
          {variant === "bracket"
            ? "World Cup 2026 Bracket"
            : "World Cup 2026 Group"}
        </div>
      </div>
    </div>
  );
}
