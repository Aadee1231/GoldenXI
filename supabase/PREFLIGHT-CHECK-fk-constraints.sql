-- =========================================================
-- PREFLIGHT CHECK: Foreign Key Constraint Analysis
-- =========================================================
-- This query inspects the actual foreign key constraints
-- to determine ON DELETE behavior before running seed file.
-- 
-- Run this in Supabase SQL Editor BEFORE running seed-wc2026-full-format.sql
-- =========================================================

SELECT 
  tc.table_name AS "Table",
  kcu.column_name AS "Column",
  ccu.table_name AS "References Table",
  ccu.column_name AS "References Column",
  rc.delete_rule AS "ON DELETE Behavior"
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE 
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    -- Check bracket_picks foreign keys
    (tc.table_name = 'bracket_picks' AND kcu.column_name IN ('match_id', 'picked_team_id', 'bracket_id'))
    OR
    -- Check brackets foreign keys
    (tc.table_name = 'brackets' AND kcu.column_name = 'tournament_id')
    OR
    -- Check matches foreign keys
    (tc.table_name = 'matches' AND kcu.column_name IN ('tournament_id', 'home_team_id', 'away_team_id', 'winner_team_id'))
    OR
    -- Check teams foreign keys
    (tc.table_name = 'teams' AND kcu.column_name = 'tournament_id')
  )
ORDER BY 
  tc.table_name, 
  kcu.column_name;

-- =========================================================
-- INTERPRETATION GUIDE:
-- =========================================================
-- 
-- ON DELETE Behavior values:
-- - CASCADE: Deleting parent deletes child rows
-- - SET NULL: Deleting parent sets child FK to NULL
-- - RESTRICT: Deleting parent fails if child rows exist
-- - NO ACTION: Same as RESTRICT (PostgreSQL default)
-- 
-- CRITICAL FOREIGN KEYS TO CHECK:
-- 
-- 1. bracket_picks.match_id -> matches.id
--    - CASCADE: Deleting matches deletes all picks (DESTRUCTIVE)
--    - SET NULL: Deleting matches sets picks.match_id = NULL (BROKEN)
--    - RESTRICT: Deleting matches fails if picks exist (SAFE but BLOCKS)
-- 
-- 2. bracket_picks.picked_team_id -> teams.id
--    - CASCADE: Deleting teams deletes all picks (DESTRUCTIVE)
--    - SET NULL: Deleting teams sets picks.picked_team_id = NULL (BROKEN)
--    - RESTRICT: Deleting teams fails if picks exist (SAFE but BLOCKS)
-- 
-- 3. brackets.tournament_id -> tournaments.id
--    - CASCADE: Deleting tournament deletes all brackets (DESTRUCTIVE)
--    - SET NULL: Deleting tournament sets brackets.tournament_id = NULL (BROKEN)
--    - RESTRICT: Deleting tournament fails if brackets exist (SAFE but BLOCKS)
-- 
-- 4. matches.tournament_id -> tournaments.id
--    - CASCADE: Deleting tournament deletes all matches (EXPECTED)
--    - RESTRICT: Deleting tournament fails if matches exist (BLOCKS)
-- 
-- 5. teams.tournament_id -> tournaments.id
--    - CASCADE: Deleting tournament deletes all teams (EXPECTED)
--    - RESTRICT: Deleting tournament fails if teams exist (BLOCKS)
-- 
-- =========================================================
-- WHAT WILL HAPPEN WHEN RUNNING seed-wc2026-full-format.sql?
-- =========================================================
-- 
-- The seed file does:
-- 1. DELETE FROM matches WHERE tournament_id = wc_id;
-- 2. DELETE FROM teams WHERE tournament_id = wc_id;
-- 
-- Based on FK rules:
-- 
-- IF bracket_picks.match_id -> matches.id = CASCADE:
--   → Deleting matches will CASCADE delete all bracket_picks
--   → Old brackets become empty
--   → DESTRUCTIVE but script succeeds
-- 
-- IF bracket_picks.match_id -> matches.id = SET NULL:
--   → Deleting matches will set bracket_picks.match_id = NULL
--   → Old brackets broken but not deleted
--   → Script succeeds
-- 
-- IF bracket_picks.match_id -> matches.id = RESTRICT/NO ACTION:
--   → Deleting matches will FAIL with FK constraint error
--   → No data deleted (transaction rolls back)
--   → Script fails, must delete bracket_picks manually first
-- 
-- =========================================================
