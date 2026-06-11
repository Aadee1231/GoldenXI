"use client";

import { useEffect, useRef, useState } from "react";
import type { ShotStyle } from "@/src/lib/goalie/difficulty";

type Props = {
  /** Target x in container space [0,1] — from TARGET_POCKET_CENTERS. */
  targetX: number;
  /** Target y in container space [0,1] — from TARGET_POCKET_CENTERS. */
  targetY: number;
  /** Total flight duration in ms — matches the save-detection window. */
  flightMs: number;
  /**
   * Visual style of the ball flight — purely decorative.
   * Save detection is pocket-based regardless of style.
   */
  shotStyle?: ShotStyle;
};

/** Penalty spot: horizontally centred, near the bottom of the container. */
const SPOT_X = 0.50;
const SPOT_Y = 0.86;

/** Map ShotStyle to the CSS animation name prefix (direction appended at runtime). */
function arcAnimationName(style: ShotStyle): string | null {
  switch (style) {
    case "slight-curve": return "goalie-ball-arc";
    case "heavy-curve":  return "goalie-ball-arc-heavy";
    case "late-swerve":  return "goalie-ball-arc-late";
    default:             return null;
  }
}

/**
 * Animated ⚽ that flies from the penalty spot to a target pocket on mount.
 *
 * Structure (two divs):
 *   Outer — handles x/y via CSS `left`/`top` transitions + optional lateral
 *           arc animation (`translateX` keyframe, returns to 0 at end).
 *   Inner — handles centering (`translate(-50%,-50%)`) and perspective scale.
 *
 * The split ensures the arc `transform` on the outer div never conflicts with
 * the centering `transform` on the inner div.
 *
 * Re-mount with a fresh `key` for every shot so the ball always resets.
 */
export default function ShotBall({ targetX, targetY, flightMs, shotStyle = "straight" }: Props) {
  const [launched, setLaunched] = useState(false);
  const arcDirRef = useRef<"l" | "r">(Math.random() < 0.5 ? "l" : "r");

  useEffect(() => {
    const id = requestAnimationFrame(() => setLaunched(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const x     = launched ? targetX : SPOT_X;
  const y     = launched ? targetY : SPOT_Y;
  const scale = launched ? 0.75 : 1.5;

  const arcName = arcAnimationName(shotStyle);

  return (
    <div
      aria-hidden="true"
      style={{
        position:      "absolute",
        left:          `${x * 100}%`,
        top:           `${y * 100}%`,
        zIndex:        16,
        pointerEvents: "none",
        userSelect:    "none",
        willChange:    "left, top",
        transition:    launched
          ? `left ${flightMs}ms cubic-bezier(0.35, 0, 0.65, 1), top ${flightMs}ms cubic-bezier(0.15, 0.5, 0.5, 1)`
          : "none",
        animation:     launched && arcName
          ? `${arcName}-${arcDirRef.current} ${flightMs}ms ease-in-out forwards`
          : "none",
      }}
    >
      <div
        style={{
          transform:  `translate(-50%, -50%) scale(${scale})`,
          fontSize:   "2.25rem",
          lineHeight: 1,
          willChange: "transform",
          transition: launched ? `transform ${flightMs}ms ease-in` : "none",
          filter:     "drop-shadow(0 4px 8px rgba(0,0,0,0.6))",
        }}
      >
        ⚽
      </div>
    </div>
  );
}
