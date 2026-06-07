-- Fix tournament issue: Set the correct tournament as active
-- This ensures the app finds the tournament with the matches

-- First, deactivate all tournaments
UPDATE public.tournaments
SET is_active = false;

-- Then, activate only the one with the slug (the one with matches)
UPDATE public.tournaments
SET is_active = true
WHERE slug = 'world-cup-2026';

-- Verify the fix
SELECT 
  id,
  name,
  slug,
  is_active,
  (SELECT COUNT(*) FROM public.matches WHERE tournament_id = tournaments.id) as matches_count,
  (SELECT COUNT(*) FROM public.teams WHERE tournament_id = tournaments.id) as teams_count
FROM public.tournaments
ORDER BY is_active DESC, created_at DESC;
