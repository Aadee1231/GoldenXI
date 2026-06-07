-- =========================================================
-- Step 4: RLS Policies for Bracket-Group Connection
-- =========================================================
-- This migration adds RLS policies to ensure:
-- 1. Users can read groups they are members of
-- 2. Users can read group members for groups they belong to
-- 3. Users can read bracket submission status for members of groups they belong to
-- 4. Users can create/update their own bracket
-- 5. Users cannot edit someone else's bracket

-- =========================================================
-- 1. Enable RLS on all tables (if not already enabled)
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 2. Profiles Policies
-- =========================================================

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can read profiles of members in their groups
DROP POLICY IF EXISTS "Users can read group member profiles" ON public.profiles;
CREATE POLICY "Users can read group member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = profiles.id
    )
  );

-- =========================================================
-- 3. Tournaments Policies (public read)
-- =========================================================

DROP POLICY IF EXISTS "Tournaments are publicly readable" ON public.tournaments;
CREATE POLICY "Tournaments are publicly readable"
  ON public.tournaments
  FOR SELECT
  USING (true);

-- =========================================================
-- 4. Teams Policies (public read)
-- =========================================================

DROP POLICY IF EXISTS "Teams are publicly readable" ON public.teams;
CREATE POLICY "Teams are publicly readable"
  ON public.teams
  FOR SELECT
  USING (true);

-- =========================================================
-- 5. Matches Policies (public read)
-- =========================================================

DROP POLICY IF EXISTS "Matches are publicly readable" ON public.matches;
CREATE POLICY "Matches are publicly readable"
  ON public.matches
  FOR SELECT
  USING (true);

-- =========================================================
-- 6. Brackets Policies
-- =========================================================

-- Users can read their own brackets
DROP POLICY IF EXISTS "Users can read own brackets" ON public.brackets;
CREATE POLICY "Users can read own brackets"
  ON public.brackets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own brackets
DROP POLICY IF EXISTS "Users can create own brackets" ON public.brackets;
CREATE POLICY "Users can create own brackets"
  ON public.brackets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own brackets
DROP POLICY IF EXISTS "Users can update own brackets" ON public.brackets;
CREATE POLICY "Users can update own brackets"
  ON public.brackets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own brackets
DROP POLICY IF EXISTS "Users can delete own brackets" ON public.brackets;
CREATE POLICY "Users can delete own brackets"
  ON public.brackets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can read brackets of members in their groups
DROP POLICY IF EXISTS "Users can read group member brackets" ON public.brackets;
CREATE POLICY "Users can read group member brackets"
  ON public.brackets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = brackets.user_id
    )
  );

-- =========================================================
-- 7. Bracket Picks Policies
-- =========================================================

-- Users can read their own bracket picks
DROP POLICY IF EXISTS "Users can read own bracket picks" ON public.bracket_picks;
CREATE POLICY "Users can read own bracket picks"
  ON public.bracket_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.brackets
      WHERE brackets.id = bracket_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can create picks for their own brackets
DROP POLICY IF EXISTS "Users can create own bracket picks" ON public.bracket_picks;
CREATE POLICY "Users can create own bracket picks"
  ON public.bracket_picks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brackets
      WHERE brackets.id = bracket_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can update picks for their own brackets
DROP POLICY IF EXISTS "Users can update own bracket picks" ON public.bracket_picks;
CREATE POLICY "Users can update own bracket picks"
  ON public.bracket_picks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.brackets
      WHERE brackets.id = bracket_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can delete picks for their own brackets
DROP POLICY IF EXISTS "Users can delete own bracket picks" ON public.bracket_picks;
CREATE POLICY "Users can delete own bracket picks"
  ON public.bracket_picks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.brackets
      WHERE brackets.id = bracket_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can read bracket picks of members in their groups
DROP POLICY IF EXISTS "Users can read group member bracket picks" ON public.bracket_picks;
CREATE POLICY "Users can read group member bracket picks"
  ON public.bracket_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.brackets b
      JOIN public.group_members gm1 ON b.user_id = gm1.user_id
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE b.id = bracket_picks.bracket_id
        AND gm2.user_id = auth.uid()
    )
  );

-- =========================================================
-- 8. Groups Policies
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
-- 9. Group Members Policies
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
-- 10. Verify RLS is enabled
-- =========================================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'tournaments',
    'teams',
    'matches',
    'brackets',
    'bracket_picks',
    'groups',
    'group_members'
  )
ORDER BY tablename;
