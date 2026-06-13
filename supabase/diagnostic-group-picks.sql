-- Diagnostic: Check group picks and scoring for all leaderboard users
-- Run this in Supabase SQL Editor to understand why scores are 0

-- 1. Show each user's Group A picks vs actual standings
SELECT
  p.display_name,
  p.username,
  bgp.group_label,
  bgp.position AS predicted_position,
  t.code AS team_code,
  t.name AS team_name
FROM public.profiles p
JOIN public.brackets b ON b.user_id = p.id
  AND b.tournament_id = (SELECT id FROM public.tournaments WHERE is_active = true LIMIT 1)
JOIN public.bracket_group_picks bgp ON bgp.bracket_id = b.id
JOIN public.teams t ON t.id = bgp.team_id
WHERE bgp.group_label = 'A'
ORDER BY p.display_name, bgp.position;

-- 2. Count how many group picks each user has (should be 48 for complete bracket)
SELECT
  p.display_name,
  p.username,
  COUNT(bgp.id) AS total_group_picks,
  COUNT(DISTINCT bgp.group_label) AS groups_filled
FROM public.profiles p
JOIN public.brackets b ON b.user_id = p.id
  AND b.tournament_id = (SELECT id FROM public.tournaments WHERE is_active = true LIMIT 1)
LEFT JOIN public.bracket_group_picks bgp ON bgp.bracket_id = b.id
WHERE b.status = 'submitted'
GROUP BY p.display_name, p.username
ORDER BY total_group_picks DESC;

-- 3. Check if old 'group_picks' table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'group_picks'
) AS old_group_picks_table_exists,
EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'third_place_picks'
) AS old_third_place_picks_table_exists;
