import { createClient } from "@/src/lib/supabase/server";
import { getCurrentUserProfile } from "@/src/lib/supabase/queries/profiles";
import AuthButton from "@/src/components/auth/AuthButton";

export default async function NavbarAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const result = await getCurrentUserProfile();
    profile = result.profile;
  }

  return <AuthButton user={user} profile={profile} />;
}
