export type Direction = "left" | "center" | "right";

export type GamePhase =
  | "idle"
  | "ready"
  | "whistle"
  | "runup"
  | "shot"
  | "saved"
  | "goal"
  | "gameOver";

export type RoundResult = {
  saved: boolean;
  target: Direction;
  pick: Direction | null;
  reactionMs: number | null;
  points: number;
};

export type GameStats = {
  saves: number;
  misses: number;
  score: number;
  reactionTimes: number[];
};

/** Number of lives the player starts with. Game ends when lives reach 0. */
export const STARTING_LIVES = 3;
export const BEST_SCORE_KEY = "goldenxi_goalie_best_v1";

// ---------------------------------------------------------------------------
// Penalty-kick timing constants
// ---------------------------------------------------------------------------

/** Duration of the whistle / alert phase before the runup begins. */
export const WHISTLE_MS = 600;

/** Minimum runup duration — prevents the shot from being too predictable. */
export const RUNUP_MIN_MS = 800;

/** Maximum runup duration — creates suspense on long runups. */
export const RUNUP_MAX_MS = 3500;

/** Ball flight window on the first shot (saves = 0). */
export const BALL_FLIGHT_START_MS = 1500;

/** Ball flight window at maximum difficulty (saves ≥ 8). */
export const BALL_FLIGHT_MIN_MS = 650;

/**
 * Grace period at the start of the shot phase.
 * Saves registered within this window are ignored — pre-positioned hands or
 * held keys cannot auto-save; the player must react deliberately.
 */
export const SHOT_LOCKOUT_MS = 120;

/** How long the SAVE / GOAL result overlay is shown before the next round. */
export const RESULT_MS = 900;

// ── Ready-stance constants (camera mode only) ────────────────────────────────
/** Left edge of the horizontal "ready band" in display-space (0 → 1). */
export const READY_X_MIN = 0.20;
/** Right edge of the horizontal "ready band". */
export const READY_X_MAX = 0.80;
/** How long both hands must stay in the ready band before the shot arms (ms). */
export const READY_HOLD_MS = 400;
/** Max time to wait in ready phase before forcing through — prevents soft-lock. */
export const READY_MAX_WAIT_MS = 6_000;

/**
 * Returns the ball-flight window (ms) for a given save count.
 * Eases linearly from BALL_FLIGHT_START_MS down to BALL_FLIGHT_MIN_MS over
 * the first 8 saves, then holds at the minimum.
 */
export function ballFlightMs(saves: number): number {
  const progress = Math.min(1, saves / 8);
  return Math.round(
    BALL_FLIGHT_START_MS - (BALL_FLIGHT_START_MS - BALL_FLIGHT_MIN_MS) * progress,
  );
}

/**
 * Step-based ball-flight window for camera mode — keeps early shots very
 * forgiving before ramping difficulty in coarse steps.
 *   0 – 4 saves  → 1500 ms
 *   5 – 9 saves  → 1300 ms
 *  10 – 14 saves → 1100 ms
 *  15 +  saves   →  850 ms
 */
export function cameraFlightMs(saves: number): number {
  if (saves < 5)  return 1500;
  if (saves < 10) return 1300;
  if (saves < 15) return 1100;
  return 850;
}

export const DIRECTIONS: Direction[] = ["left", "center", "right"];

export type GameMode = "keyboard" | "camera";

export type CameraError =
  | "none"
  | "not-found"
  | "blocked"
  | "no-pose"
  | "too-close"
  | "too-far";

export type LandmarkPoint = { x: number; y: number; visibility: number };

export type GoaliePoseLandmarks = {
  nose: LandmarkPoint;
  leftShoulder: LandmarkPoint;
  rightShoulder: LandmarkPoint;
  leftWrist: LandmarkPoint;
  rightWrist: LandmarkPoint;
};

export const POSE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
export const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// Hand Landmarker — shares the same tasks-vision WASM bundle
export const HAND_WASM_URL = POSE_WASM_URL;
export const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const ZONE_THRESHOLDS = { left: 0.38, right: 0.62 } as const;
export const VISIBILITY_THRESHOLD = 0.65;

export const DIRECTION_LABELS: Record<Direction, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};
