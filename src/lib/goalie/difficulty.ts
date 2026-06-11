/**
 * difficulty.ts — Goalkeeper camera-mode difficulty progression.
 *
 * Each stage defines all parameters for a range of shot numbers:
 *   · flightMs    — save window duration (ms) — primary "speed" knob
 *   · forgiveness — zone boundary margin for palmInZone save detection
 *   · runupMinMs  — minimum whistle-to-kick delay (ms)
 *   · runupMaxMs  — maximum whistle-to-kick delay (ms) — variance = unpredictability
 *   · zoneWeights — relative probability of each zone being targeted
 *
 * Zone difficulty notes:
 *   top-left / top-right  → hardest (large arm travel, cross-body)
 *   top-middle            → medium  (up but no reach)
 *   bottom-left/right     → easy    (natural lean)
 *   bottom-middle         → easiest (arms already low and centred)
 *
 * Anti-repeat: pickWeightedZone() applies a 70% weight penalty to zones
 * used in the last 2 shots — avoids exploitation and monotony while never
 * making any zone impossible.
 */

import { ALL_SHOT_ZONES, type ShotZone } from "@/src/lib/goalie/geometry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DifficultyStage = {
  /** Human-readable name shown in the DEBUG overlay. */
  name: string;
  /** First 1-indexed shot number where this stage is active. */
  minShot: number;
  /** Ball flight window — time the player has to react (ms). */
  flightMs: number;
  /**
   * Zone boundary forgiveness for save detection.
   * Passed directly to palmInZone():
   *   +0.04 = zone boundary expands 4 % → more generous (easy)
   *    0.00 = exact hard-boundary match (hard)
   */
  forgiveness: number;
  /** Minimum runup delay between whistle and kick (ms). */
  runupMinMs: number;
  /** Maximum runup delay — higher range = more unpredictable timing. */
  runupMaxMs: number;
  /** Relative weights for zone selection (need not sum to 1). */
  zoneWeights: Record<ShotZone, number>;
};

// ---------------------------------------------------------------------------
// Stage definitions
// ---------------------------------------------------------------------------

export const DIFFICULTY_STAGES: DifficultyStage[] = [
  {
    name: "Warm Up",
    minShot: 1,
    flightMs: 1600,
    forgiveness: 0.04,
    runupMinMs: 1000,
    runupMaxMs: 3500,
    zoneWeights: {
      "top-left":      1,  // rare — avoid corners early
      "top-middle":    2,
      "top-right":     1,
      "bottom-left":   4,  // bias toward easy bottom zones
      "bottom-middle": 5,  // most common — natural position
      "bottom-right":  4,
    },
  },
  {
    name: "Building",
    minShot: 6,
    flightMs: 1350,
    forgiveness: 0.03,
    runupMinMs: 900,
    runupMaxMs: 3200,
    zoneWeights: {
      "top-left":      2,
      "top-middle":    3,
      "top-right":     2,
      "bottom-left":   4,
      "bottom-middle": 4,
      "bottom-right":  4,
    },
  },
  {
    name: "In the Zone",
    minShot: 11,
    flightMs: 1150,
    forgiveness: 0.02,
    runupMinMs: 800,
    runupMaxMs: 3000,
    zoneWeights: {
      "top-left":      3,  // all zones equal
      "top-middle":    3,
      "top-right":     3,
      "bottom-left":   3,
      "bottom-middle": 3,
      "bottom-right":  3,
    },
  },
  {
    name: "Pressure",
    minShot: 21,
    flightMs: 950,
    forgiveness: 0.01,
    runupMinMs: 700,
    runupMaxMs: 2600,
    zoneWeights: {
      "top-left":      4,  // corners start dominating
      "top-middle":    2,
      "top-right":     4,
      "bottom-left":   3,
      "bottom-middle": 1,  // easy centre fades
      "bottom-right":  3,
    },
  },
  {
    name: "Elite",
    minShot: 31,
    flightMs: 750,
    forgiveness: 0.00,
    runupMinMs: 600,
    runupMaxMs: 2200,
    zoneWeights: {
      "top-left":      5,  // brutal — corners dominate
      "top-middle":    1,
      "top-right":     5,
      "bottom-left":   2,
      "bottom-middle": 1,
      "bottom-right":  2,
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the active difficulty stage for a given 1-indexed shot number.
 * Scans forward and returns the last stage whose minShot ≤ shot.
 */
export function getDifficultyForShot(shot: number): DifficultyStage {
  let active = DIFFICULTY_STAGES[0];
  for (const stage of DIFFICULTY_STAGES) {
    if (shot >= stage.minShot) active = stage;
    else break;
  }
  return active;
}

/**
 * Weighted random zone selection with anti-repeat dampening.
 *
 * · forcedZone: dev override — bypasses weighting entirely.
 * · recentZones: last N zones used. Each repeated zone has its weight
 *   reduced to 30 % of its original value (70 % penalty), making
 *   the same easy zone unlikely to appear multiple shots in a row.
 *   Minimum effective weight is clamped to 30 % of the base weight —
 *   no zone is ever completely removed.
 */
export function pickWeightedZone(
  weights: Record<ShotZone, number>,
  recentZones: ShotZone[],
  forcedZone: ShotZone | null = null,
): ShotZone {
  if (forcedZone !== null) return forcedZone;

  const adjusted: Record<ShotZone, number> = { ...weights };
  for (const zone of recentZones) {
    adjusted[zone] = Math.max(adjusted[zone] * 0.30, weights[zone] * 0.30);
  }

  const total = ALL_SHOT_ZONES.reduce((sum, z) => sum + adjusted[z], 0);
  let r = Math.random() * total;
  for (const zone of ALL_SHOT_ZONES) {
    r -= adjusted[zone];
    if (r <= 0) return zone;
  }
  return ALL_SHOT_ZONES[ALL_SHOT_ZONES.length - 1]; // fallback (floating-point safety)
}

/**
 * Returns formatted debug lines for the difficulty indicator pre element.
 * Included at the top of both the shot and ready debug panels.
 */
export function difficultyDebugLines(stage: DifficultyStage, shot: number): string[] {
  const w = stage.zoneWeights;
  return [
    `── DIFFICULTY ──────────────────────`,
    `Stage:       ${stage.name}  (shot ${shot}, minShot ${stage.minShot})`,
    `Flight ms:   ${stage.flightMs}ms`,
    `Forgiveness: ${stage.forgiveness}`,
    `Runup:       ${stage.runupMinMs}–${stage.runupMaxMs}ms`,
    `Weights:     TL=${w["top-left"]} TM=${w["top-middle"]} TR=${w["top-right"]}`,
    `             BL=${w["bottom-left"]} BM=${w["bottom-middle"]} BR=${w["bottom-right"]}`,
  ];
}
