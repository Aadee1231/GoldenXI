import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flame, Users, Trophy, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "World Cup 2026 Leaderboard — Bracket Rankings & Standings",
  description:
    "Compete on the GoldenXI World Cup 2026 leaderboard. Track your bracket score live, see global rankings, and compete in private friend groups as the tournament unfolds.",
  alternates: {
    canonical: "https://goldenxi.vercel.app/world-cup-leaderboard",
  },
  openGraph: {
    title: "World Cup 2026 Leaderboard — GoldenXI",
    description:
      "Track your World Cup 2026 bracket score live on GoldenXI. Global rankings, private groups, and goalie game standings.",
    url: "https://goldenxi.vercel.app/world-cup-leaderboard",
    images: [
      {
        url: "https://goldenxi.vercel.app/og-image.png?v=6",
        width: 1200,
        height: 630,
        alt: "World Cup 2026 Leaderboard — GoldenXI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "World Cup 2026 Leaderboard — GoldenXI",
    description:
      "Track your World Cup 2026 bracket score live. Global rankings and private group standings on GoldenXI.",
  },
};

const leaderboardFeatures = [
  {
    icon: Flame,
    title: "Global Rankings",
    desc: "Every GoldenXI player's bracket is scored and ranked globally. See who has the best predictions across all users.",
    color: "text-red-400",
    border: "border-red-400/20",
    bg: "bg-red-400/5",
  },
  {
    icon: Users,
    title: "Private Group Standings",
    desc: "Compete within your own group. Each group has its own leaderboard, so you can focus on beating your friends.",
    color: "text-blue-400",
    border: "border-blue-400/20",
    bg: "bg-blue-400/5",
  },
  {
    icon: ShieldCheck,
    title: "Goalie Game Rankings",
    desc: "Separate leaderboard for Goalkeeper Reaction scores. Top camera-mode goalkeepers ranked by saves and reaction speed.",
    color: "text-green-400",
    border: "border-green-400/20",
    bg: "bg-green-400/5",
  },
];

export default function WorldCupLeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-blue-400 ring-1 ring-blue-400/20">
            <Flame className="h-3.5 w-3.5" />
            Global Rankings
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            World Cup 2026{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400">
            Track your World Cup 2026 bracket score in real time. Compete
            globally, compete in private groups, and see who called it right.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/25 transition-all hover:scale-105"
            >
              View Live Leaderboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/bracket"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-8 py-4 text-base font-bold text-white transition-all hover:border-white/40"
            >
              Build Your Bracket
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-16">
          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              How the GoldenXI Leaderboard Works
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                Every GoldenXI player who builds a{" "}
                <Link
                  href="/world-cup-2026-bracket"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  World Cup 2026 bracket
                </Link>{" "}
                is automatically entered into the global leaderboard. Your
                score updates in real time as official tournament results are
                recorded — no manual entry required.
              </p>
              <p>
                Points are earned for correct predictions at every round.
                Group-stage picks earn up to 3 points per team. Correct
                knockout picks earn more as the tournament progresses — a right
                call in the Quarter-finals is worth 8 points, a correct
                Semi-final pick earns 12, and calling the champion earns{" "}
                <strong className="text-white">20 points</strong>. The scoring
                system rewards both breadth and depth of prediction accuracy.
              </p>
              <p>
                The global leaderboard ranks all players from highest to lowest
                total score. It updates throughout the tournament — positions
                can shift dramatically after each round as some players&apos;
                picks hold up while others are eliminated.
              </p>
            </div>
          </section>

          {/* Feature cards */}
          <section>
            <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
              Three Ways to Compete
            </h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {leaderboardFeatures.map(
                ({ icon: Icon, title, desc, color, border, bg }) => (
                  <div
                    key={title}
                    className={`rounded-xl border p-6 ${border} ${bg} transition-all hover:scale-[1.02]`}
                  >
                    <Icon className={`mb-3 h-6 w-6 ${color}`} />
                    <h3 className="mb-2 font-bold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-zinc-500">
                      {desc}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              Private Group Leaderboards
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                The global leaderboard is exciting, but competing within a
                private group is often more personal. GoldenXI lets you{" "}
                <strong className="text-white">
                  create an invite-only group
                </strong>{" "}
                for any circle — your workplace, your friend group, your family,
                or any community of football fans. Each group gets its own
                dedicated standings page.
              </p>
              <p>
                When you create a group, you receive a unique join code. Share
                it and anyone who joins will have their bracket scored within
                your group. The group leaderboard shows each member&apos;s
                current points, their champion pick, and their bracket date —
                everything you need to follow the competition.
              </p>
              <p>
                Group standings update automatically alongside the global
                leaderboard. Whether you&apos;re checking in during a match day
                or reviewing after a round, you&apos;ll always see the latest
                standings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              The Goalkeeper Reaction Leaderboard
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                GoldenXI also features a separate leaderboard for the{" "}
                <Link
                  href="/goalie-camera-game"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  AI Goalkeeper Camera mini-game
                </Link>
                . Players who complete a game session are ranked by their save
                count, accuracy percentage, reaction speed, and overall score.
                The two leaderboards — bracket predictions and goalkeeper
                reaction — run independently, giving you two distinct
                competitive tracks during the World Cup.
              </p>
              <p>
                Whether you&apos;re a prediction expert or a reflex ace, there
                is a GoldenXI leaderboard waiting for your best performance.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 to-yellow-500/5 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white">
              Stake your claim on the leaderboard
            </h2>
            <p className="mb-7 text-zinc-400">
              Build your bracket now and join the competition. Every correct
              prediction earns points. Every round, positions shift. Stay on
              top all the way to the Final.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-7 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
              >
                View Leaderboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/bracket"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3 text-sm font-bold text-white transition hover:border-white/40"
              >
                Build My Bracket
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
