-- =========================================================
-- Fix: join_group_by_code — resolve "group_id is ambiguous"
-- =========================================================
-- Root cause: RETURNS TABLE declares an output column named
-- `group_id`, which PostgreSQL treats as an implicit variable
-- inside the function body.  When the query
--   WHERE group_id = v_group_id
-- runs against public.group_members, PostgreSQL cannot tell
-- whether `group_id` refers to the table column or the
-- function-output variable — hence the ambiguity error.
--
-- Fix strategy:
--   1. Add table aliases (gm.) on every group_members column
--      reference so there is no unqualified name to confuse.
--   2. Rename function-body parameter to p_join_code so the
--      input param cannot collide with column names either.
--   3. Make the function idempotent: if the caller is already
--      a member, return success + group_id instead of an error
--      so a post-signup redirect always lands on the group page.
-- =========================================================

DROP FUNCTION IF EXISTS public.join_group_by_code(text);

CREATE FUNCTION public.join_group_by_code(p_join_code text)
RETURNS TABLE (
  success       boolean,
  group_id      uuid,
  error_code    text,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id          uuid;
  v_group_id         uuid;
  v_allow_late_join  boolean;
  v_lock_at          timestamptz;
  v_is_locked        boolean;
  v_existing_id      uuid;
BEGIN
  -- 1. Require authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY
      SELECT false, NULL::uuid, 'not_authenticated'::text,
             'You must be logged in to join a group'::text;
    RETURN;
  END IF;

  -- 2. Look up the group by join code (case-insensitive)
  SELECT g.id, g.allow_late_join, g.lock_at
    INTO v_group_id, v_allow_late_join, v_lock_at
    FROM public.groups g
   WHERE UPPER(g.join_code) = UPPER(p_join_code);

  IF v_group_id IS NULL THEN
    RETURN QUERY
      SELECT false, NULL::uuid, 'invalid_code'::text,
             'Invalid join code'::text;
    RETURN;
  END IF;

  -- 3. Check for existing membership — fully qualified to avoid
  --    any collision with the RETURNS TABLE column named `group_id`.
  SELECT gm.id
    INTO v_existing_id
    FROM public.group_members gm
   WHERE gm.group_id = v_group_id
     AND gm.user_id  = v_user_id;

  -- Idempotent: already a member → treat as success so
  -- post-signup redirects land on the group page cleanly.
  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY
      SELECT true, v_group_id, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- 4. Lock check
  v_is_locked := (v_lock_at IS NOT NULL AND now() >= v_lock_at);
  IF v_is_locked AND NOT v_allow_late_join THEN
    RETURN QUERY
      SELECT false, v_group_id,
             'group_locked'::text,
             'This group is locked and no longer accepting new members'::text;
    RETURN;
  END IF;

  -- 5. Insert membership row
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_group_id, v_user_id);

  -- 6. Return success
  RETURN QUERY
    SELECT true, v_group_id, NULL::text, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;
