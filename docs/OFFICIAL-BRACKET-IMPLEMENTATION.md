# Official 2026 World Cup Bracket Implementation

## Overview

GoldenXI now uses the **official 2026 FIFA World Cup knockout bracket structure** instead of custom seeding logic. This ensures that Round of 32 matchups match the official tournament format with fixed bracket slots, predetermined match numbers, dates, venues, and FIFA's third-place mapping logic.

## What Changed

### Before (Custom Seeding)
- Simple deterministic algorithm paired teams sequentially
- Created matchups like "Mexico vs Switzerland" based on arbitrary ordering
- No match numbers, dates, or venues
- Custom third-place assignment logic

### After (Official Template)
- Fixed bracket structure following FIFA regulations
- Predetermined slots: `1A vs 3C`, `2A vs 2B`, `1E vs 3X`, etc.
- Official match numbers (73-104)
- Real dates and venues
- FIFA Annex C third-place mapping logic

## File Structure

### New Files Created

```
src/lib/world-cup-2026/
├── index.ts                      # Main exports
├── knockout-template.ts          # Official bracket template with all rounds
├── third-place-mapping.ts        # Annex C third-place slot assignments
├── bracket-resolver.ts           # Helper functions to resolve slots to teams
└── build-knockout-bracket.ts     # Main function to build R32 bracket
```

### Modified Files

```
src/components/bracket-v3/
└── KnockoutBracketStep.tsx       # Updated to use official bracket logic
```

## Core Components

### 1. Knockout Template (`knockout-template.ts`)

Contains the official bracket structure for all knockout rounds:

- **Round of 32**: 16 matches (Match 73-88)
  - Fixed slots like `1A`, `2B`, `3C`, `THIRD_PLACE_SLOT_1`, etc.
  - Match dates: June 28 - July 3, 2026
  - Venues: SoFi Stadium, MetLife Stadium, Estadio Azteca, etc.

- **Round of 16**: 8 matches (Match 89-96)
- **Quarterfinals**: 4 matches (Match 97-100)
- **Semifinals**: 2 matches (Match 101-102)
- **Final**: 1 match (Match 104)

Example template entry:
```typescript
{
  matchNumber: 74,
  round: "r32",
  slotA: "1E",
  slotB: "THIRD_PLACE_SLOT_1",
  allowedThirdGroups: ["A", "B", "C", "D", "F"],
  date: "2026-06-29",
  displayDate: "Monday, June 29",
  stadium: "Gillette Stadium",
  city: "Boston",
}
```

### 2. Third-Place Mapping (`third-place-mapping.ts`)

Implements FIFA's official Annex C logic for assigning third-place teams to bracket slots.

**Key Features:**
- 495 possible combinations of 8 third-place teams from 12 groups
- Each combination has predetermined slot assignments
- Respects constraints (e.g., SLOT_1 can only be A/B/C/D/F)
- Fallback algorithm when official mapping not found (with console warning)

**Current Status:**
- ⚠️ **Partial implementation**: 3 example combinations coded
- 🔄 **TODO**: Add remaining 492 combinations from FIFA Annex C table
- ✅ **Fallback mode**: Safe temporary algorithm respects all constraints

Function:
```typescript
getThirdPlaceSlotAssignments(["A", "C", "E", "F", "H", "I", "J", "K"])
// Returns: { THIRD_PLACE_SLOT_1: "A", THIRD_PLACE_SLOT_2: "C", ... }
```

### 3. Bracket Resolver (`bracket-resolver.ts`)

Helper functions to convert slot codes into actual team data:

- `getTeamByGroupPosition()` - Get team by group and position (1st, 2nd, 3rd)
- `getThirdPlaceTeamByGroup()` - Get 3rd place team from specific group
- `resolveBracketSlot()` - Convert slot code to team (e.g., "1A" → Germany)
- `buildQualifiedTeams()` - Build all 32 qualified teams with seed info

### 4. Build Knockout Bracket (`build-knockout-bracket.ts`)

Main function that generates the Round of 32 bracket:

```typescript
buildOfficialRoundOf32(
  groupRankings,      // User's group rankings
  teamsData,          // Teams by group from database
  selectedThirdPlaceTeams  // 8 selected third-place team IDs
)
// Returns: { matches, qualifiedTeams, thirdPlaceAssignments }
```

## How It Works

### Bracket Generation Flow

1. **User completes group rankings** (positions 1, 2, 3 for each group A-L)
2. **User selects 8 third-place teams** (from 12 available)
3. **System determines third-place groups** from selected team IDs
4. **Third-place mapping** assigns each group to a specific slot
5. **Template resolution** converts slots to actual teams:
   - `1A` → 1st place team from Group A
   - `2B` → 2nd place team from Group B
   - `THIRD_PLACE_SLOT_1` → Assigned third-place team (e.g., Group C)
6. **Matches generated** with all metadata (numbers, dates, venues)

### Example Match Resolution

**Template:**
```
Match 79: 1A vs THIRD_PLACE_SLOT_3
Allowed third groups: C/E/F/H/I
```

**User Input:**
- Group A 1st place: Mexico
- Selected third-place teams include: Scotland (Group C)
- Third-place mapping assigns Group C to SLOT_3

**Result:**
```
Match 79
Estadio Azteca · Mexico City
Tuesday, June 30
Mexico (1A) vs Scotland (3C)
```

## UI Features

### Match Cards Display

Each Round of 32 match card shows:
- ✅ Match number (e.g., "Match 74")
- ✅ Stadium and city (e.g., "Gillette Stadium · Boston")
- ✅ Display date (e.g., "Monday, June 29")
- ✅ Team flags and names
- ✅ Slot labels (e.g., "1E", "3C")
- ✅ Winner selection
- 🔧 **Dev mode only**: Template debug info (e.g., "1E vs 3A/B/C/D/F")

### Debug Mode

In development (`NODE_ENV=development`), each match shows:
```
Template: 1E vs 3A/B/C/D/F
```

This helps verify the bracket matches FIFA's official structure.

## Data Integrity

### Preserving User Picks

When group rankings or third-place selections change:
- ✅ R32 regenerates with new teams
- ✅ Downstream knockout picks cleared only if teams changed
- ✅ No random reseeding
- ✅ Knockout auto-pick does not change teams

### Validation

The system validates:
- Exactly 8 third-place teams selected
- No duplicate groups
- All slots can be assigned (respects constraints)
- All group positions filled

## Testing Checklist

### Bracket Structure Tests

- [ ] Match 73: `2A vs 2B` (fixed runner-up matchup)
- [ ] Match 74: `1E vs 3X` where X ∈ {A,B,C,D,F}
- [ ] Match 75: `1F vs 2C` (fixed matchup)
- [ ] Match 79: `1A vs 3X` where X ∈ {C,E,F,H,I}
- [ ] All 16 R32 matches have correct match numbers (73-88)
- [ ] All matches show dates, venues, cities

### Third-Place Logic Tests

- [ ] Selecting 8 third-place teams triggers correct assignments
- [ ] Changing third-place selection regenerates R32
- [ ] Fallback warning appears when official mapping not found
- [ ] All assigned groups respect slot constraints

### User Flow Tests

- [ ] Fresh bracket creation works
- [ ] Saved bracket reload preserves picks
- [ ] Group ranking changes regenerate R32 correctly
- [ ] Third-place changes only affect R32 (not downstream picks)
- [ ] Knockout auto-pick works without changing teams
- [ ] Review page shows correct champion/runner-up

### UI Tests

- [ ] Match numbers display correctly
- [ ] Dates and venues show on R32 cards
- [ ] Slot labels show (1A, 2B, 3C, etc.)
- [ ] Dev mode shows template debug info
- [ ] Production mode hides debug info

## Known Limitations

### Third-Place Mapping

⚠️ **Current Status**: Partial implementation with fallback

**What's Implemented:**
- Structure for all 495 combinations
- 3 example combinations from Annex C
- Safe fallback algorithm that respects constraints
- Console warnings when fallback is used

**What's Needed:**
- Remaining 492 combinations from FIFA Annex C table
- This is a large data entry task (495 combinations × 8 slot assignments)

**Fallback Behavior:**
- Uses constraint-aware algorithm
- Never creates impossible matchups
- Clearly warns in console: `⚠️ Using fallback third-place assignment algorithm`
- Safe for testing and development

### Future Enhancements

1. **Complete Annex C Table**
   - Add all 495 official combinations
   - Remove fallback algorithm
   - Remove console warnings

2. **Match Metadata**
   - Add kickoff times
   - Add TV broadcast info (if public)
   - Add referee assignments (after official announcement)

3. **Bracket Visualization**
   - Traditional bracket tree view
   - Printable bracket sheet
   - Mobile-optimized bracket navigation

## Compliance Notes

### What We Use (✅ Allowed)

- **Factual tournament structure**: Match numbers, dates, venues
- **Public information**: Group slots, third-place logic, country names
- **Country flags**: Standard emoji/Unicode flags
- **GoldenXI branding**: Black/gold visual style

### What We Avoid (❌ Not Allowed)

- FIFA official logos or trademarks
- Official World Cup branding
- Trophy imagery
- Official fonts or color schemes
- Official tournament graphics

This implementation uses only factual, publicly available tournament structure data.

## Development Commands

```bash
# Build the app
npm run build

# Run development server
npm run dev

# Type check
npx tsc --noEmit

# Test bracket generation
# (Navigate to /bracket-v3 in browser)
```

## Files Reference

### Core Logic
- `src/lib/world-cup-2026/knockout-template.ts` - Official bracket template
- `src/lib/world-cup-2026/third-place-mapping.ts` - Annex C mapping
- `src/lib/world-cup-2026/bracket-resolver.ts` - Slot resolution helpers
- `src/lib/world-cup-2026/build-knockout-bracket.ts` - Main build function

### UI Components
- `src/components/bracket-v3/KnockoutBracketStep.tsx` - Knockout bracket UI
- `src/components/bracket-v3/BracketWizard.tsx` - Wizard state management
- `src/components/bracket-v3/ThirdPlaceStep.tsx` - Third-place selection

### Types
- `src/types/index.ts` - Core type definitions
- `src/lib/world-cup-2026/knockout-template.ts` - Bracket-specific types

## Summary

✅ **Completed:**
- Official knockout template with all rounds
- Third-place mapping structure (partial Annex C)
- Helper functions for slot resolution
- Updated UI with match numbers, dates, venues
- Successful build with no errors

⚠️ **Partial:**
- Third-place mapping: 3/495 combinations implemented
- Fallback algorithm active with warnings

🔄 **Next Steps:**
- Add remaining 492 Annex C combinations
- Test with real bracket scenarios
- Verify against official FIFA bracket predictor

The app is now safe to test with the official bracket structure!
