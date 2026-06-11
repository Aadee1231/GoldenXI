-- ============================================================
-- Migration: create public.goalie_scores
-- Run this in the Supabase SQL editor.
-- ============================================================

create table if not exists public.goalie_scores (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references auth.users(id) on delete cascade not null,
  display_name        text        not null,
  mode                text        not null check (mode in ('keyboard', 'camera')),
  score               integer     not null default 0,
  saves               integer     not null default 0,
  goals_allowed       integer     not null default 0,
  total_rounds        integer     not null default 10,
  avg_reaction_ms     integer,
  fastest_reaction_ms integer,
  best_streak         integer     not null default 0,
  accuracy            numeric(5, 2),   -- 0.00 – 100.00 (saves / total_rounds × 100)
  metadata            jsonb,
  created_at          timestamptz default now() not null
);

-- Index for the leaderboard query (score DESC per mode)
create index if not exists goalie_scores_mode_score_idx
  on public.goalie_scores (mode, score desc);

-- Index for user history lookups
create index if not exists goalie_scores_user_idx
  on public.goalie_scores (user_id, created_at desc);

-- ── Row-Level Security ─────────────────────────────────────
alter table public.goalie_scores enable row level security;

-- Anyone (including anon) can read leaderboard rows
create policy "goalie_scores_select_all"
  on public.goalie_scores
  for select
  using (true);

-- Authenticated users may only insert rows for themselves
create policy "goalie_scores_insert_own"
  on public.goalie_scores
  for insert
  with check (auth.uid() = user_id);

-- Users may not update or delete scores (immutable records)
-- (no UPDATE / DELETE policies → those operations are rejected)
