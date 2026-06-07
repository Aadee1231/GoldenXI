-- =========================================================
-- Fix: Group Members SELECT Policy
-- =========================================================
-- The issue is that group_members SELECT policy is not working

-- First, let's check what policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'group_members'
ORDER BY policyname;

-- Drop and recreate the SELECT policy for group_members
-- The current policy might have a circular dependency issue

DROP POLICY IF EXISTS "Users can read group members" ON public.group_members;

-- Create a simpler policy that just checks if the user is querying their own memberships
-- OR if they're a member of the same group
CREATE POLICY "Users can read group members"
  ON public.group_members
  FOR SELECT
  USING (
    -- Users can always see their own memberships
    user_id = auth.uid()
    OR
    -- Users can see members of groups they belong to
    group_id IN (
      SELECT group_id 
      FROM public.group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'group_members'
  AND policyname = 'Users can read group members';

-- Test the policy by selecting your own memberships
SELECT 
  gm.id,
  gm.group_id,
  gm.user_id,
  g.name as group_name
FROM public.group_members gm
JOIN public.groups g ON g.id = gm.group_id
WHERE gm.user_id = auth.uid();
