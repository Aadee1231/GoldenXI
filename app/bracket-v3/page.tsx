import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import BracketWizard from "@/src/components/bracket-v3/BracketWizard";

export default async function BracketV3Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <BracketWizard />
    </div>
  );
}
