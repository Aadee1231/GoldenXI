import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getGroupById } from "@/src/lib/supabase/queries/groups";
import { getGroupSettings, canEditGroupSettings } from "@/src/lib/supabase/queries/group-settings";
import GroupSettingsForm from "@/src/components/groups/GroupSettingsForm";

interface GroupSettingsPageProps {
  params: Promise<{ id: string }>;
}

async function GroupSettingsContent({ groupId }: { groupId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?redirect=/groups/${groupId}/settings`);
  }

  const { group, error: groupError } = await getGroupById(groupId);
  const { canEdit, error: permError } = await canEditGroupSettings(groupId);
  const { settings, error: settingsError } = await getGroupSettings(groupId);

  if (groupError || !group) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <h1 className="text-xl font-bold text-red-400">Error Loading Group</h1>
        <p className="mt-2 text-red-300">Error: {groupError || "Group not found"}</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
        <h1 className="text-xl font-bold text-yellow-400">Access Denied</h1>
        <p className="mt-2 text-zinc-300">Only the group creator can edit settings.</p>
        <Link
          href={`/groups/${groupId}`}
          className="mt-4 inline-flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Group
        </Link>
      </div>
    );
  }

  if (settingsError || !settings) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <h1 className="text-xl font-bold text-red-400">Error Loading Settings</h1>
        <p className="mt-2 text-red-300">Error: {settingsError || "Settings not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold text-white">{group.name}</h1>
        <p className="mt-1 text-sm text-zinc-400">Group Settings</p>
      </div>

      <GroupSettingsForm
        groupId={groupId}
        groupName={group.name}
        initialSettings={settings}
      />
    </div>
  );
}

function GroupSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      <div className="h-96 animate-pulse rounded-xl bg-white/5" />
    </div>
  );
}

export default async function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#080808] py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href={`/groups/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Group
        </Link>

        <Suspense fallback={<GroupSettingsSkeleton />}>
          <GroupSettingsContent groupId={id} />
        </Suspense>
      </div>
    </div>
  );
}
