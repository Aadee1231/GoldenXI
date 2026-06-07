import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getCurrentUserProfile } from "@/src/lib/supabase/queries/profiles";
import ProfileEditForm from "@/src/components/auth/ProfileEditForm";

export const metadata = {
  title: "Profile | GoldenXI",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { profile } = await getCurrentUserProfile();

  if (!profile) {
    redirect("/profile/setup");
  }

  return (
    <div className="min-h-screen px-4 py-24">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">
            Your <span className="text-yellow-400">Profile</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage your username and display name
          </p>
        </div>
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  );
}
