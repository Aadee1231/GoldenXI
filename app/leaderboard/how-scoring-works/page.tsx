import Link from "next/link";
import { Trophy, TrendingUp, Award, Clock } from "lucide-react";

export const metadata = {
  title: "How Scoring Works | GoldenXI",
};

export default function LeaderboardHowScoringWorks() {
  return (
    <div className="relative min-h-screen px-4 py-24">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-yellow-500/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-gradient-to-r from-blue-400/15 to-blue-500/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-blue-400 shadow-lg shadow-blue-400/10 ring-1 ring-blue-400/20">
            <Trophy className="h-4 w-4" />
            Guide
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            How Scoring Works
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-zinc-400">
            Points are awarded for correct bracket predictions
          </p>
        </div>

        {/* Overview */}
        <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold text-white">When Scoring Begins</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Scoring begins once real tournament results are entered by the admin. Before matches are completed, all brackets show 0 points.
          </p>
        </div>

        {/* Point values */}
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">Points per Correct Pick</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                  GS
                </div>
                <span className="text-sm text-white">Group Stage — Up to 3 pts per group</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">Up to 3 pts</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                  R32
                </div>
                <span className="text-sm text-white">Round of 32</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">4 pts</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                  R16
                </div>
                <span className="text-sm text-white">Round of 16</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">6 pts</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                  QF
                </div>
                <span className="text-sm text-white">Quarterfinals</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">8 pts</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                  SF
                </div>
                <span className="text-sm text-white">Semifinals</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">12 pts</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-5 py-4 ring-1 ring-yellow-400/20">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/20 text-xs font-semibold text-yellow-400">
                  🏆
                </div>
                <span className="text-sm font-semibold text-white">Final / Champion</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">20 pts</span>
            </div>
          </div>
        </div>

        {/* Group stage explanation */}
        <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.04] p-6">
          <h3 className="mb-2 font-semibold text-white">Group Stage Scoring</h3>
          <p className="text-sm text-zinc-400">
            Each group is worth up to 3 points: 3 for the exact 1–4 order, 2 for the correct top two teams in any order, and 1 for the correct top three teams in any order. Only the highest tier is awarded — points are not cumulative. With 12 groups, the maximum group-stage score is 36 points.
          </p>
        </div>

        {/* Info cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-white">Progressive Scoring</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Correct picks in later rounds are worth more points. Getting the champion right is the most valuable prediction.
            </p>
          </div>
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Leaderboard Ranking</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Users appear on the leaderboard once they have a completed and public bracket. Rankings are by total bracket points.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-8 py-3 font-semibold text-black transition-colors hover:bg-yellow-500"
          >
            View Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
