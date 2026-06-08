# Preflight Results & Analysis

**Date:** June 7, 2026  
**Status:** ✅ COMPLETE - Issues Identified

---

## Foreign Key Delete Rules (From Preflight Query)

Based on your Supabase preflight check results:

```
bracket_picks.bracket_id → brackets.id: CASCADE
bracket_picks.match_id → matches.id: CASCADE
bracket_picks.picked_team_id → teams.id: SET NULL
brackets.tournament_id → tournaments.id: CASCADE
matches.away_team_id → teams.id: SET NULL
matches.home_team_id → teams.id: SET NULL
matches.tournament_id → tournaments.id: CASCADE
matches.winner_team_id → teams.id: SET NULL
teams.tournament_id → tournaments.id: CASCADE
```

---

## Critical Analysis

### ⚠️ CRITICAL FK: `bracket_picks.match_id` → `matches.id` = **CASCADE**

**What this means:**
- When you delete matches, all `bracket_picks` for those matches are **automatically deleted**
- This is **DESTRUCTIVE** but the script will succeed

**Impact on seed file:**
```sql
DELETE FROM matches WHERE tournament_id = wc_id;
-- ✅ Succeeds
-- ❌ CASCADE deletes ALL bracket_picks for those matches
-- ❌ Old brackets become empty (all picks gone)
```

### ⚠️ CRITICAL FK: `bracket_picks.picked_team_id` → `teams.id` = **SET NULL**

**What this means:**
- When you delete teams, `bracket_picks.picked_team_id` is set to **NULL**
- This is **BROKEN** but not deleted

**Impact on seed file:**
```sql
DELETE FROM teams WHERE tournament_id = wc_id;
-- ✅ Succeeds
-- ⚠️ Sets bracket_picks.picked_team_id = NULL for all affected picks
-- ⚠️ Old brackets have NULL team references (broken)
```

### Combined Impact: **DESTRUCTIVE + BROKEN**

**When running seed file:**
1. `DELETE FROM matches` → **CASCADE deletes all bracket_picks** ❌
2. `DELETE FROM teams` → **Sets remaining picks to NULL** (but they're already deleted from step 1)

**Result:**
- ✅ Script will **SUCCEED**
- ❌ All old `bracket_picks` will be **DELETED** (due to CASCADE on match_id)
- ❌ Old brackets become **EMPTY** (all picks gone)
- ❌ Users lose all bracket data

---

## Issue Found: CHECK Constraint on `matches.round`

### Error Message:
```
ERROR: 23514: new row for relation "matches" violates check constraint "matches_round_check"
DETAIL: Failing row contains (..., r32, ...)
```

### Root Cause:
The `matches` table has a CHECK constraint that only allows:
```sql
CHECK (round IN ('group', 'r16', 'qf', 'sf', 'final'))
```

The seed file tries to insert `r32` which is **not allowed** by the constraint.

### Fix Required:
Update the CHECK constraint to include `r32`:
```sql
CHECK (round IN ('group', 'r32', 'r16', 'qf', 'sf', 'final'))
```

**Migration file created:** `supabase/migration-add-r32-round.sql`

---

## Summary: Is Seed Safe to Run?

### ❌ NOT Safe to Run Yet

**Blocking Issue:**
- CHECK constraint prevents `r32` values
- **Must run migration first** to add `r32` to allowed values

**After Migration:**

### Development Environment:
**Safe?** ⚠️ **YES, with data loss**

**What will happen:**
1. ✅ Script will succeed (after migration)
2. ❌ All old `bracket_picks` will be **DELETED** (CASCADE)
3. ❌ Old brackets become empty
4. ❌ Users lose all picks

**Acceptable?** ✅ YES for development (expected behavior)

### Production Environment:
**Safe?** ❌ **NO**

**Reasons:**
1. ❌ All user `bracket_picks` will be deleted
2. ❌ Users lose all their bracket data
3. ❌ No rollback possible

**Recommendation:** Create new tournament with different slug instead

---

## Should We Export Brackets First?

### ✅ YES - Highly Recommended

**Reason:** FK = CASCADE means all `bracket_picks` will be **permanently deleted**

**Export Before Running:**
1. Export `brackets` table to CSV
2. Export `bracket_picks` table to CSV
3. Save to safe location

**How to Export (Supabase Dashboard):**
1. Go to Table Editor
2. Select `brackets` table
3. Click "Export" → CSV
4. Repeat for `bracket_picks` table

---

## Action Plan

### Step 1: Run Migration (REQUIRED)
**File:** `supabase/migration-add-r32-round.sql`

```sql
-- Drop old constraint
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_round_check;

-- Add new constraint with r32
ALTER TABLE public.matches
ADD CONSTRAINT matches_round_check
CHECK (round IN ('group', 'r32', 'r16', 'qf', 'sf', 'final'));
```

**Run this in Supabase SQL Editor FIRST**

### Step 2: Export Old Brackets (RECOMMENDED)
- Export `brackets` table
- Export `bracket_picks` table
- Save CSV files

### Step 3: Run Seed File
**File:** `supabase/seed-wc2026-full-format.sql`

**What will happen:**
- ✅ Script succeeds
- ❌ All old `bracket_picks` deleted (CASCADE)
- ❌ Old brackets become empty

### Step 4: Verify Results
Expected counts:
```
teams_count: 48
matches_total: 79
group_placeholder_rows: 48
r32_matches: 16
r16_matches: 8
qf_matches: 4
sf_matches: 2
final_matches: 1
groups_count: 12
```

---

## Final Recommendations

### For Development:
1. ✅ Run migration to add `r32` to CHECK constraint
2. ✅ Export brackets (optional, for reference)
3. ✅ Run seed file
4. ✅ Accept that old brackets will be empty
5. ✅ Verify 48 teams, 79 matches created

### For Production:
1. ❌ **DO NOT run seed file**
2. ✅ Create new tournament with different slug
3. ✅ Keep old tournament and brackets intact
4. ✅ Mark old brackets as "legacy"
5. ✅ Users can view old brackets (read-only)

---

## Summary

**Foreign Key Behavior:**
- `bracket_picks.match_id` → CASCADE (DESTRUCTIVE)
- `bracket_picks.picked_team_id` → SET NULL (BROKEN)

**Blocking Issue:**
- CHECK constraint doesn't allow `r32`
- Must run migration first

**Seed File Will:**
1. ❌ FAIL (until migration run)
2. ✅ SUCCEED (after migration)
3. ❌ DELETE all old bracket_picks (CASCADE)
4. ❌ Empty all old brackets

**Safe for Development?** ⚠️ YES (after migration, with data loss)

**Safe for Production?** ❌ NO (users lose data)

**Export Brackets First?** ✅ YES (data will be deleted)

**Next Steps:**
1. Run `migration-add-r32-round.sql`
2. Export brackets (optional)
3. Run `seed-wc2026-full-format.sql`
4. Verify results

---

**Status:** ⏸️ Ready to proceed after running migration
