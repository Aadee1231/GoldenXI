import { Flame } from "lucide-react";
import Link from "next/link";
import { fetchLeaderboard } from "@/src/lib/supabase/queries/leaderboard";
import { fetchGlobalGoalieLeaderboard } from "@/src/lib/supabase/queries/goalie-leaderboard";
import LeaderboardRow from "@/src/components/leaderboard/LeaderboardRow";
import LeaderboardEmpty from "@/src/components/leaderboard/LeaderboardEmpty";
import LeaderboardTabs from "@/src/components/leaderboard/LeaderboardTabs";
import GoalieLeaderboardSection from "@/src/components/leaderboard/GoalieLeaderboardSection";
import { hasProvisionalGroups } from "@/src/data/groupStandings";
import type { LeaderboardEntry } from "@/src/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "World Cup 2026 Leaderboard — Bracket Rankings & Goalie Standings",
  description:
    "Track your World Cup 2026 bracket score in real time. See global rankings, compete in private groups, and check the Goalkeeper Reaction leaderboard on GoldenXI.",
  alternates: {
    canonical: "https://goldenxi.vercel.app/leaderboard",
  },
  openGraph: {
    title: "World Cup 2026 Leaderboard — GoldenXI",
    description:
      "Track your World Cup 2026 bracket score live. Global rankings, private groups, and goalie game standings.",
    url: "https://goldenxi.vercel.app/leaderboard",
  },
};

/**
 * Show the podium only once at least one user has accumulated any points.
 * During early group stage with no standings entered yet, everyone is at 0 and
 * the podium is meaningless noise, so we hide it.
 */
function shouldShowLeaderboardPodium(entries: LeaderboardEntry[]): boolean {
  return entries.some((e) => e.total_score > 0);
}

type SearchParams = Promise<{ tab?: string }>;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab = "bracket" } = await searchParams;
  const activeTab = tab === "goalie" ? "goalie" : "bracket";

  const { data: entries, error: bracketError } =
    activeTab === "bracket"
      ? await fetchLeaderboard(75)
      : { data: [] as Awaited<ReturnType<typeof fetchLeaderboard>>["data"], error: null };

  const { data: goalieEntries, error: goalieError } =
    activeTab === "goalie"
      ? await fetchGlobalGoalieLeaderboard(50)
      : { data: [] as Awaited<ReturnType<typeof fetchGlobalGoalieLeaderboard>>["data"], error: null };

  return (
    <div className="relative min-h-screen px-4 py-24">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-yellow-500/8 blur-3xl" />
      </div>

      <div className={`relative mx-auto ${activeTab === "goalie" ? "max-w-5xl" : "max-w-3xl"}`}>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-gradient-to-r from-blue-400/15 to-blue-500/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-blue-400 shadow-lg shadow-blue-400/10 ring-1 ring-blue-400/20">
            <Flame className="h-4 w-4" />
            Global Rankings
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Leaderboard
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-zinc-400">
            {activeTab === "bracket"
              ? <>Scoring begins when tournament results are entered.<br className="hidden sm:inline" />Correct picks earn more points in later rounds.</>
              : "Top camera-mode goalkeepers ranked by save performance and reaction speed."}
          </p>
          <Link
            href="/leaderboard/how-scoring-works"
            className="mt-3 inline-block text-sm text-zinc-500 hover:text-yellow-400 transition-colors"
          >
            How scoring works →
          </Link>
        </div>

        {/* Tabs */}
        <LeaderboardTabs activeTab={activeTab} />

        {/* ── Bracket Rankings tab ── */}
        {activeTab === "bracket" && (
          <>
            {bracketError && (
              <p className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-center text-xs font-semibold text-red-400 ring-1 ring-red-400/20">
                Error loading leaderboard: {bracketError}
              </p>
            )}

            {/* Top-3 podium strip — shown once at least one user has points */}
            {shouldShowLeaderboardPodium(entries) && entries.length >= 3 && (
              <div className="mb-10 grid grid-cols-3 gap-3">
                {[entries[1], entries[0], entries[2]].map((entry, i) => {
                  const heights = ["h-40", "h-44", "h-40"];
                  const medals = ["🥈", "🥇", "🥉"];
                  return (
                    <div
                      key={entry.bracket_id}
                      className={[
                        "flex flex-col items-center justify-end gap-2 rounded-xl border px-3 pb-5 pt-4 transition-all duration-300 hover:scale-105",
                        i === 1
                          ? "border-yellow-400/40 bg-gradient-to-b from-yellow-400/10 to-yellow-400/5 ring-1 ring-yellow-400/20"
                          : "border-white/10 bg-white/[0.04] hover:border-white/20",
                        heights[i],
                      ].join(" ")}
                    >
                      <span className="text-3xl">{medals[i]}</span>
                      <p className="max-w-full truncate text-center text-xs font-bold text-white">
                        {entry.display_name || entry.username}
                      </p>
                      <p
                        className={[
                          "text-base font-extrabold tabular-nums",
                          i === 1 ? "text-yellow-400" : "text-zinc-300",
                        ].join(" ")}
                      >
                        {entry.total_score} pts
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table header */}
            {entries.length > 0 && (
              <div className="mb-2 flex items-center gap-4 px-5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                <div className="w-8 shrink-0 text-center">#</div>
                <div className="w-9 shrink-0" />
                <div className="flex-1">Player / Bracket</div>
                <div className="hidden min-w-[110px] sm:block">Champion</div>
                <div className="w-14 shrink-0 text-right">Points</div>
                <div className="hidden w-16 shrink-0 text-right lg:block">Date</div>
              </div>
            )}

            {/* Rows */}
            {entries.length === 0 ? (
              <LeaderboardEmpty />
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <LeaderboardRow key={entry.bracket_id} entry={entry} />
                ))}
              </div>
            )}

            {/* Provisional note + footer */}
            {entries.length > 0 && (
              <div className="mt-10 space-y-3">
                {hasProvisionalGroups() && (
                  <div className="rounded-lg border border-yellow-400/15 bg-yellow-400/5 p-4 text-center">
                    <p className="text-xs leading-relaxed text-yellow-400/80">
                      ⚡ Live group-stage points are provisional and may change as standings update.
                    </p>
                  </div>
                )}
                <div className="rounded-lg border border-blue-400/10 bg-blue-400/5 p-4 text-center">
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Group Stage: Up to 3 points per group · R32 1 · R16 6 · QF 8 · SF 12 · Final 20
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Goalie Reaction tab ── */}
        {activeTab === "goalie" && (
          <GoalieLeaderboardSection entries={goalieEntries} error={goalieError} />
        )}
      </div>
    </div>
  );
}
