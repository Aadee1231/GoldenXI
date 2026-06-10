# Goalkeeper Reaction — Roadmap

A standalone reflex mini-game for GoldenXI, intentionally isolated from the
bracket / groups / leaderboard / auth systems.

## Phase 0 — Browser MVP (DONE)

Playable at `/goalie`. No backend required.

- 10-round penalty-save challenge with left / center / right reactions.
- Reaction-window scoring: faster correct dives score more, plus a streak bonus.
- Tracks round, saves, goals conceded, current streak, score, and best score.
- Best score persisted in `localStorage` only (no Supabase).
- Pure CSS/SVG goal frame, animated ball, and keeper — no official marks,
  logos, fonts, or federation/FIFA imagery.
- Keyboard support: `A` = left, `W` / `Space` = center, `D` = right.
- Mobile-friendly, responsive layout.
- Homepage "Goalkeeper Reaction" card links here.

Files:

- `app/goalie/page.tsx`
- `src/components/goalie/GoalieGame.tsx`
- `src/components/goalie/GoalieField.tsx`
- `src/components/goalie/ReactionControls.tsx`
- `src/components/goalie/GoalieScoreCard.tsx`
- `src/components/goalie/types.ts`

No paid dependencies and no API keys are required.

## Phase 1 — Webcam / body-pose reaction mode

Let players "dive" physically using their webcam instead of buttons.

- Detect lean / hand direction (left / center / right) from pose keypoints.
- Map detected pose to the existing reaction input so game logic is reused.
- Keep button/keyboard input as a fallback and for accessibility.
- Camera access must be opt-in; all inference runs client-side (no upload).

Candidate libraries (all free, client-side, no API keys):

- `@mediapipe/tasks-vision` (Pose Landmarker) or `@tensorflow-models/pose-detection`
  with the `MoveNet` model on the WebGL/WebGPU backend.

## Phase 2 — Supabase leaderboard

Persist scores to a dedicated, isolated table (do not reuse bracket tables).

- New table e.g. `goalie_scores` with its own RLS policies.
- Submit score on game over for authenticated users; anonymous play stays local.
- Display a goalie-specific leaderboard separate from the bracket leaderboard.
- Reuse existing Supabase client helpers without altering bracket/group queries.

## Phase 3 — Anti-cheat / replay validation

Make submitted scores trustworthy before they hit any shared leaderboard.

- Record a compact replay (per-round target, input, reaction timestamps).
- Server-side validation of reaction times against the round timeline
  (reject impossible/too-consistent reactions and out-of-range values).
- Rate-limit submissions and validate via a Supabase Edge Function / RPC.
- Optional integrity nonce issued at game start and verified at submit.

## Required APIs / libraries summary

| Phase | New dependencies | API keys | Cost |
| ----- | ---------------- | -------- | ---- |
| 0 (MVP) | none | none | free |
| 1 | MediaPipe Tasks Vision **or** TensorFlow.js pose-detection | none | free |
| 2 | existing `@supabase/*` packages | existing Supabase project | free tier |
| 3 | Supabase Edge Functions / RPC | existing Supabase project | free tier |
