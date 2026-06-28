import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, CheckCircle, XCircle, Clock } from "lucide-react";
import { fetchBracketForScoreDetails } from "@/src/lib/supabase/queries/leaderboard";
import { calculateGroupScoreBreakdown, type GroupScoreBreakdown } from "@/src/lib/bracket/scoring";
import { hasProvisionalGroups } from "@/src/data/groupStandings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Score Details — GoldenXI",
  description: "See exactly how each point was earned in this World Cup 2026 bracket.",
};

type Props = {
  params: Promise<{ bracketId: string }>;
};

const ROUND_LABELS: Record<string, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  final: "Final",
};

const ROUND_POINTS: Record<string, number> = {
  r32: 4,
  r16: 6,
  qf: 8,
  sf: 12,
  final: 20,
};

const ROUND_ORDER = ["r32", "r16", "qf", "sf", "final"];

function getReasonText(reason: GroupScoreBreakdown["reason"]): string {
  switch (reason) {
    case "perfect":
      return "Perfect group order";
    case "top2":
      return "Correct top 2 teams, wrong order";
    case "top3":
      return "Correct top 3 teams";
    case "none":
      return "No points";
    case "not_scored":
      return "Not scored yet";
  }
}

function getReasonColor(reason: GroupScoreBreakdown["reason"]): string {
  switch (reason) {
    case "perfect":
      return "text-green-400";
    case "top2":
      return "text-blue-400";
    case "top3":
      return "text-yellow-400";
    case "none":
      return "text-zinc-500";
    case "not_scored":
      return "text-zinc-600";
  }
}

function getReasonBg(reason: GroupScoreBreakdown["reason"]): string {
  switch (reason) {
    case "perfect":
      return "bg-green-400/10 border-green-400/20";
    case "top2":
      return "bg-blue-400/10 border-blue-400/20";
    case "top3":
      return "bg-yellow-400/10 border-yellow-400/20";
    case "none":
      return "bg-zinc-400/5 border-zinc-400/10";
    case "not_scored":
      return "bg-zinc-400/5 border-zinc-400/10";
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default async function ScoreDetailsPage({ params }: Props) {
  const { bracketId } = await params;
  const { data, error } = await fetchBracketForScoreDetails(bracketId);

  if (error || !data) {
    notFound();
  }

  const { bracket, groupPicks, knockoutPicks, champion } = data;
  const displayName = bracket.display_name || bracket.username || "Unknown Player";

  // Group stage scoring
  const groupBreakdown = calculateGroupScoreBreakdown(groupPicks);
  const totalGroupScore = groupBreakdown.reduce((sum, g) => sum + g.points, 0);

  // Knockout scoring — only count picks where the match result is known
  const knockoutByRound: Record<string, { correct: number; total: number; pts: number }> = {};
  let totalKnockoutScore = 0;
  for (const pick of knockoutPicks) {
    const round = pick.round;
    if (!ROUND_LABELS[round]) continue; // skip group-round picks
    if (!knockoutByRound[round]) knockoutByRound[round] = { correct: 0, total: 0, pts: 0 };
    knockoutByRound[round].total++;
    if (pick.match_completed && pick.match_winner_id) {
      const pts = pick.is_correct ? (ROUND_POINTS[round] ?? 0) : 0;
      if (pick.is_correct) {
        knockoutByRound[round].correct++;
        knockoutByRound[round].pts += pts;
        totalKnockoutScore += pts;
      }
    }
  }

  const totalScore = totalGroupScore + totalKnockoutScore;
  const anyKnockoutResults = knockoutPicks.some(p => p.match_completed && p.match_winner_id && ROUND_LABELS[p.round]);

  return (
    <div className="relative min-h-screen px-4 py-24 pb-32">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-yellow-500/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* Back button */}
        <Link
          href="/leaderboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leaderboard
        </Link>

        {/* Header */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white">
              {bracket.avatar_url ? (
                <img
                  src={bracket.avatar_url}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                displayName.slice(0, 1).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-sm text-zinc-400">{bracket.name}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-zinc-400">Total:</span>
                  <span className="text-lg font-bold text-white">{totalScore} pts</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span>Groups: <span className="text-zinc-300 font-semibold">{totalGroupScore}</span></span>
                  <span>·</span>
                  <span>Knockout: <span className="text-zinc-300 font-semibold">{totalKnockoutScore}</span></span>
                </div>
                {champion && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Champion:</span>
                    <span className="font-semibold text-white">{champion.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-500">{timeAgo(bracket.submitted_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Provisional note */}
        {hasProvisionalGroups() && (
          <div className="mb-6 rounded-lg border border-yellow-400/15 bg-yellow-400/5 p-4">
            <p className="text-xs leading-relaxed text-yellow-400/80">
              ⚡ Live group-stage points are provisional and may change as standings update.
            </p>
          </div>
        )}

        {/* ── Knockout Breakdown ── */}
        {anyKnockoutResults && (
          <div className="mb-8 space-y-3">
            <h2 className="text-lg font-semibold text-white">Knockout Stage</h2>
            {ROUND_ORDER.filter(r => knockoutByRound[r]).map(round => {
              const rd = knockoutByRound[round];
              const picksInRound = knockoutPicks.filter(p => p.round === round && ROUND_LABELS[p.round]);
              return (
                <div key={round} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{ROUND_LABELS[round]}</span>
                    <span className="text-sm font-bold text-yellow-400">{rd.pts} pts</span>
                  </div>
                  <div className="space-y-1.5">
                    {picksInRound.map(pick => {
                      const decided = pick.match_completed && pick.match_winner_id;
                      return (
                        <div
                          key={pick.match_id}
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs ${
                            !decided
                              ? "bg-white/[0.02] text-zinc-500"
                              : pick.is_correct
                              ? "bg-green-400/10 text-green-300"
                              : "bg-red-400/8 text-red-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {decided ? (
                              pick.is_correct ? (
                                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                              )
                            ) : (
                              <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                            )}
                            <span className="font-medium">{pick.picked_team_code || "—"}</span>
                            {decided && !pick.is_correct && pick.match_winner_code && (
                              <span className="text-zinc-500">
                                (won: <span className="text-zinc-400">{pick.match_winner_code}</span>)
                              </span>
                            )}
                          </div>
                          <span className="font-semibold tabular-nums">
                            {decided ? (pick.is_correct ? `+${ROUND_POINTS[round]}` : "0") : "—"} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Group Stage Breakdown ── */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Group Stage</h2>
          {groupBreakdown.map((group) => (
            <div
              key={group.groupLabel}
              className={`rounded-xl border p-4 ${getReasonBg(group.reason)}`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Group letter and points */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 font-bold text-white">
                    {group.groupLabel}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${getReasonColor(group.reason)}`}>
                      {getReasonText(group.reason)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {group.isFinal ? "Final" : "Provisional"} • {group.points} pts
                    </p>
                  </div>
                </div>

                {/* Rankings comparison */}
                <div className="flex gap-6 text-xs">
                  {/* User's prediction */}
                  <div>
                    <p className="mb-1 text-zinc-500">Your pick</p>
                    <div className="space-y-0.5">
                      {[1, 2, 3, 4].map((pos) => {
                        const teamCode = group.predictedRanking[pos];
                        const actualTeamCode = group.actualRanking[pos];
                        const isCorrect = teamCode === actualTeamCode;
                        return (
                          <div
                            key={pos}
                            className={`flex items-center gap-1.5 ${
                              isCorrect && group.reason !== "not_scored" ? "text-green-400" : "text-zinc-400"
                            }`}
                          >
                            <span className="w-4 text-zinc-600">{pos}.</span>
                            <span className="font-medium">{teamCode || "—"}</span>
                            {isCorrect && group.reason !== "not_scored" && (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actual standings */}
                  {group.reason !== "not_scored" && (
                    <>
                      <div className="w-px bg-white/10" />
                      <div>
                        <p className="mb-1 text-zinc-500">Actual</p>
                        <div className="space-y-0.5">
                          {[1, 2, 3, 4].map((pos) => {
                            const teamCode = group.actualRanking[pos];
                            return (
                              <div key={pos} className="flex items-center gap-1.5 text-zinc-400">
                                <span className="w-4 text-zinc-600">{pos}.</span>
                                <span className="font-medium">{teamCode || "—"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring rules reminder */}
        <div className="mt-8 rounded-lg border border-blue-400/10 bg-blue-400/5 p-4">
          <p className="text-xs leading-relaxed text-zinc-500">
            <strong className="text-zinc-400">Group Stage:</strong> 3 pts = perfect order · 2 pts = correct top 2 · 1 pt = correct top 3
            <br />
            <strong className="text-zinc-400">Knockout:</strong> R32 4 pts · R16 6 pts · QF 8 pts · SF 12 pts · Final 20 pts
          </p>
        </div>
      </div>
    </div>
  );
}
