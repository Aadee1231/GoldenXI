import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy, Star, Zap } from "lucide-react";

export const metadata: Metadata = {
  title:
    "World Cup 2026 Predictions — Group Stage, Knockouts & Champion Picks",
  description:
    "Make your World Cup 2026 predictions on GoldenXI. Predict group standings, knockout round winners, and your tournament champion — then track your score live.",
  alternates: {
    canonical: "https://goldenxi.vercel.app/world-cup-2026-predictions",
  },
  openGraph: {
    title: "World Cup 2026 Predictions — GoldenXI",
    description:
      "Make your World Cup 2026 predictions. Groups, knockouts, champion — scored live as results come in.",
    url: "https://goldenxi.vercel.app/world-cup-2026-predictions",
    images: [
      {
        url: "https://goldenxi.vercel.app/og-image.png?v=6",
        width: 1200,
        height: 630,
        alt: "World Cup 2026 Predictions — GoldenXI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "World Cup 2026 Predictions — GoldenXI",
    description:
      "Predict the entire World Cup 2026. Groups, knockouts, and champion — tracked live on GoldenXI.",
  },
};

const scoringRows = [
  { round: "Group Stage (per team)", points: "Up to 3 pts" },
  { round: "Round of 32", points: "1 pt" },
  { round: "Round of 16", points: "6 pts" },
  { round: "Quarter-finals", points: "8 pts" },
  { round: "Semi-finals", points: "12 pts" },
  { round: "Final (Champion)", points: "20 pts" },
];

export default function WorldCup2026PredictionsPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-blue-400 ring-1 ring-blue-400/20">
            Make Your Predictions
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            World Cup 2026{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Predictions
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400">
            Predict every stage of the FIFA World Cup 2026 — from the opening
            group matches to the Final. Lock in your picks, earn points, and
            prove you called it first.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/bracket"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/25 transition-all hover:scale-105"
            >
              Make My Predictions <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-8 py-4 text-base font-bold text-white transition-all hover:border-white/40"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-16">
          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              What You Can Predict on GoldenXI
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                GoldenXI lets you make predictions across the entire 2026 FIFA
                World Cup. The prediction process starts with the{" "}
                <strong className="text-white">group stage</strong> — you rank
                all four teams in each of the 12 groups, predicting who
                finishes first, second, and third. Because eight third-place
                teams also advance, every group prediction matters.
              </p>
              <p>
                Once the group stage is set, your bracket continues through the{" "}
                <strong className="text-white">
                  Round of 32, Round of 16, Quarter-finals, Semi-finals
                </strong>
                , and the{" "}
                <strong className="text-white">Final</strong>. Each stage
                requires you to pick match winners, and GoldenXI auto-populates
                the next round based on your current picks.
              </p>
              <p>
                Your most important prediction is your{" "}
                <strong className="text-white">tournament champion</strong>.
                The team you pick to lift the trophy earns the highest point
                value if correct — 20 points. Every other prediction contributes
                to your total score based on the round it occurs in.
              </p>
            </div>
          </section>

          {/* Scoring table */}
          <section>
            <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
              How Predictions Are Scored
            </h2>
            <p className="mb-6 text-base leading-relaxed text-zinc-400">
              Points scale with the importance of the round. Getting a
              Quarter-final prediction right is worth far more than a group
              pick, and getting your champion correct is the single most
              valuable call you can make. Here&apos;s how GoldenXI scores each
              prediction:
            </p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    <th className="px-5 py-3 text-left font-semibold text-zinc-400">
                      Prediction
                    </th>
                    <th className="px-5 py-3 text-right font-semibold text-zinc-400">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scoringRows.map(({ round, points }, i) => (
                    <tr
                      key={round}
                      className={[
                        "border-b border-white/5",
                        i === scoringRows.length - 1
                          ? "bg-yellow-400/5"
                          : "hover:bg-white/[0.02]",
                      ].join(" ")}
                    >
                      <td
                        className={`px-5 py-3 ${i === scoringRows.length - 1 ? "font-semibold text-yellow-400" : "text-white"}`}
                      >
                        {round}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-bold ${i === scoringRows.length - 1 ? "text-yellow-400" : "text-zinc-300"}`}
                      >
                        {points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              Scores are updated automatically as official tournament results
              are entered.
            </p>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              Tips for Making Strong Predictions
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                The 2026 World Cup expanded format introduces more room for
                upsets. With 48 teams, the gap between Group A giants and
                Group H minnows can be significant — but history shows smaller
                nations regularly cause shocks. Don&apos;t be afraid to back a
                dark horse in the group stage when the points cost is lower.
              </p>
              <p>
                In the knockout rounds, your picks carry more weight. Think
                carefully about draw brackets: if you pick a strong nation to
                win their group, you may set them on a collision course with
                another strong side in the Round of 16. Consider both your
                individual match prediction and the path it creates deeper in
                the tournament.
              </p>
              <p>
                Your champion pick is a long-term commitment — the team you
                call has to win six or seven straight knockout matches. Choose
                a team with depth, experienced management, and ideally a
                tournament track record. That said, every World Cup throws up
                at least one surprise finalist. Factor in the host advantage
                for the United States, and consider which form teams are
                hottest heading into the summer of 2026.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
              Track Your Predictions in Real Time
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-400">
              <p>
                After you submit your bracket, GoldenXI does the rest. As
                official results are entered after each match, your score
                updates automatically. Visit the{" "}
                <Link
                  href="/leaderboard"
                  className="font-semibold text-yellow-400 hover:underline"
                >
                  leaderboard
                </Link>{" "}
                at any point during the tournament to see your global ranking
                and compare your total points against other GoldenXI players.
              </p>
              <p>
                If you&apos;re competing in a{" "}
                <strong className="text-white">private group</strong>, your
                score is also visible on that group&apos;s dedicated standings
                page. GoldenXI makes it easy to follow the action and the
                competition simultaneously.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 to-yellow-500/5 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white">
              Lock in your World Cup 2026 predictions
            </h2>
            <p className="mb-7 text-zinc-400">
              Free to use. No limits. Sign up, build your bracket, and let the
              tournament scoring do the rest. Or explore the{" "}
              <Link
                href="/world-cup-2026-bracket"
                className="text-yellow-400 hover:underline"
              >
                World Cup 2026 bracket guide
              </Link>{" "}
              to learn more about the format.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/bracket"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-7 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
              >
                Make My Predictions <ArrowRight className="h-4 w-4" />
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
