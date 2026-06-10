import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, Lock, CheckCircle, XCircle } from "lucide-react";
import {
  getPublicBracket,
  getPublicBracketRounds,
  getPublicBracketPickCounts,
} from "@/src/lib/supabase/queries/public-bracket";
import { createClient } from "@/src/lib/supabase/server";
import ShareCard from "@/src/components/share/ShareCard";
import TeamFlag from "@/src/components/ui/TeamFlag";
import PublicKnockoutBracket from "@/src/components/bracket/PublicKnockoutBracket";

interface PublicBracketPageProps {
  params: Promise<{ username: string }>;
}

async function PublicBracketContent({ username }: { username: string }) {
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-500/30 bg-zinc-500/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">No Active Tournament</h1>
          <p className="mt-3 text-zinc-300">
            There is no active tournament at this time.
          </p>
        </div>
      </div>
    );
  }

  const tournamentId = tournaments[0].id;
  const { bracket, error } = await getPublicBracket(username, tournamentId);
  const rounds = bracket
    ? await getPublicBracketRounds(username, tournamentId)
    : null;
  const pickCounts = bracket
    ? await getPublicBracketPickCounts(username, tournamentId)
    : null;

  if (error || !bracket) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-500/30 bg-zinc-500/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700">
            <Lock className="h-8 w-8 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bracket Not Available</h1>
          <p className="mt-3 text-zinc-300">
            This bracket is private or does not exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-3 text-sm font-medium text-black transition hover:bg-yellow-500"
          >
            Create Your Own Bracket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            <h1 className="text-3xl font-extrabold text-white">
              Golden<span className="text-yellow-400">XI</span>
            </h1>
          </div>
          <p className="text-sm text-zinc-500">World Cup 2026 Bracket Challenge</p>
        </div>

        <div className="space-y-8">
          <ShareCard
            username={bracket.username}
            displayName={bracket.display_name}
            championName={bracket.champion_name}
            championFlag={bracket.champion_flag}
            championCode={bracket.champion_code}
            totalScore={bracket.points_earned}
            variant="bracket"
          />

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {bracket.display_name || bracket.username}'s Bracket
              </h2>
              {bracket.is_locked && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-yellow-400/20 px-3 py-1.5 text-xs font-semibold text-yellow-400 ring-1 ring-yellow-400/30">
                  <Lock className="h-3.5 w-3.5" />
                  Locked
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-4 py-3.5">
                <span className="text-sm font-medium text-zinc-400">Status</span>
                <div className="flex items-center gap-2">
                  {bracket.status === "submitted" ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">
                        Submitted
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm font-semibold text-zinc-500">
                        {bracket.status === "draft" ? "Draft" : "In Progress"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {pickCounts && (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-4 py-3.5">
                    <span className="text-sm font-medium text-zinc-400">Group Rankings</span>
                    <span className={`text-sm font-semibold ${pickCounts.groupPicks === 48 ? 'text-green-400' : 'text-white'}`}>
                      {pickCounts.groupPicks} / 48
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-4 py-3.5">
                    <span className="text-sm font-medium text-zinc-400">Third-Place Picks</span>
                    <span className={`text-sm font-semibold ${pickCounts.thirdPlacePicks === 8 ? 'text-green-400' : 'text-white'}`}>
                      {pickCounts.thirdPlacePicks} / 8
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-4 py-3.5">
                    <span className="text-sm font-medium text-zinc-400">Knockout Picks</span>
                    <span className={`text-sm font-semibold ${pickCounts.knockoutPicks === 31 ? 'text-green-400' : 'text-white'}`}>
                      {pickCounts.knockoutPicks} / 31
                    </span>
                  </div>
                </>
              )}

              {bracket.champion_name && (
                <div className="flex items-center justify-between rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-3.5">
                  <span className="text-sm font-medium text-zinc-400">Champion Pick</span>
                  <div className="flex items-center gap-2.5">
                    <TeamFlag
                      name={bracket.champion_name}
                      code={bracket.champion_code || ""}
                      flag_emoji={bracket.champion_flag}
                      flag_code={bracket.champion_code}
                      size="md"
                    />
                    <span className="text-base font-bold text-white">
                      {bracket.champion_name}
                    </span>
                  </div>
                </div>
              )}

              {bracket.points_earned > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-3.5">
                  <span className="text-sm font-medium text-zinc-400">Total Score</span>
                  <span className="text-xl font-extrabold text-yellow-400">
                    {bracket.points_earned} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          {rounds && <PublicKnockoutBracket rounds={rounds} />}

          <div className="text-center">
            <Link
              href="/bracket"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/40"
            >
              <Trophy className="h-5 w-5" />
              Create Your Own Bracket
            </Link>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center">
            <p className="text-xs leading-relaxed text-zinc-600">
              GoldenXI is an independent fan-made game. It is not affiliated with, endorsed by, sponsored by, or officially connected to FIFA, the FIFA World Cup, or any tournament organizer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicBracketSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="h-96 w-full max-w-3xl animate-pulse rounded-xl bg-white/5" />
    </div>
  );
}

export async function generateMetadata({ params }: PublicBracketPageProps) {
  const { username } = await params;

  return {
    title: `${username}'s Bracket | GoldenXI`,
    description: `Check out ${username}'s World Cup bracket and make your own picks on GoldenXI.`,
  };
}

export default async function PublicBracketPage({ params }: PublicBracketPageProps) {
  const { username } = await params;

  return (
    <Suspense fallback={<PublicBracketSkeleton />}>
      <PublicBracketContent username={username} />
    </Suspense>
  );
}
