import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, ArrowRight, User, Layout, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works - GoldenXI",
  description: "Learn how to build your World Cup 2026 bracket and compete on GoldenXI.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-extrabold text-white">
              How It <span className="text-yellow-400">Works</span>
            </h1>
          </div>
          <p className="text-lg text-zinc-400">
            Build your bracket in three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400/15 ring-2 ring-blue-400/40">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">1. Create Your Account</h2>
            </div>
            <p className="text-base leading-relaxed text-zinc-400">
              Sign up in seconds to save your tournament picks. Your account lets you track your 
              bracket, join groups, and climb the global leaderboard as the tournament progresses.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/15 ring-2 ring-yellow-400/40">
                <Layout className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">2. Build Your Bracket</h2>
            </div>
            <p className="text-base leading-relaxed text-zinc-400">
              Rank all 12 groups from 1-4, select the best third-place teams, and predict every 
              knockout round winner from the Round of 32 to the champion. Later rounds are worth 
              more points, so choose wisely!
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-400/15 ring-2 ring-green-400/40">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">3. Invite Your Group</h2>
            </div>
            <p className="text-base leading-relaxed text-zinc-400">
              Create a private group and share your unique code with friends, family, or coworkers. 
              Compete on your group leaderboard to see who really knows the beautiful game.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Scoring</h2>
            <p className="mb-4 text-base leading-relaxed text-zinc-400">
              Points are awarded for correct predictions throughout the tournament:
            </p>
            <ul className="space-y-2 text-base text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Group stage:</strong> 1 point per correct team ranking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Round of 32:</strong> 2 points per correct winner</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Round of 16:</strong> 4 points per correct winner</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Quarter-finals:</strong> 8 points per correct winner</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Semi-finals:</strong> 16 points per correct winner</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Final:</strong> 32 points for correct champion</span>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/bracket"
            className="group inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
          >
            Start Building
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
