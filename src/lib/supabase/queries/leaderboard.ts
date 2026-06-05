import { createClient } from "@/src/lib/supabase/server";
import type { LeaderboardEntry } from "@/src/lib/mock-data/leaderboard";

export async function fetchLeaderboard(
  limit = 50
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("brackets")
      .select(
        `
        id,
        name,
        user_id,
        points_earned,
        created_at,
        profiles!inner ( username, avatar_url ),
        bracket_picks (
          picked_team_id,
          matches!inner (
            round,
            teams:picked_team_id ( name, flag_emoji )
          )
        )
      `
      )
      .eq("is_locked", true)
      .order("points_earned", { ascending: false })
      .limit(limit);

    if (error) return { data: [], error: error.message };
    if (!data || data.length === 0) return { data: [], error: null };

    const entries: LeaderboardEntry[] = data.map((row, idx) => {
      const profile = Array.isArray(row.profiles)
        ? row.profiles[0]
        : row.profiles;

      const finalPick = (row.bracket_picks ?? []).find(
        (p: Record<string, unknown>) => {
          const match = p.matches as Record<string, unknown> | null;
          return match?.round === "final";
        }
      );

      const championTeam = finalPick
        ? (
            (finalPick as Record<string, unknown>).matches as Record<
              string,
              unknown
            >
          )?.teams as { name: string; flag_emoji: string | null } | null
        : null;

      return {
        rank: idx + 1,
        bracket_id: row.id as string,
        bracket_name: row.name as string,
        user_id: row.user_id as string,
        username: (profile as { username: string })?.username ?? "Anonymous",
        avatar_url:
          (profile as { avatar_url: string | null })?.avatar_url ?? null,
        points_earned: (row.points_earned as number) ?? 0,
        champion_name: championTeam?.name ?? null,
        champion_flag: championTeam?.flag_emoji ?? null,
        created_at: row.created_at as string,
      };
    });

    return { data: entries, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
