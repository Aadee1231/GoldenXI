-- ============================================================
-- Migration: goalie_camera_global_leaderboard +
--            goalie_camera_group_leaderboard views
--
-- Run once in the Supabase SQL editor.
-- Safe to re-run (uses CREATE OR REPLACE).
-- ============================================================

-- ── 1. Global camera leaderboard ──────────────────────────
-- One row per user (enforced by the unique constraint on
-- goalie_scores(user_id, mode)), camera mode only, ranked.
CREATE OR REPLACE VIEW public.goalie_camera_global_leaderboard AS
SELECT
  gs.id,
  gs.user_id,
  gs.display_name,
  gs.score,
  gs.saves,
  gs.goals_allowed,
  gs.total_rounds          AS shots_faced,
  gs.best_streak,
  gs.avg_reaction_ms,
  gs.fastest_reaction_ms,
  gs.accuracy,
  gs.created_at,
  ROW_NUMBER() OVER (
    ORDER BY
      gs.score           DESC,
      gs.saves           DESC,
      gs.best_streak     DESC,
      gs.avg_reaction_ms ASC NULLS LAST,
      gs.created_at      ASC
  ) AS rank
FROM public.goalie_scores gs
WHERE gs.mode = 'camera';

GRANT SELECT ON public.goalie_camera_global_leaderboard TO anon, authenticated;

-- ── 2. Per-group camera leaderboard ───────────────────────
-- Camera mode scores joined with group membership so the
-- application can filter by group_id.
CREATE OR REPLACE VIEW public.goalie_camera_group_leaderboard AS
SELECT
  gs.id,
  gs.user_id,
  gs.display_name,
  gs.score,
  gs.saves,
  gs.goals_allowed,
  gs.total_rounds          AS shots_faced,
  gs.best_streak,
  gs.avg_reaction_ms,
  gs.fastest_reaction_ms,
  gs.accuracy,
  gs.created_at,
  gm.group_id
FROM public.goalie_scores gs
JOIN public.group_members gm ON gs.user_id = gm.user_id
WHERE gs.mode = 'camera';

GRANT SELECT ON public.goalie_camera_group_leaderboard TO anon, authenticated;
