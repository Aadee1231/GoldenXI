import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Trophy, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Goalkeeper Camera Game — Save Penalties in Real Time",
  description:
    "Play GoldenXI's AI goalkeeper camera game in your browser. Use your webcam and real body movements to save penalty kicks. Compete on the global goalie leaderboard.",
  alternates: {
    canonical: "https://goldenxi.vercel.app/goalie-camera-game",
  },
  openGraph: {
    title: "AI Goalkeeper Camera Game — GoldenXI",
    description:
      "Use your webcam and real body movements to save penalty kicks in real time. GoldenXI's AI goalkeeper mini-game.",
    url: "https://goldenxi.vercel.app/goalie-camera-game",
    images: [
      {
        url: "https://goldenxi.vercel.app/og-image.png?v=6",
        width: 1200,
        height: 630,
        alt: "AI Goalkeeper Camera Game — GoldenXI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Goalkeeper Camera Game — GoldenXI",
    description:
      "Use your webcam and real body movements to save penalty kicks. AI-powered goalkeeper mini-game.",
  },
};

const stages = [
  {
    name: "Warmup",
    shots: "Shots 1–5",
    desc: "Slow, straight shots. Get your bearings and find your positioning.",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
  },
  {
    name: "Medium",
    shots: "Shots 6–10",
    desc: "Speed increases. Slight curves introduced. Corners become more frequent.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  {
    name: "Hard",
    shots: "Shots 11–18",
    desc: "Heavy curve balls, corner bias. Reaction window narrows significantly.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
  {
    name: "Expert",
    shots: "Shots 19–30",
    desc: "Faster flights, more deceptive trajectories. Corner placement becomes dominant.",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  {
    name: "Insane",
    shots: "Shots 31+",
    desc: "Maximum speed, maximum curve, maximum corner bias. Only the best survive.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
];

export default function GoalieCameraGamePage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-red-400 ring-1 ring-red-400/20">
            AI Mini-Game
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            AI Goalkeeper{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Camera Game
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400">
            Step into goal and use your real body to save penalties. GoldenXI
            reads your webcam in real time and tracks your movements to
            determine every save and every goal. Can you survive all five
            stages?
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/goalie"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/25 transition-all hover:scale-105"
            >
              Play Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-8 py-4 text-base font-bold text-white transition-all hover:border-white/40"
            >
              View Goalie Leaderboard
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-16">
          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              What Is the Goalkeeper Camera Game?
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                The GoldenXI Goalkeeper Camera game is an{" "}
                <strong className="text-white">
                  AI-powered penalty mini-game
                </strong>{" "}
                that runs entirely in your browser. Unlike traditional button
                games, this one uses your device&apos;s webcam and on-device
                body tracking to read your actual physical movements. To make a
                save, you move your arms — or your whole body — into the path
                of the incoming shot.
              </p>
              <p>
                The game uses{" "}
                <strong className="text-white">
                  real-time pose detection
                </strong>{" "}
                to track your hand positions against six distinct goal zones:
                top-left, top-center, top-right, bottom-left, bottom-center,
                and bottom-right. Each shot is aimed at one of these zones, and
                you have a limited window to get your hands there before the
                ball crosses the line.
              </p>
              <p>
                You start with{" "}
                <strong className="text-white">three lives</strong>. Every goal
                that beats you costs one life. The game ends when you lose all
                three. Your final score is based on the number of saves you
                make, your save accuracy, and your average reaction time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              How to Play
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                Open the{" "}
                <Link
                  href="/goalie"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  Goalkeeper game
                </Link>{" "}
                and allow camera access when prompted. The game uses your
                webcam image locally — no video is uploaded or stored. Once the
                camera is active, hold both hands up in front of you in a
                neutral centered position to signal that you&apos;re ready.
                When the whistle blows, a penalty kick begins.
              </p>
              <p>
                Watch the ball&apos;s trajectory and dive toward the right zone.
                The goal frame highlights the target zone with a pulsing
                indicator so you can anticipate the shot. Your glove indicator
                turns green the moment you successfully enter the target pocket,
                confirming a save.
              </p>
              <p>
                The game is designed to be played standing up with your arms in
                front of the screen. A small screen or tablet works well;
                larger monitors or a laptop on a desk are ideal. The more
                space you have to move, the better your reactions will
                translate.
              </p>
            </div>
          </section>

          {/* Difficulty stages */}
          <section>
            <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
              Difficulty Stages
            </h2>
            <p className="mb-6 text-base leading-relaxed text-zinc-400">
              The game gets progressively harder as your save count grows.
              There are five distinct stages, each with faster shots, tighter
              pockets, and more deceptive trajectories:
            </p>
            <div className="space-y-3">
              {stages.map(({ name, shots, desc, color, bg, border }) => (
                <div
                  key={name}
                  className={`flex items-start gap-4 rounded-xl border p-5 ${border} ${bg}`}
                >
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-black ${color}`}>{name}</p>
                    <p className="text-xs text-zinc-600">{shots}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              The Goalie Game Leaderboard
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                After every game session, your performance is submitted to the{" "}
                <Link
                  href="/leaderboard"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  GoldenXI Goalkeeper Leaderboard
                </Link>
                . Only your best score is retained. The leaderboard ranks
                players by their save count, accuracy, average reaction time,
                longest save streak, and total shots faced.
              </p>
              <p>
                The goalkeeper leaderboard is completely separate from the
                bracket prediction rankings, so you can compete in both areas
                simultaneously. Whether you&apos;re a prediction mastermind or
                a reflex specialist — or both — GoldenXI tracks your best.
              </p>
              <p>
                Private groups also have goalie standings, so you can compare
                your reaction speed against the same friends you compete with
                in the bracket competition.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl border border-red-400/20 bg-gradient-to-br from-red-400/10 to-red-500/5 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white">
              Ready to step into goal?
            </h2>
            <p className="mb-7 text-zinc-400">
              All you need is a webcam and a bit of space. The game runs
              entirely in your browser — no downloads, no installs. Or go back
              to the{" "}
              <Link href="/" className="text-yellow-400 hover:underline">
                GoldenXI homepage
              </Link>{" "}
              to build your World Cup bracket too.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/goalie"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-7 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
              >
                Play Goalkeeper Game <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/bracket"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3 text-sm font-bold text-white transition hover:border-white/40"
              >
                Build World Cup Bracket
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
