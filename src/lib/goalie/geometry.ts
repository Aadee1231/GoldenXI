/**
 * geometry.ts — Goalkeeper camera-mode save-zone geometry helpers.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * COORDINATE SYSTEM — READ THIS SECTION BEFORE EDITING ANYTHING BELOW
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  SOURCE — MediaPipe raw landmark space
 *  ─────────────────────────────────────
 *  MediaPipe PoseLandmarker outputs x ∈ [0, 1] and y ∈ [0, 1] where:
 *    (0, 0)  = top-LEFT corner of the RAW camera frame
 *    (1, 0)  = top-RIGHT corner of the RAW camera frame
 *
 *  On a front-facing ("selfie") camera the raw image is NOT mirrored.
 *  This means:
 *    · The player's LEFT hand  → appears at high x (right side of raw frame)
 *    · The player's RIGHT hand → appears at low  x (left  side of raw frame)
 *
 *  MIRROR — what the player sees on screen
 *  ────────────────────────────────────────
 *  We mirror the <video> element with CSS `scaleX(-1)` so the experience
 *  feels like looking in a mirror (natural for the player).  The canvas
 *  overlay is NOT CSS-mirrored; instead every draw call manually mirrors
 *  the x coordinate:
 *
 *    x_display = (1 − x_raw) × canvas_width
 *    y_display =  y_raw       × canvas_height     ← y does NOT change
 *
 *  After this transform:
 *    x_display ≈ 0  → player's LEFT side
 *    x_display ≈ W  → player's RIGHT side  (W = canvas width in pixels)
 *
 *  For normalized zone math we work in [0, 1] mirrored space:
 *    x_mirrored = 1 − x_raw
 *    y_mirrored = y_raw          (same)
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ZONE LAYOUT — player's view (mirrored video), normalized [0,1] × [0,1]
 * ════════════════════════════════════════════════════════════════════════════
 *
 *   x=0 (player's LEFT)                     x=1 (player's RIGHT)
 *    │                                            │
 *  y=0 ┌──────────────┬─────────────┬────────────┐
 *  top  │  top-left   │ top-center  │  top-right │  y < VERT_MID (0.50)
 *       │             │             │            │
 *  y=.5 ├─────────────┴─────────────┴────────────┤
 *  bot  │  bottom-left│   (body)    │ bottom-right│  y ≥ VERT_MID
 *  y=1  └─────────────┴─────────────┴────────────┘
 *
 *  Horizontal splits for the TOP row:
 *    left │ center  boundary: x = HORIZ_LEFT  (0.38)
 *    center │ right boundary: x = HORIZ_RIGHT (0.62)
 *
 *  Horizontal split for the BOTTOM row (equal halves, no center zone):
 *    left │ right boundary: x = HORIZ_BOT (0.50)
 *
 *  Vertical split:
 *    top  │ bottom boundary: y = VERT_MID (0.50)
 *
 *  Why no bottom-center?  The player's torso occupies that region,
 *  making it physically unreachable — keeping only bottom-left and
 *  bottom-right makes the 5 zones equally achievable.
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShotZone =
  | "top-left" | "top-middle" | "top-right"
  | "bottom-left" | "bottom-middle" | "bottom-right";

/** Zone rectangle in mirrored normalized space [0,1] × [0,1]. */
export type ZoneBounds = {
  /** Left edge of zone (0 = player's left = left of mirrored display). */
  x0: number;
  /** Top edge of zone (0 = top of display). */
  y0: number;
  /** Right edge of zone (1 = player's right). */
  x1: number;
  /** Bottom edge of zone (1 = bottom of display). */
  y1: number;
};

// ---------------------------------------------------------------------------
// Grid constants — edit these to reshape zones
// ---------------------------------------------------------------------------

/** Left-third boundary: x < H_L → "left" column. */
const H_L = 1 / 3;

/** Right-third boundary: x ≥ H_R → "right" column. */
const H_R = 2 / 3;

/** Vertical midline: y < V_M → top row, y ≥ V_M → bottom row. */
const V_M = 0.5;

// ---------------------------------------------------------------------------
// Zone definitions — mirrored normalized coordinates
// ---------------------------------------------------------------------------

export const SHOT_ZONES: Record<ShotZone, ZoneBounds> = {
  "top-left":      { x0: 0,   y0: 0,   x1: H_L, y1: V_M },
  "top-middle":    { x0: H_L, y0: 0,   x1: H_R, y1: V_M },
  "top-right":     { x0: H_R, y0: 0,   x1: 1,   y1: V_M },
  "bottom-left":   { x0: 0,   y0: V_M, x1: H_L, y1: 1   },
  "bottom-middle": { x0: H_L, y0: V_M, x1: H_R, y1: 1   },
  "bottom-right":  { x0: H_R, y0: V_M, x1: 1,   y1: 1   },
};

/** Ordered array of all zones (used for random selection and iteration). */
export const ALL_SHOT_ZONES: ShotZone[] = [
  "top-left", "top-middle", "top-right",
  "bottom-left", "bottom-middle", "bottom-right",
];

/** Human-readable labels for UI display. */
export const SHOT_ZONE_LABELS: Record<ShotZone, string> = {
  "top-left":      "Top Left",
  "top-middle":    "Top Middle",
  "top-right":     "Top Right",
  "bottom-left":   "Bottom Left",
  "bottom-middle": "Bottom Middle",
  "bottom-right":  "Bottom Right",
};

/**
 * Returns the centre of a zone in mirrored normalized [0,1] display space.
 * Used to position the shot-ball animation target over the correct zone.
 */
export function zoneCenterDisplay(zone: ShotZone): { x: number; y: number } {
  const b = SHOT_ZONES[zone];
  return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 };
}

// ---------------------------------------------------------------------------
// Forgiveness & glove constants
// ---------------------------------------------------------------------------

/**
 * Extra expansion (in normalized units) applied to each zone edge before
 * testing whether a wrist hit it.  Acts as a generosity margin so the game
 * does not feel pixel-perfect / unfair.
 *
 * 0.04 ≈ 25 px on a 640 px-wide canvas — generous but not exploitable.
 *
 * NOTE: keep this small enough that adjacent zone pairs don't overlap after
 * expansion.  The tightest gap is between bottom-left (x1=0.50) and
 * bottom-right (x0=0.50) — they share an edge so FORGIVENESS_NORM must stay
 * < 0.05 to avoid ambiguous double-hits.
 */
export const FORGIVENESS_NORM = 0.04;

/**
 * Zone forgiveness margin for camera-mode save detection.
 * A palm within this distance of a zone boundary still counts as being
 * inside that zone — gives slight benefit at the 1/3 and 1/2 edges.
 * 0.03 = 3 % of the field width/height.
 */
export const ZONE_FORGIVENESS = 0.03;

/**
 * Canonical zone type for camera-mode save detection.
 * Identical to ShotZone — one type, one set of string values, everywhere.
 * Never compare against "Bottom Left", "BL", "bottomLeft", etc.
 */
export type SaveZone = ShotZone;

/**
 * THE single source of truth for zone detection.
 * Maps a display-space normalized coordinate to a SaveZone.
 *
 * Rules (matches the visual grid rendered by PoseOverlay exactly):
 *   y < 0.5  → top row;    y ≥ 0.5 → bottom row
 *   x < 1/3  → left col;   x < 2/3 → middle col;  x ≥ 2/3 → right col
 *
 * @param point.x  Display-space x: 0 = left, 1 = right  (apply 1-rawX first)
 * @param point.y  Display-space y: 0 = top,  1 = bottom  (rawY unchanged)
 */
export function getZoneFromPoint(point: { x: number; y: number }): ShotZone {
  const col = point.x < 1 / 3 ? "left" : point.x < 2 / 3 ? "middle" : "right";
  const row = point.y < 0.5   ? "top"  : "bottom";
  return `${row}-${col}` as ShotZone;
}

/**
 * Convenience: two-arg alias kept for backward-compatibility with helpers
 * that already have mx/my as separate numbers.
 */
export function palmToZone(mx: number, my: number): ShotZone {
  return getZoneFromPoint({ x: mx, y: my });
}

/**
 * Returns true when the palm falls inside `zone`'s bounds expanded by
 * `forgiveness` on all four edges.  Used for save detection so a hand
 * hovering at a zone edge still registers.
 */
export function palmInZone(
  mx: number, my: number,
  zone: ShotZone,
  forgiveness = ZONE_FORGIVENESS,
): boolean {
  const b = SHOT_ZONES[zone];
  return mx >= b.x0 - forgiveness && mx <= b.x1 + forgiveness
      && my >= b.y0 - forgiveness && my <= b.y1 + forgiveness;
}

/**
 * Visual radius of the goalkeeper glove disc drawn on the canvas, expressed
 * as a fraction of the canvas WIDTH.
 * Also used as the "footprint" of the wrist when computing zone hits:
 *   effective hit region = zone bounds expanded by (GLOVE_RADIUS_NORM + FORGIVENESS_NORM).
 *
 * 0.055 ≈ 35 px on a 640 px canvas.
 */
export const GLOVE_RADIUS_NORM = 0.055;

/**
 * Collision radius of the ball in normalized space.
 * Intentionally slightly smaller than the visual emoji size (~0.056)
 * so the hitbox matches the actual ball, not the surrounding glyph bbox.
 */
export const BALL_RADIUS_NORM = 0.04;

/**
 * Minimum distance (normalized) a palm must travel from its shot-start
 * position before it is considered to have "moved" for the pre-positioning
 * guard.  Prevents standing-still saves when a hand happens to be near
 * the penalty spot at the moment the ball is kicked.
 *
 * 0.06 ≈ 38 px on a 640 px canvas — deliberate but not large.
 */
export const MOVEMENT_THRESHOLD_NORM = 0.06;

/**
 * Grace period (ms) after shot start.  After this point, glove-ball overlap
 * alone is sufficient for a save — the motion check is waived.  Prevents
 * false "no motion detected" when the ball arrives while the player's hand
 * is already correctly positioned.
 */
export const GRACE_PERIOD_MS = 175;

/**
 * Minimum displacement (normalized) for a non-pre-positioned hand to earn
 * a save.  Much smaller than MOVEMENT_THRESHOLD_NORM — essentially any
 * deliberate hand movement rather than a large travel distance.
 */
export const SMALL_MOTION_NORM = 0.025;

/**
 * Penalty-spot position in normalized mirrored-display space.
 * Mirrors the SPOT_X / SPOT_Y constants in ShotBall.tsx so the
 * collision loop starts the ball at exactly the visual origin.
 */
export const SPOT_X = 0.50;
export const SPOT_Y = 0.86;

/**
 * Returns true when the glove circle overlaps the ball circle.
 *
 * All coordinates must be in the same space: mirrored normalized [0,1] display.
 *
 * @param gloveX  Palm centre x — toMirroredX already applied
 * @param gloveY  Palm centre y — same as raw y (no transform needed)
 * @param ballX   Ball centre x — mirrored normalized
 * @param ballY   Ball centre y — normalized
 * @param totalR  Sum of both radii + any forgiveness margin
 *                (GLOVE_RADIUS_NORM + BALL_RADIUS_NORM + FORGIVENESS_NORM)
 */
export function gloveBallOverlap(
  gloveX: number, gloveY: number,
  ballX:  number, ballY:  number,
  totalR: number,
): boolean {
  return Math.hypot(gloveX - ballX, gloveY - ballY) <= totalR;
}

/**
 * Solve a CSS cubic-bezier timing function: given linear animation progress
 * ∈ [0,1] returns the eased output value.
 *
 * Allows collision tracking to precisely match the CSS transitions used in
 * ShotBall.tsx so the visual ball and the collision circle stay in sync.
 *
 * Uses Newton-Raphson to invert the X axis of the bezier curve, then
 * evaluates the Y axis at the found parameter t.
 */
export function solveCSSBezierY(
  p1x: number, p1y: number,
  p2x: number, p2y: number,
  progress: number,
): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const X  = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y  = (t: number) => ((ay * t + by) * t + cy) * t;
  const DX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  let t = progress;
  for (let i = 0; i < 8; i++) {
    const e = X(t) - progress;
    if (Math.abs(e) < 1e-6) break;
    const d = DX(t);
    if (Math.abs(d) < 1e-8) break;
    t = Math.max(0, Math.min(1, t - e / d));
  }
  return Y(t);
}

// ---------------------------------------------------------------------------
// Coordinate transform helpers
// ---------------------------------------------------------------------------

/**
 * Convert a raw MediaPipe landmark x-coordinate to mirrored display x.
 *
 * Raw camera x=0 is the left edge of the camera sensor.  For a front-facing
 * camera the player's RIGHT hand is at small raw-x.  After mirroring, the
 * player's RIGHT hand is at large display-x (feels natural).
 *
 *   x_raw=0 → x_mirrored=1  (raw left  → display right)
 *   x_raw=1 → x_mirrored=0  (raw right → display left)
 */
export function toMirroredX(rawX: number): number {
  return 1 - rawX;
}

/**
 * y-coordinates are NOT mirrored — the top of the camera frame maps to
 * the top of the display.  This passthrough exists for documentation clarity.
 */
export function toDisplayY(rawY: number): number {
  return rawY;
}

/** Returns the centre of a zone in normalized mirrored-display space. */
export function zoneCenterNorm(bounds: ZoneBounds): { x: number; y: number } {
  return {
    x: (bounds.x0 + bounds.x1) / 2,
    y: (bounds.y0 + bounds.y1) / 2,
  };
}

// ---------------------------------------------------------------------------
// Hit detection
// ---------------------------------------------------------------------------

/**
 * Returns true when the wrist centre (in mirrored normalized coordinates)
 * overlaps a zone after expanding the zone edges by the combined glove radius
 * and forgiveness margin.
 *
 * Expansion applied on all four sides:
 *   expand = GLOVE_RADIUS_NORM + forgiveness
 *   zone_x ∈ [x0 − expand, x1 + expand]
 *   zone_y ∈ [y0 − expand, y1 + expand]
 *
 * @param mx          Wrist x in mirrored normalized space: toMirroredX(raw_x)
 * @param my          Wrist y in normalized space: raw_y  (no transform needed)
 * @param zone        Zone bounds to test against
 * @param forgiveness Additional expansion beyond the glove radius (default: FORGIVENESS_NORM)
 */
export function wristHitsZone(
  mx: number,
  my: number,
  zone: ZoneBounds,
  forgiveness: number = FORGIVENESS_NORM,
): boolean {
  // Total expand = visual glove size + forgiveness buffer
  const expand = GLOVE_RADIUS_NORM + forgiveness;
  return (
    mx >= zone.x0 - expand &&
    mx <= zone.x1 + expand &&
    my >= zone.y0 - expand &&
    my <= zone.y1 + expand
  );
}

/**
 * Given a wrist position (mirrored normalized), return the ShotZone that
 * best matches it, or null if it is not inside any zone's detection region.
 *
 * When the wrist sits on the shared border between two zones (within their
 * overlapping forgiveness bands), the zone whose CENTRE is closest to the
 * wrist wins — preventing arbitrary zone assignment at boundaries.
 *
 * @param mx  Wrist x, mirrored: toMirroredX(raw_x)
 * @param my  Wrist y: raw_y
 * @param forgiveness  Override the default FORGIVENESS_NORM if needed
 */
export function detectShotZone(
  mx: number,
  my: number,
  forgiveness: number = FORGIVENESS_NORM,
): ShotZone | null {
  let bestZone: ShotZone | null = null;
  let bestDist = Infinity;

  for (const zone of ALL_SHOT_ZONES) {
    const bounds = SHOT_ZONES[zone];
    if (!wristHitsZone(mx, my, bounds, forgiveness)) continue;

    // Break ties by distance to zone centre
    const c = zoneCenterNorm(bounds);
    const dist = Math.hypot(mx - c.x, my - c.y);
    if (dist < bestDist) {
      bestDist = dist;
      bestZone = zone;
    }
  }
  return bestZone;
}

// ---------------------------------------------------------------------------
// Landmark-level detection (consumes GoaliePoseLandmarks directly)
// ---------------------------------------------------------------------------

/** Minimal shape for a wrist landmark (subset of GoaliePoseLandmarks). */
export type WristLandmark = { x: number; y: number; visibility: number };

// ---------------------------------------------------------------------------
// Palm-center types (HandLandmarker — no per-point visibility)
// ---------------------------------------------------------------------------

/**
 * Normalized [0,1] palm centre computed from the HandLandmarker result.
 * Coordinates are in RAW landmark space (not yet mirrored).
 * Use toMirroredX / toDisplayY before comparing against zone bounds.
 */
export type PalmPoint = { x: number; y: number };

/**
 * Both hands' palm centres for a single frame.
 * null means that hand was not detected / has too low confidence.
 *
 * NOTE: MediaPipe HandLandmarker reports handedness relative to the raw
 * (unmirrored) frame.  For a front-facing camera:
 *   "Left"  label → player's RIGHT hand (low raw-x)
 *   "Right" label → player's LEFT  hand (high raw-x)
 * The detection helpers below apply toMirroredX before zone tests, so the
 * naming here does NOT matter for correctness — we test BOTH hands.
 */
export type HandPalmData = {
  /** MediaPipe "Left" hand (player's right in mirrored view). */
  mpLeft: PalmPoint | null;
  /** MediaPipe "Right" hand (player's left in mirrored view). */
  mpRight: PalmPoint | null;
};

/**
 * Determine which ShotZone (if any) either wrist is currently occupying.
 *
 * Algorithm:
 *  1. Convert each raw landmark to mirrored display space.
 *  2. Run detectShotZone on each wrist that clears the visibility threshold.
 *  3. If both wrists land in zones simultaneously, prefer the one with higher
 *     MediaPipe visibility (more reliable tracking).
 *
 * Returns null when:
 *  · Neither wrist has sufficient visibility (tracking lost / occluded), OR
 *  · Both visible wrists are outside every zone's detection region.
 *
 * @param leftWrist    MediaPipe landmark index 15 (player's left wrist)
 * @param rightWrist   MediaPipe landmark index 16 (player's right wrist)
 * @param visThreshold Minimum visibility score to trust a wrist position
 */
export function detectZoneFromWrists(
  leftWrist: WristLandmark,
  rightWrist: WristLandmark,
  visThreshold: number,
): ShotZone | null {
  const lwVisible = leftWrist.visibility  >= visThreshold;
  const rwVisible = rightWrist.visibility >= visThreshold;

  if (!lwVisible && !rwVisible) return null; // both wrists occluded

  //
  // Mirror raw x → display x so zone thresholds align with what the player sees.
  //
  // Player's LEFT wrist (MP index 15) sits at high raw-x in a front-facing camera
  // because the player's left is the camera's right.  After mirroring, it appears
  // at low display-x — which is where the player expects their left hand to be.
  //
  const lwMX = toMirroredX(leftWrist.x);
  const lwMY = toDisplayY(leftWrist.y);

  // Player's RIGHT wrist (MP index 16): low raw-x → high display-x after mirror.
  const rwMX = toMirroredX(rightWrist.x);
  const rwMY = toDisplayY(rightWrist.y);

  const lwZone = lwVisible ? detectShotZone(lwMX, lwMY) : null;
  const rwZone = rwVisible ? detectShotZone(rwMX, rwMY) : null;

  if (lwZone === null && rwZone === null) return null;
  if (lwZone === null) return rwZone;
  if (rwZone === null) return lwZone;

  // Both wrists in a zone — trust the one MediaPipe is more confident about.
  return leftWrist.visibility >= rightWrist.visibility ? lwZone : rwZone;
}

// ---------------------------------------------------------------------------
// Palm-based zone detection (HandLandmarker)
// ---------------------------------------------------------------------------

/**
 * Determine which ShotZone (if any) either palm is currently occupying.
 *
 * Mirrors the wrist-based variant but accepts HandPalmData (no visibility
 * field — a null palm means the hand was not detected this frame).
 *
 * Algorithm:
 *  1. Mirror each present palm's raw x-coordinate.
 *  2. Run detectShotZone on each non-null palm.
 *  3. If both palms land in a zone simultaneously, prefer mpLeft (player's
 *     visible right hand in the mirrored view) as an arbitrary tiebreak.
 *
 * Returns null when both palms are absent or outside every zone.
 */
export function detectZoneFromPalms(
  palms: HandPalmData,
): ShotZone | null {
  const lZone = palms.mpLeft
    ? detectShotZone(toMirroredX(palms.mpLeft.x), toDisplayY(palms.mpLeft.y))
    : null;
  const rZone = palms.mpRight
    ? detectShotZone(toMirroredX(palms.mpRight.x), toDisplayY(palms.mpRight.y))
    : null;

  if (lZone === null && rZone === null) return null;
  if (lZone === null) return rZone;
  if (rZone === null) return lZone;
  // Both in zones — default to mpLeft (arbitrary; both inputs are equally
  // reliable since HandLandmarker doesn't expose per-point confidence).
  return lZone;
}

// ── Video object-cover coordinate transform ──────────────────────────────────

export type VideoTransform = {
  scale: number; scaledW: number; scaledH: number;
  cropX: number; cropY:   number; cW: number; cH: number;
};

export function computeVideoTransform(vidW: number, vidH: number, cW: number, cH: number): VideoTransform {
  const safeW = vidW > 0 ? vidW : cW > 0 ? cW : 640;
  const safeH = vidH > 0 ? vidH : cH > 0 ? cH : 360;
  const scale = Math.max(cW / safeW, cH / safeH);
  const scaledW = safeW * scale;
  const scaledH = safeH * scale;
  return { scale, scaledW, scaledH, cropX: Math.max(0, (scaledW - cW) / 2), cropY: Math.max(0, (scaledH - cH) / 2), cW, cH };
}

/** Raw MediaPipe [0,1] landmark → container CSS pixels with object-cover crop + selfie mirror. */
export function landmarkToContainerPx(rawX: number, rawY: number, t: VideoTransform): { x: number; y: number } {
  return { x: t.cW - (rawX * t.scaledW - t.cropX), y: rawY * t.scaledH - t.cropY };
}

// ── Shared collision debug state (pollGloveBall ↔ PoseOverlay) ───────────────

export type GloveDebugState = { px: { x: number; y: number }; r: number; overlap: boolean; label: string };

export type CollisionState = {
  ballPx: { x: number; y: number }; ballR: number;
  gloves: (GloveDebugState | null)[];
  anyOverlap: boolean; phase: string; fieldW: number; fieldH: number; t: number;
};
