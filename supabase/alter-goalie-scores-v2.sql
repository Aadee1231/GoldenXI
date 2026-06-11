-- ============================================================
-- Migration: goalie_scores → v2 (endless 3-lives mode)
-- Run this in the Supabase SQL editor (safe to run multiple times).
-- ============================================================

-- ── New columns ────────────────────────────────────────────
alter table public.goalie_scores
  add column if not exists lives_used    integer not null default 3,
  add column if not exists game_version  text    not null default 'goalie_reaction_v1',
  add column if not exists ended_reason  text    not null default 'lives_lost';

-- Back-fill old rows so the data is consistent.
-- Old rows had fixed 10 rounds with 3 lives system not yet in place.
-- We mark them as the legacy version so queries can distinguish them.
update public.goalie_scores
set
  game_version = 'goalie_reaction_v1',
  ended_reason = 'lives_lost'
where game_version = 'goalie_reaction_v1'; -- no-op if already set; avoids touching new rows

-- ── Leaderboard index (new ranking: score ↓, saves ↓, avg_reaction_ms ↑) ──
-- Drop the old mode-only index and replace with the multi-column ranking index.
drop index if exists goalie_scores_mode_score_idx;

create index if not exists goalie_scores_leaderboard_idx
  on public.goalie_scores (score desc, saves desc, avg_reaction_ms asc nulls last);

-- Per-mode index for filtered leaderboard queries
create index if not exists goalie_scores_mode_leaderboard_idx
  on public.goalie_scores (mode, score desc, saves desc);

-- Per-user index for "my best score" queries
create index if not exists goalie_scores_user_best_idx
  on public.goalie_scores (user_id, score desc);
