# World Cup 2026 Format Upgrade Plan

**Date:** June 7, 2026  
**Status:** Planning Phase  
**Goal:** Upgrade GoldenXI from 16-team knockout bracket to full 48-team World Cup 2026 format with group stage predictions

---

## Executive Summary

This document outlines the plan to upgrade GoldenXI from a simple 16-team knockout bracket (R16 → QF → SF → Final) to the full 2026 World Cup format featuring:
- **48 teams** in 12 groups of 4
- **Group stage predictions** (all 48 group matches)
- **Best third-place team selection** (pick 8 of 24 third-place teams)
- **Round of 32** knockout bracket
- **104 total matches** to predict

---

## Current Architecture Summary

### Tech Stack
- **Frontend:** Next.js 16.2.7 App Router, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** lucide-react ^1.17.0
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deployment:** Vercel

### Current Routes & Pages
- `/` - Landing page (homepage stats: 32 Teams, 64 Matches)
- `/auth` - Authentication page
- `/bracket` - Main bracket builder (BracketPageV2)
- `/groups` - Private groups listing
- `/groups/[id]` - Group detail with leaderboard
- `/leaderboard` - Global leaderboard
- `/u/[username]` - Public bracket sharing
- `/profile/setup` - Profile setup flow

### Current Components
**Bracket:**
- `BracketPageV2.tsx` - Main bracket UI (742 lines)
- `BracketRound.tsx` - Renders a single round
- `BracketMatch.tsx` - Renders a single match
- `TeamSlot.tsx` - Team selection UI
- `BracketShareSection.tsx` - Public sharing controls
- `BracketShareCard.tsx` - Share card preview

**Groups:**
- `CreateGroupForm.tsx` - Create new group
- `JoinGroupForm.tsx` - Join with code
- `GroupLeaderboard.tsx` - Group-specific leaderboard
- `GroupMemberList.tsx` - Member list
- `GroupSettingsForm.tsx` - Group admin settings
- `GroupActions.tsx` - Leave/delete actions

**Leaderboard:**
- `LeaderboardRow.tsx` - Single leaderboard entry
- `LeaderboardEmpty.tsx` - Empty state

---

## Current Data Model Summary

### Database Tables (Supabase)

**tournaments**
- `id` (uuid, PK)
- `name` (text) - "World Cup 2026"
- `season` (text) - "2026"
- `slug` (text) - "world-cup-2026"
- `is_active` (boolean)
- `start_date`, `end_date` (date)
- `starts_at`, `ends_at` (timestamptz)
- `status` (text) - "active"

**teams**
- `id` (uuid, PK)
- `tournament_id` (uuid, FK)
- `name` (text) - "Brazil"
- `code` (text) - "BRA"
- `flag_emoji` (text) - "🇧🇷"
- `group_label` (text) - "A", "B", etc. (currently unused in bracket logic)

**matches**
- `id` (uuid, PK)
- `tournament_id` (uuid, FK)
- `home_team_id`, `away_team_id` (uuid, FK to teams, nullable)
- `round` (text) - **"group" | "r16" | "qf" | "sf" | "final"**
- `home_score`, `away_score` (integer, nullable)
- `winner_id` (uuid, FK to teams, nullable)
- `match_date` (date)
- `match_number` (integer)
- `completed` (boolean)

**brackets**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `tournament_id` (uuid, FK)
- `name` (text) - "My Bracket"
- `points_earned` (integer) - default 0
- `is_locked` (boolean)
- `status` (text) - **"draft" | "submitted" | "scored"**
- `submitted_at`, `locked_at`, `updated_at` (timestamptz)

**bracket_picks**
- `id` (uuid, PK)
- `bracket_id` (uuid, FK)
- `match_id` (uuid, FK)
- `picked_team_id` (uuid, FK to teams, nullable)
- `is_correct` (boolean, nullable)
- `points_awarded` (integer, nullable)

**groups**
- `id` (uuid, PK)
- `name` (text)
- `join_code` (text, unique, 6 chars)
- `created_by` (uuid, FK to auth.users)
- `tournament_id` (uuid, FK)
- `invite_policy` (text) - "admin_only" | "members"
- `leaderboard_visibility` (text) - "always" | "after_lock" | "after_first_result"
- `bracket_visibility` (text) - "status_only" | "after_lock" | "always"
- `lock_at` (timestamptz, nullable)
- `allow_late_join` (boolean)
- `description` (text, nullable)

**group_members**
- `id` (uuid, PK)
- `group_id` (uuid, FK)
- `user_id` (uuid, FK to auth.users)
- `bracket_id` (uuid, FK, nullable)
- `joined_at` (timestamptz)

**profiles**
- `id` (uuid, PK, FK to auth.users)
- `username` (text, unique)
- `display_name` (text, nullable)
- `avatar_url` (text, nullable)
- `points` (integer)
- `public_bracket` (boolean) - enables /u/[username] sharing

### TypeScript Types (`src/types/index.ts`)

```typescript
type MatchRound = "group" | "r16" | "qf" | "sf" | "final";
type BracketStatus = "draft" | "submitted" | "scored";
```

---

## Current Bracket Flow Summary

### User Journey (Current)
1. **User logs in** → redirected to `/bracket`
2. **Bracket loads** → fetches 15 matches (8 R16 + 4 QF + 2 SF + 1 Final)
3. **User picks winners** → clicks teams to advance them round-by-round
4. **Downstream propagation** → winner auto-advances to next round
5. **Save draft** → stores 15 picks in `bracket_picks`
6. **Lock bracket** → sets `locked_at`, `is_locked = true`, `status = "submitted"`
7. **Share publicly** → enables `/u/[username]` if `public_bracket = true`
8. **Join groups** → bracket auto-linked to group via `group_members.bracket_id`

### Current Pick Count
- **R16:** 8 matches → 8 picks
- **QF:** 4 matches → 4 picks
- **SF:** 2 matches → 2 picks
- **Final:** 1 match → 1 pick
- **Total:** **15 picks** (hardcoded in `BracketPageV2.tsx:441`, `brackets-client.ts:357`)

### Current Scoring Logic (`src/lib/bracket/scoring.ts`)
```typescript
const ROUND_POINTS: Record<MatchRound, number> = {
  group: 0,   // No points (not used in current UI)
  r16: 1,     // 1 point per correct pick
  qf: 2,      // 2 points per correct pick
  sf: 4,      // 4 points per correct pick
  final: 8,   // 8 points for champion
};
// Max score: 8*1 + 4*2 + 2*4 + 1*8 = 32 points
```

### Current Data Flow
1. **Load matches:** `getBracketMatches()` fetches matches with `round IN ('r16', 'qf', 'sf', 'final')`
2. **Load existing picks:** `getUserBracket()` fetches `bracket_picks` for current user
3. **UI state:** `BracketPageV2` maintains local `BracketState` with 4 round arrays + champion
4. **Save:** `saveBracket(picks)` deletes old picks, inserts new ones
5. **Lock:** `lockBracket(bracketId)` validates 15 picks, sets `locked_at`
6. **Score:** `scoreBracket(bracketId)` calculates points when matches complete

---

## Required New Bracket Flow

### New User Journey (2026 Format)
1. **User logs in** → redirected to `/bracket`
2. **Step 1: Group Stage Predictions**
   - Show all 12 groups (A-L), 4 teams each
   - User predicts winner and runner-up for each group (24 picks)
   - User predicts match results for all 48 group matches (optional: for tiebreakers)
3. **Step 2: Best Third-Place Teams**
   - Show all 12 third-place teams
   - User selects 8 teams to advance (8 picks)
4. **Step 3: Knockout Bracket**
   - Auto-populate Round of 32 based on group winners, runners-up, and best third-place teams
   - User picks winners for R32 → R16 → QF → SF → Final
   - R32: 16 matches → 16 picks
   - R16: 8 matches → 8 picks
   - QF: 4 matches → 4 picks
   - SF: 2 matches → 2 picks
   - Final: 1 match → 1 pick
5. **Step 4: Champion & Save**
   - Display champion
   - Save/Lock/Share bracket

### New Pick Count
- **Group stage:** 24 picks (winner + runner-up per group) OR 48 picks (all group matches)
- **Best third-place:** 8 picks
- **R32:** 16 picks
- **R16:** 8 picks
- **QF:** 4 picks
- **SF:** 2 picks
- **Final:** 1 pick
- **Total:** **63 picks** (if group stage = 24) or **87 picks** (if group stage = 48)

### New Scoring Logic (Proposed)
```typescript
const ROUND_POINTS: Record<MatchRound, number> = {
  group: 1,        // 1 point per correct group match result
  third_place: 2,  // 2 points per correct third-place team selected
  r32: 1,          // 1 point per correct R32 pick
  r16: 2,          // 2 points per correct R16 pick
  qf: 4,           // 4 points per correct QF pick
  sf: 8,           // 8 points per correct SF pick
  final: 16,       // 16 points for champion
};
// Max score: TBD (depends on group stage scoring)
```

---

## Files That Need Changes

### Frontend Components (High Priority)

#### **1. `src/components/bracket/BracketPageV2.tsx`** ⚠️ MAJOR REWRITE
- **Current:** Single-page knockout bracket (R16 → Final)
- **New:** Multi-step wizard (Group Stage → Third Place → Knockout → Champion)
- **Changes:**
  - Add step navigation (tabs or stepper UI)
  - Create `GroupStageStep` component (12 groups, 48 teams)
  - Create `ThirdPlaceStep` component (select 8 of 12 third-place teams)
  - Refactor knockout bracket to start at R32 (not R16)
  - Update pick count validation (15 → 63 or 87)
  - Update `BracketState` type to include group stage + third-place picks

#### **2. `src/types/index.ts`** ⚠️ TYPE CHANGES
- **Current:** `MatchRound = "group" | "r16" | "qf" | "sf" | "final"`
- **New:** Add `"r32"` and potentially `"third_place"` rounds
- **Changes:**
  - Update `MatchRound` type
  - Add `GroupPick` type (group_id, first_place_team_id, second_place_team_id)
  - Add `ThirdPlacePick` type (team_id[])
  - Update `BracketPick` to support group stage picks

#### **3. `src/lib/supabase/queries/brackets-client.ts`** ⚠️ PICK LOGIC
- **Current:** Expects 15 picks (R16 → Final)
- **New:** Expects 63-87 picks (Group → R32 → Final)
- **Changes:**
  - Update `BracketPickInput` type to support group stage picks
  - Update `saveBracket()` validation (line 441: `picks.length < 15`)
  - Update `lockBracket()` validation (line 357: `pickCount < 15`)
  - Add logic to handle group stage picks separately from knockout picks

#### **4. `src/lib/supabase/queries/matches-client.ts`** ⚠️ MATCH LOADING
- **Current:** Fetches `round IN ('r16', 'qf', 'sf', 'final')`
- **New:** Fetch `round IN ('group', 'r32', 'r16', 'qf', 'sf', 'final')`
- **Changes:**
  - Add `getBracketMatches()` to return group stage matches
  - Add `getGroupStageMatches()` helper
  - Add `getKnockoutMatches()` helper

#### **5. `src/lib/bracket/scoring.ts`** ⚠️ SCORING LOGIC
- **Current:** `ROUND_POINTS = { group: 0, r16: 1, qf: 2, sf: 4, final: 8 }`
- **New:** Update points for group stage, third-place, R32
- **Changes:**
  - Update `ROUND_POINTS` object
  - Update `calculateBracketScore()` to handle group picks
  - Update max score calculation (line 219: `maxScore = 32`)

#### **6. `app/page.tsx`** ⚠️ HOMEPAGE STATS
- **Current:** Stats show "32 Teams / 64 Matches"
- **New:** Stats show "48 Teams / 104 Matches / 1 Champion"
- **Changes:**
  - Update `stats` array (line 41-45)

### Frontend Components (Medium Priority)

#### **7. `src/components/bracket/BracketRound.tsx`**
- May need updates to support R32 round

#### **8. `src/components/bracket/BracketMatch.tsx`**
- May need updates for group stage match display

#### **9. `src/components/bracket/TeamSlot.tsx`**
- May need updates for group stage team selection

#### **10. `src/components/leaderboard/LeaderboardRow.tsx`**
- Update to show new max score (not 32)

### Backend Queries (High Priority)

#### **11. `src/lib/supabase/queries/leaderboard.ts`** ⚠️ SCORING
- **Current:** Uses `calculateBracketScore()` with 15 picks
- **New:** Update to handle 63-87 picks
- **Changes:**
  - Update `fetchLeaderboard()` to calculate new max score
  - Update `fetchGroupLeaderboard()` to calculate new max score

#### **12. `src/lib/supabase/queries/groups.ts`**
- Likely no changes needed (groups are tournament-agnostic)

#### **13. `src/lib/supabase/queries/public-bracket.ts`**
- Likely no changes needed (just fetches bracket data)

### Database Changes (Critical)

#### **14. `supabase/seed-bracket-data.sql`** ⚠️ MAJOR REWRITE
- **Current:** Seeds 16 teams, 15 matches (R16 → Final)
- **New:** Seed 48 teams, 104 matches (Group → Final)
- **Changes:**
  - Insert 48 teams with `group_label` (A-L)
  - Insert 48 group stage matches (`round = 'group'`)
  - Insert 16 R32 matches (`round = 'r32'`)
  - Insert 8 R16 matches
  - Insert 4 QF matches
  - Insert 2 SF matches
  - Insert 1 Final match
  - Update tournament dates to match real 2026 schedule

---

## Database Changes Needed

### Schema Changes (Minimal)

**Good News:** The existing schema is mostly compatible! 

✅ **No changes needed:**
- `matches.round` already supports `"group"` (defined in type)
- `teams.group_label` already exists (A-L)
- `bracket_picks` can store any match pick (no schema change)

⚠️ **Potential additions:**
1. **Add `r32` to `MatchRound` enum** (if using database enum)
   - Current: `"group" | "r16" | "qf" | "sf" | "final"`
   - New: `"group" | "r32" | "r16" | "qf" | "sf" | "final"`

2. **Add `third_place_picks` table** (optional, if storing separately)
   ```sql
   CREATE TABLE public.third_place_picks (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     bracket_id uuid REFERENCES public.brackets(id) ON DELETE CASCADE,
     team_id uuid REFERENCES public.teams(id),
     created_at timestamptz DEFAULT now()
   );
   ```
   - **Alternative:** Store in `bracket_picks` with `match_id = NULL` and special flag

3. **Add `group_picks` table** (optional, if storing group winners separately)
   ```sql
   CREATE TABLE public.group_picks (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     bracket_id uuid REFERENCES public.brackets(id) ON DELETE CASCADE,
     group_label text NOT NULL, -- 'A', 'B', etc.
     first_place_team_id uuid REFERENCES public.teams(id),
     second_place_team_id uuid REFERENCES public.teams(id),
     created_at timestamptz DEFAULT now()
   );
   ```
   - **Alternative:** Use `bracket_picks` with special match IDs for group winners

### Data Migration

**Approach 1: Clean Slate (Recommended for Development)**
- Run new seed script to replace all teams/matches
- Existing brackets become invalid (acceptable pre-tournament)
- Users re-create brackets with new format

**Approach 2: Preserve Existing Brackets**
- Keep old 16-team data
- Add new 48-team data with different `tournament_id`
- Create "World Cup 2026 (Full Format)" as new tournament
- Migrate users to new tournament

**Recommendation:** Use Approach 1 since tournament hasn't started yet.

---

## Safe Phased Implementation Plan

### Phase 1: Database & Seed Data (No User Impact)
**Goal:** Prepare database with 48 teams and 104 matches

**Tasks:**
1. ✅ Review existing schema (already done)
2. 🔨 Create new seed script: `supabase/seed-wc2026-full-format.sql`
   - 48 teams (12 groups × 4 teams)
   - 48 group stage matches
   - 16 R32 matches (TBD teams)
   - 8 R16 matches (TBD teams)
   - 4 QF matches (TBD teams)
   - 2 SF matches (TBD teams)
   - 1 Final match (TBD teams)
3. 🔨 Add `r32` to `MatchRound` type in `src/types/index.ts`
4. 🔨 Update `ROUND_POINTS` in `src/lib/bracket/scoring.ts` (add `r32: 1`)
5. ✅ Test seed script in development Supabase instance
6. ⏸️ **STOP** - Do not deploy to production yet

**Validation:**
- [ ] 48 teams exist with correct group labels (A-L)
- [ ] 104 matches exist with correct rounds
- [ ] Existing brackets still load (even if invalid)

---

### Phase 2: Backend API Updates (No UI Changes)
**Goal:** Update queries to support new format without breaking existing UI

**Tasks:**
1. 🔨 Update `src/lib/supabase/queries/matches-client.ts`
   - Add `getGroupStageMatches()` function
   - Update `getBracketMatches()` to include `r32` round
2. 🔨 Update `src/lib/supabase/queries/brackets-client.ts`
   - Add `GroupPickInput` type
   - Add `ThirdPlacePickInput` type
   - Keep `saveBracket()` backward compatible (accept 15 or 63+ picks)
3. 🔨 Update `src/lib/bracket/scoring.ts`
   - Update `calculateBracketScore()` to handle group picks
   - Update max score calculation
4. ✅ Test API functions in isolation (unit tests or manual testing)
5. ⏸️ **STOP** - Do not update UI yet

**Validation:**
- [ ] `getBracketMatches()` returns 104 matches
- [ ] `saveBracket()` accepts both old (15) and new (63+) pick formats
- [ ] Scoring logic handles group stage picks

---

### Phase 3: New Bracket UI Components (Isolated)
**Goal:** Build new bracket UI without replacing existing page

**Tasks:**
1. 🔨 Create `src/components/bracket/GroupStageStep.tsx`
   - Display 12 groups with 4 teams each
   - Allow user to pick 1st and 2nd place per group
   - OR allow user to predict all 48 group matches
2. 🔨 Create `src/components/bracket/ThirdPlaceStep.tsx`
   - Display 12 third-place teams
   - Allow user to select 8 teams
3. 🔨 Create `src/components/bracket/KnockoutBracketStep.tsx`
   - Refactor existing knockout bracket to start at R32
   - Auto-populate R32 based on group stage picks
4. 🔨 Create `src/components/bracket/BracketWizard.tsx`
   - Step navigation (Group → Third Place → Knockout → Champion)
   - Progress indicator
   - Save draft at each step
5. 🔨 Create new route: `/bracket-v3` (temporary testing route)
6. ✅ Test new UI in isolation
7. ⏸️ **STOP** - Do not replace main `/bracket` route yet

**Validation:**
- [ ] Group stage step allows picking 24 teams (or 48 matches)
- [ ] Third-place step allows selecting 8 teams
- [ ] Knockout bracket auto-populates from group picks
- [ ] Can save draft and reload picks
- [ ] Can lock bracket with all 63+ picks

---

### Phase 4: Replace Main Bracket Page
**Goal:** Swap old bracket UI with new wizard

**Tasks:**
1. 🔨 Update `/app/bracket/page.tsx` to use `BracketWizard`
2. 🔨 Archive old `BracketPageV2.tsx` as `BracketPageV2-legacy.tsx`
3. 🔨 Update homepage stats (32 → 48 teams, 64 → 104 matches)
4. 🔨 Update validation in `brackets-client.ts` (15 → 63 picks)
5. ✅ Test full user flow (create → save → lock → share)
6. ✅ Test group leaderboard with new scoring
7. ✅ Test public bracket sharing
8. 🚀 Deploy to production

**Validation:**
- [ ] Users can create new brackets with group stage
- [ ] Existing locked brackets still display (read-only)
- [ ] Leaderboard calculates scores correctly
- [ ] Public sharing works
- [ ] Groups work with new format

---

### Phase 5: Polish & Optimization
**Goal:** Improve UX and performance

**Tasks:**
1. 🔨 Add group stage match predictions (optional feature)
2. 🔨 Add tiebreaker logic (goals scored, etc.)
3. 🔨 Add bracket comparison view (compare 2 brackets side-by-side)
4. 🔨 Add bracket analytics (most popular picks, upset alerts)
5. 🔨 Optimize database queries (add indexes if needed)
6. 🔨 Add loading states and error handling
7. 🔨 Add mobile-responsive design for group stage
8. 🔨 Add disclaimer footer (FIFA non-affiliation)

---

## Risk Checklist

### High Risk (Could Break Existing Functionality)

- ⚠️ **Changing pick count validation** (15 → 63)
  - **Risk:** Existing locked brackets may fail validation
  - **Mitigation:** Add backward compatibility check (if `bracket.locked_at < migration_date`, allow 15 picks)

- ⚠️ **Updating `MatchRound` type**
  - **Risk:** TypeScript errors across codebase
  - **Mitigation:** Use union type, add `r32` gradually

- ⚠️ **Replacing seed data**
  - **Risk:** Existing brackets reference old team/match IDs
  - **Mitigation:** Run seed script BEFORE users create brackets, or create new tournament

- ⚠️ **Changing scoring logic**
  - **Risk:** Leaderboard scores become incorrect
  - **Mitigation:** Recalculate all scores after migration, add version flag to brackets

### Medium Risk (May Cause UX Issues)

- ⚠️ **Multi-step wizard complexity**
  - **Risk:** Users abandon bracket creation mid-flow
  - **Mitigation:** Auto-save draft at each step, add progress indicator

- ⚠️ **Group stage UI on mobile**
  - **Risk:** 12 groups × 4 teams = too much scrolling
  - **Mitigation:** Use tabs or accordion, optimize for mobile-first

- ⚠️ **Third-place team selection**
  - **Risk:** Users confused about which 8 teams advance
  - **Mitigation:** Add clear instructions, show real 2026 rules

### Low Risk (Minor Issues)

- ⚠️ **Homepage stats update**
  - **Risk:** Cached stats show old values
  - **Mitigation:** Clear CDN cache after deploy

- ⚠️ **Leaderboard max score display**
  - **Risk:** Shows old max score (32)
  - **Mitigation:** Update hardcoded values in UI

---

## Things NOT to Touch Yet

### ✅ Keep As-Is (No Changes Needed)

1. **Authentication system** (`app/auth`, `src/lib/supabase/server.ts`)
   - Auth flow works perfectly, don't touch it

2. **Profile system** (`app/profile`, `src/lib/supabase/queries/profiles.ts`)
   - Profiles are tournament-agnostic

3. **Group creation/joining** (`src/components/groups/CreateGroupForm.tsx`, `JoinGroupForm.tsx`)
   - Group logic is independent of bracket format

4. **RLS policies** (`supabase/step4-rls-policies.sql`)
   - Security policies don't depend on bracket structure

5. **Public bracket sharing** (`app/u/[username]`, `src/lib/supabase/queries/public-bracket.ts`)
   - Sharing logic is format-agnostic (just displays picks)

6. **Group settings** (`src/components/groups/GroupSettingsForm.tsx`)
   - Lock times, visibility settings are independent

7. **Navbar/Footer** (`src/components/layout/`)
   - Navigation doesn't change

8. **Tailwind config, globals.css**
   - Styling system is fine

### ⏸️ Defer to Later Phases

1. **AI features** (Juggle Counter, Goalkeeper Reaction)
   - Not implemented yet, defer until after bracket upgrade

2. **Admin panel** (`app/admin`)
   - Match result entry can be updated later

3. **Bracket comparison view**
   - Nice-to-have feature, defer to Phase 5

4. **Advanced analytics**
   - Defer to Phase 5

---

## Product Decisions (FINALIZED)

### 1. Branding & Design
- ✅ **Brand name:** GoldenXI (no change)
- ✅ **Color scheme:** Black/gold primary, red/green/blue accents
- ✅ **Assets:** Country names and flag emojis ONLY
- ❌ **Prohibited:** FIFA logos, official trophy imagery, official fonts, federation crests, official marks
- ✅ **Disclaimer:** "GoldenXI is an independent fan-made game. It is not affiliated with, endorsed by, sponsored by, or officially connected to FIFA, the FIFA World Cup, or any tournament organizer." (add to footer later)

### 2. Group Stage Prediction Format
**DECISION:** Users rank all 4 teams in each group from 1st to 4th
- 12 groups × 4 positions = 48 team placements
- Do NOT predict individual match scores (defer to later phase)
- Simpler UI, faster completion
- Clear ranking system (1st, 2nd, 3rd, 4th)

### 3. Third-Place Team Selection
**DECISION:** Manual selection by user
- After group rankings, show the 12 teams user placed 3rd
- User manually selects exactly 8 of those 12 to advance to R32
- Simple, intuitive UI
- User controls their bracket destiny

### 4. Backward Compatibility
**DECISION:** Legacy read-only approach
- Existing 16-team brackets remain viewable
- Mark as "Legacy Format" if needed
- Do NOT delete or break existing brackets
- Do NOT force re-creation

### 5. Scoring Weights (V1)
**DECISION:** Finalized point values
- Correct group winner (1st place): **2 points**
- Correct group runner-up (2nd place): **1 point**
- Correct third-place advancer: **1 point**
- R32: **1 point**
- R16: **2 points**
- QF: **4 points**
- SF: **8 points**
- Final/Champion: **16 points**

**Max Score Calculation:**
- Group winners: 12 × 2 = 24 points
- Group runners-up: 12 × 1 = 12 points
- Third-place advancers: 8 × 1 = 8 points
- R32: 16 × 1 = 16 points
- R16: 8 × 2 = 16 points
- QF: 4 × 4 = 16 points
- SF: 2 × 8 = 16 points
- Final: 1 × 16 = 16 points
- **Total Max: 124 points**

**Note:** Scoring implementation deferred to Phase 2. Phase 1 focuses on data structure only.

---

## Summary & Next Steps

### Current State
✅ **Working production app** with:
- 16-team knockout bracket (R16 → Final)
- 15 picks per bracket
- Auth, groups, leaderboard, public sharing
- RLS policies, bracket locking

### Target State
🎯 **Full 2026 World Cup format** with:
- 48 teams, 12 groups
- Group stage predictions (24-48 picks)
- Best third-place team selection (8 picks)
- Round of 32 knockout bracket (31 picks)
- 63-87 total picks per bracket
- Updated scoring (max ~144 points)

### Implementation Phases
1. ✅ **Phase 1:** Database & seed data (1-2 days)
2. ✅ **Phase 2:** Backend API updates (2-3 days)
3. ✅ **Phase 3:** New UI components (5-7 days)
4. ✅ **Phase 4:** Replace main bracket page (2-3 days)
5. ✅ **Phase 5:** Polish & optimization (ongoing)

**Total Estimated Time:** 10-15 days of focused development

### Critical Path
1. Finalize group stage prediction format (Option A vs B)
2. Finalize scoring weights
3. Create new seed script with 48 teams
4. Build group stage UI component
5. Build third-place selection UI
6. Refactor knockout bracket to start at R32
7. Test full flow end-to-end
8. Deploy to production

---

## Appendix: File Change Summary

### Must Change (High Priority)
- `src/types/index.ts` - Add `r32` to `MatchRound`
- `src/lib/bracket/scoring.ts` - Update `ROUND_POINTS`, max score
- `src/lib/supabase/queries/brackets-client.ts` - Update pick validation (15 → 63)
- `src/lib/supabase/queries/matches-client.ts` - Fetch group + r32 matches
- `src/components/bracket/BracketPageV2.tsx` - Replace with wizard
- `app/page.tsx` - Update homepage stats (32 → 48, 64 → 104)
- `supabase/seed-bracket-data.sql` - Replace with 48-team seed

### Should Change (Medium Priority)
- `src/lib/supabase/queries/leaderboard.ts` - Update max score calculation
- `src/components/leaderboard/LeaderboardRow.tsx` - Update max score display
- `src/components/bracket/BracketRound.tsx` - Support R32 round
- `src/components/bracket/BracketMatch.tsx` - Support group matches

### May Change (Low Priority)
- `src/components/bracket/TeamSlot.tsx` - Group stage team selection
- `src/components/bracket/BracketShareCard.tsx` - Display group picks
- `app/layout.tsx` - Add disclaimer footer

### No Changes Needed
- All auth files
- All profile files
- All group files (except leaderboard scoring)
- All RLS policy files
- Navbar, Footer, globals.css

---

**End of Plan**

**Next Action:** Review this plan, make decisions on open questions, then proceed to Phase 1.
