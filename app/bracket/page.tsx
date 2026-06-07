import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { needsProfileSetup } from "@/src/lib/supabase/queries/profiles";
import BracketPageV2 from "@/src/components/bracket/BracketPageV2";

export const metadata = {
  title: "Bracket | GoldenXI",
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const needsSetup = await needsProfileSetup();
  if (needsSetup) {
    redirect("/profile/setup");
  }

  return <BracketPageV2 />;
}
