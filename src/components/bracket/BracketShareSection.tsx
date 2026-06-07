import { getCurrentUserProfile } from "@/src/lib/supabase/queries/profiles";
import { getCurrentUserBracket } from "@/src/lib/supabase/queries/groups";
import BracketShareCard from "./BracketShareCard";

export default async function BracketShareSection() {
  const { profile } = await getCurrentUserProfile();
  const { bracket } = await getCurrentUserBracket();

  if (!profile) {
    return null;
  }

  const bracketComplete = bracket ? bracket.status === "submitted" : false;

  return (
    <div className="mt-8">
      <BracketShareCard
        username={profile.username}
        displayName={profile.display_name}
        championName={null}
        championFlag={null}
        totalScore={bracket?.points_earned || 0}
        bracketComplete={bracketComplete}
      />
    </div>
  );
}
