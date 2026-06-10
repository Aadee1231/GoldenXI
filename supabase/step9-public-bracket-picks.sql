-- Optional, read-only function to power the full knockout visualization on the
-- public bracket page (/u/[username]/bracket).
--
-- SAFETY:
--   * Read-only (STABLE). No INSERT/UPDATE/DELETE.
--   * Does NOT modify any table, RLS policy, or schema.
--   * Only ever returns picks for a user who has explicitly set
--     public_bracket = true. Otherwise it returns nothing.
--   * SECURITY DEFINER is required so anonymous visitors can read the public
--     user's picks (which are otherwise owner-restricted by RLS) — exactly the
--     same pattern already used by get_public_bracket.
--
-- The app degrades gracefully if this function is not installed: the public
-- page simply falls back to the summary view. Installing it enables the full
-- bracket diagram.

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
  v_public_bracket boolean;
  v_bracket_id uuid;
BEGIN
  -- Resolve user and confirm their bracket is public.
  SELECT p.id, p.public_bracket
  INTO v_user_id, v_public_bracket
  FROM public.profiles p
  WHERE p.username = username_param;

  IF v_user_id IS NULL OR v_public_bracket IS DISTINCT FROM true THEN
    RETURN;
  END IF;

  -- Most recent bracket for this user in the tournament.
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
