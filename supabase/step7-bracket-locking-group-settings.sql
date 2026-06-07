-- =========================================================
-- Step 7: Bracket Locking and Group Settings
-- =========================================================
-- This migration adds:
-- 1. Personal bracket locking fields (locked_at, updated_at)
-- 2. Group settings for competition customization
-- 3. Helper functions for eligibility checks
-- 4. RLS policies for group settings access

-- =========================================================
-- 1. Add Bracket Locking Fields
-- =========================================================

-- Add locked_at timestamp to brackets table
ALTER TABLE public.brackets
ADD COLUMN IF NOT EXISTS locked_at timestamptz DEFAULT NULL;

-- Add updated_at timestamp to brackets table (if not exists)
ALTER TABLE public.brackets
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure submitted_at exists (may already exist from earlier steps)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brackets' 
    AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE public.brackets ADD COLUMN submitted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Create trigger to auto-update updated_at on brackets
CREATE OR REPLACE FUNCTION update_brackets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brackets_updated_at_trigger ON public.brackets;
CREATE TRIGGER brackets_updated_at_trigger
  BEFORE UPDATE ON public.brackets
  FOR EACH ROW
  EXECUTE FUNCTION update_brackets_updated_at();

-- =========================================================
-- 2. Add Group Settings Fields
-- =========================================================

-- Add settings columns to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS invite_policy text DEFAULT 'members' CHECK (invite_policy IN ('admin_only', 'members'));

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS leaderboard_visibility text DEFAULT 'always' CHECK (leaderboard_visibility IN ('always', 'after_lock', 'after_first_result'));

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS bracket_visibility text DEFAULT 'status_only' CHECK (bracket_visibility IN ('status_only', 'after_lock', 'always'));

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS lock_at timestamptz DEFAULT NULL;

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS allow_late_join boolean DEFAULT true;

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;

-- Ensure updated_at exists on groups
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'groups' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create trigger to auto-update updated_at on groups
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS groups_updated_at_trigger ON public.groups;
CREATE TRIGGER groups_updated_at_trigger
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_groups_updated_at();

-- =========================================================
-- 3. Helper Functions for Eligibility and Permissions
-- =========================================================

-- Drop existing functions if they exist (to avoid parameter name conflicts)
-- Using CASCADE to drop any dependent policies - they will be recreated if needed
DROP FUNCTION IF EXISTS public.is_group_creator(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_group_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_bracket_eligible_for_group(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_tournament_started(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_group_locked(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_group_leaderboard_with_eligibility(uuid, uuid) CASCADE;

-- Check if user is group creator/admin
CREATE FUNCTION public.is_group_creator(group_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = group_id_param
      AND created_by = user_id_param
  );
$$;

-- Check if user is a group member
CREATE FUNCTION public.is_group_member(group_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = group_id_param
      AND user_id = user_id_param
  );
$$;

-- Helper to check if user can read a group_member record (avoids recursion in RLS)
CREATE FUNCTION public.can_read_group_member(
  gm_group_id uuid,
  gm_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    gm_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_id = gm_group_id
        AND user_id = auth.uid()
    )
  );
$$;

-- Check if bracket is eligible for a group (based on lock time)
CREATE FUNCTION public.is_bracket_eligible_for_group(
  bracket_id_param uuid,
  group_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_bracket_submitted_at timestamptz;
  v_bracket_updated_at timestamptz;
  v_group_lock_at timestamptz;
BEGIN
  -- Get bracket timestamps
  SELECT submitted_at, updated_at
  INTO v_bracket_submitted_at, v_bracket_updated_at
  FROM public.brackets
  WHERE id = bracket_id_param;

  -- Get group lock time
  SELECT lock_at
  INTO v_group_lock_at
  FROM public.groups
  WHERE id = group_id_param;

  -- If no lock time set, bracket is eligible
  IF v_group_lock_at IS NULL THEN
    RETURN true;
  END IF;

  -- If bracket not submitted, not eligible
  IF v_bracket_submitted_at IS NULL THEN
    RETURN false;
  END IF;

  -- Check if submitted and updated before lock time
  RETURN (
    v_bracket_submitted_at <= v_group_lock_at
    AND v_bracket_updated_at <= v_group_lock_at
  );
END;
$$;

-- Check if any match in tournament is completed (for unlock restrictions)
CREATE FUNCTION public.has_tournament_started(tournament_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches
    WHERE tournament_id = tournament_id_param
      AND completed = true
  );
$$;

-- Check if group is locked (lock_at has passed)
CREATE FUNCTION public.is_group_locked(group_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_lock_at timestamptz;
BEGIN
  SELECT lock_at
  INTO v_lock_at
  FROM public.groups
  WHERE id = group_id_param;

  -- If no lock time, not locked
  IF v_lock_at IS NULL THEN
    RETURN false;
  END IF;

  -- Check if lock time has passed
  RETURN now() >= v_lock_at;
END;
$$;

-- =========================================================
-- 4. Recreate RLS Policies (if they were dropped by CASCADE)
-- =========================================================

-- Recreate group_members policies that may have been dropped
-- Users can read group members (using helper to avoid recursion)
DROP POLICY IF EXISTS "Users can read group members" ON public.group_members;
CREATE POLICY "Users can read group members"
  ON public.group_members
  FOR SELECT
  USING (
    can_read_group_member(group_id, user_id)
  );

-- Users can leave groups (delete their own membership)
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
  ON public.group_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- Group creators can remove members
DROP POLICY IF EXISTS "Group creators can remove members" ON public.group_members;
CREATE POLICY "Group creators can remove members"
  ON public.group_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.groups
      WHERE groups.id = group_members.group_id
        AND groups.created_by = auth.uid()
    )
  );

-- Users can join groups (create membership for themselves)
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 5. Update RLS Policies for Group Settings
-- =========================================================

-- Groups policies already exist from step4-rls-policies.sql
-- The existing policies allow:
-- - Users to read groups they are members of
-- - Users to update groups they created
-- These policies already cover group settings access

-- =========================================================
-- 6. Create RPC Function for Group Leaderboard with Eligibility
-- =========================================================

-- Enhanced group leaderboard that includes eligibility status
CREATE FUNCTION public.get_group_leaderboard_with_eligibility(
  group_id_param uuid,
  tournament_id_param uuid
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bracket_id uuid,
  bracket_name text,
  bracket_status text,
  submitted_at timestamptz,
  updated_at timestamptz,
  locked_at timestamptz,
  champion_name text,
  champion_code text,
  champion_flag text,
  is_eligible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_group_lock_at timestamptz;
BEGIN
  -- Get group lock time
  SELECT lock_at INTO v_group_lock_at
  FROM public.groups
  WHERE id = group_id_param;

  RETURN QUERY
  SELECT
    gm.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    b.id AS bracket_id,
    b.name AS bracket_name,
    b.status AS bracket_status,
    b.submitted_at,
    b.updated_at,
    b.locked_at,
    champion_pick.name AS champion_name,
    champion_pick.code AS champion_code,
    champion_pick.flag_emoji AS champion_flag,
    -- Eligibility logic
    CASE
      WHEN b.id IS NULL THEN false
      WHEN v_group_lock_at IS NULL THEN true
      WHEN b.submitted_at IS NULL THEN false
      WHEN b.submitted_at > v_group_lock_at THEN false
      WHEN b.updated_at > v_group_lock_at THEN false
      ELSE true
    END AS is_eligible
  FROM public.group_members gm
  LEFT JOIN public.profiles p ON p.id = gm.user_id
  LEFT JOIN public.brackets b ON b.user_id = gm.user_id AND b.tournament_id = tournament_id_param
  LEFT JOIN LATERAL (
    SELECT t.name, t.code, t.flag_emoji
    FROM public.bracket_picks bp
    JOIN public.matches m ON m.id = bp.match_id
    JOIN public.teams t ON t.id = bp.picked_team_id
    WHERE bp.bracket_id = b.id
      AND m.round = 'final'
    LIMIT 1
  ) champion_pick ON true
  WHERE gm.group_id = group_id_param
  ORDER BY gm.joined_at ASC;
END;
$$;

-- =========================================================
-- 7. Grant Execute Permissions on Helper Functions
-- =========================================================

GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bracket_eligible_for_group(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tournament_started(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_locked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_leaderboard_with_eligibility(uuid, uuid) TO authenticated;

-- =========================================================
-- 8. Add Comments for Documentation
-- =========================================================

COMMENT ON COLUMN public.brackets.locked_at IS 'Timestamp when user locked their bracket (cannot edit after this)';
COMMENT ON COLUMN public.brackets.submitted_at IS 'Timestamp when bracket was first submitted/completed';
COMMENT ON COLUMN public.brackets.updated_at IS 'Timestamp of last bracket modification';

COMMENT ON COLUMN public.groups.invite_policy IS 'Who can invite: admin_only or members';
COMMENT ON COLUMN public.groups.leaderboard_visibility IS 'When to show scores: always, after_lock, or after_first_result';
COMMENT ON COLUMN public.groups.bracket_visibility IS 'When to show picks: status_only, after_lock, or always';
COMMENT ON COLUMN public.groups.lock_at IS 'Deadline for bracket submissions/edits for this group';
COMMENT ON COLUMN public.groups.allow_late_join IS 'Whether users can join after lock_at';
COMMENT ON COLUMN public.groups.description IS 'Optional group description';

-- =========================================================
-- 9. Verify Changes
-- =========================================================

-- Show brackets table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'brackets'
  AND column_name IN ('locked_at', 'submitted_at', 'updated_at')
ORDER BY column_name;

-- Show groups table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'groups'
  AND column_name IN ('invite_policy', 'leaderboard_visibility', 'bracket_visibility', 'lock_at', 'allow_late_join', 'description', 'updated_at')
ORDER BY column_name;

-- Show helper functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_group_creator',
    'is_group_member',
    'is_bracket_eligible_for_group',
    'has_tournament_started',
    'is_group_locked',
    'get_group_leaderboard_with_eligibility'
  )
ORDER BY routine_name;
