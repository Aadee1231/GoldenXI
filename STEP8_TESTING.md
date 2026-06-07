# Step 8: Group Invites and Bracket Sharing - Testing Guide

## Files Changed

### New Files Created
1. **SQL Migration**
   - `supabase/step8-invites-and-sharing.sql`

2. **Query Functions**
   - `src/lib/supabase/queries/invites.ts`
   - `src/lib/supabase/queries/public-bracket.ts`

3. **Utility Functions**
   - `src/lib/utils/share.ts`

4. **Share Components**
   - `src/components/share/ShareButton.tsx`
   - `src/components/share/CopyButton.tsx`
   - `src/components/share/ShareCard.tsx`

5. **Group Components**
   - `src/components/groups/GroupInviteCard.tsx`

6. **Bracket Components**
   - `src/components/bracket/BracketShareCard.tsx`
   - `src/components/bracket/BracketShareSection.tsx`

7. **Pages**
   - `app/join/[code]/page.tsx`
   - `app/join/[code]/InvitePageContent.tsx`
   - `app/u/[username]/bracket/page.tsx`

### Modified Files
1. `src/types/index.ts` - Added `public_bracket`, `InvitePreview`, `PublicBracketData` types
2. `app/auth/actions.ts` - Added redirect parameter support
3. `app/auth/page.tsx` - Pass redirect to AuthForm
4. `src/components/auth/AuthForm.tsx` - Handle redirect parameter
5. `app/groups/[id]/page.tsx` - Added GroupInviteCard
6. `app/bracket/page.tsx` - Added BracketShareSection

## SQL Migration Required

**IMPORTANT:** You must run the SQL migration before testing.

1. Open Supabase SQL Editor
2. Copy and paste the contents of `supabase/step8-invites-and-sharing.sql`
3. Execute the migration

This migration adds:
- `public_bracket` column to `profiles` table
- Indexes on `profiles.username` and `groups.join_code`
- Unique constraint on `group_members(group_id, user_id)`
- RPC functions: `get_invite_preview`, `join_group_by_code`, `get_public_bracket`
- Updated RLS policies for group join code lookups

## Environment Variables

### Optional (Recommended for Production)
Add to `.env.local`:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production deployment, set:
```
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

If not set, the app will auto-detect the URL from `window.location.origin` (client) or `VERCEL_URL` (server).

## Testing Checklist

### 1. Group Invite Links - Signed Out Flow

**Test: Signed-out user opens invite link**
1. Create a group while signed in (or use existing group)
2. Note the join code (e.g., `ABC123`)
3. Open incognito/private window
4. Navigate to: `http://localhost:3000/join/ABC123`
5. **Expected:**
   - See invite landing page with GoldenXI branding
   - Group name displayed
   - Tournament name displayed
   - Member count displayed
   - "Sign In to Join" button
   - "Create Account" button

**Test: Sign in from invite link**
1. From the invite page (signed out), click "Sign In to Join"
2. Sign in with valid credentials
3. **Expected:**
   - After sign in, redirected back to `/join/ABC123`
   - Now see authenticated invite page
   - "Join Group" button appears
4. Click "Join Group"
5. **Expected:**
   - Successfully joined
   - Redirected to `/groups/{group_id}`

**Test: Invalid join code**
1. Navigate to: `http://localhost:3000/join/INVALID`
2. **Expected:**
   - "Invite Not Found" error page
   - Clean error message

### 2. Group Invite Links - Signed In Flow

**Test: Signed-in user opens invite link**
1. Sign in to the app
2. Navigate to: `http://localhost:3000/join/{valid-code}`
3. **Expected:**
   - See authenticated invite page
   - Group details displayed
   - "Join Group" button

**Test: Join group**
1. Click "Join Group"
2. **Expected:**
   - Success message or redirect
   - Redirected to group detail page
   - User appears in member list

**Test: Already a member**
1. Join a group
2. Try to open the same invite link again
3. **Expected:**
   - Immediately redirected to group detail page (no join button)

**Test: Locked group with late join disabled**
1. Create a group
2. Set `lock_at` to a past date
3. Set `allow_late_join` to `false`
4. Sign out and try to join via invite link
5. **Expected:**
   - "Group Locked" message
   - "This group is locked and no longer accepting new members"
   - Cannot join

**Test: Locked group with late join enabled**
1. Create a group
2. Set `lock_at` to a past date
3. Set `allow_late_join` to `true`
4. Try to join via invite link
5. **Expected:**
   - Warning: "Group is locked but late joins are allowed"
   - Can still join

### 3. Group Invite UI

**Test: Member invite policy**
1. Create a group with `invite_policy = 'members'`
2. Join the group as a non-creator member
3. Navigate to group detail page
4. **Expected:**
   - "Invite Friends" card visible
   - Join code displayed
   - "Copy" button for join code works
   - Invite link displayed
   - "Copy" button for invite link works
   - "Share Invite" button visible

**Test: Admin-only invite policy**
1. Create a group with `invite_policy = 'admin_only'`
2. Join the group as a non-creator member
3. Navigate to group detail page
4. **Expected:**
   - "Invite Friends" card shows lock icon
   - Message: "Only the group admin can invite new members"
   - No copy/share buttons for non-admin

**Test: Creator sees invite controls**
1. Create a group with `invite_policy = 'admin_only'`
2. As the creator, view group detail page
3. **Expected:**
   - Full invite controls visible
   - Can copy code and link
   - Can share

**Test: Copy functionality**
1. Click "Copy" button for join code
2. **Expected:**
   - Button changes to "Copied!" with checkmark
   - Code is in clipboard
   - Button reverts after 2 seconds

**Test: Native share (mobile/supported browsers)**
1. On a mobile device or browser with Web Share API support
2. Click "Share Invite" button
3. **Expected:**
   - Native share sheet appears
   - Share text includes group name
   - Share URL is correct

**Test: Share fallback (desktop)**
1. On desktop without Web Share API
2. Click "Share Invite" button
3. **Expected:**
   - URL copied to clipboard
   - Button shows "Copied!" feedback

### 4. Public Bracket Sharing

**Test: Enable public bracket**
1. Sign in and create/view your bracket
2. Scroll to "Share Your Bracket" section
3. Toggle "Public Sharing" switch ON
4. **Expected:**
   - Toggle animates to ON position
   - Share card preview appears
   - Share link appears
   - Copy and Share buttons appear

**Test: Disable public bracket**
1. With public sharing ON, toggle it OFF
2. **Expected:**
   - Share link and buttons disappear
   - Lock icon and message appear
   - "Enable public sharing to get your share link"

**Test: Public bracket page - public**
1. Enable public sharing
2. Note your username (e.g., `johndoe`)
3. Open incognito window
4. Navigate to: `http://localhost:3000/u/johndoe/bracket`
5. **Expected:**
   - Bracket preview page loads
   - Username/display name shown
   - Champion pick shown (if set)
   - Total score shown (if > 0)
   - Picks made count shown
   - Status shown (submitted/draft)
   - "Create Your Own Bracket" CTA

**Test: Public bracket page - private**
1. Disable public sharing
2. Open incognito window
3. Navigate to: `http://localhost:3000/u/{your-username}/bracket`
4. **Expected:**
   - "Bracket Not Available" message
   - "This bracket is private or does not exist"
   - CTA to create own bracket

**Test: Public bracket page - invalid username**
1. Navigate to: `http://localhost:3000/u/nonexistentuser/bracket`
2. **Expected:**
   - "Bracket Not Available" message

**Test: Incomplete bracket warning**
1. Create a bracket with < 15 picks
2. View bracket share section
3. **Expected:**
   - Yellow warning box appears
   - "Your bracket is incomplete. Complete all 15 picks for the best sharing experience."

**Test: Share link format**
1. Enable public sharing
2. Check the share link format
3. **Expected:**
   - Local dev: `http://localhost:3000/u/{username}/bracket`
   - Production: `https://{your-domain}/u/{username}/bracket`

### 5. Copy and Share Functionality

**Test: Copy button states**
1. Click any "Copy" button
2. **Expected:**
   - Button shows loading/success state
   - Text changes to "Copied!"
   - Icon changes to checkmark
   - Reverts after 2 seconds

**Test: Clipboard content**
1. Copy join code
2. Paste into a text editor
3. **Expected:**
   - Exact join code pasted (e.g., `ABC123`)

**Test: Share button (with Web Share API)**
1. On supported device, click "Share" button
2. **Expected:**
   - Native share dialog opens
   - Title, text, and URL are correct
   - Can share to apps/contacts

**Test: Share button (without Web Share API)**
1. On desktop, click "Share" button
2. **Expected:**
   - Falls back to copying URL
   - Shows "Copied!" feedback

### 6. Metadata and SEO

**Test: Invite page metadata**
1. View page source for `/join/{code}`
2. **Expected:**
   - Title: "Join {Group Name} | GoldenXI"
   - Description includes group name

**Test: Public bracket metadata**
1. View page source for `/u/{username}/bracket`
2. **Expected:**
   - Title: "{Username}'s Bracket | GoldenXI"
   - Description mentions username

### 7. Existing Features Still Work

**Test: Bracket saving**
1. Create/edit a bracket
2. Save picks
3. **Expected:**
   - Saves successfully
   - No errors

**Test: Bracket locking**
1. Complete all 15 picks
2. Lock bracket
3. **Expected:**
   - Locks successfully
   - Share section still works

**Test: Group leaderboard**
1. View group detail page
2. Check leaderboard section
3. **Expected:**
   - Leaderboard loads
   - Scores display correctly

**Test: Profile setup**
1. Create new account
2. **Expected:**
   - Redirected to profile setup
   - Can set username
   - After setup, can access features

**Test: Group settings**
1. As group creator, go to group settings
2. Change invite policy
3. **Expected:**
   - Settings save
   - Invite UI updates accordingly

### 8. RLS and Security

**Test: Cannot view private brackets**
1. User A enables public sharing
2. User B disables public sharing
3. Try to access User B's bracket page
4. **Expected:**
   - "Bracket Not Available" message
   - No data leaked

**Test: Cannot join without auth**
1. Sign out
2. Try to call join RPC directly
3. **Expected:**
   - Error: "Not authenticated"

**Test: Duplicate join prevention**
1. Join a group
2. Try to join the same group again
3. **Expected:**
   - Error: "You are already a member of this group"
   - No duplicate membership created

**Test: Late join enforcement**
1. Create locked group with `allow_late_join = false`
2. Try to join after lock time
3. **Expected:**
   - Error: "This group is locked and no longer accepting new members"

## Known Issues / Limitations

1. **Lint Error**: TypeScript may show "Cannot find module './InvitePageContent'" until the dev server restarts. This is a temporary IDE issue and will resolve on next build.

2. **OG Images**: Dynamic Open Graph images are not generated yet. Only title/description metadata is set.

3. **QR Codes**: Not implemented in this step.

4. **Email/SMS Invites**: Not implemented in this step.

5. **Downloadable Share Images**: Not implemented in this step.

## Troubleshooting

### Invite link shows "Invalid join code"
- Check that SQL migration ran successfully
- Verify `get_invite_preview` RPC function exists
- Check that join code exists in database

### Public bracket page shows "Not Available" even when public
- Check that SQL migration ran successfully
- Verify `get_public_bracket` RPC function exists
- Verify `public_bracket` column exists on profiles table
- Check that username is correct (case-sensitive)

### Copy button doesn't work
- Check browser console for errors
- Verify clipboard API is available (requires HTTPS or localhost)
- Try in a different browser

### Share button doesn't appear
- Check that Web Share API is supported
- On desktop, share button falls back to copy

### Redirect after sign-in doesn't work
- Check that redirect parameter is in URL
- Verify auth actions are updated
- Check browser console for errors

## Success Criteria

✅ All SQL migrations run without errors
✅ Invite links work for signed-out users
✅ Invite links work for signed-in users
✅ Group invite UI shows correct controls based on policy
✅ Public bracket sharing can be toggled on/off
✅ Public bracket pages load correctly
✅ Private brackets are protected
✅ Copy/share functionality works
✅ Existing features (bracket, leaderboard, settings) still work
✅ No RLS infinite recursion errors
✅ No TypeScript build errors
