import Link from "next/link";
import FeatureCard from "@/src/components/ui/FeatureCard";
import {
  Trophy,
  Users,
  Zap,
  ShieldCheck,
  ArrowRight,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Trophy,
    title: "Tournament Bracket",
    description:
      "Build your complete bracket prediction before the tournament starts. Pick winners round by round and rack up points with every correct call.",
  },
  {
    icon: Users,
    title: "Private Groups",
    description:
      "Create or join private leagues with friends. Share an invite code, compare brackets, and see who truly knows the beautiful game.",
  },
  {
    icon: Zap,
    title: "Juggle Counter AI",
    description:
      "Show off your touch! Use your phone camera to count keep-ups in real time powered by computer vision. Climb the juggle leaderboard.",
    badge: "AI",
  },
  {
    icon: ShieldCheck,
    title: "Goalkeeper Reaction",
    description:
      "Test your reflexes with our AI penalty save challenge. Dive left or right and see how you stack up against GoldenXI players worldwide.",
    badge: "AI",
  },
];

const stats = [
  { value: "48", label: "Teams" },
  { value: "12", label: "Groups" },
  { value: "1", label: "Champion" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16 text-center sm:px-6 lg:px-8">
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-yellow-400/10 blur-[120px]" />
        </div>

        {/* Grid overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]"
        />

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-sm font-medium text-yellow-400">
            <Star className="h-3.5 w-3.5" />
            World Cup 2026 — Build Your Bracket
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Pick the Groups. Build the Bracket.{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Crown Your Champion.
            </span>
          </h1>

          {/* Tagline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Create your full 2026 tournament prediction, choose your knockout winners, and compete with friends in private GoldenXI groups.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/bracket"
              className="group flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
            >
              Build My Bracket
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
            >
              View Leaderboard
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-yellow-400 sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
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
              Everything you need to{" "}
              <span className="text-yellow-400">win the group</span>
            </h2>
            <p className="mx-auto max-w-xl text-zinc-400">
              From bracket predictions to AI-powered mini-games — GoldenXI is
              your home for the tournament.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-white/10 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-16 text-3xl font-extrabold text-white sm:text-4xl">
            Get started in{" "}
            <span className="text-yellow-400">three steps</span>
          </h2>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up in seconds — no credit card required.",
              },
              {
                step: "02",
                title: "Build your bracket",
                desc: "Pick your winners for every match from Group Stage to Final.",
              },
              {
                step: "03",
                title: "Invite your friends",
                desc: "Share your private group code and see who the real football genius is.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 ring-1 ring-yellow-400/20">
                  <span className="text-xl font-black text-yellow-400">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-10 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
