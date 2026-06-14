import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy, Users, Zap, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Free World Cup 2026 Bracket Generator — Make & Share Your Picks",
  description:
    "Use GoldenXI's free World Cup bracket generator to predict the entire 2026 FIFA World Cup. Pick group winners, knockout round results, and your champion. Share with friends.",
  alternates: {
    canonical: "https://goldenxi.vercel.app/world-cup-bracket-generator",
  },
  openGraph: {
    title: "Free World Cup 2026 Bracket Generator — GoldenXI",
    description:
      "Generate your complete World Cup 2026 bracket for free. Groups, knockouts, and a champion pick — all in one place.",
    url: "https://goldenxi.vercel.app/world-cup-bracket-generator",
    images: [
      {
        url: "https://goldenxi.vercel.app/og-image.png?v=6",
        width: 1200,
        height: 630,
        alt: "World Cup 2026 Bracket Generator — GoldenXI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free World Cup 2026 Bracket Generator — GoldenXI",
    description:
      "Generate your complete World Cup 2026 bracket for free. Groups, knockouts, champion pick. Share with friends.",
  },
};

const steps = [
  {
    num: "01",
    title: "Rank the Groups",
    desc: "Predict the final standings in all 12 World Cup 2026 groups. Pick first, second, and third place for every group.",
    color: "blue",
  },
  {
    num: "02",
    title: "Pick Knockout Winners",
    desc: "GoldenXI seeds the bracket automatically based on your group picks. Then call each match round by round through to the Final.",
    color: "gold",
  },
  {
    num: "03",
    title: "Crown Your Champion",
    desc: "Choose who lifts the trophy. Your champion prediction is your biggest point opportunity, so make it count.",
    color: "green",
  },
];

const colorMap = {
  blue: {
    bg: "bg-blue-400/15",
    ring: "ring-blue-400/40",
    text: "text-blue-400",
  },
  gold: {
    bg: "bg-yellow-400/15",
    ring: "ring-yellow-400/40",
    text: "text-yellow-400",
  },
  green: {
    bg: "bg-green-400/15",
    ring: "ring-green-400/40",
    text: "text-green-400",
  },
};

export default function WorldCupBracketGeneratorPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400 ring-1 ring-yellow-400/20">
            Free Bracket Generator
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            World Cup 2026{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Bracket Generator
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400">
            GoldenXI is the fastest way to build your full World Cup 2026
            bracket — group stage, knockouts, and champion — completely free.
            Share your picks and compete with friends.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/bracket"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/25 transition-all hover:scale-105"
            >
              Generate My Bracket <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/world-cup-2026-bracket"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-8 py-4 text-base font-bold text-white transition-all hover:border-white/40"
            >
              About the 2026 Format
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-16">
          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              What Is a World Cup Bracket Generator?
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                A World Cup bracket generator is a tool that lets you fill in
                every round of the FIFA World Cup — from the opening group
                matches all the way to the Final — before the tournament
                begins. You predict which teams advance from each group, who
                wins each knockout fixture, and ultimately which nation lifts
                the trophy.
              </p>
              <p>
                GoldenXI&apos;s bracket generator is built specifically for the
                new{" "}
                <strong className="text-white">48-team 2026 format</strong>. It
                handles the expanded group stage with 12 groups, the best
                third-place rule, and the complete knockout draw — so you
                don&apos;t need to worry about the format details. Just make
                your picks.
              </p>
              <p>
                Once you submit your bracket, GoldenXI automatically calculates
                your score as real match results are entered. Your picks are
                compared against the actual tournament outcomes, earning you
                points on the{" "}
                <Link
                  href="/leaderboard"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  global leaderboard
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Steps */}
          <section>
            <h2 className="mb-8 text-2xl font-bold text-white sm:text-3xl">
              How GoldenXI&apos;s Bracket Generator Works
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {steps.map(({ num, title, desc, color }) => {
                const c = colorMap[color as keyof typeof colorMap];
                return (
                  <div
                    key={num}
                    className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center"
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.bg} ring-2 ${c.ring}`}
                    >
                      <span className={`text-xl font-black ${c.text}`}>
                        {num}
                      </span>
                    </div>
                    <h3 className="font-bold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-zinc-500">
                      {desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              Features That Set GoldenXI Apart
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                Unlike simple bracket templates, GoldenXI is a{" "}
                <strong className="text-white">live scoring platform</strong>.
                Your bracket doesn&apos;t just sit on a page — it earns real
                points as the tournament plays out. Group-stage picks earn up
                to 3 points per team. Knockout round predictions scale up in
                value through the Quarter-finals, Semi-finals, and Final.
                Getting your champion right earns the most points of all.
              </p>
              <p>
                <strong className="text-white">Private group leagues</strong>{" "}
                let you compete separately from the global pool. Create your
                group, share a join code, and everyone&apos;s bracket is scored
                against each other in a dedicated table. Perfect for office
                sweepstakes, friend groups, or any social circle that loves
                football.
              </p>
              <p>
                GoldenXI is completely{" "}
                <strong className="text-white">free to use</strong>. Sign up
                with your email, build your bracket in minutes, and
                you&apos;re ready to compete. No subscription, no hidden fees.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              Beyond the Bracket
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                GoldenXI isn&apos;t only a bracket generator. Between rounds,
                you can challenge yourself with the{" "}
                <Link
                  href="/goalie-camera-game"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  AI Goalkeeper Camera game
                </Link>{" "}
                — an in-browser penalty-save mini-game that uses your device
                camera and tracks your real body movements in real time.
                Goalkeeper scores have their own separate{" "}
                <Link
                  href="/leaderboard"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  leaderboard
                </Link>
                , so there are multiple ways to compete on GoldenXI during the
                World Cup.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 to-yellow-500/5 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white">
              Start generating your bracket
            </h2>
            <p className="mb-7 text-zinc-400">
              Free, fast, and built for the new 48-team World Cup 2026 format.
              Join thousands of fans making their predictions on GoldenXI.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/bracket"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-7 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
              >
                Generate My Bracket <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3 text-sm font-bold text-white transition hover:border-white/40"
              >
                Back to Homepage
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
