-- =========================================================
-- Migration: Add seed-tracking columns to profiles and brackets
-- =========================================================
-- Run this in the Supabase SQL editor BEFORE running the
-- seed-bracket-demo-users.ts script.
-- =========================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_seeded boolean DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seed_batch text;

ALTER TABLE public.brackets
  ADD COLUMN IF NOT EXISTS is_seeded boolean DEFAULT false;

ALTER TABLE public.brackets
  ADD COLUMN IF NOT EXISTS seed_batch text;

-- Index for fast cleanup queries
CREATE INDEX IF NOT EXISTS idx_profiles_seed_batch ON public.profiles(seed_batch) WHERE is_seeded = true;
CREATE INDEX IF NOT EXISTS idx_brackets_seed_batch ON public.brackets(seed_batch) WHERE is_seeded = true;

-- Disable old bracket seed entries in leaderboard_seed_entries
-- (seeded users now appear via real bracket data)
UPDATE public.leaderboard_seed_entries
SET is_active = false
WHERE leaderboard_type = 'bracket';
