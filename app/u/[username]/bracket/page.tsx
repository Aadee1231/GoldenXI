import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, Lock, CheckCircle, XCircle } from "lucide-react";
import { getPublicBracket } from "@/src/lib/supabase/queries/public-bracket";
import { createClient } from "@/src/lib/supabase/server";
import ShareCard from "@/src/components/share/ShareCard";
import TeamFlag from "@/src/components/ui/TeamFlag";

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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-white">
            <span className="text-yellow-400">GoldenXI</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">World Cup Bracket Challenge</p>
        </div>

        <div className="space-y-6">
          <ShareCard
            username={bracket.username}
            displayName={bracket.display_name}
            championName={bracket.champion_name}
            championFlag={bracket.champion_flag}
            championCode={bracket.champion_code}
            totalScore={bracket.points_earned}
            variant="bracket"
          />

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {bracket.display_name || bracket.username}'s Bracket
              </h2>
              {bracket.is_locked && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-medium text-yellow-400">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                <span className="text-sm text-zinc-400">Status</span>
                <div className="flex items-center gap-2">
                  {bracket.status === "submitted" ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        Submitted
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-500">
                        {bracket.status === "draft" ? "Draft" : "In Progress"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                <span className="text-sm text-zinc-400">Bracket Status</span>
                <span className="text-sm font-medium text-white">
                  {bracket.total_picks > 0 ? `${bracket.total_picks} picks made` : "No picks yet"}
                </span>
              </div>

              {bracket.champion_name && (
                <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                  <span className="text-sm text-zinc-400">Champion Pick</span>
                  <div className="flex items-center gap-2">
                    <TeamFlag
                      name={bracket.champion_name}
                      code={bracket.champion_code || ""}
                      flag_emoji={bracket.champion_flag}
                      flag_code={bracket.champion_code}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-white">
                      {bracket.champion_name}
                    </span>
                  </div>
                </div>
              )}

              {bracket.points_earned > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                  <span className="text-sm text-zinc-400">Total Score</span>
                  <span className="text-lg font-bold text-yellow-400">
                    {bracket.points_earned}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 text-sm font-medium text-black transition hover:bg-yellow-500"
            >
              <Trophy className="h-4 w-4" />
              Create Your Own Bracket
            </Link>
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
