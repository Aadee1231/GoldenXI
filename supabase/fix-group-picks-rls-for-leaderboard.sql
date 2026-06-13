-- Fix: Allow leaderboard scoring to read group picks for all submitted brackets
-- 
-- Problem: The global leaderboard uses SECURITY DEFINER RPC to get bracket IDs
-- (bypassing RLS), but then queries bracket_group_picks directly with the
-- user's session. The existing RLS only allows reading picks where
-- profiles.public_bracket = true, so users with public_bracket = false
-- have their picks silently hidden, scoring them 0.
--
-- Fix 1: Add RLS policy allowing reads for any submitted bracket
-- Fix 2: Ensure all existing profiles have public_bracket = true
-- Fix 3: Set default to true for new signups

-- ============================================================================
-- FIX 1: Add policy to allow reading group picks for submitted brackets
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view group picks for submitted brackets" ON public.bracket_group_picks;

CREATE POLICY "Anyone can view group picks for submitted brackets"
  ON public.bracket_group_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets b
      WHERE b.id = bracket_group_picks.bracket_id
        AND b.status = 'submitted'
    )
  );

-- Same fix for bracket_third_place_picks (same problem would affect group leaderboards)
DROP POLICY IF EXISTS "Anyone can view third place picks for submitted brackets" ON public.bracket_third_place_picks;

CREATE POLICY "Anyone can view third place picks for submitted brackets"
  ON public.bracket_third_place_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets b
      WHERE b.id = bracket_third_place_picks.bracket_id
        AND b.status = 'submitted'
    )
  );

-- ============================================================================
-- FIX 2: Set public_bracket = true for all existing users who are on leaderboard
-- ============================================================================
UPDATE public.profiles
SET public_bracket = true
WHERE public_bracket IS NULL OR public_bracket = false;

-- ============================================================================
-- FIX 3: Set default for new signups
-- ============================================================================
ALTER TABLE public.profiles ALTER COLUMN public_bracket SET DEFAULT true;

-- ============================================================================
-- VERIFY: Check how many profiles now have public_bracket = true
-- ============================================================================
SELECT 
  COUNT(*) FILTER (WHERE public_bracket = true) AS public_count,
  COUNT(*) FILTER (WHERE public_bracket = false OR public_bracket IS NULL) AS private_count,
  COUNT(*) AS total
FROM public.profiles;
