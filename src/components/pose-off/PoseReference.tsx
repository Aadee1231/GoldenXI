"use client";

/**
 * PoseReference — large arcade-style reference panel showing a stick-figure
 * illustration of the target pose with name, instruction, and accuracy bar.
 *
 * Layout: vertical panel on desktop (left side), compact strip on mobile (top).
 */

import type { PoseTemplate } from "@/src/lib/pose/templates";
import type { MatchTier } from "@/src/lib/pose/scoring";

// ---------------------------------------------------------------------------
// SVG arm coordinates per pose  [x1,y1, x2,y2] pairs (upper-arm, forearm)
// Body skeleton is constant; only arms differ.
// ViewBox: "-15 -5 230 275"
// Shoulder L=(50,62) R=(150,62)
// ---------------------------------------------------------------------------
type Seg = [number, number, number, number];

const POSE_ARMS: Record<string, [Seg, Seg, Seg, Seg]> = {
  //                  L-upper-arm         L-forearm           R-upper-arm        R-forearm
  "arms-wide":     [[50,62,  5,70],   [ 5,70, -12,60],   [150,62,195,70],  [195,70,212,60]],
  "hands-on-hips": [[50,62, 22,100],  [22,100, 52,138],  [150,62,178,100], [178,100,148,138]],
  "point-sky":     [[50,62, 40,105],  [40,105, 38,148],  [150,62,158,18],  [158,18, 154,-5]],
  "crossed-arms":  [[50,62, 78,98],   [78,98, 122,90],   [150,62,122,98],  [122,98, 78,90]],
  "phone-call":    [[50,62, 40,108],  [40,108, 38,152],  [150,62,156,38],  [156,38, 120,26]],
  "shush":         [[50,62, 40,108],  [40,108, 38,152],  [150,62,156,48],  [156,48, 104,50]],
};

const TIER_BG: Record<MatchTier, string> = {
  PERFECT: "#facc15",
  GREAT:   "#4ade80",
  CLOSE:   "#60a5fa",
  MISS:    "#71717a",
};

function PoseStickFigure({ id, tier }: { id: string; tier: MatchTier | null }) {
  const arms = POSE_ARMS[id] ?? POSE_ARMS["arms-wide"];
  const col = tier ? TIER_BG[tier] : "#ffffff";

  return (
    <svg
      viewBox="-15 -5 230 275"
      className="w-full max-w-[200px] drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
      aria-label="Pose illustration"
    >
      {/* Head */}
      <circle cx="100" cy="22" r="18" fill={col} opacity="0.95" />

      {/* Neck */}
      <line x1="100" y1="40" x2="100" y2="62" stroke={col} strokeWidth="7" strokeLinecap="round" />

      {/* Shoulders */}
      <line x1="50" y1="62" x2="150" y2="62" stroke={col} strokeWidth="7" strokeLinecap="round" />

      {/* Torso */}
      <line x1="100" y1="62" x2="100" y2="158" stroke={col} strokeWidth="7" strokeLinecap="round" />

      {/* Hips */}
      <line x1="65" y1="158" x2="135" y2="158" stroke={col} strokeWidth="7" strokeLinecap="round" />

      {/* Left leg */}
      <line x1="65" y1="158" x2="60" y2="215" stroke={col} strokeWidth="6" strokeLinecap="round" />
      <line x1="60" y1="215" x2="55" y2="255" stroke={col} strokeWidth="5" strokeLinecap="round" opacity="0.7" />

      {/* Right leg */}
      <line x1="135" y1="158" x2="140" y2="215" stroke={col} strokeWidth="6" strokeLinecap="round" />
      <line x1="140" y1="215" x2="145" y2="255" stroke={col} strokeWidth="5" strokeLinecap="round" opacity="0.7" />

      {/* Arms — 4 segments: L-upper, L-fore, R-upper, R-fore */}
      {arms.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={col}
          strokeWidth={i % 2 === 0 ? 7 : 6}
          strokeLinecap="round"
          opacity={i % 2 === 0 ? 1 : 0.9}
        />
      ))}

      {/* Joint dots at shoulders, elbows */}
      {[
        [50,62],[150,62],
        [arms[0][2], arms[0][3]],
        [arms[2][2], arms[2][3]],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill={col} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Accuracy ring (radial progress)
// ---------------------------------------------------------------------------
function AccuracyRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  const col  = pct >= 88 ? "#facc15" : pct >= 70 ? "#4ade80" : pct >= 45 ? "#60a5fa" : "#71717a";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.2s" }} />
      </svg>
      <span className="absolute text-lg font-extrabold tabular-nums" style={{ color: col }}>
        {pct}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type Props = {
  pose: PoseTemplate;
  tier: MatchTier | null;
  simScore: number | null;
  /** Compact horizontal layout for mobile top strip */
  compact?: boolean;
};

export default function PoseReference({ pose, tier, simScore, compact }: Props) {
  const tierLabel = tier ? tier : null;
  const tierCol: Record<MatchTier, string> = {
    PERFECT: "text-yellow-300 bg-yellow-400/15",
    GREAT:   "text-green-300 bg-green-400/15",
    CLOSE:   "text-blue-300 bg-blue-400/15",
    MISS:    "text-zinc-500 bg-zinc-800/30",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-16 shrink-0">
          <PoseStickFigure id={pose.id} tier={tier} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Copy this pose</p>
          <p className="text-lg font-extrabold text-white leading-tight truncate">{pose.name}</p>
          <p className="text-xs text-zinc-400 leading-tight">{pose.hint}</p>
        </div>
        {simScore !== null && (
          <div className="shrink-0">
            <AccuracyRing score={simScore} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-between p-5 gap-4">
      {/* Label */}
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Copy this pose</p>
        <p className="text-2xl font-extrabold text-white">{pose.name}</p>
      </div>

      {/* Tier badge */}
      {tierLabel && (
        <div className={`rounded-full px-4 py-1 text-sm font-extrabold uppercase tracking-widest ${tierCol[tier!]}`}>
          {tierLabel}
        </div>
      )}

      {/* SVG figure */}
      <div className="flex flex-1 items-center justify-center w-full px-4">
        <PoseStickFigure id={pose.id} tier={tier} />
      </div>

      {/* Instruction */}
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-white leading-snug">{pose.hint}</p>
        <p className="text-xs text-zinc-500">Hold steady until the ring fills</p>
      </div>

      {/* Accuracy ring */}
      {simScore !== null && (
        <AccuracyRing score={simScore} />
      )}
    </div>
  );
}
