-- Fix the get_public_bracket function to resolve ambiguous column reference

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
  points_earned numeric,
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
  v_public_bracket boolean;
BEGIN
  -- Find user by username
  SELECT p.id, p.public_bracket
  INTO v_user_id, v_public_bracket
  FROM public.profiles p
  WHERE p.username = username_param;

  -- If user not found or bracket not public, return empty
  IF v_user_id IS NULL OR v_public_bracket = false THEN
    RETURN;
  END IF;

  -- Return bracket info
  RETURN QUERY
  SELECT
    b.id AS bracket_id,
    b.name AS bracket_name,
    b.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    b.points_earned,
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

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_bracket(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_bracket(text, uuid) TO authenticated;
