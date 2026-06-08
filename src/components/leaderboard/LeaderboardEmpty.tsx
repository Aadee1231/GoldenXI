import Link from "next/link";
import { Trophy } from "lucide-react";

export default function LeaderboardEmpty() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-white/10 bg-white/5 py-20 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-blue-400/20 bg-gradient-to-b from-blue-400/10 to-blue-400/5 ring-4 ring-blue-400/5">
        <Trophy className="h-12 w-12 text-blue-400/60" />
      </div>
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-white">
          No brackets submitted yet
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Be the first to lock in your picks and claim the top spot.<br />
          Scoring begins when tournament results are entered.<br />
          Correct picks earn more points in later rounds.
        </p>
      </div>
      <Link
        href="/bracket"
        className="mt-2 rounded-xl bg-yellow-400 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
      >
        Build Your Bracket
      </Link>
    </div>
  );
}
