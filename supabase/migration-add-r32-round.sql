-- =========================================================
-- Migration: Add r32 to matches.round CHECK constraint
-- =========================================================
-- This migration updates the CHECK constraint on matches.round
-- to allow the new "r32" (Round of 32) value.
--
-- BEFORE: round CHECK (round IN ('group', 'r16', 'qf', 'sf', 'final'))
-- AFTER:  round CHECK (round IN ('group', 'r32', 'r16', 'qf', 'sf', 'final'))
-- =========================================================

-- Drop the old CHECK constraint
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_round_check;

-- Add new CHECK constraint with r32 included
ALTER TABLE public.matches
ADD CONSTRAINT matches_round_check
CHECK (round IN ('group', 'r32', 'r16', 'qf', 'sf', 'final'));

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.matches'::regclass
  AND conname = 'matches_round_check';

-- =========================================================
-- Expected Output:
-- constraint_name: matches_round_check
-- constraint_definition: CHECK ((round = ANY (ARRAY['group'::text, 'r32'::text, 'r16'::text, 'qf'::text, 'sf'::text, 'final'::text])))
-- =========================================================
