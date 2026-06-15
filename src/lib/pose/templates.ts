/**
 * Celebration Pose-Off — Pose Templates
 *
 * Each template defines:
 *   - A human-readable name and emoji
 *   - A cue description shown to the player
 *   - Joint angle targets (in degrees) for each of the key joints
 *   - A tolerance per joint (how many degrees off is still acceptable)
 *
 * Angles are computed as the angle at the MIDDLE joint of a three-point chain.
 *   e.g. leftElbow = angle(leftShoulder → leftElbow → leftWrist)
 *
 * The scoring module compares these targets against live landmarks.
 *
 * All angles are 0-180°. Landmark indices follow the MediaPipe full-body model:
 *   11/12 = shoulders, 13/14 = elbows, 15/16 = wrists,
 *   23/24 = hips, 25/26 = knees, 27/28 = ankles.
 */

export type JointAngleTarget = {
  joint: PoseJoint;
  target: number;  // degrees
  weight: number;  // 0-1, how much this joint counts toward overall score
};

export type PoseJoint =
  | "leftElbow"
  | "rightElbow"
  | "leftShoulder"
  | "rightShoulder"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee";

export type PoseTemplate = {
  id: string;
  name: string;
  emoji: string;
  cue: string;
  description: string;
  /** Short coaching line shown under the pose illustration */
  hint: string;
  joints: JointAngleTarget[];
  /** Uniform tolerance applied to every joint unless overridden */
  defaultTolerance: number;
};

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const POSE_TEMPLATES: PoseTemplate[] = [
  // ── Arms Wide ─────────────────────────────────────────────────────────────
  {
    id: "arms-wide",
    name: "Arms Wide",
    emoji: "🙌",
    cue: "Spread both arms out wide like wings!",
    description: "Extend both arms out to your sides at shoulder height.",
    hint: "Stretch both arms out wide — like you own the pitch!",
    defaultTolerance: 27,
    joints: [
      // Both elbows nearly straight (arms out flat)
      { joint: "leftElbow",     target: 165, weight: 0.25 },
      { joint: "rightElbow",    target: 165, weight: 0.25 },
      // Shoulders at ~90° — upper arm perpendicular to torso
      { joint: "leftShoulder",  target: 90,  weight: 0.20 },
      { joint: "rightShoulder", target: 90,  weight: 0.20 },
      // Hips relaxed / standing
      { joint: "leftHip",       target: 170, weight: 0.05 },
      { joint: "rightHip",      target: 170, weight: 0.05 },
    ],
  },

  // ── Hands on Hips ─────────────────────────────────────────────────────────
  {
    id: "hands-on-hips",
    name: "Hands on Hips",
    emoji: "💪",
    cue: "Put both hands on your hips and strike a power pose!",
    description: "Bend elbows ~90° and rest fists on your hips.",
    hint: "Hands on hips, elbows out — boss mode!",
    defaultTolerance: 26,
    joints: [
      // Elbows bent ~90°
      { joint: "leftElbow",     target: 90,  weight: 0.30 },
      { joint: "rightElbow",    target: 90,  weight: 0.30 },
      // Shoulders relatively low / tucked
      { joint: "leftShoulder",  target: 55,  weight: 0.15 },
      { joint: "rightShoulder", target: 55,  weight: 0.15 },
      { joint: "leftHip",       target: 165, weight: 0.05 },
      { joint: "rightHip",      target: 165, weight: 0.05 },
    ],
  },

  // ── Point to Sky ──────────────────────────────────────────────────────────
  {
    id: "point-sky",
    name: "Point to Sky",
    emoji: "☝️",
    cue: "One arm straight up — point to the sky!",
    description: "Extend your right arm straight overhead.",
    hint: "Right arm straight up, point at the sky!",
    defaultTolerance: 26,
    joints: [
      // Right elbow straight
      { joint: "rightElbow",    target: 160, weight: 0.35 },
      // Right shoulder lifted overhead
      { joint: "rightShoulder", target: 155, weight: 0.35 },
      // Left arm relaxed/down
      { joint: "leftElbow",     target: 145, weight: 0.10 },
      { joint: "leftShoulder",  target: 35,  weight: 0.10 },
      { joint: "leftHip",       target: 168, weight: 0.05 },
      { joint: "rightHip",      target: 168, weight: 0.05 },
    ],
  },

  // ── Crossed Arms ──────────────────────────────────────────────────────────
  {
    id: "crossed-arms",
    name: "Crossed Arms",
    emoji: "🤞",
    cue: "Cross your arms across your chest!",
    description: "Fold both arms across your chest.",
    hint: "Fold both arms across your chest tight.",
    defaultTolerance: 28,
    joints: [
      // Both elbows tightly bent
      { joint: "leftElbow",     target: 55,  weight: 0.30 },
      { joint: "rightElbow",    target: 55,  weight: 0.30 },
      // Both shoulders pulled inward / low
      { joint: "leftShoulder",  target: 45,  weight: 0.15 },
      { joint: "rightShoulder", target: 45,  weight: 0.15 },
      { joint: "leftHip",       target: 168, weight: 0.05 },
      { joint: "rightHip",      target: 168, weight: 0.05 },
    ],
  },

  // ── Phone Call ────────────────────────────────────────────────────────────
  {
    id: "phone-call",
    name: "Phone Call",
    emoji: "🤙",
    cue: "Hold your hand up to your ear like a phone!",
    description: "Bend your right elbow and bring your hand to your ear.",
    hint: "Right hand to your ear — hello, legend speaking!",
    defaultTolerance: 27,
    joints: [
      // Right elbow sharply bent ~70°
      { joint: "rightElbow",    target: 70,  weight: 0.35 },
      // Right shoulder raised moderately
      { joint: "rightShoulder", target: 80,  weight: 0.30 },
      // Left arm hanging naturally
      { joint: "leftElbow",     target: 155, weight: 0.15 },
      { joint: "leftShoulder",  target: 30,  weight: 0.10 },
      { joint: "leftHip",       target: 168, weight: 0.05 },
      { joint: "rightHip",      target: 168, weight: 0.05 },
    ],
  },

  // ── Shush ─────────────────────────────────────────────────────────────────
  {
    id: "shush",
    name: "Shush",
    emoji: "🤫",
    cue: "Raise one finger to your lips — shhh!",
    description: "Bring your right hand up to your mouth in a shush gesture.",
    hint: "Right finger to lips — silence the crowd!",
    defaultTolerance: 27,
    joints: [
      // Right elbow bent, forearm raised toward face
      { joint: "rightElbow",    target: 80,  weight: 0.35 },
      { joint: "rightShoulder", target: 65,  weight: 0.30 },
      // Left arm down/relaxed
      { joint: "leftElbow",     target: 155, weight: 0.15 },
      { joint: "leftShoulder",  target: 25,  weight: 0.10 },
      { joint: "leftHip",       target: 170, weight: 0.05 },
      { joint: "rightHip",      target: 170, weight: 0.05 },
    ],
  },
];

/** Returns a random pose, optionally excluding a specific id */
export function pickRandomPose(excludeId?: string): PoseTemplate {
  const pool = excludeId
    ? POSE_TEMPLATES.filter((p) => p.id !== excludeId)
    : POSE_TEMPLATES;
  return pool[Math.floor(Math.random() * pool.length)];
}
