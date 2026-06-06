import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users, Crown, Trophy } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getGroupById } from "@/src/lib/supabase/queries/groups";
import GroupMemberList from "@/src/components/groups/GroupMemberList";
import GroupLeaderboard from "@/src/components/groups/GroupLeaderboard";
import GroupActions from "@/src/components/groups/GroupActions";
import CopyJoinCodeButton from "./CopyJoinCodeButton";

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

async function GroupDetailContent({ groupId }: { groupId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/groups/${groupId}");
  }

  const group = await getGroupById(groupId);

  if (!group) {
    notFound();
  }

  // Check if user is a member
  const isMember = group.members.some((m) => m.user_id === user.id);
  const isCreator = group.created_by === user.id;

  if (!isMember) {
    redirect("/groups?error=not-member");
  }

  // Sort members by bracket points for leaderboard
  const sortedMembers = [...group.members].sort((a, b) => {
    const pointsA = a.bracket?.points_earned || 0;
    const pointsB = b.bracket?.points_earned || 0;
    return pointsB - pointsA;
  });

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Group Header */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{group.name}</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {group.tournament.name} • {group.tournament.season}
              </p>
            </div>
            {isCreator && (
              <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-1 text-xs font-medium text-yellow-400">
                <Crown className="h-3 w-3" />
                Creator
              </span>
            )}
          </div>

          {/* Join Code */}
          <div className="mt-6 flex items-center gap-3">
            <div className="rounded-lg bg-black/50 px-4 py-2">
              <span className="text-xs text-zinc-500">Join Code</span>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg font-bold text-yellow-400">
                  {group.join_code}
                </code>
                <CopyJoinCodeButton joinCode={group.join_code} />
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Share this code with friends to invite them
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Group Leaderboard
          </h2>
          <GroupLeaderboard members={sortedMembers} currentUserId={user.id} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Members */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Users className="h-5 w-5 text-yellow-400" />
            Members ({group.members.length})
          </h3>
          <GroupMemberList 
            members={group.members} 
            creatorId={group.created_by}
            currentUserId={user.id}
          />
        </div>

        {/* Actions */}
        <GroupActions 
          groupId={group.id} 
          isCreator={isCreator} 
          memberCount={group.members.length}
        />
      </div>
    </div>
  );
}

function GroupDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-40 animate-pulse rounded-xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
      </div>
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
        <div className="h-32 animate-pulse rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#080808] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/groups"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Link>

        <Suspense fallback={<GroupDetailSkeleton />}>
          <GroupDetailContent groupId={id} />
        </Suspense>
      </div>
    </div>
  );
}
