import { createClient } from "@/src/lib/supabase/server";
import AuthButton from "@/src/components/auth/AuthButton";

export default async function NavbarAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <AuthButton user={user} />;
}
