# Guest Bracket Mode — Implementation Plan (NOT yet implemented)

Goal: let visitors build a full bracket **without signing up**. Signup/login stays
required for anything that persists or is social: permanent save, locking,
sharing, creating/joining groups, and leaderboard entry.

This is a plan only. No guest code has been written. Below are the files/areas
that would change and the recommended approach.

## Recommended approach

Store an in-progress guest bracket in `localStorage` (client-only), then migrate
it into Supabase on first login/signup. This avoids any DB/RLS changes for the
guest experience itself.

1. **Local draft store (new)** — `src/lib/guest/guest-bracket.ts`
   - `getGuestBracket() / setGuestBracket() / clearGuestBracket()`
   - Shape mirrors `BracketState` (`groupRankings`, `thirdPlacePicks`, `knockoutPicks`, `currentStep`).
2. **Wizard data layer (edit)** — `src/components/bracket-v3/BracketWizard.tsx`,
   `GroupStageStep.tsx`, `ThirdPlaceStep.tsx`, `KnockoutBracketStep.tsx`
   - These currently call `supabase.auth.getUser()` and read/write picks by
     `bracket_id`. Introduce a small abstraction (`useBracketStore`) that writes
     to Supabase when authenticated, otherwise to the local guest store.
   - Replace direct `save*Picks` / `get*Picks` calls with the abstraction.
3. **Gating UI (edit)** — `src/components/bracket/BracketShareCard.tsx`,
   lock button, groups pages, leaderboard
   - When guest: show "Sign up to save / lock / share / join groups / enter leaderboard"
     CTAs instead of the actions.
4. **Auth entry points (edit)** — `app/auth/actions.ts`, `app/auth/page.tsx`
   - Preserve `?next=` so a guest returns to `/bracket` after auth.
5. **Migration on login (new)** — `src/lib/guest/migrate-guest-bracket.ts`
   - After first successful auth, if a local guest bracket exists: create a
     bracket row, persist group/third-place/knockout picks, then `clearGuestBracket()`.
   - Call this from `/auth/callback` (server) or a client effect on `/bracket`.
6. **Entry routing (edit)** — `app/page.tsx` / nav "Build bracket"
   - Allow `/bracket` (or a `/bracket-v3` guest variant) to render the wizard
     without forcing auth; only gate the persistence actions.

## Notes / risks
- No schema or RLS changes are required for the guest flow itself.
- The migration step is the main correctness risk (duplicate brackets if a user
  already has one). Guard with "only migrate if the user has no existing bracket,
  else prompt to overwrite/merge."
- Keep the existing authenticated flow untouched as the default path.
