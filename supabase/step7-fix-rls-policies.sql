-- =========================================================
-- Step 7 Fix: Recreate All RLS Policies That May Have Been Dropped
-- =========================================================
-- Run this to restore RLS policies that were dropped by CASCADE

-- =========================================================
-- Groups Policies
-- =========================================================

-- Users can read groups they are members of
DROP POLICY IF EXISTS "Users can read their groups" ON public.groups;
CREATE POLICY "Users can read their groups"
  ON public.groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
    )
  );

-- Users can create groups
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups"
  ON public.groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update groups they created
DROP POLICY IF EXISTS "Users can update own groups" ON public.groups;
CREATE POLICY "Users can update own groups"
  ON public.groups
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete groups they created
DROP POLICY IF EXISTS "Users can delete own groups" ON public.groups;
CREATE POLICY "Users can delete own groups"
  ON public.groups
  FOR DELETE
  USING (auth.uid() = created_by);

-- =========================================================
-- Group Members Policies
-- =========================================================

-- Users can read members of groups they belong to
DROP POLICY IF EXISTS "Users can read group members" ON public.group_members;
CREATE POLICY "Users can read group members"
  ON public.group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- Users can join groups (create membership for themselves)
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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

-- =========================================================
-- Verify Policies
-- =========================================================

-- Show all policies on groups table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;
