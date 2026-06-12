-- =========================================================
-- Fix: join_group_by_code — match frontend parameter name
-- =========================================================
-- Frontend calls: supabase.rpc("join_group_by_code", { join_code_param: code })
-- This migration creates/replace the function with parameter name join_code_param
-- to match the frontend exactly.
--
-- Features:
-- - Uses auth.uid() for authentication
-- - Finds group by groups.join_code case-insensitively
-- - Inserts into group_members
-- - Idempotent: already-members return success without error
-- - Fully qualifies columns with aliases to avoid ambiguous errors
-- - Returns jsonb with success, group_id, group_name, tournament_id
-- - Reloads PostgREST schema cache at the end
-- =========================================================

DROP FUNCTION IF EXISTS public.join_group_by_code(text);

CREATE FUNCTION public.join_group_by_code(join_code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id          uuid;
  v_group_id         uuid;
  v_group_name       text;
  v_tournament_id    uuid;
  v_allow_late_join  boolean;
  v_lock_at          timestamptz;
  v_is_locked        boolean;
  v_existing_id      uuid;
  result             jsonb;
BEGIN
  -- 1. Require authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    result := jsonb_build_object(
      'success', false,
      'error_code', 'not_authenticated',
      'error_message', 'You must be logged in to join a group'
    );
    RETURN result;
  END IF;

  -- 2. Look up the group by join code (case-insensitive)
  SELECT g.id, g.name, g.tournament_id, g.allow_late_join, g.lock_at
    INTO v_group_id, v_group_name, v_tournament_id, v_allow_late_join, v_lock_at
    FROM public.groups g
   WHERE UPPER(g.join_code) = UPPER(join_code_param);

  IF v_group_id IS NULL THEN
    result := jsonb_build_object(
      'success', false,
      'error_code', 'invalid_code',
      'error_message', 'Invalid join code'
    );
    RETURN result;
  END IF;

  -- 3. Check for existing membership — fully qualified to avoid ambiguity
  SELECT gm.id
    INTO v_existing_id
    FROM public.group_members gm
   WHERE gm.group_id = v_group_id
     AND gm.user_id  = v_user_id;

  -- Idempotent: already a member → return success so
  -- post-signup redirects land on the group page cleanly
  IF v_existing_id IS NOT NULL THEN
    result := jsonb_build_object(
      'success', true,
      'group_id', v_group_id,
      'group_name', v_group_name,
      'tournament_id', v_tournament_id
    );
    RETURN result;
  END IF;

  -- 4. Lock check
  v_is_locked := (v_lock_at IS NOT NULL AND now() >= v_lock_at);
  IF v_is_locked AND NOT v_allow_late_join THEN
    result := jsonb_build_object(
      'success', false,
      'group_id', v_group_id,
      'error_code', 'group_locked',
      'error_message', 'This group is locked and no longer accepting new members'
    );
    RETURN result;
  END IF;

  -- 5. Insert membership row
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_group_id, v_user_id);

  -- 6. Return success with group details
  result := jsonb_build_object(
    'success', true,
    'group_id', v_group_id,
    'group_name', v_group_name,
    'tournament_id', v_tournament_id
  );
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
