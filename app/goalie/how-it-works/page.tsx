import Link from "next/link";
import { Camera, Heart, Target, Zap, Trophy, Shield } from "lucide-react";

export const metadata = {
  title: "How Goalie Reaction Works | GoldenXI",
};

export default function GoalieHowItWorks() {
  return (
    <div className="relative min-h-screen px-4 py-24">
      {/* Background atmosphere */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 ring-1 ring-red-400/20">
            <Camera className="h-4 w-4" />
            Guide
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            How Goalie{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Reaction
            </span>{" "}
            Works
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm text-zinc-400">
            A webcam reflex mini-game — read the shot and dive in time
          </p>
        </div>

        {/* How to play */}
        <div className="mb-10 space-y-4">
          <h2 className="text-xl font-semibold text-white">How to Play</h2>
          {[
            {
              icon: <Camera className="h-5 w-5 text-yellow-400" />,
              title: "Start with both hands",
              description: "Put both hands in front of the camera to begin. The game detects when you're ready.",
            },
            {
              icon: <Target className="h-5 w-5 text-yellow-400" />,
              title: "Read the incoming shot",
              description: "Watch for the target save zone (highlighted pocket) and the ball's flight path.",
            },
            {
              icon: <Shield className="h-5 w-5 text-yellow-400" />,
              title: "Move your hand to save",
              description: "Move your hand into the target zone before the ball arrives. Timing is everything.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring & Difficulty */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-400" />
              <h3 className="font-semibold text-white">Saves & Goals</h3>
            </div>
            <p className="text-sm text-zinc-400">
              A save increases your score and streak. A goal costs one life. You start with 3 lives — game ends when lives reach 0.
            </p>
          </div>
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              <h3 className="font-semibold text-white">Difficulty Progression</h3>
            </div>
            <p className="text-sm text-zinc-400">
              The game gets harder over time with faster shots, tighter save windows, and more ball curves. Test your limits!
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mt-6 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Leaderboard</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Your best scores appear on the goalie leaderboard. Compete globally and within groups for the top reflex times.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/goalie"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-8 py-3 font-semibold text-black transition-colors hover:bg-yellow-500"
          >
            Play Goalie Reaction
          </Link>
        </div>
      </div>
    </div>
  );
}
