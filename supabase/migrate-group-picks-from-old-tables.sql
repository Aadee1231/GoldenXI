-- Migration: Move data from incorrectly named tables to correct tables
-- This fixes data that was saved to 'group_picks' and 'third_place_picks'
-- due to a bug in BracketWizard.tsx that has now been fixed.

-- ============================================================================
-- MIGRATE group_picks -> bracket_group_picks
-- ============================================================================

-- First, check if the old table exists and has data
DO $$
DECLARE
  old_table_exists boolean;
  row_count integer;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'group_picks'
  ) INTO old_table_exists;
  
  IF old_table_exists THEN
    EXECUTE format('SELECT COUNT(*) FROM %I', 'group_picks') INTO row_count;
    RAISE NOTICE 'Old table group_picks exists with % rows', row_count;
    
    IF row_count > 0 THEN
      -- Insert data from old table to new table, skipping duplicates
      INSERT INTO public.bracket_group_picks (bracket_id, group_label, team_id, position)
      SELECT bracket_id, group_label, team_id, position
      FROM public.group_picks
      ON CONFLICT (bracket_id, group_label, team_id) DO NOTHING;
      
      RAISE NOTICE 'Migrated data from group_picks to bracket_group_picks';
    END IF;
  ELSE
    RAISE NOTICE 'Old table group_picks does not exist, skipping migration';
  END IF;
END $$;

-- ============================================================================
-- MIGRATE third_place_picks -> bracket_third_place_picks
-- ============================================================================

DO $$
DECLARE
  old_table_exists boolean;
  row_count integer;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'third_place_picks'
  ) INTO old_table_exists;
  
  IF old_table_exists THEN
    EXECUTE format('SELECT COUNT(*) FROM %I', 'third_place_picks') INTO row_count;
    RAISE NOTICE 'Old table third_place_picks exists with % rows', row_count;
    
    IF row_count > 0 THEN
      -- Insert data from old table to new table, skipping duplicates
      INSERT INTO public.bracket_third_place_picks (bracket_id, team_id, created_at)
      SELECT bracket_id, team_id, created_at
      FROM public.third_place_picks
      ON CONFLICT (bracket_id, team_id) DO NOTHING;
      
      RAISE NOTICE 'Migrated data from third_place_picks to bracket_third_place_picks';
    END IF;
  ELSE
    RAISE NOTICE 'Old table third_place_picks does not exist, skipping migration';
  END IF;
END $$;

-- ============================================================================
-- CLEANUP (OPTIONAL - Uncomment after verifying migration worked)
-- ============================================================================

-- After verifying the migration worked correctly and scores are restored,
-- you can drop the old tables to clean up:

-- DROP TABLE IF EXISTS public.group_picks CASCADE;
-- DROP TABLE IF EXISTS public.third_place_picks CASCADE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check how many rows are now in the correct tables
SELECT 'bracket_group_picks' as table_name, COUNT(*) as row_count FROM public.bracket_group_picks
UNION ALL
SELECT 'bracket_third_place_picks' as table_name, COUNT(*) as row_count FROM public.bracket_third_place_picks;
