-- =========================================================
-- GoldenXI World Cup 2026 Full Format Seed Data
-- =========================================================
-- This script seeds the complete 2026 FIFA World Cup format:
-- - 48 teams across 12 groups (A-L)
-- - Real tournament: 104 total matches
-- - GoldenXI V1 prediction rows: 79 total
--
-- PREDICTION ROW BREAKDOWN (79 total):
-- - 48 group ranking placeholder rows (not real fixtures)
-- - 16 Round of 32 matches
-- - 8 Round of 16 matches
-- - 4 Quarterfinal matches
-- - 2 Semifinal matches
-- - 1 Final match
--
-- TOURNAMENT FORMAT:
-- - Top 2 from each group (24 teams) advance automatically
-- - Best 8 third-place teams advance
-- - Total: 32 teams in knockout stage
--
-- IMPORTANT NOTES:
-- - Uses country names and flag emojis only (no official FIFA assets)
-- - Re-runnable: Uses upsert patterns to avoid duplicates
-- - Official FIFA World Cup 2026 groups (as of June 2026)
-- - V1 does NOT predict all 72 real group-stage fixtures
-- - Group stage uses 48 placeholder rows for team ranking predictions
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 1. Ensure Required Columns Exist
-- =========================================================

alter table public.tournaments
add column if not exists slug text;

alter table public.tournaments
add column if not exists status text default 'active';

alter table public.tournaments
add column if not exists starts_at timestamptz;

alter table public.tournaments
add column if not exists ends_at timestamptz;

alter table public.teams
add column if not exists code text;

alter table public.teams
add column if not exists flag_emoji text;

alter table public.teams
add column if not exists group_label text;

alter table public.matches
add column if not exists match_number integer;

alter table public.matches
add column if not exists winner_team_id uuid references public.teams(id) on delete set null;

create unique index if not exists tournaments_slug_unique_idx
on public.tournaments(slug);

-- =========================================================
-- 2. Upsert World Cup 2026 Tournament
-- =========================================================

do $$
declare
  wc_id uuid;
begin
  -- Try to find existing tournament by slug
  select id into wc_id
  from public.tournaments
  where slug = 'world-cup-2026'
  limit 1;

  -- If it doesn't exist, create it
  if wc_id is null then
    insert into public.tournaments (
      id,
      name,
      season,
      is_active,
      start_date,
      end_date,
      slug,
      status,
      starts_at,
      ends_at
    )
    values (
      gen_random_uuid(),
      'World Cup 2026',
      '2026',
      true,
      '2026-06-11'::date,
      '2026-07-19'::date,
      'world-cup-2026',
      'active',
      '2026-06-11 00:00:00+00'::timestamptz,
      '2026-07-19 23:59:59+00'::timestamptz
    )
    returning id into wc_id;
  else
    -- Update existing tournament
    update public.tournaments
    set
      name = 'World Cup 2026',
      season = '2026',
      is_active = true,
      start_date = '2026-06-11'::date,
      end_date = '2026-07-19'::date,
      slug = 'world-cup-2026',
      status = 'active',
      starts_at = '2026-06-11 00:00:00+00'::timestamptz,
      ends_at = '2026-07-19 23:59:59+00'::timestamptz
    where id = wc_id;
  end if;

  -- Point existing groups/brackets to this tournament
  update public.groups
  set tournament_id = wc_id
  where tournament_id is null or tournament_id != wc_id;

  update public.brackets
  set tournament_id = wc_id
  where tournament_id is null or tournament_id != wc_id;

  -- =========================================================
  -- SAFETY ANALYSIS: Deleting Old Teams & Matches
  -- =========================================================
  -- 
  -- Q: What happens when we delete old matches and teams?
  -- A: It depends on the foreign key constraints in bracket_picks.
  --
  -- SCENARIO 1: FK has ON DELETE CASCADE
  -- - Deleting matches → deletes all bracket_picks for those matches
  -- - Deleting teams → deletes all bracket_picks for those teams
  -- - Result: Old brackets become empty (DESTRUCTIVE)
  --
  -- SCENARIO 2: FK has ON DELETE RESTRICT (default)
  -- - Deleting matches → SQL ERROR if any bracket_picks exist
  -- - Deleting teams → SQL ERROR if any bracket_picks exist
  -- - Result: Script fails, no data deleted (SAFE but blocks migration)
  --
  -- SCENARIO 3: FK has ON DELETE SET NULL
  -- - Deleting matches → sets bracket_picks.match_id = NULL
  -- - Deleting teams → sets bracket_picks.picked_team_id = NULL
  -- - Result: Old brackets become invalid but not deleted
  --
  -- CURRENT SUPABASE SCHEMA (based on code analysis):
  -- - bracket_picks.match_id → matches.id (likely RESTRICT or CASCADE)
  -- - bracket_picks.picked_team_id → teams.id (likely RESTRICT or CASCADE)
  -- - No explicit ON DELETE clause visible in migration files
  --
  -- RECOMMENDED APPROACH (safest):
  -- 1. First run: Check if any bracket_picks exist for this tournament
  -- 2. If yes: Either skip deletion OR delete bracket_picks first
  -- 3. If no: Safe to delete matches and teams
  --
  -- FOR DEVELOPMENT (acceptable risk):
  -- - Delete old matches and teams
  -- - If script fails → FK constraint exists → manually delete bracket_picks first
  -- - If script succeeds → Old brackets will break (expected for dev)
  --
  -- FOR PRODUCTION (requires careful planning):
  -- - Export old bracket data first
  -- - Mark old brackets as "legacy" before running
  -- - Consider creating new tournament_id instead of reusing
  -- =========================================================

  -- Clear old matches and teams for this tournament only
  -- WARNING: This may fail if bracket_picks have FK constraints
  -- If it fails, manually delete bracket_picks first or use a new tournament_id
  delete from public.matches
  where tournament_id = wc_id;

  delete from public.teams
  where tournament_id = wc_id;

  -- =========================================================
  -- 3. Insert 48 Teams (12 Groups × 4 Teams)
  -- =========================================================
  -- Official FIFA World Cup 2026 groups
  -- Using country names and flag emojis only (no official logos)
  -- =========================================================

  insert into public.teams (
    id,
    tournament_id,
    name,
    code,
    flag_emoji,
    group_label
  )
  select
    gen_random_uuid(),
    wc_id,
    team_name,
    team_code,
    team_flag,
    team_group
  from (
    values
      -- GROUP A
      ('Mexico',                  'MEX', '🇲🇽', 'A'),
      ('South Africa',            'RSA', '��', 'A'),
      ('Korea Republic',          'KOR', '��', 'A'),
      ('Czechia',                 'CZE', '��', 'A'),
      
      -- GROUP B
      ('Canada',                  'CAN', '��', 'B'),
      ('Bosnia and Herzegovina',  'BIH', '�🇦', 'B'),
      ('Qatar',                   'QAT', '��', 'B'),
      ('Switzerland',             'SUI', '�🇭', 'B'),
      
      -- GROUP C
      ('Brazil',                  'BRA', '�🇷', 'C'),
      ('Morocco',                 'MAR', '��', 'C'),
      ('Haiti',                   'HAI', '��', 'C'),
      ('Scotland',                'SCO', '�', 'C'),
      
      -- GROUP D
      ('USA',                     'USA', '��', 'D'),
      ('Paraguay',                'PAR', '��', 'D'),
      ('Australia',               'AUS', '��', 'D'),
      ('Türkiye',                 'TUR', '��', 'D'),
      
      -- GROUP E
      ('Germany',                 'GER', '🇩🇪', 'E'),
      ('Curaçao',                 'CUW', '��', 'E'),
      ('Côte d''Ivoire',          'CIV', '��', 'E'),
      ('Ecuador',                 'ECU', '🇪🇨', 'E'),
      
      -- GROUP F
      ('Netherlands',             'NED', '��', 'F'),
      ('Japan',                   'JPN', '��', 'F'),
      ('Sweden',                  'SWE', '��', 'F'),
      ('Tunisia',                 'TUN', '��', 'F'),
      
      -- GROUP G
      ('Belgium',                 'BEL', '��', 'G'),
      ('Egypt',                   'EGY', '��', 'G'),
      ('Iran',                    'IRN', '��', 'G'),
      ('New Zealand',             'NZL', '��', 'G'),
      
      -- GROUP H
      ('Spain',                   'ESP', '��', 'H'),
      ('Cape Verde',              'CPV', '��', 'H'),
      ('Saudi Arabia',            'KSA', '��', 'H'),
      ('Uruguay',                 'URU', '��', 'H'),
      
      -- GROUP I
      ('France',                  'FRA', '��', 'I'),
      ('Senegal',                 'SEN', '��', 'I'),
      ('Iraq',                    'IRQ', '��', 'I'),
      ('Norway',                  'NOR', '��', 'I'),
      
      -- GROUP J
      ('Argentina',               'ARG', '��', 'J'),
      ('Algeria',                 'ALG', '��', 'J'),
      ('Austria',                 'AUT', '��', 'J'),
      ('Jordan',                  'JOR', '��', 'J'),
      
      -- GROUP K
      ('Portugal',                'POR', '��', 'K'),
      ('DR Congo',                'COD', '��', 'K'),
      ('Uzbekistan',              'UZB', '��', 'K'),
      ('Colombia',                'COL', '��', 'K'),
      
      -- GROUP L
      ('England',                 'ENG', '�', 'L'),
      ('Croatia',                 'CRO', '��', 'L'),
      ('Ghana',                   'GHA', '��', 'L'),
      ('Panama',                  'PAN', '��', 'L')
  ) as seed(team_name, team_code, team_flag, team_group);

  -- =========================================================
  -- 4. Insert Group Stage Placeholder Rows (48 rows)
  -- =========================================================
  -- Real tournament: Each group has 6 actual fixtures (72 total)
  -- GoldenXI V1: Uses 48 placeholder rows for group ranking predictions
  -- 
  -- IMPORTANT: These are NOT real match fixtures
  -- - Each row represents a team slot in a group (4 per group)
  -- - Users will rank teams 1st, 2nd, 3rd, 4th per group
  -- - Users do NOT predict individual group match scores in V1
  -- - Actual group fixtures may be added in future versions
  -- =========================================================

  with group_teams as (
    select
      id,
      name,
      code,
      group_label,
      row_number() over (partition by group_label order by name) as team_position
    from public.teams
    where tournament_id = wc_id
  )
  insert into public.matches (
    id,
    tournament_id,
    home_team_id,
    away_team_id,
    round,
    match_number,
    match_date,
    completed
  )
  select
    gen_random_uuid(),
    wc_id,
    null::uuid,  -- No specific home/away for group ranking placeholders
    null::uuid,
    'group',
    (ascii(group_label) - ascii('A')) * 4 + team_position::integer,
    '2026-06-12'::date + ((ascii(group_label) - ascii('A')) || ' days')::interval,
    false
  from group_teams;

  -- =========================================================
  -- 5. Insert Round of 32 Matches (16 matches)
  -- =========================================================
  -- R32 matches are TBD until group stage completes
  -- Match pairings follow 2026 World Cup bracket structure
  -- =========================================================

  insert into public.matches (
    id,
    tournament_id,
    home_team_id,
    away_team_id,
    round,
    match_number,
    match_date,
    completed
  )
  select
    gen_random_uuid(),
    wc_id,
    null::uuid,
    null::uuid,
    'r32',
    gs,
    case
      when gs <= 4  then '2026-06-27'::date
      when gs <= 8  then '2026-06-28'::date
      when gs <= 12 then '2026-06-29'::date
      else '2026-06-30'::date
    end,
    false
  from generate_series(1, 16) as gs;

  -- =========================================================
  -- 6. Insert Round of 16 Matches (8 matches)
  -- =========================================================

  insert into public.matches (
    id,
    tournament_id,
    home_team_id,
    away_team_id,
    round,
    match_number,
    match_date,
    completed
  )
  select
    gen_random_uuid(),
    wc_id,
    null::uuid,
    null::uuid,
    'r16',
    gs,
    case
      when gs <= 2 then '2026-07-03'::date
      when gs <= 4 then '2026-07-04'::date
      when gs <= 6 then '2026-07-05'::date
      else '2026-07-06'::date
    end,
    false
  from generate_series(1, 8) as gs;

  -- =========================================================
  -- 7. Insert Quarterfinal Matches (4 matches)
  -- =========================================================

  insert into public.matches (
    id,
    tournament_id,
    home_team_id,
    away_team_id,
    round,
    match_number,
    match_date,
    completed
  )
  select
    gen_random_uuid(),
    wc_id,
    null::uuid,
    null::uuid,
    'qf',
    gs,
    case
      when gs <= 2 then '2026-07-09'::date
      else '2026-07-10'::date
    end,
    false
  from generate_series(1, 4) as gs;

  -- =========================================================
  -- 8. Insert Semifinal Matches (2 matches)
  -- =========================================================

  insert into public.matches (
    id,
    tournament_id,
    home_team_id,
    away_team_id,
    round,
    match_number,
    match_date,
    completed
  )
  select
    gen_random_uuid(),
    wc_id,
    null::uuid,
    null::uuid,
    'sf',
    gs,
    case
      when gs = 1 then '2026-07-14'::date
      else '2026-07-15'::date
    end,
    false
  from generate_series(1, 2) as gs;

  -- =========================================================
  -- 9. Insert Final Match (1 match)
  -- =========================================================

  insert into public.matches (
    id,
    tournament_id,
    home_team_id,
    away_team_id,
    round,
    match_number,
    match_date,
    completed
  )
  values (
    gen_random_uuid(),
    wc_id,
    null::uuid,
    null::uuid,
    'final',
    1,
    '2026-07-19'::date,
    false
  );

end $$;

-- Refresh Supabase API schema cache
notify pgrst, 'reload schema';

-- =========================================================
-- 10. Verification Query
-- =========================================================

with wc as (
  select id
  from public.tournaments
  where slug = 'world-cup-2026'
  limit 1
)
select
  'tournament_id' as item,
  id::text as value
from wc

union all

select
  'teams_count' as item,
  count(*)::text as value
from public.teams
where tournament_id = (select id from wc)

union all

select
  'matches_total' as item,
  count(*)::text as value
from public.matches
where tournament_id = (select id from wc)

union all

select
  'group_matches' as item,
  count(*)::text as value
from public.matches
where tournament_id = (select id from wc)
  and round = 'group'

union all

select
  'r32_matches' as item,
  count(*)::text as value
from public.matches
where tournament_id = (select id from wc)
  and round = 'r32'

union all

select
  'r16_matches' as item,
  count(*)::text as value
from public.matches
where tournament_id = (select id from wc)
  and round = 'r16'

union all

select
  'qf_matches' as item,
  count(*)::text as value
from public.matches
where tournament_id = (select id from wc)
  and round = 'qf'

union all

select
  'sf_matches' as item,
  count(*)::text as value
from public.matches
where tournament_id = (select id from wc)
  and round = 'sf'

union all

select
  'final_matches' as item,
  count(*)::text as value
from public.matches
where tournament_id = (select id from wc)
  and round = 'final'

union all

select
  'groups_count' as item,
  count(distinct group_label)::text as value
from public.teams
where tournament_id = (select id from wc);

-- =========================================================
-- Expected Results:
-- - teams_count: 48
-- - matches_total: 79 (GoldenXI V1 prediction rows)
-- - group_placeholder_rows: 48 (not real fixtures, for ranking predictions)
-- - r32_matches: 16
-- - r16_matches: 8
-- - qf_matches: 4
-- - sf_matches: 2
-- - final_matches: 1
-- - groups_count: 12
--
-- NOTE: Real tournament has 104 matches (72 group + 32 knockout)
-- GoldenXI V1 uses 79 prediction rows (48 group placeholders + 31 knockout)
-- =========================================================
