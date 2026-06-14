import Link from "next/link";
import { Trophy, Users, Share2, Lock, CheckCircle } from "lucide-react";

export const metadata = {
  title: "How the Bracket Works | GoldenXI",
};

export default function BracketHowItWorks() {
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
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-gradient-to-r from-yellow-400/15 to-yellow-500/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400 shadow-lg shadow-yellow-400/10 ring-1 ring-yellow-400/20">
            <Trophy className="h-4 w-4" />
            Guide
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            How the Bracket Works
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-zinc-400">
            Build your World Cup 2026 bracket in 4 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Rank all teams in each group",
              description: "Predict the 1st through 4th place finishers for all 12 groups (48 teams total).",
              icon: <Users className="h-5 w-5 text-yellow-400" />,
            },
            {
              step: "2",
              title: "Pick the 8 best third-place teams",
              description: "Select which 8 third-place teams will advance to the knockout stage based on their performance.",
              icon: <CheckCircle className="h-5 w-5 text-yellow-400" />,
            },
            {
              step: "3",
              title: "Fill out the knockout bracket",
              description: "Predict winners for every match from Round of 32 through the Final champion.",
              icon: <Trophy className="h-5 w-5 text-yellow-400" />,
            },
            {
              step: "4",
              title: "Review, lock, and share",
              description: "Review your complete bracket, lock it in, and share with friends to compete.",
              icon: <Share2 className="h-5 w-5 text-yellow-400" />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400 font-bold text-lg">
                {item.step}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {item.icon}
                  <h3 className="font-semibold text-white">{item.title}</h3>
                </div>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-white">Competition</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Compete on the global leaderboard and inside groups. Once tournament results are entered, your picks are scored automatically.
            </p>
          </div>
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Prediction Focus</h3>
            </div>
            <p className="text-sm text-zinc-400">
              The bracket is meant to predict the full tournament path. Make your best picks for every match from groups to champion.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/bracket"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-8 py-3 font-semibold text-black transition-colors hover:bg-yellow-500"
          >
            Build My Bracket
          </Link>
        </div>
      </div>
    </div>
  );
}
