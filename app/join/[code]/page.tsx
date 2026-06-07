import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getInvitePreview, checkGroupMembership } from "@/src/lib/supabase/queries/invites";
import InvitePageContent from "./InvitePageContent";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

async function InviteContent({ code }: { code: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { preview, error } = await getInvitePreview(code);

  if (error || !preview) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400">Invite Not Found</h1>
          <p className="mt-3 text-zinc-300">
            This invite link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <InvitePageContent
        preview={preview}
        joinCode={code}
        isAuthenticated={false}
        isMember={false}
      />
    );
  }

  const { isMember } = await checkGroupMembership(preview.group_id);

  if (isMember) {
    redirect(`/groups/${preview.group_id}`);
  }

  return (
    <InvitePageContent
      preview={preview}
      joinCode={code}
      isAuthenticated={true}
      isMember={false}
    />
  );
}

function InviteSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="h-96 w-full max-w-md animate-pulse rounded-xl bg-white/5" />
    </div>
  );
}

export async function generateMetadata({ params }: InvitePageProps) {
  const { code } = await params;
  const { preview } = await getInvitePreview(code);

  if (!preview) {
    return {
      title: "Join Group | GoldenXI",
      description: "Join a GoldenXI bracket group",
    };
  }

  return {
    title: `Join ${preview.group_name} | GoldenXI`,
    description: `You've been invited to join ${preview.group_name}. Make your World Cup picks and compete with friends.`,
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;

  return (
    <Suspense fallback={<InviteSkeleton />}>
      <InviteContent code={code} />
    </Suspense>
  );
}
