-- =========================================================
-- Fix: Infinite Recursion in group_members Policy
-- =========================================================
-- We need to use a SECURITY DEFINER function to avoid recursion

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Users can read group members" ON public.group_members;

-- Create a helper function to check if user can see a group_member record
-- This uses SECURITY DEFINER to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION public.can_read_group_member(
  gm_group_id uuid,
  gm_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- User can read if:
  -- 1. It's their own membership record
  -- 2. They are a member of the same group
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

-- Now create the policy using the helper function
CREATE POLICY "Users can read group members"
  ON public.group_members
  FOR SELECT
  USING (
    can_read_group_member(group_id, user_id)
  );

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_read_group_member(uuid, uuid) TO authenticated;

-- Test the policy
SELECT 
  gm.id,
  gm.group_id,
  gm.user_id,
  g.name as group_name
FROM public.group_members gm
JOIN public.groups g ON g.id = gm.group_id
WHERE gm.user_id = auth.uid();
