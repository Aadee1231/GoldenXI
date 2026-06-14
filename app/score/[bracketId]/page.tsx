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

  const { bracket, groupPicks, champion } = data;
  const displayName = bracket.display_name || bracket.username || "Unknown Player";
  const breakdown = calculateGroupScoreBreakdown(groupPicks);
  const totalGroupScore = breakdown.reduce((sum, g) => sum + g.points, 0);

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
                  <span className="text-lg font-bold text-white">{totalGroupScore} pts</span>
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

        {/* Group breakdown */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Group Stage Breakdown</h2>
          {breakdown.map((group) => (
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
            <strong className="text-zinc-400">Group Stage Scoring:</strong> 3 pts = perfect order · 2 pts = correct top 2 · 1 pt = correct top 3 · 0 pts = no match
          </p>
        </div>
      </div>
    </div>
  );
}
