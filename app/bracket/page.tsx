import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { needsProfileSetup } from "@/src/lib/supabase/queries/profiles";
import BracketWizard from "@/src/components/bracket-v3/BracketWizard";

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

  return (
    <div className="min-h-screen bg-[#080808]">
      <BracketWizard />
    </div>
  );
}
