-- =========================================================
-- Step 7 Fix: Update Existing Groups with Default Values
-- =========================================================
-- Run this after step7-bracket-locking-group-settings.sql
-- to populate default values for existing groups

-- Update existing groups to have default values for new columns
UPDATE public.groups
SET 
  invite_policy = COALESCE(invite_policy, 'members'),
  leaderboard_visibility = COALESCE(leaderboard_visibility, 'always'),
  bracket_visibility = COALESCE(bracket_visibility, 'status_only'),
  allow_late_join = COALESCE(allow_late_join, true),
  updated_at = COALESCE(updated_at, now())
WHERE invite_policy IS NULL 
   OR leaderboard_visibility IS NULL 
   OR bracket_visibility IS NULL 
   OR allow_late_join IS NULL
   OR updated_at IS NULL;

-- Verify the update
SELECT 
  id,
  name,
  invite_policy,
  leaderboard_visibility,
  bracket_visibility,
  allow_late_join,
  lock_at,
  description,
  updated_at
FROM public.groups
ORDER BY created_at DESC
LIMIT 10;
