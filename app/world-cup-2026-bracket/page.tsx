import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy, Users, ShieldCheck, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "World Cup 2026 Bracket — Build & Track Your Tournament Picks",
  description:
    "Build your complete World Cup 2026 bracket for free. Predict group winners, knockout round results, and crown your champion across all 48 teams and 12 groups.",
  alternates: {
    canonical: "https://goldenxi.vercel.app/world-cup-2026-bracket",
  },
  openGraph: {
    title: "World Cup 2026 Bracket — GoldenXI",
    description:
      "Build your complete World Cup 2026 bracket for free. 48 teams, 12 groups, and a full knockout road to the champion.",
    url: "https://goldenxi.vercel.app/world-cup-2026-bracket",
    images: [
      {
        url: "https://goldenxi.vercel.app/og-image.png?v=6",
        width: 1200,
        height: 630,
        alt: "World Cup 2026 Bracket — GoldenXI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "World Cup 2026 Bracket — GoldenXI",
    description:
      "Build your complete World Cup 2026 bracket for free. 48 teams, 12 groups, full knockout stage.",
  },
};

const features = [
  {
    icon: Trophy,
    title: "Full Tournament Coverage",
    desc: "From 12 groups to the Final — every round, every match, all 48 national teams in one bracket.",
  },
  {
    icon: Users,
    title: "Private Group Competitions",
    desc: "Create an invite-only group and compete on a private leaderboard with friends, family, or coworkers.",
  },
  {
    icon: ShieldCheck,
    title: "Live Score Tracking",
    desc: "Watch your bracket score update in real time as official tournament results come in.",
  },
  {
    icon: Star,
    title: "Global Leaderboard",
    desc: "See where your bracket ranks among all GoldenXI players from around the world.",
  },
];

export default function WorldCup2026BracketPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400 ring-1 ring-yellow-400/20">
            FIFA World Cup 2026
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            World Cup 2026{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Bracket
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400">
            Build your complete World Cup 2026 bracket for free. Predict group
            winners, every knockout round, and crown your champion — then
            compete with friends as the tournament unfolds.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/bracket"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/25 transition-all hover:scale-105 hover:shadow-yellow-400/40"
            >
              Build My Bracket <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white/40"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-16">
          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              The 2026 FIFA World Cup Format
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                The 2026 FIFA World Cup is the most ambitious edition of the
                tournament in its history. For the first time ever,{" "}
                <strong className="text-white">48 national teams</strong> will
                compete — an expansion from the traditional 32 — spread across{" "}
                <strong className="text-white">12 groups of four</strong>.
                Jointly hosted by the United States, Canada, and Mexico, the
                tournament will be played across 16 host cities and 11 stadiums.
              </p>
              <p>
                In the group stage, the top two teams from each group advance
                automatically, while the eight best third-placed finishers also
                progress to the Round of 32. This new format means nearly every
                group match carries real stakes — even a third-place finish can
                keep a team&apos;s World Cup dream alive. From the Round of 32,
                it&apos;s straight knockout football: Round of 16,
                Quarter-finals, Semi-finals, and the Final.
              </p>
              <p>
                With more teams, more matches, and more potential upsets than
                ever before, correctly predicting the full 2026 World Cup
                bracket is harder — and far more rewarding — than any previous
                edition. That&apos;s where GoldenXI comes in.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              How to Build Your Bracket on GoldenXI
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                GoldenXI&apos;s{" "}
                <Link
                  href="/bracket"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  bracket builder
                </Link>{" "}
                walks you through the entire tournament step by step. Start by
                ranking all 12 groups — predict which teams finish first,
                second, and third in every group. You also select which
                third-place teams you believe will qualify as the best
                third-place finishers across the tournament.
              </p>
              <p>
                Once your group stage is set, GoldenXI seeds the Round of 32
                bracket based on your picks. From there, you predict each
                match one round at a time, all the way through to the Final.
                Your champion call is the most valuable prediction of all —
                choose wisely.
              </p>
              <p>
                Your bracket is saved automatically. As the real tournament
                progresses and official results are entered, your score updates
                live on the{" "}
                <Link
                  href="/leaderboard"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  GoldenXI leaderboard
                </Link>
                . Points scale by round — getting a champion right in the Final
                is worth far more than a correct group pick.
              </p>
            </div>
          </section>

          {/* Feature grid */}
          <section>
            <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
              Why Use GoldenXI for Your World Cup Bracket?
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20"
                >
                  <Icon className="mb-3 h-6 w-6 text-yellow-400" />
                  <h3 className="mb-2 font-bold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              Compete With Friends in Private Groups
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                One of the best parts of a World Cup is debating predictions
                with people you know. GoldenXI lets you{" "}
                <strong className="text-white">
                  create or join a private group
                </strong>{" "}
                with its own separate leaderboard. Whether it&apos;s your
                friend circle, your office, your family WhatsApp group, or a
                pub quiz team — you can all compete together.
              </p>
              <p>
                Share your group code and everyone who joins will have their
                bracket scored against each other. The group leaderboard updates
                in real time, so the banter is live throughout the tournament.
                There&apos;s no better way to find out who really knows the
                beautiful game.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 to-yellow-500/5 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white">
              Ready to make your picks?
            </h2>
            <p className="mb-7 text-zinc-400">
              Sign up free, build your World Cup 2026 bracket, and invite your
              friends. You can also explore the{" "}
              <Link
                href="/goalie-camera-game"
                className="text-yellow-400 hover:underline"
              >
                AI Goalkeeper Camera game
              </Link>{" "}
              for a different kind of World Cup challenge.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/bracket"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-7 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
              >
                Build My Bracket <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3 text-sm font-bold text-white transition hover:border-white/40"
              >
                Learn More About GoldenXI
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
