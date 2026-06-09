import { getCurrentUserProfile } from "@/src/lib/supabase/queries/profiles";
import { getCurrentUserBracket } from "@/src/lib/supabase/queries/groups";
import { createClient } from "@/src/lib/supabase/server";
import BracketShareCard from "./BracketShareCard";

export default async function BracketShareSection() {
  const { profile } = await getCurrentUserProfile();
  const { bracket } = await getCurrentUserBracket();

  if (!profile) {
    return null;
  }

  let bracketComplete = false;
  const isLocked = bracket?.is_locked ?? false;
  let championName: string | null = null;
  let championCode: string | null = null;
  let championFlag: string | null = null;

  if (bracket) {
    const supabase = await createClient();

    // Completion is based on the actual picks (48 group + 8 third-place + 31
    // knockout), NOT the submitted/locked status — a bracket can be fully
    // complete without being locked.
    const [groupCount, thirdCount, knockoutCount] = await Promise.all([
      supabase
        .from("group_picks")
        .select("id", { count: "exact", head: true })
        .eq("bracket_id", bracket.id),
      supabase
        .from("third_place_picks")
        .select("id", { count: "exact", head: true })
        .eq("bracket_id", bracket.id),
      supabase
        .from("bracket_picks")
        .select("id", { count: "exact", head: true })
        .eq("bracket_id", bracket.id),
    ]);

    bracketComplete =
      (groupCount.count ?? 0) === 48 &&
      (thirdCount.count ?? 0) === 8 &&
      (knockoutCount.count ?? 0) === 31;

    // Champion = the team picked in the final match.
    const { data: finalMatch } = await supabase
      .from("matches")
      .select("id")
      .eq("tournament_id", bracket.tournament_id)
      .eq("round", "final")
      .limit(1)
      .maybeSingle();

    if (finalMatch) {
      const { data: finalPick } = await supabase
        .from("bracket_picks")
        .select("picked_team_id, teams:picked_team_id (name, code, flag_emoji, flag_code)")
        .eq("bracket_id", bracket.id)
        .eq("match_id", finalMatch.id)
        .maybeSingle();

      const team = finalPick?.teams as
        | { name: string; code: string; flag_emoji: string | null; flag_code: string | null }
        | { name: string; code: string; flag_emoji: string | null; flag_code: string | null }[]
        | null
        | undefined;
      const teamRow = Array.isArray(team) ? team[0] : team;
      if (teamRow) {
        championName = teamRow.name;
        championCode = teamRow.flag_code || teamRow.code;
        championFlag = teamRow.flag_emoji;
      }
    }
  }

  return (
    <div className="mt-8">
      <BracketShareCard
        username={profile.username}
        displayName={profile.display_name}
        championName={championName}
        championFlag={championFlag}
        championCode={championCode}
        totalScore={bracket?.points_earned || 0}
        bracketComplete={bracketComplete}
        isLocked={isLocked}
      />
    </div>
  );
}
