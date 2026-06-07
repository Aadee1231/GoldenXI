-- =========================================================
-- Test Match Results for Scoring Verification
-- =========================================================
-- This file provides example SQL to set match winners for testing
-- the leaderboard scoring system locally.
--
-- IMPORTANT: Run this AFTER running step5-match-results.sql
--
-- Usage:
-- 1. Run this entire file in Supabase SQL Editor to set test results
-- 2. Check the leaderboard to see scores update
-- 3. To reset, set completed = false and winner_team_id = null
-- =========================================================

-- Get the active tournament ID
DO $$
DECLARE
  wc_id uuid;
  brazil_id uuid;
  netherlands_id uuid;
  england_id uuid;
  germany_id uuid;
  france_id uuid;
  spain_id uuid;
  argentina_id uuid;
  portugal_id uuid;
  
  -- Match IDs
  r16_match1_id uuid;
  r16_match2_id uuid;
  r16_match3_id uuid;
  r16_match4_id uuid;
  qf_match1_id uuid;
  qf_match2_id uuid;
  sf_match1_id uuid;
  final_match_id uuid;
BEGIN
  -- Get tournament ID
  SELECT id INTO wc_id
  FROM public.tournaments
  WHERE slug = 'world-cup-2026'
  LIMIT 1;

  IF wc_id IS NULL THEN
    RAISE EXCEPTION 'World Cup 2026 tournament not found. Run seed-bracket-data.sql first.';
  END IF;

  -- Get team IDs
  SELECT id INTO brazil_id FROM public.teams WHERE tournament_id = wc_id AND code = 'BRA' LIMIT 1;
  SELECT id INTO netherlands_id FROM public.teams WHERE tournament_id = wc_id AND code = 'NED' LIMIT 1;
  SELECT id INTO england_id FROM public.teams WHERE tournament_id = wc_id AND code = 'ENG' LIMIT 1;
  SELECT id INTO germany_id FROM public.teams WHERE tournament_id = wc_id AND code = 'GER' LIMIT 1;
  SELECT id INTO france_id FROM public.teams WHERE tournament_id = wc_id AND code = 'FRA' LIMIT 1;
  SELECT id INTO spain_id FROM public.teams WHERE tournament_id = wc_id AND code = 'ESP' LIMIT 1;
  SELECT id INTO argentina_id FROM public.teams WHERE tournament_id = wc_id AND code = 'ARG' LIMIT 1;
  SELECT id INTO portugal_id FROM public.teams WHERE tournament_id = wc_id AND code = 'POR' LIMIT 1;

  -- Get match IDs (by match_number and round)
  SELECT id INTO r16_match1_id FROM public.matches WHERE tournament_id = wc_id AND round = 'r16' AND match_number = 1 LIMIT 1;
  SELECT id INTO r16_match2_id FROM public.matches WHERE tournament_id = wc_id AND round = 'r16' AND match_number = 2 LIMIT 1;
  SELECT id INTO r16_match3_id FROM public.matches WHERE tournament_id = wc_id AND round = 'r16' AND match_number = 3 LIMIT 1;
  SELECT id INTO r16_match4_id FROM public.matches WHERE tournament_id = wc_id AND round = 'r16' AND match_number = 4 LIMIT 1;
  SELECT id INTO qf_match1_id FROM public.matches WHERE tournament_id = wc_id AND round = 'qf' AND match_number = 1 LIMIT 1;
  SELECT id INTO qf_match2_id FROM public.matches WHERE tournament_id = wc_id AND round = 'qf' AND match_number = 2 LIMIT 1;
  SELECT id INTO sf_match1_id FROM public.matches WHERE tournament_id = wc_id AND round = 'sf' AND match_number = 1 LIMIT 1;
  SELECT id INTO final_match_id FROM public.matches WHERE tournament_id = wc_id AND round = 'final' AND match_number = 1 LIMIT 1;

  -- =========================================================
  -- ROUND OF 16 RESULTS (1 point each)
  -- =========================================================
  
  -- Match 1: Brazil vs Australia → Brazil wins
  UPDATE public.matches
  SET 
    winner_team_id = brazil_id,
    completed = true,
    completed_at = NOW() - INTERVAL '10 days'
  WHERE id = r16_match1_id;

  -- Match 2: Netherlands vs Uruguay → Netherlands wins
  UPDATE public.matches
  SET 
    winner_team_id = netherlands_id,
    completed = true,
    completed_at = NOW() - INTERVAL '10 days'
  WHERE id = r16_match2_id;

  -- Match 3: England vs Morocco → England wins
  UPDATE public.matches
  SET 
    winner_team_id = england_id,
    completed = true,
    completed_at = NOW() - INTERVAL '9 days'
  WHERE id = r16_match3_id;

  -- Match 4: Germany vs Mexico → Germany wins
  UPDATE public.matches
  SET 
    winner_team_id = germany_id,
    completed = true,
    completed_at = NOW() - INTERVAL '9 days'
  WHERE id = r16_match4_id;

  -- =========================================================
  -- QUARTERFINALS RESULTS (2 points each)
  -- =========================================================
  
  -- QF Match 1: Brazil vs Netherlands → Brazil wins
  UPDATE public.matches
  SET 
    winner_team_id = brazil_id,
    completed = true,
    completed_at = NOW() - INTERVAL '6 days'
  WHERE id = qf_match1_id;

  -- QF Match 2: England vs Germany → England wins
  UPDATE public.matches
  SET 
    winner_team_id = england_id,
    completed = true,
    completed_at = NOW() - INTERVAL '6 days'
  WHERE id = qf_match2_id;

  -- =========================================================
  -- SEMIFINALS RESULTS (4 points each)
  -- =========================================================
  
  -- SF Match 1: Brazil vs England → Brazil wins
  UPDATE public.matches
  SET 
    winner_team_id = brazil_id,
    completed = true,
    completed_at = NOW() - INTERVAL '3 days'
  WHERE id = sf_match1_id;

  -- =========================================================
  -- FINAL RESULT (8 points)
  -- =========================================================
  
  -- Final: Brazil vs [other SF winner] → Brazil wins
  -- Note: For testing, we'll set Brazil as champion
  UPDATE public.matches
  SET 
    winner_team_id = brazil_id,
    completed = true,
    completed_at = NOW() - INTERVAL '1 day'
  WHERE id = final_match_id;

  RAISE NOTICE 'Test match results set successfully!';
  RAISE NOTICE 'Tournament ID: %', wc_id;
  RAISE NOTICE 'Champion: Brazil';
  RAISE NOTICE '';
  RAISE NOTICE 'Scoring breakdown:';
  RAISE NOTICE '- R16 matches completed: 4 (1 point each)';
  RAISE NOTICE '- QF matches completed: 2 (2 points each)';
  RAISE NOTICE '- SF matches completed: 1 (4 points each)';
  RAISE NOTICE '- Final completed: 1 (8 points)';
  RAISE NOTICE '';
  RAISE NOTICE 'Perfect bracket score: 4 + 4 + 4 + 8 = 20 points (out of 32 max)';
END $$;

-- =========================================================
-- Verify results
-- =========================================================

SELECT
  'Match Results Summary' as report_type,
  m.round,
  COUNT(*) as total_matches,
  SUM(CASE WHEN m.completed THEN 1 ELSE 0 END) as completed_matches,
  t.name as champion_team
FROM public.matches m
LEFT JOIN public.teams t ON t.id = m.winner_team_id
WHERE m.tournament_id = (SELECT id FROM public.tournaments WHERE slug = 'world-cup-2026' LIMIT 1)
GROUP BY m.round, t.name
ORDER BY 
  CASE m.round
    WHEN 'r16' THEN 1
    WHEN 'qf' THEN 2
    WHEN 'sf' THEN 3
    WHEN 'final' THEN 4
  END;

-- =========================================================
-- RESET SCRIPT (uncomment to clear all results)
-- =========================================================

/*
UPDATE public.matches
SET 
  winner_team_id = NULL,
  completed = false,
  completed_at = NULL
WHERE tournament_id = (
  SELECT id FROM public.tournaments WHERE slug = 'world-cup-2026' LIMIT 1
);

SELECT 'All match results cleared' as status;
*/
