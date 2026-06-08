import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Users, Plus, LogIn, Trophy } from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import { getUserGroups } from "@/src/lib/supabase/queries/groups";
import { needsProfileSetup } from "@/src/lib/supabase/queries/profiles";
import Link from "next/link";
import CreateGroupForm from "@/src/components/groups/CreateGroupForm";
import JoinGroupForm from "@/src/components/groups/JoinGroupForm";
import SectionHeader from "@/src/components/ui/SectionHeader";

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
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-400/10 ring-1 ring-green-400/20">
            <Users className="h-5 w-5 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">My Groups</h2>
        </div>
        
        {groups.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-white/10">
              <Users className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">No groups yet</h3>
            <p className="text-sm text-zinc-400">
              Create a group or join one with a code to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-green-400/50 hover:bg-green-400/5 hover:shadow-lg hover:shadow-green-400/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-green-400">
                      {group.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Invite Code:</span>
                      <code className="rounded-md bg-yellow-400/10 px-2.5 py-1 font-mono text-sm font-bold text-yellow-400 ring-1 ring-yellow-400/20">
                        {group.join_code}
                      </code>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-lg bg-green-400/10 px-4 py-2.5 text-sm font-semibold text-green-400 ring-1 ring-green-400/20 transition-all group-hover:bg-green-400/20 group-hover:ring-green-400/30">
                    <Trophy className="h-4 w-4" />
                    <span className="hidden sm:inline">View Group</span>
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
        <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-6 ring-1 ring-green-400/10">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-400/10 ring-1 ring-green-400/20">
              <Plus className="h-4 w-4 text-green-400" />
            </div>
            <h3 className="font-semibold text-white">Create Group</h3>
          </div>
          <CreateGroupForm />
        </div>

        {/* Join Group */}
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-6 ring-1 ring-yellow-400/10">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10 ring-1 ring-yellow-400/20">
              <LogIn className="h-4 w-4 text-yellow-400" />
            </div>
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
    <div className="relative min-h-screen bg-[#080808] py-20">
      {/* Background tournament energy */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-green-500/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-yellow-500/5 blur-3xl" />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader 
          icon={Users}
          title="Private Groups"
          subtitle="Create or join private groups to compete with friends and climb the rankings together."
          color="green"
        />

        <Suspense fallback={<GroupsSkeleton />}>
          <GroupsContent />
        </Suspense>
      </div>
    </div>
  );
}
