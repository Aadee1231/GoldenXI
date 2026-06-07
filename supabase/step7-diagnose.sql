-- =========================================================
-- Diagnostic Queries to Debug Groups Not Showing
-- =========================================================

-- 1. Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'group_members')
ORDER BY tablename;

-- 2. Check what policies exist
SELECT 
  schemaname,
  tablename,
  policyname, 
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;

-- 3. Check your user ID
SELECT auth.uid() as my_user_id;

-- 4. Check groups in database (raw data)
SELECT 
  id,
  name,
  created_by,
  join_code,
  invite_policy,
  leaderboard_visibility,
  bracket_visibility,
  allow_late_join
FROM public.groups
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check group_members for your user
SELECT 
  gm.id,
  gm.group_id,
  gm.user_id,
  g.name as group_name,
  gm.joined_at
FROM public.group_members gm
JOIN public.groups g ON g.id = gm.group_id
WHERE gm.user_id = auth.uid()
ORDER BY gm.joined_at DESC;

-- 6. Test the SELECT policy directly
-- This simulates what the app query does
SELECT g.*
FROM public.groups g
WHERE EXISTS (
  SELECT 1
  FROM public.group_members gm
  WHERE gm.group_id = g.id
    AND gm.user_id = auth.uid()
);
