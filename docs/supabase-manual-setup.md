# Manual Supabase / Vercel settings for the pre-beta cleanup

These are the **manual** steps needed to fully enable the fixes in this PR. None
of these are run automatically by the app or this PR.

## 1. Auth confirmation email (issue #1)
- Dashboard -> Authentication -> Emails -> **Confirm signup**.
- Subject: `Confirm your GoldenXI account`
- Body: paste `docs/supabase-confirmation-email.html`.

## 2. Auth redirect / callback (issue #2)
- Dashboard -> Authentication -> URL Configuration:
  - **Site URL**: `https://goldenxi.vercel.app`
  - **Redirect URLs**: add `https://goldenxi.vercel.app/auth/callback`
    (and your local dev URL, e.g. `http://localhost:3000/auth/callback`, if testing locally).
- Vercel -> Project -> Settings -> Environment Variables:
  - `NEXT_PUBLIC_SITE_URL=https://goldenxi.vercel.app`
  - Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
- The signup flow now sends `emailRedirectTo = {SITE_URL}/auth/callback`, and the
  new route handler exchanges the code and redirects to `/profile/setup`
  (incomplete profile) or `/bracket`.

## 3. Optional: full public bracket visualization (issue #9)
- The public page `/u/[username]/bracket` shows the full knockout diagram when an
  **optional, read-only** function is installed; otherwise it falls back to the
  summary view automatically.
- To enable the full diagram, run `supabase/step9-public-bracket-picks.sql` in the
  SQL editor. It is read-only (STABLE), changes no tables/RLS/schema, and only
  returns picks for users who have `public_bracket = true` (same security model as
  the existing `get_public_bracket`).
- This is optional and safe to skip for beta; the page still works without it.

## Not changed
- No RLS policies, table schemas, or existing functions were modified.
- No destructive SQL is included.
