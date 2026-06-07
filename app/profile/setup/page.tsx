import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getCurrentUserProfile } from "@/src/lib/supabase/queries/profiles";
import ProfileSetupForm from "@/src/components/auth/ProfileSetupForm";

export const metadata = {
  title: "Profile Setup | GoldenXI",
};

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { profile } = await getCurrentUserProfile();

  // If user already has a username, redirect to bracket
  if (profile?.username) {
    redirect("/bracket");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-white">
            Complete Your <span className="text-yellow-400">Profile</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Choose your username and display name to get started
          </p>
        </div>
        <ProfileSetupForm profile={profile} />
      </div>
    </div>
  );
}
