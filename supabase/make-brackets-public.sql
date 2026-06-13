-- =========================================================
-- Make brackets public by default
-- =========================================================
-- Brackets are now public once submitted. Remove the
-- public_bracket gate from all leaderboard/bracket-view RPCs
-- and ensure existing + new profiles default to true.
--
-- Run this in the Supabase SQL editor.
-- =========================================================

-- 1. Back-fill existing profiles: everyone is opted-in
UPDATE public.profiles
SET public_bracket = true
WHERE public_bracket IS DISTINCT FROM true;

-- 2. Set the column default so new profiles start as public
ALTER TABLE public.profiles
  ALTER COLUMN public_bracket SET DEFAULT true;

-- =========================================================
-- 3. Replace get_global_leaderboard — no public_bracket filter
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
  ORDER BY b.submitted_at ASC
  LIMIT limit_param;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(uuid, integer) TO anon;

-- =========================================================
-- 4. Replace get_public_bracket — no public_bracket gate
-- =========================================================
DROP FUNCTION IF EXISTS public.get_public_bracket(text, uuid);

CREATE FUNCTION public.get_public_bracket(
  username_param text,
  tournament_id_param uuid
)
RETURNS TABLE (
  bracket_id uuid,
  bracket_name text,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  points_earned integer,
  is_locked boolean,
  status text,
  submitted_at timestamptz,
  champion_name text,
  champion_code text,
  champion_flag text,
  total_picks integer,
  public_bracket boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT p.id
  INTO v_user_id
  FROM public.profiles p
  WHERE p.username = username_param;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    b.id AS bracket_id,
    b.name AS bracket_name,
    b.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(b.points_earned, 0)::integer AS points_earned,
    b.is_locked,
    b.status,
    b.submitted_at,
    champion_pick.name AS champion_name,
    champion_pick.code AS champion_code,
    champion_pick.flag_emoji AS champion_flag,
    (SELECT COUNT(*)::integer FROM public.bracket_picks WHERE bracket_picks.bracket_id = b.id) AS total_picks,
    p.public_bracket
  FROM public.brackets b
  JOIN public.profiles p ON p.id = b.user_id
  LEFT JOIN LATERAL (
    SELECT t.name, t.code, t.flag_emoji
    FROM public.bracket_picks bp
    JOIN public.matches m ON m.id = bp.match_id
    JOIN public.teams t ON t.id = bp.picked_team_id
    WHERE bp.bracket_id = b.id
      AND m.round = 'final'
    LIMIT 1
  ) champion_pick ON true
  WHERE b.user_id = v_user_id
    AND b.tournament_id = tournament_id_param
  ORDER BY b.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_bracket(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_bracket(text, uuid) TO authenticated;

-- =========================================================
-- 5. Replace get_public_bracket_picks — no public_bracket gate
-- =========================================================
DROP FUNCTION IF EXISTS public.get_public_bracket_picks(text, uuid);

CREATE FUNCTION public.get_public_bracket_picks(
  username_param text,
  tournament_id_param uuid
)
RETURNS TABLE (
  group_rankings jsonb,
  third_place_picks jsonb,
  knockout_picks jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id uuid;
  v_bracket_id uuid;
BEGIN
  SELECT p.id
  INTO v_user_id
  FROM public.profiles p
  WHERE p.username = username_param;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT b.id INTO v_bracket_id
  FROM public.brackets b
  WHERE b.user_id = v_user_id
    AND b.tournament_id = tournament_id_param
  ORDER BY b.created_at DESC
  LIMIT 1;

  IF v_bracket_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'group_label', gp.group_label,
        'team_id', gp.team_id,
        'position', gp.position
      ))
      FROM public.bracket_group_picks gp
      WHERE gp.bracket_id = v_bracket_id
    ), '[]'::jsonb) AS group_rankings,
    COALESCE((
      SELECT jsonb_agg(tpp.team_id)
      FROM public.bracket_third_place_picks tpp
      WHERE tpp.bracket_id = v_bracket_id
    ), '[]'::jsonb) AS third_place_picks,
    COALESCE((
      SELECT jsonb_object_agg(bp.match_id, bp.picked_team_id)
      FROM public.bracket_picks bp
      WHERE bp.bracket_id = v_bracket_id
    ), '{}'::jsonb) AS knockout_picks;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_bracket_picks(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_bracket_picks(text, uuid) TO authenticated;
