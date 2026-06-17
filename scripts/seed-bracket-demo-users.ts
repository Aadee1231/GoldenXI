/**
 * Seed script: create 50 realistic demo bracket users.
 *
 * These users are inserted into the real data model (profiles, brackets,
 * bracket_group_picks, bracket_third_place_picks, bracket_picks) so they
 * appear naturally on the leaderboard and their "View bracket" / "Score
 * details" pages work exactly like real users.
 *
 * Prerequisites:
 *   1. Run supabase/add-seed-tracking-columns.sql in Supabase SQL editor.
 *   2. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-bracket-demo-users.ts
 */

import { createClient } from "@supabase/supabase-js";

const SEED_BATCH = "bracket-seed-1";

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helper (seeded by string so results are stable)
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRng(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return mulberry32(h >>> 0);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ---------------------------------------------------------------------------
// 50 realistic seed users
// ---------------------------------------------------------------------------
const SEED_USERS = [
  { username: "alexmartini",    display_name: "Alex Martini" },
  { username: "sorayalewis",    display_name: "Soraya Lewis" },
  { username: "rafaelcruz92",   display_name: "Rafael Cruz" },
  { username: "priyachadha",    display_name: "Priya Chadha" },
  { username: "tomw_picks",     display_name: "Tom Whitfield" },
  { username: "juancarlos11",   display_name: "Juan Carlos" },
  { username: "annakovacs",     display_name: "Anna Kovács" },
  { username: "benfletch",      display_name: "Ben Fletcher" },
  { username: "larakumar",      display_name: "Lara Kumar" },
  { username: "oskarsson",      display_name: "Erik Oskarsson" },
  { username: "miaferreira",    display_name: "Mia Ferreira" },
  { username: "callumross",     display_name: "Callum Ross" },
  { username: "natalia_wp",     display_name: "Natalia Wierzbicka" },
  { username: "davidtran86",    display_name: "David Tran" },
  { username: "simoneklein",    display_name: "Simone Klein" },
  { username: "hamzayilmaz",    display_name: "Hamza Yılmaz" },
  { username: "chloe_ftbl",     display_name: "Chloé Blanc" },
  { username: "marcusbell",     display_name: "Marcus Bell" },
  { username: "yuki_fc",        display_name: "Yuki Tanaka" },
  { username: "oliviart",       display_name: "Olivia Reyes" },
  { username: "sebastiank",     display_name: "Sebastian König" },
  { username: "amara_ng",       display_name: "Amara Nwosu" },
  { username: "jakemorris",     display_name: "Jake Morris" },
  { username: "luisabraga",     display_name: "Luísa Braga" },
  { username: "daniyar_k",      display_name: "Daniyar Kasymov" },
  { username: "sophiehunt",     display_name: "Sophie Hunt" },
  { username: "nicolasv",       display_name: "Nicolas Vidal" },
  { username: "zinabou",        display_name: "Zina Bouaziz" },
  { username: "rorymc",         display_name: "Rory McCallum" },
  { username: "emiliorojas",    display_name: "Emilio Rojas" },
  { username: "helenw_fc",      display_name: "Helen Weston" },
  { username: "kumardeep",      display_name: "Kumar Deep" },
  { username: "leapham",        display_name: "Léa Pham" },
  { username: "okonkwo99",      display_name: "Obi Okonkwo" },
  { username: "katarzyna_p",    display_name: "Katarzyna Piotrowska" },
  { username: "frederiksen",    display_name: "Lars Frederiksen" },
  { username: "marisolv",       display_name: "Marisol Vargas" },
  { username: "aaravpatel",     display_name: "Aarav Patel" },
  { username: "ingridberg",     display_name: "Ingrid Berg" },
  { username: "tomasferro",     display_name: "Tomás Ferro" },
  { username: "ashleyng",       display_name: "Ashley Ng" },
  { username: "dimitrisp",      display_name: "Dimitris Papadopoulos" },
  { username: "celestef",       display_name: "Céleste Fontaine" },
  { username: "robinhood42",    display_name: "Robin Hood" },
  { username: "sabinamuller",   display_name: "Sabina Müller" },
  { username: "chinwe_fc",      display_name: "Chinwe Obi" },
  { username: "arturogm",       display_name: "Arturo García" },
  { username: "meredithj",      display_name: "Meredith Jones" },
  { username: "viktorhansen",   display_name: "Viktor Hansen" },
  { username: "yasminhamed",    display_name: "Yasmin Hamed" },
];

// Spread of favorite champions across the 50 users (realistic distribution)
const CHAMPION_CODES = [
  "ESP", "ESP", "ESP", "ESP", "ESP",
  "FRA", "FRA", "FRA", "FRA", "FRA",
  "BRA", "BRA", "BRA", "BRA",
  "ARG", "ARG", "ARG", "ARG",
  "ENG", "ENG", "ENG",
  "GER", "GER", "GER",
  "POR", "POR", "POR",
  "NED", "NED",
  "MEX", "MEX",
  "USA", "USA",
  "URU",
  "BEL",
  "COL",
  "NOR",
  "CAN",
  "AUS",
  "JPN",
  "SEN",
  "MAR",
  "ESP",
  "FRA",
  "ARG",
  "BRA",
  "GER",
  "POR",
  "ENG",
  "NED",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
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
  // 1. Get active tournament
  // -------------------------------------------------------------------------
  const { data: tournament, error: tErr } = await supabase
    .from("tournaments")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (tErr || !tournament) {
    console.error("❌ Could not find active tournament:", tErr?.message);
    process.exit(1);
  }
  const tournamentId: string = tournament.id;
  console.log(`✅ Tournament: ${tournamentId}`);

  // -------------------------------------------------------------------------
  // 2. Load teams grouped by group_label
  // -------------------------------------------------------------------------
  const { data: teams, error: teamsErr } = await supabase
    .from("teams")
    .select("id, name, code, group_label")
    .eq("tournament_id", tournamentId)
    .not("group_label", "is", null);

  if (teamsErr || !teams || teams.length === 0) {
    console.error("❌ Could not load teams:", teamsErr?.message);
    process.exit(1);
  }

  const teamsByGroup = new Map<string, { id: string; name: string; code: string }[]>();
  for (const t of teams) {
    if (!t.group_label) continue;
    if (!teamsByGroup.has(t.group_label)) teamsByGroup.set(t.group_label, []);
    teamsByGroup.get(t.group_label)!.push({ id: t.id, name: t.name, code: t.code });
  }

  const teamByCode = new Map(teams.map((t) => [t.code, t.id]));
  console.log(`✅ Teams loaded: ${teams.length} across ${teamsByGroup.size} groups`);

  // -------------------------------------------------------------------------
  // 3. Load knockout matches (r32, r16, qf, sf, final)
  // -------------------------------------------------------------------------
  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select("id, round, match_number")
    .eq("tournament_id", tournamentId)
    .in("round", ["r32", "r16", "qf", "sf", "final"])
    .order("round")
    .order("match_number");

  if (matchErr || !matches || matches.length === 0) {
    console.error("❌ Could not load matches:", matchErr?.message);
    process.exit(1);
  }

  const matchesByRound = new Map<string, { id: string; match_number: number }[]>();
  for (const m of matches) {
    if (!matchesByRound.has(m.round)) matchesByRound.set(m.round, []);
    matchesByRound.get(m.round)!.push({ id: m.id, match_number: m.match_number });
  }

  const finalMatch = matchesByRound.get("final")?.[0];
  if (!finalMatch) {
    console.error("❌ No final match found");
    process.exit(1);
  }
  console.log(`✅ Matches loaded: ${matches.length} knockout matches`);

  // -------------------------------------------------------------------------
  // 4. Check for existing seed batch (idempotency guard)
  // -------------------------------------------------------------------------
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("seed_batch", SEED_BATCH)
    .limit(1);

  if (existing && existing.length > 0) {
    console.warn(`⚠️  Seed batch "${SEED_BATCH}" already exists. Run remove-bracket-demo-users.ts first.`);
    process.exit(0);
  }

  // -------------------------------------------------------------------------
  // 5. Create users
  // -------------------------------------------------------------------------
  const groupLabels = Array.from(teamsByGroup.keys()).sort();
  let created = 0;
  let failed = 0;

  for (let i = 0; i < SEED_USERS.length; i++) {
    const { username, display_name } = SEED_USERS[i];
    const rng = seededRng(`${SEED_BATCH}:${username}`);
    const championCode = CHAMPION_CODES[i % CHAMPION_CODES.length];
    const championId = teamByCode.get(championCode);

    if (!championId) {
      console.warn(`  ⚠️  Champion code "${championCode}" not found in DB, skipping ${username}`);
      failed++;
      continue;
    }

    console.log(`\n[${i + 1}/50] ${username} (champion: ${championCode})`);

    // -- Create auth user --------------------------------------------------
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: `${username}.seed@goldenxi.internal`,
      email_confirm: true,
      user_metadata: { display_name, is_seeded: true, seed_batch: SEED_BATCH },
    });

    if (authErr || !authData?.user) {
      console.error(`  ❌ Auth user creation failed: ${authErr?.message}`);
      failed++;
      continue;
    }
    const userId = authData.user.id;

    // -- Upsert profile ----------------------------------------------------
    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: userId,
      username,
      display_name,
      public_bracket: true,
      is_seeded: true,
      seed_batch: SEED_BATCH,
    });

    if (profileErr) {
      console.error(`  ❌ Profile upsert failed: ${profileErr.message}`);
      await supabase.auth.admin.deleteUser(userId);
      failed++;
      continue;
    }

    // -- Create bracket ----------------------------------------------------
    const submittedAt = new Date(
      Date.now() - Math.floor(rng() * 30 * 24 * 60 * 60 * 1000)
    ).toISOString();

    const { data: bracket, error: bracketErr } = await supabase
      .from("brackets")
      .insert({
        user_id: userId,
        tournament_id: tournamentId,
        name: `${display_name.split(" ")[0]}'s Bracket`,
        status: "submitted",
        submitted_at: submittedAt,
        is_locked: true,
        is_seeded: true,
        seed_batch: SEED_BATCH,
      })
      .select("id")
      .single();

    if (bracketErr || !bracket) {
      console.error(`  ❌ Bracket creation failed: ${bracketErr?.message}`);
      await supabase.auth.admin.deleteUser(userId);
      failed++;
      continue;
    }
    const bracketId = bracket.id;

    // -- Group picks (12 groups × 4 positions) ----------------------------
    const groupPickRows: { bracket_id: string; group_label: string; team_id: string; position: number }[] = [];

    for (const label of groupLabels) {
      const groupTeams = teamsByGroup.get(label) ?? [];
      const shuffled = shuffle(groupTeams, rng);
      shuffled.forEach((t, pos) => {
        groupPickRows.push({ bracket_id: bracketId, group_label: label, team_id: t.id, position: pos + 1 });
      });
    }

    const { error: gpErr } = await supabase.from("bracket_group_picks").insert(groupPickRows);
    if (gpErr) {
      console.error(`  ❌ Group picks failed: ${gpErr.message}`);
      await supabase.auth.admin.deleteUser(userId);
      failed++;
      continue;
    }

    // -- Third-place picks (exactly 8 of the 12 group 3rd-placers) --------
    const thirdPlacePool = groupLabels.map((label) => {
      const shuffled = groupPickRows.filter((r) => r.group_label === label).sort((a, b) => a.position - b.position);
      return shuffled[2]?.team_id;
    }).filter(Boolean) as string[];

    const thirdPlaceSelected = shuffle(thirdPlacePool, rng).slice(0, 8);
    const tpRows = thirdPlaceSelected.map((team_id) => ({ bracket_id: bracketId, team_id }));

    const { error: tpErr } = await supabase.from("bracket_third_place_picks").insert(tpRows);
    if (tpErr) {
      console.error(`  ❌ Third-place picks failed: ${tpErr.message}`);
      await supabase.auth.admin.deleteUser(userId);
      failed++;
      continue;
    }

    // -- Knockout picks ---------------------------------------------------
    // Strategy: pick the champion for final, and spread picks across the
    // pool of all 48 teams for earlier rounds (realistic guesses).
    // The champion is forced into the final match pick.
    const allTeamIds = teams.map((t) => t.id);
    const knockoutPickRows: { bracket_id: string; match_id: string; picked_team_id: string }[] = [];

    const rounds = ["r32", "r16", "qf", "sf", "final"] as const;
    for (const round of rounds) {
      const roundMatches = matchesByRound.get(round) ?? [];
      for (const m of roundMatches) {
        let pickedTeamId: string;
        if (round === "final") {
          pickedTeamId = championId;
        } else {
          // 60% chance of picking champion's "side" — just pick from full pool
          pickedTeamId = rng() < 0.6 ? championId : pick(allTeamIds, rng);
        }
        knockoutPickRows.push({ bracket_id: bracketId, match_id: m.id, picked_team_id: pickedTeamId });
      }
    }

    const { error: kpErr } = await supabase.from("bracket_picks").insert(knockoutPickRows);
    if (kpErr) {
      console.error(`  ❌ Knockout picks failed: ${kpErr.message}`);
      await supabase.auth.admin.deleteUser(userId);
      failed++;
      continue;
    }

    console.log(`  ✅ Created: bracket ${bracketId}`);
    created++;
  }

  console.log(`\n🏁 Done. Created: ${created}, Failed: ${failed}`);
  if (failed > 0) console.log(`   Re-run after fixing failures to retry failed users.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
