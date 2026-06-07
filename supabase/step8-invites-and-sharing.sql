-- =========================================================
-- Step 8: Group Invites and Bracket Sharing
-- =========================================================
-- This migration adds:
-- 1. public_bracket field to profiles for bracket sharing
-- 2. Indexes for performance (username, join_code)
-- 3. Unique constraint on group_members to prevent duplicates
-- 4. RPC function for safe invite preview (signed-out users)
-- 5. Enhanced joinGroup RPC with late join validation

-- =========================================================
-- 1. Add public_bracket Field to Profiles
-- =========================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS public_bracket boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.public_bracket IS 'Whether user allows their bracket to be viewed via share link';

-- =========================================================
-- 2. Add Performance Indexes
-- =========================================================

-- Index on profiles.username for public bracket lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Index on groups.join_code for invite lookups
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code);

-- =========================================================
-- 3. Ensure Unique Constraint on Group Members
-- =========================================================

-- Drop existing constraint if it exists (to avoid errors)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'group_members_group_id_user_id_key'
  ) THEN
    ALTER TABLE public.group_members DROP CONSTRAINT group_members_group_id_user_id_key;
  END IF;
END $$;

-- Create unique constraint to prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_unique 
ON public.group_members(group_id, user_id);

-- =========================================================
-- 4. RPC Function: Get Invite Preview (Public-Safe)
-- =========================================================

-- This function returns public-safe group info for invite links
-- Can be called by signed-out users
DROP FUNCTION IF EXISTS public.get_invite_preview(text);

CREATE FUNCTION public.get_invite_preview(join_code_param text)
RETURNS TABLE (
  group_id uuid,
  group_name text,
  tournament_id uuid,
  tournament_name text,
  member_count bigint,
  invite_policy text,
  allow_late_join boolean,
  lock_at timestamptz,
  is_locked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_group_id uuid;
  v_lock_at timestamptz;
BEGIN
  -- Find group by join code (case-insensitive)
  SELECT g.id, g.lock_at
  INTO v_group_id, v_lock_at
  FROM public.groups g
  WHERE UPPER(g.join_code) = UPPER(join_code_param);

  -- If group not found, return empty
  IF v_group_id IS NULL THEN
    RETURN;
  END IF;

  -- Return public-safe group info
  RETURN QUERY
  SELECT
    g.id AS group_id,
    g.name AS group_name,
    g.tournament_id,
    t.name AS tournament_name,
    COUNT(gm.id) AS member_count,
    g.invite_policy,
    g.allow_late_join,
    g.lock_at,
    CASE 
      WHEN g.lock_at IS NULL THEN false
      WHEN now() >= g.lock_at THEN true
      ELSE false
    END AS is_locked
  FROM public.groups g
  LEFT JOIN public.tournaments t ON t.id = g.tournament_id
  LEFT JOIN public.group_members gm ON gm.group_id = g.id
  WHERE g.id = v_group_id
  GROUP BY g.id, g.name, g.tournament_id, t.name, g.invite_policy, g.allow_late_join, g.lock_at;
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_invite_preview(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_preview(text) TO authenticated;

-- =========================================================
-- 5. Enhanced RPC Function: Join Group with Validation
-- =========================================================

-- This function validates late join rules and prevents duplicates
DROP FUNCTION IF EXISTS public.join_group_by_code(text);

CREATE FUNCTION public.join_group_by_code(join_code_param text)
RETURNS TABLE (
  success boolean,
  group_id uuid,
  error_code text,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_group_id uuid;
  v_allow_late_join boolean;
  v_lock_at timestamptz;
  v_is_locked boolean;
  v_existing_member_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'not_authenticated', 'You must be logged in to join a group';
    RETURN;
  END IF;

  -- Find group by join code (case-insensitive)
  SELECT g.id, g.allow_late_join, g.lock_at
  INTO v_group_id, v_allow_late_join, v_lock_at
  FROM public.groups g
  WHERE UPPER(g.join_code) = UPPER(join_code_param);

  -- Check if group exists
  IF v_group_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'invalid_code', 'Invalid join code';
    RETURN;
  END IF;

  -- Check if user is already a member
  SELECT id INTO v_existing_member_id
  FROM public.group_members
  WHERE group_id = v_group_id AND user_id = v_user_id;

  IF v_existing_member_id IS NOT NULL THEN
    RETURN QUERY SELECT false, v_group_id, 'already_member', 'You are already a member of this group';
    RETURN;
  END IF;

  -- Check if group is locked
  v_is_locked := (v_lock_at IS NOT NULL AND now() >= v_lock_at);

  -- If locked and late join not allowed, reject
  IF v_is_locked AND NOT v_allow_late_join THEN
    RETURN QUERY SELECT false, v_group_id, 'group_locked', 'This group is locked and no longer accepting new members';
    RETURN;
  END IF;

  -- Add user as member
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_group_id, v_user_id);

  -- Success
  RETURN QUERY SELECT true, v_group_id, NULL::text, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;

-- =========================================================
-- 6. RPC Function: Get Public Bracket by Username
-- =========================================================

-- This function returns a user's bracket if public_bracket is enabled
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
    (SELECT COUNT(*)::integer FROM public.bracket_picks WHERE bracket_id = b.id) AS total_picks,
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

-- =========================================================
-- 7. Update RLS Policies for Groups (Allow Join Code Lookup)
-- =========================================================

-- Allow anyone (authenticated) to read groups by join_code for joining
-- This is needed for the join flow
DROP POLICY IF EXISTS "Users can read groups by join code" ON public.groups;
CREATE POLICY "Users can read groups by join code"
  ON public.groups
  FOR SELECT
  USING (
    -- Members can read
    is_group_member(id, auth.uid())
    OR
    -- Anyone authenticated can read basic info via join code (for joining)
    auth.uid() IS NOT NULL
  );

-- =========================================================
-- 8. Verify Changes
-- =========================================================

-- Show profiles table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'public_bracket';

-- Show indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'groups', 'group_members')
  AND indexname IN ('idx_profiles_username', 'idx_groups_join_code', 'idx_group_members_unique')
ORDER BY tablename, indexname;

-- Show new functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_invite_preview',
    'join_group_by_code',
    'get_public_bracket'
  )
ORDER BY routine_name;
