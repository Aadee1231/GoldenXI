-- STEP 1: Verify which policies currently exist on bracket_group_picks
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'bracket_group_picks'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Check table grants (anon role must have SELECT permission)
-- ============================================================================
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'bracket_group_picks'
  AND table_schema = 'public';
