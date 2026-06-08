import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Users, Plus, LogIn, Trophy } from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import { getUserGroups } from "@/src/lib/supabase/queries/groups";
import { needsProfileSetup } from "@/src/lib/supabase/queries/profiles";
import Link from "next/link";
import CreateGroupForm from "@/src/components/groups/CreateGroupForm";
import JoinGroupForm from "@/src/components/groups/JoinGroupForm";

async function GroupsContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/groups");
  }

  const needsSetup = await needsProfileSetup();
  if (needsSetup) {
    redirect("/profile/setup");
  }

  const groups = await getUserGroups();

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main content - My Groups */}
      <div className="lg:col-span-2">
        <h2 className="mb-6 text-2xl font-bold text-white">My Groups</h2>
        
        {groups.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-zinc-500" />
            <h3 className="mb-2 text-lg font-semibold text-white">No groups yet</h3>
            <p className="text-zinc-400">
              Create a group or join one with a code to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-green-400/50 hover:bg-white/10 hover:shadow-lg hover:shadow-green-400/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                      {group.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-zinc-400">
                      Invite Code: <span className="font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">{group.join_code}</span>
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2 rounded-lg bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-400 transition-all group-hover:bg-green-400/20">
                    <Trophy className="h-4 w-4" />
                    <span>View Group</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar - Actions */}
      <div className="space-y-6">
        {/* Create Group */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Create Group</h3>
          </div>
          <CreateGroupForm />
        </div>

        {/* Join Group */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <LogIn className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Join Group</h3>
          </div>
          <JoinGroupForm />
        </div>
      </div>
    </div>
  );
}

function GroupsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
        <div className="h-32 animate-pulse rounded-xl bg-white/5" />
        <div className="h-32 animate-pulse rounded-xl bg-white/5" />
      </div>
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-xl bg-white/5" />
        <div className="h-48 animate-pulse rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-[#080808] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Private Groups</h1>
          <p className="mt-2 text-zinc-400">
            Create or join private groups to compete with friends.
          </p>
        </div>

        <Suspense fallback={<GroupsSkeleton />}>
          <GroupsContent />
        </Suspense>
      </div>
    </div>
  );
}
