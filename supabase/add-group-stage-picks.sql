-- Migration: Add Group Stage Picks and Third-Place Picks Tables
-- Phase 2: Schema + Backend API Support for World Cup 2026
-- Run this after seeding the 48 teams and 79 matches

-- ============================================================================
-- TABLE: bracket_group_picks
-- Stores user predictions for group stage rankings (1st-4th place per group)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bracket_group_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid NOT NULL REFERENCES public.brackets(id) ON DELETE CASCADE,
  group_label text NOT NULL CHECK (group_label IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L')),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position BETWEEN 1 AND 4),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one team per position per group per bracket
  CONSTRAINT unique_bracket_group_position UNIQUE (bracket_id, group_label, position),
  
  -- Ensure one position per team per group per bracket (no duplicate teams)
  CONSTRAINT unique_bracket_group_team UNIQUE (bracket_id, group_label, team_id)
);

-- ============================================================================
-- TABLE: bracket_third_place_picks
-- Stores user selections for the 8 third-place teams advancing to R32
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bracket_third_place_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid NOT NULL REFERENCES public.brackets(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure each team is only selected once per bracket
  CONSTRAINT unique_bracket_third_place_team UNIQUE (bracket_id, team_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bracket_group_picks_bracket_id 
  ON public.bracket_group_picks(bracket_id);

CREATE INDEX IF NOT EXISTS idx_bracket_group_picks_group_label 
  ON public.bracket_group_picks(group_label);

CREATE INDEX IF NOT EXISTS idx_bracket_third_place_picks_bracket_id 
  ON public.bracket_third_place_picks(bracket_id);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE public.bracket_group_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_third_place_picks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: bracket_group_picks
-- ============================================================================

-- Users can SELECT their own group picks
CREATE POLICY "Users can view their own group picks"
  ON public.bracket_group_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_group_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can INSERT their own group picks
CREATE POLICY "Users can insert their own group picks"
  ON public.bracket_group_picks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_group_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can UPDATE their own group picks
CREATE POLICY "Users can update their own group picks"
  ON public.bracket_group_picks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_group_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_group_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can DELETE their own group picks
CREATE POLICY "Users can delete their own group picks"
  ON public.bracket_group_picks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_group_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Public/shared bracket viewing (if user has public_bracket enabled in profile)
CREATE POLICY "Public can view group picks for public brackets"
  ON public.bracket_group_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets b
      INNER JOIN public.profiles p ON p.id = b.user_id
      WHERE b.id = bracket_group_picks.bracket_id
        AND p.public_bracket = true
    )
  );

-- Group members can view group picks (if bracket is in a group they're in)
-- NOTE: Commented out until group_brackets table exists
-- Uncomment this policy after creating the group_brackets table
/*
CREATE POLICY "Group members can view group picks"
  ON public.bracket_group_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets b
      INNER JOIN public.group_brackets gb ON gb.bracket_id = b.id
      INNER JOIN public.group_members gm ON gm.group_id = gb.group_id
      WHERE b.id = bracket_group_picks.bracket_id
        AND gm.user_id = auth.uid()
    )
  );
*/

-- ============================================================================
-- RLS POLICIES: bracket_third_place_picks
-- ============================================================================

-- Users can SELECT their own third-place picks
CREATE POLICY "Users can view their own third-place picks"
  ON public.bracket_third_place_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_third_place_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can INSERT their own third-place picks
CREATE POLICY "Users can insert their own third-place picks"
  ON public.bracket_third_place_picks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_third_place_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can UPDATE their own third-place picks
CREATE POLICY "Users can update their own third-place picks"
  ON public.bracket_third_place_picks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_third_place_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_third_place_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Users can DELETE their own third-place picks
CREATE POLICY "Users can delete their own third-place picks"
  ON public.bracket_third_place_picks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets
      WHERE brackets.id = bracket_third_place_picks.bracket_id
        AND brackets.user_id = auth.uid()
    )
  );

-- Public/shared bracket viewing (if user has public_bracket enabled in profile)
CREATE POLICY "Public can view third-place picks for public brackets"
  ON public.bracket_third_place_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets b
      INNER JOIN public.profiles p ON p.id = b.user_id
      WHERE b.id = bracket_third_place_picks.bracket_id
        AND p.public_bracket = true
    )
  );

-- Group members can view third-place picks (if bracket is in a group they're in)
-- NOTE: Commented out until group_brackets table exists
-- Uncomment this policy after creating the group_brackets table
/*
CREATE POLICY "Group members can view third-place picks"
  ON public.bracket_third_place_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brackets b
      INNER JOIN public.group_brackets gb ON gb.bracket_id = b.id
      INNER JOIN public.group_members gm ON gm.group_id = gb.group_id
      WHERE b.id = bracket_third_place_picks.bracket_id
        AND gm.user_id = auth.uid()
    )
  );
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.bracket_group_picks IS 
  'User predictions for group stage rankings (1st-4th place) for each of 12 groups';

COMMENT ON TABLE public.bracket_third_place_picks IS 
  'User selections for the 8 third-place teams that advance to Round of 32';

COMMENT ON COLUMN public.bracket_group_picks.position IS 
  'Ranking position within the group: 1=1st place, 2=2nd place, 3=3rd place, 4=4th place';

COMMENT ON COLUMN public.bracket_group_picks.group_label IS 
  'Group identifier: A through L for World Cup 2026';
