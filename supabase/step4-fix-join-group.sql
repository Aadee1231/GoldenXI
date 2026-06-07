-- =========================================================
-- Fix: Allow users to find groups by join code (for joining)
-- =========================================================
-- This allows non-members to look up a group by join_code
-- so they can join it. Without this, the joinGroup function fails
-- because RLS blocks reading groups you're not a member of.

-- Allow authenticated users to read groups by join_code
-- This is needed for the "Join Group" functionality
DROP POLICY IF EXISTS "Users can find groups by join code" ON public.groups;
CREATE POLICY "Users can find groups by join code"
  ON public.groups
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND join_code IS NOT NULL
  );

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'groups'
ORDER BY policyname;
