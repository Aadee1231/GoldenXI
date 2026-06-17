/**
 * Cleanup script: remove all seeded demo bracket users.
 *
 * Deletes auth users created by seed-bracket-demo-users.ts.
 * Because profiles.id → auth.users has ON DELETE CASCADE, deleting the
 * auth user automatically cascades to profiles, brackets, bracket_picks,
 * bracket_group_picks, and bracket_third_place_picks.
 *
 * SAFETY: Only touches rows where profiles.is_seeded = true AND
 * seed_batch = SEED_BATCH. Real user data is never touched.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/remove-bracket-demo-users.ts
 */

import { createClient } from "@supabase/supabase-js";

const SEED_BATCH = "bracket-seed-1";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // -------------------------------------------------------------------------
  // 1. Find all seeded profile IDs for this batch
  // -------------------------------------------------------------------------
  const { data: seededProfiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("is_seeded", true)
    .eq("seed_batch", SEED_BATCH);

  if (profilesErr) {
    console.error("❌ Could not fetch seeded profiles:", profilesErr.message);
    process.exit(1);
  }

  if (!seededProfiles || seededProfiles.length === 0) {
    console.log(`ℹ️  No seeded profiles found for batch "${SEED_BATCH}". Nothing to remove.`);
    return;
  }

  console.log(`Found ${seededProfiles.length} seeded user(s) in batch "${SEED_BATCH}".`);

  // -------------------------------------------------------------------------
  // 2. Delete auth users (cascades to profiles → brackets → picks)
  // -------------------------------------------------------------------------
  let deleted = 0;
  let failed = 0;

  for (const profile of seededProfiles) {
    const { error } = await supabase.auth.admin.deleteUser(profile.id);
    if (error) {
      console.error(`  ❌ Failed to delete auth user ${profile.username} (${profile.id}): ${error.message}`);
      failed++;
    } else {
      console.log(`  ✅ Deleted: ${profile.username} (${profile.id})`);
      deleted++;
    }
  }

  // -------------------------------------------------------------------------
  // 3. Re-enable bracket seed entries if desired (optional)
  // -------------------------------------------------------------------------
  // Uncomment if you want to restore the old leaderboard_seed_entries after cleanup:
  // await supabase
  //   .from("leaderboard_seed_entries")
  //   .update({ is_active: true })
  //   .eq("leaderboard_type", "bracket");

  console.log(`\n🏁 Done. Deleted: ${deleted}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
