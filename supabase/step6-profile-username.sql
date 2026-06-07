-- =========================================================
-- Step 6: Profile and Username System
-- =========================================================
-- This migration adds username and display_name support to profiles
-- and updates RLS policies for proper public access to profile data.

-- =========================================================
-- 1. Update profiles table schema
-- =========================================================

-- Add display_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Make username nullable initially (users can set it during onboarding)
-- We'll enforce uniqueness but allow NULL during profile creation
DO $$ 
BEGIN
  -- Check if username column exists and modify it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'username'
  ) THEN
    -- Drop existing constraint if any
    ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;
  END IF;
END $$;

-- Add unique constraint on username (excluding nulls)
DROP INDEX IF EXISTS profiles_username_unique_idx;
CREATE UNIQUE INDEX profiles_username_unique_idx 
  ON public.profiles (username) 
  WHERE username IS NOT NULL;

-- Add constraints for username validation
-- Username: 3-20 chars, lowercase letters, numbers, underscores only
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_username_format;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_username_format 
  CHECK (
    username IS NULL OR 
    (
      LENGTH(username) >= 3 AND 
      LENGTH(username) <= 20 AND 
      username ~ '^[a-z0-9_]+$'
    )
  );

-- Add constraints for display_name validation
-- Display name: 1-30 chars, trim whitespace
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_display_name_format;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_display_name_format 
  CHECK (
    display_name IS NULL OR 
    (
      LENGTH(TRIM(display_name)) >= 1 AND 
      LENGTH(TRIM(display_name)) <= 30
    )
  );

-- =========================================================
-- 2. Create trigger to auto-create profile on user signup
-- =========================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 3. Update RLS policies for profiles
-- =========================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read group member profiles" ON public.profiles;

-- Users can read their own profile (all fields)
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for manual profile creation if needed)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public can read public profile fields for leaderboard
-- This allows reading username, display_name, avatar_url for any user
-- without needing to be in the same group
DROP POLICY IF EXISTS "Public profile fields are readable" ON public.profiles;
CREATE POLICY "Public profile fields are readable"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Note: The above policy allows reading all profile fields publicly.
-- If you want to restrict certain fields, you would need to use
-- column-level security or create views. For now, we keep it simple
-- since profiles only contain public-safe data (no emails, etc.)

-- =========================================================
-- 4. Update RPC functions for leaderboard to include display_name
-- =========================================================

-- Drop existing functions first to avoid signature conflicts
DROP FUNCTION IF EXISTS public.get_global_leaderboard(uuid, integer);
DROP FUNCTION IF EXISTS public.get_group_leaderboard(uuid, uuid);

-- Create global leaderboard function with display_name
CREATE FUNCTION public.get_global_leaderboard(
  tournament_id_param UUID,
  limit_param INT DEFAULT 50
)
RETURNS TABLE (
  bracket_id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bracket_name TEXT,
  submitted_at TIMESTAMPTZ,
  champion_name TEXT,
  champion_code TEXT,
  champion_flag TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS bracket_id,
    b.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    b.name AS bracket_name,
    b.submitted_at,
    final_team.name AS champion_name,
    final_team.code AS champion_code,
    final_team.flag_emoji AS champion_flag
  FROM public.brackets b
  INNER JOIN public.profiles p ON p.id = b.user_id
  LEFT JOIN LATERAL (
    SELECT bp.picked_team_id
    FROM public.bracket_picks bp
    INNER JOIN public.matches m ON m.id = bp.match_id
    WHERE bp.bracket_id = b.id
      AND m.round = 'final'
    LIMIT 1
  ) final_pick ON true
  LEFT JOIN public.teams final_team ON final_team.id = final_pick.picked_team_id
  WHERE b.tournament_id = tournament_id_param
    AND b.status = 'submitted'
  ORDER BY b.submitted_at ASC
  LIMIT limit_param;
END;
$$;

-- Create group leaderboard function with display_name
CREATE FUNCTION public.get_group_leaderboard(
  group_id_param UUID,
  tournament_id_param UUID
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bracket_id UUID,
  bracket_name TEXT,
  bracket_status TEXT,
  submitted_at TIMESTAMPTZ,
  champion_name TEXT,
  champion_code TEXT,
  champion_flag TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    b.id AS bracket_id,
    b.name AS bracket_name,
    b.status AS bracket_status,
    b.submitted_at,
    final_team.name AS champion_name,
    final_team.code AS champion_code,
    final_team.flag_emoji AS champion_flag
  FROM public.group_members gm
  INNER JOIN public.profiles p ON p.id = gm.user_id
  LEFT JOIN public.brackets b ON b.user_id = gm.user_id
    AND b.tournament_id = tournament_id_param
  LEFT JOIN LATERAL (
    SELECT bp.picked_team_id
    FROM public.bracket_picks bp
    INNER JOIN public.matches m ON m.id = bp.match_id
    WHERE bp.bracket_id = b.id
      AND m.round = 'final'
    LIMIT 1
  ) final_pick ON true
  LEFT JOIN public.teams final_team ON final_team.id = final_pick.picked_team_id
  WHERE gm.group_id = group_id_param
  ORDER BY p.username ASC;
END;
$$;

-- =========================================================
-- 5. Backfill existing profiles with display_name from username
-- =========================================================

-- For existing profiles that have username but no display_name,
-- copy username to display_name
UPDATE public.profiles
SET display_name = username
WHERE display_name IS NULL AND username IS NOT NULL;

-- =========================================================
-- 6. Verify setup
-- =========================================================

-- Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
