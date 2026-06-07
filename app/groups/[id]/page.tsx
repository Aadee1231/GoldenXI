import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowLeft, Users, Crown, Trophy, CheckCircle, XCircle, Edit } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getGroupById, getGroupMembersWithBrackets, getCurrentUserBracket } from "@/src/lib/supabase/queries/groups";
import CopyJoinCodeButton from "./CopyJoinCodeButton";

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

async function GroupDetailContent({ groupId }: { groupId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?redirect=/groups/${groupId}`);
  }

  // Fetch group, members with brackets, and current user's bracket
  const { group, error: groupError } = await getGroupById(groupId);
  const { members, error: membersError } = await getGroupMembersWithBrackets(groupId);
  const { bracket: userBracket, error: bracketError } = await getCurrentUserBracket();

  // Debug: Show error if group fetch failed
  if (groupError || !group) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <h1 className="text-xl font-bold text-red-400">Error Loading Group</h1>
        <p className="mt-2 text-zinc-300">Group ID: {groupId}</p>
        <p className="mt-2 text-red-300">Error: {groupError || "Group not found"}</p>
      </div>
    );
  }

  // Check if user is a member (handle case where members failed to load)
  const isMember = membersError ? false : members.some((m) => m.user_id === user.id);
  const isCreator = group.created_by === user.id;

  if (!isMember && !membersError) {
    redirect("/groups?error=not-member");
  }

  return (
    <div className="space-y-6">
      {/* Debug: Show members error as warning if present */}
      {membersError && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-300">
            <strong>Warning:</strong> Could not load members: {membersError}
          </p>
        </div>
      )}

      {/* Group Header */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{group.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Group ID: {group.id}
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
        <div className="mt-6 flex flex-wrap items-center gap-3">
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

      {/* Current User's Bracket Status */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Your Bracket
        </h3>
        {userBracket ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-zinc-300">
                Bracket {userBracket.status === "submitted" ? "submitted" : "saved as draft"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/bracket"
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-500"
              >
                <Edit className="h-4 w-4" />
                {userBracket.status === "submitted" ? "View Bracket" : "Edit Bracket"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-zinc-500" />
              <span className="text-sm text-zinc-400">
                You haven't submitted your bracket yet
              </span>
            </div>
            <Link
              href="/bracket"
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-500"
            >
              <Trophy className="h-4 w-4" />
              Create Bracket
            </Link>
          </div>
        )}
      </div>

      {/* Member Brackets */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
          <Users className="h-5 w-5 text-yellow-400" />
          Member Brackets ({members.length})
        </h3>
        {members.length === 0 ? (
          <p className="text-sm text-zinc-400">No members found.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {member.profile?.username || `User ${member.user_id.slice(0, 8)}`}
                      </span>
                      {member.user_id === group.created_by && (
                        <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                          <Crown className="h-3 w-3" />
                          Creator
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.bracket ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-green-400">
                        {member.bracket.status === "submitted" ? "Submitted" : "Draft"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-zinc-500" />
                      <span className="text-xs text-zinc-500">No bracket</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Leaderboard Placeholder */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Group Leaderboard
        </h3>
        <p className="text-sm text-zinc-400">Scoring and leaderboard coming in Step 5...</p>
      </div>
    </div>
  );
}

function GroupDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-xl bg-white/5" />
      <div className="h-32 animate-pulse rounded-xl bg-white/5" />
      <div className="h-48 animate-pulse rounded-xl bg-white/5" />
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
