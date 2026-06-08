# Preflight Quick Reference

**Run this SQL in Supabase SQL Editor:**

```sql
SELECT 
  tc.table_name AS "Table",
  kcu.column_name AS "Column",
  ccu.table_name AS "References Table",
  ccu.column_name AS "References Column",
  rc.delete_rule AS "ON DELETE Behavior"
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE 
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    (tc.table_name = 'bracket_picks' AND kcu.column_name IN ('match_id', 'picked_team_id', 'bracket_id'))
    OR (tc.table_name = 'brackets' AND kcu.column_name = 'tournament_id')
    OR (tc.table_name = 'matches' AND kcu.column_name IN ('tournament_id', 'home_team_id', 'away_team_id', 'winner_team_id'))
    OR (tc.table_name = 'teams' AND kcu.column_name = 'tournament_id')
  )
ORDER BY tc.table_name, kcu.column_name;
```

---

## What to Look For

**Critical Rows:**
1. `bracket_picks` | `match_id` | `matches` | `id` | **[?]**
2. `bracket_picks` | `picked_team_id` | `teams` | `id` | **[?]**

**ON DELETE Behavior:**
- **CASCADE** = Deleting parent deletes children (DESTRUCTIVE)
- **SET NULL** = Deleting parent sets FK to NULL (BROKEN)
- **RESTRICT** or **NO ACTION** = Deleting parent fails (SAFE but BLOCKS)

---

## Quick Decision Tree

### If Both Critical FKs = RESTRICT:
✅ **Safest** - Script will fail, no data lost  
**Action:** Delete `bracket_picks` first:
```sql
DELETE FROM bracket_picks
WHERE match_id IN (
  SELECT id FROM matches 
  WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'world-cup-2026')
);
```

### If Both Critical FKs = CASCADE:
⚠️ **Destructive** - Script succeeds, all picks deleted  
**Action:** Export brackets first (optional), then run seed

### If Both Critical FKs = SET NULL:
⚠️ **Broken** - Script succeeds, picks become NULL  
**Action:** Export brackets first (optional), then run seed

---

## Is Seed Safe to Run?

| FK Behavior | Development | Production |
|-------------|-------------|------------|
| **RESTRICT** | ✅ YES (delete picks first) | ❌ NO (use new tournament) |
| **CASCADE** | ⚠️ YES (if okay losing picks) | ❌ NO (users lose data) |
| **SET NULL** | ⚠️ YES (if okay with broken picks) | ❌ NO (brackets broken) |

**Bottom Line:** Safe for development with precautions. NOT safe for production.

---

## Should We Export Brackets First?

| FK Behavior | Export Needed? |
|-------------|----------------|
| **RESTRICT** | ❌ NO (data won't be deleted) |
| **CASCADE** | ✅ YES (data will be deleted) |
| **SET NULL** | ✅ YES (data will be broken) |

---

**Next Step:** Run the SQL query above and report back the ON DELETE behavior.
