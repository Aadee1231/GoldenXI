# Bracket Setup Instructions

## Overview
The bracket system now uses **real database UUIDs** instead of mock string IDs. All matches and teams are stored in Supabase.

## Setup Steps

### 1. Run the Seed SQL

Open the Supabase SQL Editor and run the seed file:

```bash
# File location:
supabase/seed-bracket-data.sql
```

This will create:
- 1 active tournament (World Cup 2026)
- 16 teams
- 8 Round of 16 matches (with teams assigned)
- 4 Quarterfinal matches (empty, filled by user picks)
- 2 Semifinal matches (empty)
- 1 Final match (empty)

### 2. Verify Data

Check these tables in Supabase:
- `tournaments` - should have 1 row with `is_active = true`
- `teams` - should have 16 rows
- `matches` - should have 15 rows (8 r16 + 4 qf + 2 sf + 1 final)

### 3. Test the Bracket

1. Visit `/bracket`
2. Click teams to make picks
3. Click "Save Bracket" - check console for UUID logs
4. Refresh the page - picks should be restored
5. Complete all 15 picks
6. Click "Submit Bracket" - bracket is locked

## How It Works

### Database Schema

**matches table:**
- `id` (UUID) - primary key
- `tournament_id` (UUID) - foreign key to tournaments
- `home_team_id` (UUID) - foreign key to teams (nullable)
- `away_team_id` (UUID) - foreign key to teams (nullable)
- `winner_id` (UUID) - foreign key to teams (nullable)
- `round` (TEXT) - 'r16', 'qf', 'sf', 'final'
- `completed` (BOOLEAN)

**bracket_picks table:**
- `id` (UUID) - primary key
- `bracket_id` (UUID) - foreign key to brackets
- `match_id` (UUID) - **foreign key to matches.id**
- `picked_team_id` (UUID) - foreign key to teams
- `is_correct` (BOOLEAN) - for scoring
- `points_awarded` (INTEGER) - for scoring
- `round` (TEXT) - for easier querying

### Code Flow

1. **Page Load:**
   - `getBracketMatches()` loads all 15 matches from database
   - Converts to UI format with real UUIDs
   - `getUserBracket()` loads existing picks
   - Restores picks by matching `pick.match_id` to `match.id`

2. **Making Picks:**
   - User clicks team in UI
   - React state updates with `winnerId = team.id`
   - Teams advance to next round in UI state

3. **Saving:**
   - `getPicksFromBracket()` extracts all picks
   - Each pick has `match_id` (real UUID), `picked_team_id`, `round`
   - Console logs show all UUIDs before saving
   - `saveBracket()` inserts into `bracket_picks` table

4. **Submitting:**
   - Same as save but sets `bracket.status = 'submitted'`
   - Bracket is locked, no more edits allowed

## Console Logs

When saving/submitting, you'll see:

```
💾 Saving picks with match UUIDs: [
  { match_id: "match-r16-0", picked_team_id: "team-bra" },
  { match_id: "match-r16-1", picked_team_id: "team-ned" },
  ...
]
✅ Saved bracket: { id: "...", status: "draft", ... }
✅ Saved picks: [ ... ]
```

All `match_id` values are real UUIDs from the `matches` table.

## Files Changed

### New Files:
- `supabase/seed-bracket-data.sql` - seed data
- `src/lib/supabase/queries/matches.ts` - load matches from DB
- `src/components/bracket/BracketPageV2.tsx` - new bracket component using real UUIDs

### Modified Files:
- `src/lib/supabase/queries/brackets.ts` - added console logging
- `app/bracket/page.tsx` - uses BracketPageV2
- `src/types/index.ts` - added `status` field to Bracket type

## Troubleshooting

**Error: "No active tournament found"**
- Run the seed SQL to create the tournament

**Error: "No bracket matches found"**
- Run the seed SQL to create matches

**Error: "invalid input syntax for type uuid"**
- Make sure you're using BracketPageV2, not the old BracketPage
- Check that seed SQL was run successfully

**Picks not saving:**
- Check browser console for error messages
- Verify `bracket_picks` table has all required columns
- Check RLS policies allow INSERT for authenticated users
