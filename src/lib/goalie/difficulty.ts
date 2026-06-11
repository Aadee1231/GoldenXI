/**
 * difficulty.ts — Goalkeeper camera-mode difficulty progression (v3_hard).
 *
 * Each stage defines all parameters for a range of shot numbers:
 *   · flightMinMs / flightMaxMs  — ball flight window range (ms)
 *   · fakeoutChance              — probability of a slow deceptive ball
 *   · fakeoutFlightMinMs/MaxMs   — slow-ball flight range
 *   · runupMinMs / runupMaxMs    — whistle-to-kick delay range
 *   · curveChance                — probability of a curved/swerving visual
 *   · zoneWeights                — relative probability of each zone
 *
 * Save detection uses target pockets (palmInPocket) — not full zones.
 * Pocket size is computed by getPocketSize(shot) in geometry.ts.
 *
 * Anti-repeat: pickWeightedZone() applies a 70% weight penalty to zones
 * used in the last 2 shots — avoids exploitation while never removing any zone.
 */

import { ALL_SHOT_ZONES, type ShotZone } from "@/src/lib/goalie/geometry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Visual style of the shot ball — purely decorative, save logic unchanged. */
export type ShotStyle =
  | "straight"
  | "slight-curve"
  | "heavy-curve"
  | "late-swerve"
  | "slow-fakeout";

export type DifficultyStage = {
  /** Human-readable name shown in the DEBUG overlay. */
  name: string;
  /** First 1-indexed shot number where this stage is active. */
  minShot: number;
  /** Minimum ball flight window for normal shots (ms). */
  flightMinMs: number;
  /** Maximum ball flight window for normal shots (ms). */
  flightMaxMs: number;
  /** Probability [0–1] that this shot is a slow deceptive fakeout. */
  fakeoutChance: number;
  /** Minimum flight for fakeout (slow, deceptive) shots (ms). */
  fakeoutFlightMinMs: number;
  /** Maximum flight for fakeout shots (ms). */
  fakeoutFlightMaxMs: number;
  /** Minimum runup delay between whistle and kick (ms). */
  runupMinMs: number;
  /** Maximum runup delay — higher range = more unpredictable timing. */
  runupMaxMs: number;
  /** Probability [0–1] that the ball uses a curved/swerving animation. */
  curveChance: number;
  /** Relative weights for zone selection (need not sum to 1). */
  zoneWeights: Record<ShotZone, number>;
};

// ---------------------------------------------------------------------------
// Stage definitions
// ---------------------------------------------------------------------------

export const DIFFICULTY_STAGES: DifficultyStage[] = [
  {
    name: "Warmup",
    minShot: 1,  // shots 1–7
    flightMinMs: 1350,
    flightMaxMs: 1600,
    fakeoutChance: 0,
    fakeoutFlightMinMs: 1350,
    fakeoutFlightMaxMs: 1600,
    runupMinMs: 900,
    runupMaxMs: 1800,
    curveChance: 0,
    zoneWeights: {
      "top-left":      1.0,
      "top-middle":    1.0,
      "top-right":     1.0,
      "bottom-left":   1.3,
      "bottom-middle": 1.5,
      "bottom-right":  1.3,
    },
  },
  {
    name: "Medium",
    minShot: 8,  // shots 8–13
    flightMinMs: 1050,
    flightMaxMs: 1350,
    fakeoutChance: 0,
    fakeoutFlightMinMs: 1050,
    fakeoutFlightMaxMs: 1350,
    runupMinMs: 700,
    runupMaxMs: 2200,
    curveChance: 0.15,
    zoneWeights: {
      "top-left":      1.5,
      "top-middle":    1.2,
      "top-right":     1.5,
      "bottom-left":   1.2,
      "bottom-middle": 1.0,
      "bottom-right":  1.2,
    },
  },
  {
    name: "Hard",
    minShot: 14, // shots 14–23
    flightMinMs: 800,
    flightMaxMs: 1100,
    fakeoutChance: 0.15,
    fakeoutFlightMinMs: 1100,
    fakeoutFlightMaxMs: 1400,
    runupMinMs: 500,
    runupMaxMs: 2600,
    curveChance: 0.45,
    zoneWeights: {
      "top-left":      2.2,
      "top-middle":    1.6,
      "top-right":     2.2,
      "bottom-left":   1.0,
      "bottom-middle": 0.6,
      "bottom-right":  1.0,
    },
  },
  {
    name: "Expert",
    minShot: 24, // shots 24–38
    flightMinMs: 600,
    flightMaxMs: 900,
    fakeoutChance: 0.20,
    fakeoutFlightMinMs: 1100,
    fakeoutFlightMaxMs: 1400,
    runupMinMs: 350,
    runupMaxMs: 3000,
    curveChance: 0.70,
    zoneWeights: {
      "top-left":      3.0,
      "top-middle":    2.0,
      "top-right":     3.0,
      "bottom-left":   0.8,
      "bottom-middle": 0.4,
      "bottom-right":  0.8,
    },
  },
  {
    name: "Insane",
    minShot: 39, // shots 39+
    flightMinMs: 450,
    flightMaxMs: 750,
    fakeoutChance: 0.15,
    fakeoutFlightMinMs: 1100,
    fakeoutFlightMaxMs: 1400,
    runupMinMs: 250,
    runupMaxMs: 3200,
    curveChance: 0.85,
    zoneWeights: {
      "top-left":      3.0,
      "top-middle":    2.0,
      "top-right":     3.0,
      "bottom-left":   0.8,
      "bottom-middle": 0.4,
      "bottom-right":  0.8,
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
 * Picks a shot style weighted by the stage's curve/fakeout probabilities.
 * Higher stages see more curves, swerves, and late-breaking balls.
 */
export function pickShotStyle(stage: DifficultyStage): ShotStyle {
  if (Math.random() < stage.fakeoutChance) return "slow-fakeout";
  if (Math.random() >= stage.curveChance)  return "straight";
  const r = Math.random();
  if (r < 0.35) return "slight-curve";
  if (r < 0.70) return "heavy-curve";
  return "late-swerve";
}

/**
 * Returns the ball flight duration for the given stage and style.
 * Fakeout shots use a slower, deceptive flight range.
 * All other shots pick randomly within the stage's normal range.
 */
export function pickFlightMs(stage: DifficultyStage, style: ShotStyle): number {
  if (style === "slow-fakeout") {
    return stage.fakeoutFlightMinMs +
      Math.floor(Math.random() * (stage.fakeoutFlightMaxMs - stage.fakeoutFlightMinMs + 1));
  }
  return stage.flightMinMs +
    Math.floor(Math.random() * (stage.flightMaxMs - stage.flightMinMs + 1));
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
    `Flight ms:   ${stage.flightMinMs}–${stage.flightMaxMs}ms`,
    `Fakeout:     ${(stage.fakeoutChance * 100).toFixed(0)}% (${stage.fakeoutFlightMinMs}–${stage.fakeoutFlightMaxMs}ms)`,
    `Curve chance:${(stage.curveChance * 100).toFixed(0)}%`,
    `Runup:       ${stage.runupMinMs}–${stage.runupMaxMs}ms`,
    `Weights:     TL=${w["top-left"]} TM=${w["top-middle"]} TR=${w["top-right"]}`,
    `             BL=${w["bottom-left"]} BM=${w["bottom-middle"]} BR=${w["bottom-right"]}`,
  ];
}
