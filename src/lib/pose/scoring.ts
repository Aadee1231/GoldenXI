/**
 * Celebration Pose-Off — Scoring Engine
 *
 * Computes a 0-100 similarity score between a live set of joint angles and a
 * pose template, then maps it to a quality tier and point value.
 */

import type { PoseTemplate, PoseJoint } from "./templates";

// ---------------------------------------------------------------------------
// Landmark types (MediaPipe full-body, normalised 0-1)
// ---------------------------------------------------------------------------

export type Landmark = { x: number; y: number; z: number; visibility?: number };

export type PoseLandmarks = {
  // Upper body
  leftShoulder:  Landmark; // 11
  rightShoulder: Landmark; // 12
  leftElbow:     Landmark; // 13
  rightElbow:    Landmark; // 14
  leftWrist:     Landmark; // 15
  rightWrist:    Landmark; // 16
  // Lower body
  leftHip:       Landmark; // 23
  rightHip:      Landmark; // 24
  leftKnee:      Landmark; // 25
  rightKnee:     Landmark; // 26
  leftAnkle:     Landmark; // 27
  rightAnkle:    Landmark; // 28
};

export type MatchTier = "PERFECT" | "GREAT" | "CLOSE" | "MISS";

export type MatchResult = {
  score: number;          // 0-100, best of normal vs mirrored
  tier: MatchTier;
  points: number;         // base points before streak bonus
  jointScores: Partial<Record<PoseJoint, number>>;
  // Per-limb (0-100) — average of elbow + shoulder for each side
  leftArmScore:  number;
  rightArmScore: number;
  // Mirror diagnostics
  normalScore:   number;
  mirroredScore: number;
  wasMirrored:   boolean;
  // In-game coaching string (null when pose is GREAT or better)
  helperText: string | null;
};

// ---------------------------------------------------------------------------
// Scoring constants
// ---------------------------------------------------------------------------

const TIER_THRESHOLDS: Record<MatchTier, number> = {
  PERFECT: 85,
  GREAT:   70,
  CLOSE:   50,
  MISS:     0,
};

const BASE_POINTS: Record<MatchTier, number> = {
  PERFECT: 100,
  GREAT:    70,
  CLOSE:    30,
  MISS:      0,
};

/**
 * Lower-body joints contribute very little to the score in v1.
 * Upper-body pose accuracy is what matters for celebration poses.
 */
const LOWER_BODY_JOINTS = new Set<PoseJoint>(["leftHip", "rightHip", "leftKnee", "rightKnee"]);
const LOWER_BODY_WEIGHT_MULT = 0.12;

export const STREAK_MULTIPLIERS: Array<{ streak: number; multiplier: number }> = [
  { streak: 8, multiplier: 2.0 },
  { streak: 5, multiplier: 1.5 },
  { streak: 3, multiplier: 1.2 },
];

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Angle in degrees at the vertex point B of the A→B→C chain. */
function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/** Maps a measured angle error to a 0-100 joint score using a soft falloff. */
function errorToScore(error: number, tolerance: number): number {
  if (error <= tolerance * 0.3) return 100;
  const ratio = error / tolerance;
  if (ratio <= 1.0) return Math.round(100 - 40 * ((ratio - 0.3) / 0.7));
  // Beyond tolerance: steep falloff but never drops all the way to 0 at 2× tol
  const overshoot = Math.min(ratio - 1.0, 1.5) / 1.5;
  return Math.round(60 * (1 - overshoot));
}

// ---------------------------------------------------------------------------
// Extract joint angles from live landmarks
// ---------------------------------------------------------------------------

export function computeJointAngles(lm: PoseLandmarks): Record<PoseJoint, number> {
  return {
    leftElbow:     angleDeg(lm.leftShoulder,  lm.leftElbow,     lm.leftWrist),
    rightElbow:    angleDeg(lm.rightShoulder, lm.rightElbow,    lm.rightWrist),
    leftShoulder:  angleDeg(lm.leftHip,       lm.leftShoulder,  lm.leftElbow),
    rightShoulder: angleDeg(lm.rightHip,      lm.rightShoulder, lm.rightElbow),
    leftHip:       angleDeg(lm.leftShoulder,  lm.leftHip,       lm.leftKnee),
    rightHip:      angleDeg(lm.rightShoulder, lm.rightHip,      lm.rightKnee),
    leftKnee:      angleDeg(lm.leftHip,       lm.leftKnee,      lm.leftAnkle),
    rightKnee:     angleDeg(lm.rightHip,      lm.rightKnee,     lm.rightAnkle),
  };
}

// ---------------------------------------------------------------------------
// Core match function
// ---------------------------------------------------------------------------

/** Exported tier classifier — also used by the UI layer for score smoothing. */
export function tierFromScore(s: number): MatchTier {
  if (s >= TIER_THRESHOLDS.PERFECT) return "PERFECT";
  if (s >= TIER_THRESHOLDS.GREAT)   return "GREAT";
  if (s >= TIER_THRESHOLDS.CLOSE)   return "CLOSE";
  return "MISS";
}

/** Flip left ↔ right in a joint name so the player can mirror the pose naturally. */
function mirrorJoint(j: PoseJoint): PoseJoint {
  if (j.startsWith("left"))  return j.replace("left",  "right") as PoseJoint;
  if (j.startsWith("right")) return j.replace("right", "left")  as PoseJoint;
  return j;
}

type ScoreBreakdown = {
  score: number;
  jointScores: Partial<Record<PoseJoint, number>>;
  leftArmScore: number;
  rightArmScore: number;
};

/**
 * Score live landmarks against one template orientation.
 * Lower-body joints are down-weighted so legs barely affect the result.
 */
function scoreTemplate(lm: PoseLandmarks, template: PoseTemplate): ScoreBreakdown {
  const liveAngles = computeJointAngles(lm);
  const jointScores: Partial<Record<PoseJoint, number>> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const { joint, target, weight } of template.joints) {
    const ew    = LOWER_BODY_JOINTS.has(joint) ? weight * LOWER_BODY_WEIGHT_MULT : weight;
    const error = Math.abs(liveAngles[joint] - target);
    const js    = errorToScore(error, template.defaultTolerance);
    jointScores[joint] = js;
    weightedSum += js * ew;
    totalWeight += ew;
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  const js = jointScores;
  const leftArmScore  = Math.round(((js.leftElbow  ?? 100) + (js.leftShoulder  ?? 100)) / 2);
  const rightArmScore = Math.round(((js.rightElbow ?? 100) + (js.rightShoulder ?? 100)) / 2);

  return { score, jointScores, leftArmScore, rightArmScore };
}

/** Internal coaching-text generator using the winning template orientation. */
function _helperText(
  lm: PoseLandmarks,
  template: PoseTemplate,
  jointScores: Partial<Record<PoseJoint, number>>,
): string | null {
  const live = computeJointAngles(lm);
  let worstJoint: PoseJoint | null = null;
  let worstWeightedErr = 0;

  for (const { joint, target, weight } of template.joints) {
    if (LOWER_BODY_JOINTS.has(joint) || weight < 0.12) continue;
    const err = Math.abs(live[joint] - target) * weight;
    if (err > worstWeightedErr) { worstWeightedErr = err; worstJoint = joint; }
  }

  if (!worstJoint) return null;
  const target = template.joints.find(j => j.joint === worstJoint)!.target;
  if (Math.abs(live[worstJoint] - target) < 20) return null;

  const diff = live[worstJoint] - target;
  switch (worstJoint) {
    case "leftShoulder":  return diff > 0 ? "Lower your left arm"          : "Raise your left arm";
    case "rightShoulder": return diff > 0 ? "Lower your right arm"         : "Raise your right arm";
    case "leftElbow":     return diff > 0 ? "Straighten your left elbow"   : "Bend your left elbow more";
    case "rightElbow":    return diff > 0 ? "Straighten your right elbow"  : "Bend your right elbow more";
    default:              return null;
  }
}

/**
 * Main entry point.
 * Scores both normal and mirrored orientations; returns the higher score.
 * Mirroring lets players copy the pose naturally even if they flip L/R.
 */
export function matchPose(lm: PoseLandmarks, template: PoseTemplate): MatchResult {
  const normal = scoreTemplate(lm, template);

  const mirroredTemplate: PoseTemplate = {
    ...template,
    joints: template.joints.map(({ joint, target, weight }) => ({
      joint: mirrorJoint(joint), target, weight,
    })),
  };
  const mirrored = scoreTemplate(lm, mirroredTemplate);

  const wasMirrored = mirrored.score > normal.score;
  const best        = wasMirrored ? mirrored : normal;
  const score       = best.score;
  const tier        = tierFromScore(score);

  const effectiveTemplate = wasMirrored ? mirroredTemplate : template;
  const helperText = score < TIER_THRESHOLDS.GREAT
    ? _helperText(lm, effectiveTemplate, best.jointScores)
    : null;

  return {
    score,
    tier,
    points: BASE_POINTS[tier],
    jointScores:   best.jointScores,
    leftArmScore:  best.leftArmScore,
    rightArmScore: best.rightArmScore,
    normalScore:   normal.score,
    mirroredScore: mirrored.score,
    wasMirrored,
    helperText,
  };
}

// ---------------------------------------------------------------------------
// Streak bonus
// ---------------------------------------------------------------------------

export function applyStreakBonus(basePoints: number, streak: number): number {
  for (const { streak: minStreak, multiplier } of STREAK_MULTIPLIERS) {
    if (streak >= minStreak) {
      return Math.round(basePoints * multiplier);
    }
  }
  return basePoints;
}

// ---------------------------------------------------------------------------
// Visibility gate — require key joints to be reasonably visible
// ---------------------------------------------------------------------------

const REQUIRED_JOINTS: Array<keyof PoseLandmarks> = [
  "leftShoulder", "rightShoulder",
  "leftElbow",    "rightElbow",
  "leftWrist",    "rightWrist",
  "leftHip",      "rightHip",
  "leftKnee",     "rightKnee",
  "leftAnkle",    "rightAnkle",
];

const VISIBILITY_THRESHOLD = 0.55;

export type VisibilityStatus =
  | "ok"
  | "no-pose"
  | "move-back"
  | "bad-lighting";

export function checkVisibility(lm: PoseLandmarks | null): VisibilityStatus {
  if (!lm) return "no-pose";

  const scores = REQUIRED_JOINTS.map((k) => lm[k]?.visibility ?? 0);
  const lowCount = scores.filter((v) => v < VISIBILITY_THRESHOLD).length;

  if (lowCount === 0) return "ok";
  // If all upper-body joints are fine but lower body is hidden → move back
  const upperOk = (["leftShoulder","rightShoulder","leftElbow","rightElbow"] as Array<keyof PoseLandmarks>)
    .every((k) => (lm[k]?.visibility ?? 0) >= VISIBILITY_THRESHOLD);
  if (upperOk) return "move-back";
  if (lowCount > 6) return "no-pose";
  return "bad-lighting";
}

export { BASE_POINTS, TIER_THRESHOLDS };
