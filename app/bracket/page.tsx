import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { needsProfileSetup } from "@/src/lib/supabase/queries/profiles";
import BracketPageV2 from "@/src/components/bracket/BracketPageV2";
import BracketShareSection from "@/src/components/bracket/BracketShareSection";

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
    <div>
      <BracketPageV2 />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/5" />}>
          <BracketShareSection />
        </Suspense>
      </div>
    </div>
  );
}
