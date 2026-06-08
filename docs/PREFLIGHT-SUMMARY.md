# Database Safety Preflight Check

**Date:** June 7, 2026  
**Purpose:** Verify foreign key constraints before running seed file  
**Status:** ⏸️ AWAITING RESULTS

---

## How to Run Preflight Check

### Step 1: Run FK Constraint Query

**File:** `supabase/PREFLIGHT-CHECK-fk-constraints.sql`

**Instructions:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste contents of `PREFLIGHT-CHECK-fk-constraints.sql`
4. Click "Run"
5. Review results below

### Step 2: Interpret Results

The query will return a table showing:
- **Table:** Which table has the FK
- **Column:** Which column is the FK
- **References Table:** Which table it points to
- **References Column:** Which column it points to
- **ON DELETE Behavior:** CASCADE, SET NULL, RESTRICT, or NO ACTION

---

## Critical Foreign Keys to Check

### 1. `bracket_picks.match_id` → `matches.id`

**Why Critical:** Seed file deletes old matches

| ON DELETE Behavior | What Happens | Impact |
|-------------------|--------------|--------|
| **CASCADE** | Deleting matches deletes all `bracket_picks` | ❌ DESTRUCTIVE - All picks deleted |
| **SET NULL** | Deleting matches sets `match_id = NULL` | ⚠️ BROKEN - Picks have NULL refs |
| **RESTRICT/NO ACTION** | Deleting matches fails if picks exist | ✅ SAFE - Script fails, no data lost |

### 2. `bracket_picks.picked_team_id` → `teams.id`

**Why Critical:** Seed file deletes old teams

| ON DELETE Behavior | What Happens | Impact |
|-------------------|--------------|--------|
| **CASCADE** | Deleting teams deletes all `bracket_picks` | ❌ DESTRUCTIVE - All picks deleted |
| **SET NULL** | Deleting teams sets `picked_team_id = NULL` | ⚠️ BROKEN - Picks have NULL refs |
| **RESTRICT/NO ACTION** | Deleting teams fails if picks exist | ✅ SAFE - Script fails, no data lost |

### 3. `brackets.tournament_id` → `tournaments.id`

**Why Important:** Seed file updates tournament

| ON DELETE Behavior | What Happens | Impact |
|-------------------|--------------|--------|
| **CASCADE** | Deleting tournament deletes all brackets | ❌ DESTRUCTIVE (but we're not deleting tournament) |
| **SET NULL** | Deleting tournament sets `tournament_id = NULL` | ⚠️ BROKEN (but we're not deleting tournament) |
| **RESTRICT/NO ACTION** | Deleting tournament fails if brackets exist | ✅ SAFE (but we're not deleting tournament) |

**Note:** Seed file does NOT delete tournament, only updates it. This FK is less critical.

### 4. `matches.tournament_id` → `tournaments.id`

**Why Important:** Determines if we can delete matches

| ON DELETE Behavior | What Happens | Impact |
|-------------------|--------------|--------|
| **CASCADE** | Deleting tournament would delete matches | ✅ EXPECTED (but we're not deleting tournament) |
| **RESTRICT/NO ACTION** | Deleting tournament fails if matches exist | ✅ SAFE (but we're not deleting tournament) |

**Note:** Seed file does NOT delete tournament. This FK is informational only.

### 5. `teams.tournament_id` → `tournaments.id`

**Why Important:** Determines if we can delete teams

| ON DELETE Behavior | What Happens | Impact |
|-------------------|--------------|--------|
| **CASCADE** | Deleting tournament would delete teams | ✅ EXPECTED (but we're not deleting tournament) |
| **RESTRICT/NO ACTION** | Deleting tournament fails if teams exist | ✅ SAFE (but we're not deleting tournament) |

**Note:** Seed file does NOT delete tournament. This FK is informational only.

---

## Predicted Outcomes

### Scenario A: FK = CASCADE (Most Destructive)

**If `bracket_picks.match_id` and `bracket_picks.picked_team_id` both have CASCADE:**

```sql
DELETE FROM matches WHERE tournament_id = wc_id;
-- ✅ Succeeds
-- ❌ CASCADES to DELETE all bracket_picks for those matches

DELETE FROM teams WHERE tournament_id = wc_id;
-- ✅ Succeeds
-- ❌ CASCADES to DELETE all remaining bracket_picks for those teams
```

**Result:**
- ✅ Script runs successfully
- ❌ All old `bracket_picks` deleted
- ❌ Old brackets become empty (all picks gone)
- ❌ Users lose all bracket data

**Safe for Development?** ⚠️ YES, if you're okay losing old brackets  
**Safe for Production?** ❌ NO - Users lose data

---

### Scenario B: FK = RESTRICT/NO ACTION (Safest)

**If `bracket_picks.match_id` and `bracket_picks.picked_team_id` both have RESTRICT:**

```sql
DELETE FROM matches WHERE tournament_id = wc_id;
-- ❌ FAILS with error:
-- ERROR: update or delete on table "matches" violates foreign key constraint
-- DETAIL: Key (id)=(xxx) is still referenced from table "bracket_picks"
```

**Result:**
- ❌ Script fails at DELETE FROM matches
- ✅ No data deleted (transaction rolls back)
- ✅ Old brackets still work
- ⏸️ Must manually delete `bracket_picks` first

**Safe for Development?** ✅ YES - No data lost, just need to delete picks first  
**Safe for Production?** ✅ YES - Prevents accidental data loss

---

### Scenario C: FK = SET NULL (Broken but Not Deleted)

**If `bracket_picks.match_id` and `bracket_picks.picked_team_id` both have SET NULL:**

```sql
DELETE FROM matches WHERE tournament_id = wc_id;
-- ✅ Succeeds
-- ⚠️ Sets bracket_picks.match_id = NULL for all affected picks

DELETE FROM teams WHERE tournament_id = wc_id;
-- ✅ Succeeds
-- ⚠️ Sets bracket_picks.picked_team_id = NULL for all affected picks
```

**Result:**
- ✅ Script runs successfully
- ⚠️ Old `bracket_picks` have NULL `match_id` and `picked_team_id`
- ⚠️ Old brackets exist but are broken (queries will fail)
- ⚠️ Data not deleted but unusable

**Safe for Development?** ⚠️ MAYBE - Brackets broken but not deleted  
**Safe for Production?** ❌ NO - Brackets become unusable

---

## Decision Matrix

### After Running Preflight Check:

| FK Behavior | Script Outcome | Old Brackets | Action Required |
|-------------|----------------|--------------|-----------------|
| **CASCADE** | ✅ Succeeds | ❌ Empty (picks deleted) | Export brackets first if needed |
| **RESTRICT** | ❌ Fails | ✅ Still work | Delete `bracket_picks` manually first |
| **SET NULL** | ✅ Succeeds | ⚠️ Broken (NULL refs) | Export brackets first if needed |

---

## Recommended Actions Based on Results

### If FK = CASCADE:

**Development:**
```sql
-- OPTIONAL: Export old brackets first
SELECT * FROM brackets WHERE tournament_id = (
  SELECT id FROM tournaments WHERE slug = 'world-cup-2026'
);

SELECT * FROM bracket_picks WHERE bracket_id IN (
  SELECT id FROM brackets WHERE tournament_id = (
    SELECT id FROM tournaments WHERE slug = 'world-cup-2026'
  )
);

-- Then run seed file (will delete picks automatically)
```

**Production:**
```sql
-- DO NOT RUN SEED FILE
-- Instead, create new tournament with different slug
-- Keep old brackets intact
```

---

### If FK = RESTRICT (Most Likely):

**Development:**
```sql
-- Step 1: Delete old bracket_picks first
DELETE FROM bracket_picks
WHERE match_id IN (
  SELECT id FROM matches 
  WHERE tournament_id = (
    SELECT id FROM tournaments WHERE slug = 'world-cup-2026'
  )
);

-- Step 2: Run seed file (will succeed now)
```

**Production:**
```sql
-- Same as CASCADE - create new tournament instead
```

---

### If FK = SET NULL:

**Development:**
```sql
-- OPTIONAL: Export old brackets first
-- Then run seed file (will set picks to NULL)
-- Old brackets will be broken but not deleted
```

**Production:**
```sql
-- DO NOT RUN SEED FILE
-- Create new tournament instead
```

---

## Export Old Brackets (Recommended Before Running Seed)

### Export to CSV (Supabase Dashboard)

1. Go to Table Editor
2. Select `brackets` table
3. Filter: `tournament_id = (SELECT id FROM tournaments WHERE slug = 'world-cup-2026')`
4. Click "Export" → CSV
5. Repeat for `bracket_picks` table

### Export via SQL (Supabase SQL Editor)

```sql
-- Export brackets
COPY (
  SELECT * FROM brackets 
  WHERE tournament_id = (
    SELECT id FROM tournaments WHERE slug = 'world-cup-2026'
  )
) TO '/tmp/old_brackets.csv' WITH CSV HEADER;

-- Export bracket_picks
COPY (
  SELECT bp.* FROM bracket_picks bp
  JOIN brackets b ON bp.bracket_id = b.id
  WHERE b.tournament_id = (
    SELECT id FROM tournaments WHERE slug = 'world-cup-2026'
  )
) TO '/tmp/old_bracket_picks.csv' WITH CSV HEADER;
```

**Note:** COPY command may not work in Supabase cloud. Use Table Editor export instead.

---

## Final Checklist Before Running Seed

### ✅ Preflight Checks
- [ ] Run `PREFLIGHT-CHECK-fk-constraints.sql` in Supabase
- [ ] Record FK delete behavior for `bracket_picks.match_id`
- [ ] Record FK delete behavior for `bracket_picks.picked_team_id`
- [ ] Determine which scenario applies (CASCADE, RESTRICT, SET NULL)

### ✅ Backup (Recommended)
- [ ] Export `brackets` table to CSV
- [ ] Export `bracket_picks` table to CSV
- [ ] Save exports to safe location

### ✅ Environment Check
- [ ] Confirm running in **development/staging** (NOT production)
- [ ] Confirm okay with old brackets breaking
- [ ] Confirm schema changes (group picks tables) will follow

### ✅ Execution Plan
- [ ] If FK = RESTRICT: Delete `bracket_picks` first (see SQL above)
- [ ] If FK = CASCADE: Accept that picks will be deleted
- [ ] If FK = SET NULL: Accept that picks will become NULL
- [ ] Run `seed-wc2026-full-format.sql`
- [ ] Verify results (48 teams, 79 matches, 12 groups)

---

## Summary Template (Fill After Preflight)

**Foreign Key Delete Rules:**
```
bracket_picks.match_id → matches.id: [CASCADE / RESTRICT / SET NULL]
bracket_picks.picked_team_id → teams.id: [CASCADE / RESTRICT / SET NULL]
brackets.tournament_id → tournaments.id: [CASCADE / RESTRICT / SET NULL]
matches.tournament_id → tournaments.id: [CASCADE / RESTRICT / SET NULL]
teams.tournament_id → tournaments.id: [CASCADE / RESTRICT / SET NULL]
```

**Predicted Outcome:**
- Seed file will: [SUCCEED / FAIL]
- Old bracket_picks will: [BE DELETED / BE SET TO NULL / BLOCK DELETION]
- Old brackets will: [BE EMPTY / BE BROKEN / STILL WORK]

**Safe to Run in Development?** [YES / NO / WITH PRECAUTIONS]

**Safe to Run in Production?** [YES / NO]

**Should We Export Brackets First?** [YES / NO]

**Action Required Before Running Seed:**
```sql
-- [Paste required SQL here, or write "None"]
```

---

**Status:** ⏸️ Awaiting preflight check results

**Next Step:** Run `PREFLIGHT-CHECK-fk-constraints.sql` in Supabase and fill out summary above.
