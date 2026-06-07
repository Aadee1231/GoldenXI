-- =========================================================
-- GoldenXI World Cup 2026 Bracket Seed Data
-- Works with existing world-cup-2026 tournament row
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 1. Make sure needed columns exist
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
-- 2. Create or reuse World Cup 2026 tournament
-- =========================================================

do $$
declare
  wc_id uuid;
begin
  -- Try to find existing tournament by slug first
  select id
  into wc_id
  from public.tournaments
  where slug = 'world-cup-2026'
  limit 1;

  -- If it does not exist, create it
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
  end if;

  -- Update the tournament to the correct values
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

  -- Since GoldenXI is only World Cup 2026 right now,
  -- point existing groups/brackets to this tournament.
  update public.groups
  set tournament_id = wc_id;

  update public.brackets
  set tournament_id = wc_id;

  -- Set default tournament_id for new groups/brackets
  execute format(
    'alter table public.groups alter column tournament_id set default %L::uuid',
    wc_id::text
  );

  execute format(
    'alter table public.brackets alter column tournament_id set default %L::uuid',
    wc_id::text
  );

  -- Clear old development bracket picks for this tournament
  delete from public.bracket_picks
  where match_id in (
    select id from public.matches where tournament_id = wc_id
  )
  or picked_team_id in (
    select id from public.teams where tournament_id = wc_id
  );

  -- Clear old development matches and teams for this tournament
  delete from public.matches
  where tournament_id = wc_id;

  delete from public.teams
  where tournament_id = wc_id;

  -- =========================================================
  -- 3. Insert 16 demo knockout teams
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
      (1,  'Brazil',      'BRA', '🇧🇷', 'A'),
      (2,  'Australia',   'AUS', '🇦🇺', 'A'),
      (3,  'Netherlands', 'NED', '🇳🇱', 'B'),
      (4,  'Uruguay',     'URU', '🇺🇾', 'B'),
      (5,  'England',     'ENG', '🏴',  'C'),
      (6,  'Morocco',     'MAR', '🇲🇦', 'C'),
      (7,  'Germany',     'GER', '🇩🇪', 'D'),
      (8,  'Mexico',      'MEX', '🇲🇽', 'D'),
      (9,  'France',      'FRA', '🇫🇷', 'E'),
      (10, 'Senegal',     'SEN', '🇸🇳', 'E'),
      (11, 'Spain',       'ESP', '🇪🇸', 'F'),
      (12, 'USA',         'USA', '🇺🇸', 'F'),
      (13, 'Argentina',   'ARG', '🇦🇷', 'G'),
      (14, 'Japan',       'JPN', '🇯🇵', 'G'),
      (15, 'Portugal',    'POR', '🇵🇹', 'H'),
      (16, 'Colombia',    'COL', '🇨🇴', 'H')
  ) as seed(order_num, team_name, team_code, team_flag, team_group);

  -- =========================================================
  -- 4. Insert 8 Round of 16 matches
  -- =========================================================

  with ordered_teams as (
    select
      id,
      name,
      row_number() over (
        order by
          case name
            when 'Brazil' then 1
            when 'Australia' then 2
            when 'Netherlands' then 3
            when 'Uruguay' then 4
            when 'England' then 5
            when 'Morocco' then 6
            when 'Germany' then 7
            when 'Mexico' then 8
            when 'France' then 9
            when 'Senegal' then 10
            when 'Spain' then 11
            when 'USA' then 12
            when 'Argentina' then 13
            when 'Japan' then 14
            when 'Portugal' then 15
            when 'Colombia' then 16
            else 999
          end
      ) as rn
    from public.teams
    where tournament_id = wc_id
  ),
  team_pairs as (
    select
      ((t1.rn + 1) / 2)::integer as match_number,
      t1.id as home_team_id,
      t2.id as away_team_id
    from ordered_teams t1
    join ordered_teams t2
      on t2.rn = t1.rn + 1
    where t1.rn % 2 = 1
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
    home_team_id,
    away_team_id,
    'r16',
    match_number,
    case
      when match_number in (1, 2) then '2026-06-27'::date
      when match_number in (3, 4) then '2026-06-28'::date
      when match_number in (5, 6) then '2026-06-29'::date
      else '2026-06-30'::date
    end,
    false
  from team_pairs
  order by match_number;

  -- =========================================================
  -- 5. Insert 4 Quarterfinal matches
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
      when gs <= 2 then '2026-07-03'::date
      else '2026-07-04'::date
    end,
    false
  from generate_series(1, 4) as gs;

  -- =========================================================
  -- 6. Insert 2 Semifinal matches
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
      when gs = 1 then '2026-07-07'::date
      else '2026-07-08'::date
    end,
    false
  from generate_series(1, 2) as gs;

  -- =========================================================
  -- 7. Insert Final match
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
-- 8. Confirm everything worked
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
  'matches_count' as item,
  count(*)::text as value
from public.matches
where tournament_id = (select id from wc)

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
  and round = 'final';