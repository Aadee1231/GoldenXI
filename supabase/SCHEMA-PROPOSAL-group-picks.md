# Schema Proposal: Group Stage & Third-Place Picks

## Problem Statement

The current `bracket_picks` table is designed for knockout matches:
```sql
bracket_picks (
  id uuid,
  bracket_id uuid,
  match_id uuid,        -- References a specific match
  picked_team_id uuid,  -- The team picked to win that match
  ...
)
```

**This doesn't cleanly support:**
1. **Group rankings** - User ranks 4 teams per group (1st, 2nd, 3rd, 4th)
2. **Third-place selections** - User selects 8 of 12 third-place teams

## Proposed Solution

Add two new tables to cleanly separate group stage predictions from knockout picks.

---

## Table 1: `bracket_group_picks`

Stores user's ranking of teams within each group.

```sql
create table public.bracket_group_picks (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null references public.brackets(id) on delete cascade,
  group_label text not null check (group_label in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  team_id uuid not null references public.teams(id) on delete cascade,
  position integer not null check (position between 1 and 4),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one team per position per group per bracket
  unique (bracket_id, group_label, position),
  
  -- Ensure one position per team per group per bracket
  unique (bracket_id, group_label, team_id)
);

create index idx_bracket_group_picks_bracket_id 
  on public.bracket_group_picks(bracket_id);

create index idx_bracket_group_picks_group_label 
  on public.bracket_group_picks(group_label);
```

**Usage Example:**
```sql
-- User predicts Group A: Mexico 1st, France 2nd, Uruguay 3rd, Jamaica 4th
insert into bracket_group_picks (bracket_id, group_label, team_id, position)
values
  ('bracket-uuid', 'A', 'mexico-uuid', 1),
  ('bracket-uuid', 'A', 'france-uuid', 2),
  ('bracket-uuid', 'A', 'uruguay-uuid', 3),
  ('bracket-uuid', 'A', 'jamaica-uuid', 4);
```

**Scoring Logic:**
- Position 1 (group winner): 2 points if correct
- Position 2 (runner-up): 1 point if correct
- Position 3: Used for third-place selection (no direct points)
- Position 4: No points

**Max Points:** 12 groups × (2 + 1) = 36 points

---

## Table 2: `bracket_third_place_picks`

Stores user's selection of 8 third-place teams to advance.

```sql
create table public.bracket_third_place_picks (
  id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null references public.brackets(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz default now(),
  
  -- Ensure no duplicate teams per bracket
  unique (bracket_id, team_id)
);

create index idx_bracket_third_place_picks_bracket_id 
  on public.bracket_third_place_picks(bracket_id);

-- Add constraint: exactly 8 picks per bracket (enforced in application logic)
```

**Usage Example:**
```sql
-- User selects 8 third-place teams to advance
insert into bracket_third_place_picks (bracket_id, team_id)
values
  ('bracket-uuid', 'uruguay-uuid'),
  ('bracket-uuid', 'wales-uuid'),
  ('bracket-uuid', 'australia-uuid'),
  ('bracket-uuid', 'cameroon-uuid'),
  ('bracket-uuid', 'costa-rica-uuid'),
  ('bracket-uuid', 'canada-uuid'),
  ('bracket-uuid', 'ecuador-uuid'),
  ('bracket-uuid', 'peru-uuid');
```

**Scoring Logic:**
- 1 point per correct third-place team that advances
- Max Points: 8 points

---

## Alternative: Use Existing `bracket_picks` Table

**Option A:** Store group picks as special match picks
- Create fake "group ranking" matches with `match_id = null`
- Use `picked_team_id` + custom `position` column
- ❌ Messy, requires schema change to `bracket_picks`
- ❌ Confuses knockout picks with group picks

**Option B:** Store in JSON column on `brackets` table
- Add `group_picks jsonb` column
- ❌ Harder to query and score
- ❌ No referential integrity

**Recommendation:** Use dedicated tables (cleaner, more maintainable)

---

## RLS Policies Needed

```sql
-- bracket_group_picks policies
create policy "Users can read own group picks"
  on public.bracket_group_picks
  for select
  using (
    exists (
      select 1 from public.brackets
      where brackets.id = bracket_group_picks.bracket_id
        and brackets.user_id = auth.uid()
    )
  );

create policy "Users can insert own group picks"
  on public.bracket_group_picks
  for insert
  with check (
    exists (
      select 1 from public.brackets
      where brackets.id = bracket_group_picks.bracket_id
        and brackets.user_id = auth.uid()
    )
  );

create policy "Users can update own group picks"
  on public.bracket_group_picks
  for update
  using (
    exists (
      select 1 from public.brackets
      where brackets.id = bracket_group_picks.bracket_id
        and brackets.user_id = auth.uid()
    )
  );

create policy "Users can delete own group picks"
  on public.bracket_group_picks
  for delete
  using (
    exists (
      select 1 from public.brackets
      where brackets.id = bracket_group_picks.bracket_id
        and brackets.user_id = auth.uid()
    )
  );

-- Similar policies for bracket_third_place_picks
```

---

## Migration Strategy

**Phase 1 (Current):**
- ✅ Propose schema (this document)
- ⏸️ Wait for approval before creating migration

**Phase 2 (After Approval):**
- Create migration: `supabase/add-group-picks-tables.sql`
- Run migration in development
- Test with sample data
- Deploy to production

**Phase 3 (Implementation):**
- Update TypeScript types
- Create query functions
- Build UI components

---

## Total Pick Count

With new tables:
- **Group rankings:** 12 groups × 4 positions = 48 picks
- **Third-place selections:** 8 picks
- **Knockout matches:** 16 R32 + 8 R16 + 4 QF + 2 SF + 1 Final = 31 picks
- **Total:** 48 + 8 + 31 = **87 picks**

---

## Recommendation

✅ **Approve and create these two tables**

They provide:
- Clean separation of concerns
- Easy scoring logic
- Type safety
- Referential integrity
- Future extensibility (e.g., add tiebreaker fields)

**Next Step:** Review and approve, then I'll create the migration SQL file.
