-- ============================================================================
-- Migration: Allow group members to view each other's bracket_group_picks
-- ============================================================================
-- Without this, the group-leaderboard group-stage scoring only sees picks from
-- public brackets (because the only non-owner SELECT policy was the public one).
-- This mirrors the existing "Users can read group member bracket picks" policy
-- already present on bracket_picks.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

DROP POLICY IF EXISTS "Group members can view group picks" ON public.bracket_group_picks;

CREATE POLICY "Group members can view group picks"
  ON public.bracket_group_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.brackets b
      JOIN public.group_members gm1 ON b.user_id = gm1.user_id
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE b.id = bracket_group_picks.bracket_id
        AND gm2.user_id = auth.uid()
    )
  );
