-- ============================================================
-- Migration: upsert-goalie-scores-best-only
--
-- Changes:
--   1. Add a unique constraint on (user_id, mode) so each player
--      has exactly one leaderboard row per game mode.
--   2. Allow authenticated users to update their own row (needed
--      for upsert to work via the anon/authed client).
--
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- 1. Keep only the best row per (user_id, mode), delete the rest.
--    (Skip if the table is empty or already de-duplicated.)
delete from public.goalie_scores gs
where id not in (
  select distinct on (user_id, mode) id
  from   public.goalie_scores
  order  by user_id, mode, score desc, created_at asc
);

-- 2. Add the unique constraint so future upserts resolve cleanly.
alter table public.goalie_scores
  add constraint goalie_scores_user_mode_unique
  unique (user_id, mode);

-- 3. Allow authenticated users to update their own row.
--    The application-level upsert only writes when the new score
--    is strictly higher, but the DB policy must permit the UPDATE.
create policy "goalie_scores_update_own"
  on public.goalie_scores
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
