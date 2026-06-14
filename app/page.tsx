import type { Metadata } from "next";
import Link from "next/link";
import FeatureCard from "@/src/components/ui/FeatureCard";
import StatusBadge from "@/src/components/ui/StatusBadge";
import {
  Trophy,
  Users,
  Zap,
  ShieldCheck,
  ArrowRight,
  Star,
} from "lucide-react";
import {
  FloatingSoccerBalls,
  TournamentColorBeams,
  StadiumGrid,
  GoldSpotlight,
  RadarGradient,
  TournamentParticles,
  StadiumLights,
  PitchMarkings,
} from "@/src/components/ui/AnimatedBackground";
import {
  SoccerPitchOverlay,
  PitchGrassPattern,
  SoccerBallPattern,
  StadiumFloodlightGlow,
} from "@/src/components/ui/SoccerPitchBackground";

export const metadata: Metadata = {
  title:
    "GoldenXI — World Cup 2026 Bracket Generator, Predictions & Leaderboard",
  description:
    "Create your World Cup 2026 bracket, predict every knockout round, compete with friends in private groups, climb the leaderboard, and play AI soccer games like Goalie Camera.",
  alternates: {
    canonical: "https://goldenxi.vercel.app",
  },
  openGraph: {
    title:
      "GoldenXI — World Cup 2026 Bracket Generator, Predictions & Leaderboard",
    description:
      "Create your World Cup 2026 bracket, predict every knockout round, compete with friends in private groups, climb the leaderboard, and play AI soccer games like Goalie Camera.",
    url: "https://goldenxi.vercel.app",
  },
};

const features = [
  {
    icon: Trophy,
    title: "Full Tournament Bracket",
    description:
      "Rank every group, choose the best third-place teams, and predict the full road from the Round of 32 to the champion.",
    color: "gold" as const,
    href: "/bracket",
  },
  {
    icon: Users,
    title: "Private Groups",
    description:
      "Create invite-only groups for friends, classmates, coworkers, or family and compete for bragging rights.",
    color: "green" as const,
    href: "/groups",
  },
  {
    icon: ShieldCheck,
    title: "Goalkeeper Reaction",
    description:
      "Test your reflexes in a fast penalty-save challenge. Dive left, center, or right before the ball beats you.",
    color: "red" as const,
    href: "/goalie",
  },
  {
    icon: Star,
    title: "Celebration Pose Off",
    description:
      "Coming soon: Strike your best iconic celebration poses and challenge friends to see who has the most flair.",
    color: "blue" as const,
    badge: "Coming Soon",
  },
] as const;

const stats = [
  { value: "48", label: "Teams" },
  { value: "12", label: "Groups" },
  { value: "1", label: "Champion" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GoldenXI",
  url: "https://goldenxi.vercel.app",
  description:
    "Create your World Cup 2026 bracket, predict every knockout round, compete with friends in private groups, climb the leaderboard, and play AI soccer games.",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  genre: "Sports",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "World Cup 2026 bracket generator",
    "Group stage predictions",
    "Knockout round bracket",
    "Global leaderboard",
    "Private friend groups",
    "AI goalkeeper camera mini-game",
  ],
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16 text-center sm:px-6 lg:px-8">
        {/* Background layers - soccer pitch atmosphere */}
        <PitchGrassPattern />
        <SoccerPitchOverlay />
        <StadiumFloodlightGlow />
        <SoccerBallPattern />
        <FloatingSoccerBalls />

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Badge */}
          <div className="group relative mb-6 inline-flex items-center gap-2 overflow-hidden rounded-full border border-yellow-400/40 bg-gradient-to-r from-yellow-400/15 via-yellow-400/10 to-yellow-400/15 px-5 py-2 text-sm font-bold text-yellow-400 shadow-lg shadow-yellow-400/10 ring-1 ring-yellow-400/20">
            {/* Animated glow */}
            <div className="absolute inset-0 -z-10 animate-pulse-slow bg-yellow-400/20 blur-xl" />
            <Star className="h-4 w-4 animate-pulse-slow" />
            World Cup 2026 — Build Your Bracket
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="relative inline-block">
              <span className="absolute inset-0 blur-xl bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-30" />
              <span className="relative bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                Crown Your Champion
              </span>
            </span>
          </h1>

          {/* Tagline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Create your full World Cup 2026 tournament prediction, choose your knockout winners, and compete with friends in private GoldenXI groups.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/bracket"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/30 transition-all hover:shadow-yellow-400/50 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative">Build My Bracket</span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/leaderboard"
              className="group flex items-center gap-2 rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-400/10 to-blue-500/10 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-400/10 ring-1 ring-blue-400/20 backdrop-blur-sm transition-all hover:border-blue-400/50 hover:shadow-blue-400/20 hover:scale-105"
            >
              View Leaderboard
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-8 sm:gap-12">
            {stats.map((stat, i) => {
              const colors = [
                { text: "text-red-400", glow: "shadow-red-400/20" },
                { text: "text-blue-400", glow: "shadow-blue-400/20" },
                { text: "text-green-400", glow: "shadow-green-400/20" },
              ];
              const color = colors[i];
              return (
                <div key={stat.label} className="group text-center">
                  <div className={`text-3xl font-extrabold transition-all sm:text-4xl ${color.text} drop-shadow-lg ${color.glow}`}>
                    {stat.value}
                  </div>
                  <div className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom fade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent"
        />
      </section>

      {/* ── Features ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
              Your 2026 tournament{" "}
              <span className="text-yellow-400">command center</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              Build your bracket, challenge your friends, and climb the GoldenXI rankings as the tournament unfolds.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ── About GoldenXI (SEO section) ── */}
      <section className="border-t border-white/10 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-3xl font-extrabold text-white sm:text-4xl">
            What is{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              GoldenXI
            </span>
            ?
          </h2>
          <div className="space-y-6 text-base leading-relaxed text-zinc-400">
            <p>
              <strong className="text-white">
                GoldenXI is a free World Cup 2026 bracket generator
              </strong>{" "}
              built for football fans who want to go deeper than just watching.
              Create your complete tournament prediction — rank all 12 groups,
              select the best third-place qualifiers, and call every knockout
              round from the Round of 32 through to the Final.
            </p>
            <p>
              The{" "}
              <strong className="text-white">2026 FIFA World Cup </strong> is the
              biggest in the competition&apos;s history, featuring{" "}
              <strong className="text-white">48 national teams</strong> across 12
              groups, hosted across the United States, Canada, and Mexico. With
              more teams and more upsets possible, GoldenXI gives you a
              structured bracket tool to lock in your predictions before the
              tournament begins.
            </p>
            <p>
              <strong className="text-white">
                Compete on the global leaderboard
              </strong>{" "}
              as the tournament progresses. Points are awarded for correct group
              picks, knockout round predictions, and your champion call — with
              later rounds worth significantly more. Watch your rank update live
              as results come in.
            </p>
            <p>
              <strong className="text-white">
                Create or join a private group
              </strong>{" "}
              with friends, coworkers, or family. Every group gets its own
              leaderboard so you can settle who really knows the beautiful game.
              Share your unique group code and invite anyone to join before the
              tournament kicks off.
            </p>
            <p>
              When you need a break from bracket building, step into goal with
              the{" "}
              <strong className="text-white">
                Goalkeeper Reaction mini-game
              </strong>
              . Use your device camera and full-body movements to save penalty
              shots in real time — an AI-powered soccer game that tests your
              reflexes and ranks your performance on a separate leaderboard.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/bracket"
              className="rounded-lg bg-yellow-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
            >
              Build Your Bracket
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40"
            >
              View Leaderboard
            </Link>
            <Link
              href="/goalie"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40"
            >
              Play Goalie Game
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative border-t border-white/10 px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl text-center">
          <h2 className="mb-16 text-3xl font-extrabold text-white sm:text-4xl">
            Start your run in{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">three steps</span>
          </h2>

          <div className="relative grid gap-10 sm:grid-cols-3">
            {/* Connecting lines on desktop */}
            <div className="pointer-events-none absolute left-0 top-8 hidden h-px w-full bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent sm:block" aria-hidden="true" />
            <div className="pointer-events-none absolute left-0 top-8 hidden h-px w-full animate-pulse-slow bg-gradient-to-r from-blue-400/20 via-green-400/20 to-red-400/20 blur-sm sm:block" aria-hidden="true" />
            
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up in seconds and save your tournament picks.",
                color: "blue",
              },
              {
                step: "02",
                title: "Build your bracket",
                desc: "Rank the groups, choose your knockout winners, and crown your champion.",
                color: "gold",
              },
              {
                step: "03",
                title: "Invite your group",
                desc: "Share your code and find out who really knows the game.",
                color: "green",
              },
            ].map(({ step, title, desc, color }) => {
              const colorMap = {
                blue: { bg: "bg-blue-400/15", ring: "ring-blue-400/40", text: "text-blue-400", shadow: "shadow-blue-400/20" },
                gold: { bg: "bg-yellow-400/15", ring: "ring-yellow-400/40", text: "text-yellow-400", shadow: "shadow-yellow-400/20" },
                green: { bg: "bg-green-400/15", ring: "ring-green-400/40", text: "text-green-400", shadow: "shadow-green-400/20" },
              };
              const c = colorMap[color as keyof typeof colorMap];
              return (
                <div key={step} className="group relative flex flex-col items-center gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${c.bg} shadow-lg ${c.shadow} ring-2 ${c.ring} backdrop-blur-sm transition-all group-hover:scale-110`}>
                    <span className={`text-2xl font-black ${c.text}`}>
                      {step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16">
            <Link
              href="/bracket"
              className="group inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-10 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
            >
              Start now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
