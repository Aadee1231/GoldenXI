-- =========================================================
-- Phase 4.5: Add flag_code column and update team data
-- =========================================================
-- This migration adds flag_code to teams table and updates
-- all 48 teams with proper ISO country codes for stable
-- flag rendering.
-- =========================================================

-- Add flag_code column if it doesn't exist
alter table public.teams
add column if not exists flag_code text;

-- Update all teams with proper flag codes
do $$
declare
  wc_id uuid;
begin
  -- Get the World Cup 2026 tournament ID
  select id into wc_id
  from public.tournaments
  where slug = 'world-cup-2026'
  limit 1;

  if wc_id is not null then
    -- Group A
    update public.teams set flag_code = 'MX' where tournament_id = wc_id and code = 'MEX';
    update public.teams set flag_code = 'ZA' where tournament_id = wc_id and code = 'RSA';
    update public.teams set flag_code = 'KR' where tournament_id = wc_id and code = 'KOR';
    update public.teams set flag_code = 'CZ' where tournament_id = wc_id and code = 'CZE';

    -- Group B
    update public.teams set flag_code = 'CA' where tournament_id = wc_id and code = 'CAN';
    update public.teams set flag_code = 'BA' where tournament_id = wc_id and code = 'BIH';
    update public.teams set flag_code = 'QA' where tournament_id = wc_id and code = 'QAT';
    update public.teams set flag_code = 'CH' where tournament_id = wc_id and code = 'SUI';

    -- Group C
    update public.teams set flag_code = 'BR' where tournament_id = wc_id and code = 'BRA';
    update public.teams set flag_code = 'MA' where tournament_id = wc_id and code = 'MAR';
    update public.teams set flag_code = 'HT' where tournament_id = wc_id and code = 'HAI';
    update public.teams set flag_code = 'GB-SCT' where tournament_id = wc_id and code = 'SCO';

    -- Group D
    update public.teams set flag_code = 'US' where tournament_id = wc_id and code = 'USA';
    update public.teams set flag_code = 'PY' where tournament_id = wc_id and code = 'PAR';
    update public.teams set flag_code = 'AU' where tournament_id = wc_id and code = 'AUS';
    update public.teams set flag_code = 'TR' where tournament_id = wc_id and code = 'TUR';

    -- Group E
    update public.teams set flag_code = 'DE' where tournament_id = wc_id and code = 'GER';
    update public.teams set flag_code = 'CW' where tournament_id = wc_id and code = 'CUW';
    update public.teams set flag_code = 'CI' where tournament_id = wc_id and code = 'CIV';
    update public.teams set flag_code = 'EC' where tournament_id = wc_id and code = 'ECU';

    -- Group F
    update public.teams set flag_code = 'NL' where tournament_id = wc_id and code = 'NED';
    update public.teams set flag_code = 'JP' where tournament_id = wc_id and code = 'JPN';
    update public.teams set flag_code = 'SE' where tournament_id = wc_id and code = 'SWE';
    update public.teams set flag_code = 'TN' where tournament_id = wc_id and code = 'TUN';

    -- Group G
    update public.teams set flag_code = 'BE' where tournament_id = wc_id and code = 'BEL';
    update public.teams set flag_code = 'EG' where tournament_id = wc_id and code = 'EGY';
    update public.teams set flag_code = 'IR' where tournament_id = wc_id and code = 'IRN';
    update public.teams set flag_code = 'NZ' where tournament_id = wc_id and code = 'NZL';

    -- Group H
    update public.teams set flag_code = 'ES' where tournament_id = wc_id and code = 'ESP';
    update public.teams set flag_code = 'CV' where tournament_id = wc_id and code = 'CPV';
    update public.teams set flag_code = 'SA' where tournament_id = wc_id and code = 'KSA';
    update public.teams set flag_code = 'UY' where tournament_id = wc_id and code = 'URU';

    -- Group I
    update public.teams set flag_code = 'FR' where tournament_id = wc_id and code = 'FRA';
    update public.teams set flag_code = 'SN' where tournament_id = wc_id and code = 'SEN';
    update public.teams set flag_code = 'IQ' where tournament_id = wc_id and code = 'IRQ';
    update public.teams set flag_code = 'NO' where tournament_id = wc_id and code = 'NOR';

    -- Group J
    update public.teams set flag_code = 'AR' where tournament_id = wc_id and code = 'ARG';
    update public.teams set flag_code = 'DZ' where tournament_id = wc_id and code = 'ALG';
    update public.teams set flag_code = 'AT' where tournament_id = wc_id and code = 'AUT';
    update public.teams set flag_code = 'JO' where tournament_id = wc_id and code = 'JOR';

    -- Group K
    update public.teams set flag_code = 'PT' where tournament_id = wc_id and code = 'POR';
    update public.teams set flag_code = 'CD' where tournament_id = wc_id and code = 'COD';
    update public.teams set flag_code = 'UZ' where tournament_id = wc_id and code = 'UZB';
    update public.teams set flag_code = 'CO' where tournament_id = wc_id and code = 'COL';

    -- Group L
    update public.teams set flag_code = 'GB-ENG' where tournament_id = wc_id and code = 'ENG';
    update public.teams set flag_code = 'HR' where tournament_id = wc_id and code = 'CRO';
    update public.teams set flag_code = 'GH' where tournament_id = wc_id and code = 'GHA';
    update public.teams set flag_code = 'PA' where tournament_id = wc_id and code = 'PAN';
  end if;
end $$;
