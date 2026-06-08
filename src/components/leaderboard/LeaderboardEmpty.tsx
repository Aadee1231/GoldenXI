import Link from "next/link";
import { Trophy } from "lucide-react";

export default function LeaderboardEmpty() {
  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-400/5">
        <Trophy className="h-9 w-9 text-yellow-400/60" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">
          No brackets submitted yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          Be the first to lock in your picks and claim the top spot. Scoring begins when tournament results are entered.
        </p>
      </div>
      <Link
        href="/bracket"
        className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
      >
        Build Your Bracket
      </Link>
    </div>
  );
}
