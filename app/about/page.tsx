import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About GoldenXI",
  description: "Learn about GoldenXI, the free World Cup 2026 bracket builder and prediction game.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-extrabold text-white">
              About <span className="text-yellow-400">GoldenXI</span>
            </h1>
          </div>
          <p className="text-lg text-zinc-400">
            Your free World Cup 2026 bracket builder and prediction game
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">What is GoldenXI?</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              GoldenXI is a free, fan-made World Cup 2026 bracket builder and prediction game. 
              Create your complete tournament prediction — rank all 12 groups, select the best 
              third-place qualifiers, and call every knockout round from the Round of 32 through 
              to the Final.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Features</h2>
            <ul className="space-y-3 text-base text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Full tournament bracket with group rankings and knockout predictions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Global leaderboard to compete with fans worldwide</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Private groups to challenge friends, family, and coworkers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Goalkeeper Reaction mini-game with AI-powered camera controls</span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Independent & Fan-Made</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              GoldenXI is an independent fan-made game. It is not affiliated with, endorsed by, 
              sponsored by, or officially connected to FIFA, the FIFA World Cup, or any tournament 
              organizer. This is a passion project built by soccer fans, for soccer fans.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Free & Ad-Free</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              GoldenXI is completely free to use and contains no advertisements. Optional donations 
              help cover hosting and development costs, but are never required to use any features 
              of the site.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/bracket"
            className="group inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
          >
            Build Your Bracket
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
