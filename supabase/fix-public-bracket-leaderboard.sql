-- =========================================================
-- Fix: public_bracket privacy filter on global leaderboard
-- =========================================================
-- The previous get_global_leaderboard RPC returned ALL submitted
-- brackets regardless of profiles.public_bracket. This migration
-- restricts the global leaderboard to users who opted in.
--
-- Run this in the Supabase SQL editor.
-- =========================================================

DROP FUNCTION IF EXISTS public.get_global_leaderboard(uuid, integer);

CREATE FUNCTION public.get_global_leaderboard(
  tournament_id_param UUID,
  limit_param INT DEFAULT 50
)
RETURNS TABLE (
  bracket_id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bracket_name TEXT,
  submitted_at TIMESTAMPTZ,
  champion_name TEXT,
  champion_code TEXT,
  champion_flag TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS bracket_id,
    b.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    b.name AS bracket_name,
    b.submitted_at,
    final_team.name AS champion_name,
    final_team.code AS champion_code,
    final_team.flag_emoji AS champion_flag
  FROM public.brackets b
  INNER JOIN public.profiles p ON p.id = b.user_id
  LEFT JOIN LATERAL (
    SELECT bp.picked_team_id
    FROM public.bracket_picks bp
    INNER JOIN public.matches m ON m.id = bp.match_id
    WHERE bp.bracket_id = b.id
      AND m.round = 'final'
    LIMIT 1
  ) final_pick ON true
  LEFT JOIN public.teams final_team ON final_team.id = final_pick.picked_team_id
  WHERE b.tournament_id = tournament_id_param
    AND b.status = 'submitted'
    AND p.public_bracket = true
  ORDER BY b.submitted_at ASC
  LIMIT limit_param;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(uuid, integer) TO anon;
