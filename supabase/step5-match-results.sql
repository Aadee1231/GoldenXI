-- =========================================================
-- Step 5: Match Results and Leaderboard Support
-- =========================================================
-- This migration adds support for tracking match results
-- and calculating leaderboard scores

-- =========================================================
-- 1. Ensure matches table has result tracking columns
-- =========================================================

-- winner_team_id already exists from seed-bracket-data.sql
-- completed column already exists (boolean)
-- Add completed_at for timestamp tracking

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- =========================================================
-- 2. Add submitted_at to brackets table for tiebreaker
-- =========================================================

ALTER TABLE public.brackets
ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Update existing submitted brackets to have a submitted_at timestamp
UPDATE public.brackets
SET submitted_at = updated_at
WHERE status = 'submitted' AND submitted_at IS NULL;

-- =========================================================
-- 3. Create SECURITY DEFINER function for safe leaderboard access
-- =========================================================

-- This function returns leaderboard-safe data without exposing
-- private user information or allowing edits to other users' brackets

CREATE OR REPLACE FUNCTION public.get_global_leaderboard(
  tournament_id_param uuid,
  limit_param integer DEFAULT 50
)
RETURNS TABLE (
  bracket_id uuid,
  user_id uuid,
  username text,
  avatar_url text,
  bracket_name text,
  submitted_at timestamptz,
  champion_team_id uuid,
  champion_name text,
  champion_code text,
  champion_flag text
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
    p.avatar_url,
    b.name AS bracket_name,
    b.submitted_at,
    final_pick.picked_team_id AS champion_team_id,
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
  ORDER BY b.submitted_at ASC
  LIMIT limit_param;
END;
$$;

-- =========================================================
-- 4. Create SECURITY DEFINER function for group leaderboard
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_group_leaderboard(
  group_id_param uuid,
  tournament_id_param uuid
)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  bracket_id uuid,
  bracket_name text,
  bracket_status text,
  submitted_at timestamptz,
  champion_team_id uuid,
  champion_name text,
  champion_code text,
  champion_flag text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gm.user_id,
    p.username,
    p.avatar_url,
    b.id AS bracket_id,
    b.name AS bracket_name,
    b.status AS bracket_status,
    b.submitted_at,
    final_pick.picked_team_id AS champion_team_id,
    final_team.name AS champion_name,
    final_team.code AS champion_code,
    final_team.flag_emoji AS champion_flag
  FROM public.group_members gm
  INNER JOIN public.profiles p ON p.id = gm.user_id
  LEFT JOIN public.brackets b ON b.user_id = gm.user_id
    AND b.tournament_id = tournament_id_param
  LEFT JOIN LATERAL (
    SELECT bp.picked_team_id
    FROM public.bracket_picks bp
    INNER JOIN public.matches m ON m.id = bp.match_id
    WHERE bp.bracket_id = b.id
      AND m.round = 'final'
    LIMIT 1
  ) final_pick ON true
  LEFT JOIN public.teams final_team ON final_team.id = final_pick.picked_team_id
  WHERE gm.group_id = group_id_param
  ORDER BY gm.joined_at ASC;
END;
$$;

-- =========================================================
-- 5. Grant execute permissions on the functions
-- =========================================================

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_leaderboard(uuid, uuid) TO authenticated;

-- =========================================================
-- 6. Verify setup
-- =========================================================

SELECT
  'matches_columns' AS check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches'
  AND column_name IN ('winner_team_id', 'completed', 'completed_at')
ORDER BY column_name;
