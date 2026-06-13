-- Find teams referenced in bracket_group_picks but NOT in the active tournament
-- These team_ids would resolve to "" in teamCodeMap, scoring 0

SELECT DISTINCT
  t.id AS team_id,
  t.code AS team_code,
  t.name AS team_name,
  t.tournament_id AS team_tournament_id,
  tour.is_active,
  COUNT(bgp.bracket_id) AS used_in_picks
FROM public.bracket_group_picks bgp
JOIN public.teams t ON t.id = bgp.team_id
LEFT JOIN public.tournaments tour ON tour.id = t.tournament_id
GROUP BY t.id, t.code, t.name, t.tournament_id, tour.is_active
ORDER BY t.code;

-- ============================================================================
-- Also check: are ALL teams linked to the active tournament?
-- ============================================================================
SELECT 
  tour.id AS tournament_id,
  tour.is_active,
  COUNT(t.id) AS team_count
FROM public.tournaments tour
LEFT JOIN public.teams t ON t.tournament_id = tour.id
GROUP BY tour.id, tour.is_active
ORDER BY tour.is_active DESC;
