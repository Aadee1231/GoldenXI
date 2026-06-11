"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  ALL_SHOT_ZONES,
  SHOT_ZONES,
  SHOT_ZONE_LABELS,
  ZONE_FORGIVENESS,
  GLOVE_RADIUS_NORM,
  getZoneFromPoint,
  computeVideoTransform,
  landmarkToContainerPx,
  type ShotZone,
  type HandPalmData,
} from "@/src/lib/goalie/geometry";

// ─────────────────────────────────────────────────────────────────────────────
// Debug toggle — shows zone grid, hand zone labels, and match status.
// ─────────────────────────────────────────────────────────────────────────────
const SHOW_DEBUG = true;

// ─────────────────────────────────────────────────────────────────────────────
// Visual constants (colours per zone + state)
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_IDLE_FILL: Record<ShotZone, string> = {
  "top-left":      "rgba(59,130,246,0.12)",
  "top-middle":    "rgba(34,197,94,0.12)",
  "top-right":     "rgba(239,68,68,0.12)",
  "bottom-left":   "rgba(168,85,247,0.12)",
  "bottom-middle": "rgba(6,182,212,0.12)",
  "bottom-right":  "rgba(245,158,11,0.12)",
};

const ZONE_IDLE_BORDER: Record<ShotZone, string> = {
  "top-left":      "rgba(96,165,250,0.45)",
  "top-middle":    "rgba(74,222,128,0.45)",
  "top-right":     "rgba(248,113,113,0.45)",
  "bottom-left":   "rgba(192,132,252,0.45)",
  "bottom-middle": "rgba(34,211,238,0.45)",
  "bottom-right":  "rgba(251,191,36,0.45)",
};

const ZONE_SHORT_LABEL: Record<ShotZone, string> = {
  "top-left":      "TL",
  "top-middle":    "TM",
  "top-right":     "TR",
  "bottom-left":   "BL",
  "bottom-middle": "BM",
  "bottom-right":  "BR",
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

type CameraInput = {
  leftZone:   ShotZone | null;
  rightZone:  ShotZone | null;
  leftPoint:  { x: number; y: number } | null;
  rightPoint: { x: number; y: number } | null;
};

type Props = {
  palmRef: RefObject<HandPalmData | null>;
  phase: string;
  target: ShotZone | null;
  result: { saved: boolean } | null;
  width: number;
  height: number;
  videoRef?: RefObject<HTMLVideoElement | null>;
  /** Override the SHOW_DEBUG constant at runtime (e.g. from a keyboard toggle). */
  showDebug?: boolean;
  /** Exact same hand zones used for scoring — debug panel reads from here for parity. */
  latestInputRef?: RefObject<CameraInput | null>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PoseOverlay({
  palmRef,
  phase,
  target,
  result,
  width,
  height,
  videoRef,
  showDebug,
  latestInputRef,
}: Props) {
  const debug = showDebug ?? SHOW_DEBUG;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep refs for values read inside the rAF loop (avoids stale closure).
  const phaseRef  = useRef(phase);
  const targetRef = useRef(target);
  const resultRef = useRef(result);
  const debugRef  = useRef(debug);

  useEffect(() => { phaseRef.current  = phase;  }, [phase]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => { debugRef.current  = debug;  }, [debug]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    function draw() {
      if (!canvas || !ctx) return;
      rafId = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const curPhase  = phaseRef.current;
      const curTarget = targetRef.current;
      const curResult = resultRef.current;

      // Only show the active target cue once the ball is kicked.
      // "whistle" and "runup" mean the ball hasn't left the spot yet — no cue.
      const isShooting = curPhase === "shot";
      const isResult   = curPhase === "saved" || curPhase === "goal";
      const revealTarget = isShooting || isResult;

      // ── 1. Zone backgrounds & borders ──────────────────────────────────────
      for (const zone of ALL_SHOT_ZONES) {
        const b = SHOT_ZONES[zone];
        // Convert normalised bounds → canvas pixel rect
        const px = b.x0 * w;
        const py = b.y0 * h;
        const pw = (b.x1 - b.x0) * w;
        const ph = (b.y1 - b.y0) * h;

        const isTarget = revealTarget && curTarget === zone;

        if (isTarget) {
          if (isResult) {
            ctx.fillStyle = curResult?.saved
              ? "rgba(74,222,128,0.30)"
              : "rgba(248,113,113,0.30)";
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = curResult?.saved ? "rgba(74,222,128,0.90)" : "rgba(248,113,113,0.90)";
            ctx.lineWidth = 2.5;
          } else {
            // Shot in progress — breathe yellow to guide the player
            const pulse = Math.sin(Date.now() * 0.007) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(250,204,21,${(0.12 + pulse * 0.22).toFixed(2)})`;
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = `rgba(250,204,21,${(0.60 + pulse * 0.35).toFixed(2)})`;
            ctx.lineWidth = 2 + pulse * 2;
          }
          ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);

          ctx.font      = "bold 14px system-ui";
          ctx.fillStyle = isResult
            ? (curResult?.saved ? "rgba(74,222,128,0.95)" : "rgba(248,113,113,0.95)")
            : "rgba(250,204,21,0.95)";
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(SHOT_ZONE_LABELS[zone], px + pw / 2, py + ph / 2);
          ctx.textBaseline = "alphabetic";
        } else if (revealTarget) {
          if (debugRef.current) {
            ctx.fillStyle   = "rgba(0,0,0,0.08)";
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = "rgba(255,255,255,0.12)";
            ctx.lineWidth   = 1;
            ctx.strokeRect(px, py, pw, ph);
          }
        } else {
          if (debugRef.current) {
            ctx.fillStyle   = ZONE_IDLE_FILL[zone];
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = ZONE_IDLE_BORDER[zone];
            ctx.lineWidth   = 1;
            ctx.strokeRect(px, py, pw, ph);
            ctx.font      = "bold 12px system-ui";
            ctx.fillStyle = ZONE_IDLE_BORDER[zone];
            ctx.textAlign    = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(ZONE_SHORT_LABEL[zone], px + pw / 2, py + ph - 4);
            ctx.textBaseline = "alphabetic";
          }
        }
      }

      // ── 2. Glove circles ─────────────────────────────────────────────────────
      const palmData = palmRef.current;
      if (!palmData) {
        if (debugRef.current) {
          ctx.font      = "bold 13px monospace";
          ctx.fillStyle = "rgba(239,68,68,0.9)";
          ctx.textAlign = "left";
          ctx.fillText("⚠ No hands detected", 8, 20);
        }
        return;
      }

      const vid    = videoRef?.current;
      const vt     = computeVideoTransform(vid?.videoWidth ?? 0, vid?.videoHeight ?? 0, w, h);
      const gloveR = GLOVE_RADIUS_NORM * w;

      const gloveEntries = [
        { pt: palmData.mpLeft,  solidColor: "#3b82f6", glowColor: "rgba(59,130,246,0.50)" },
        { pt: palmData.mpRight, solidColor: "#ef4444", glowColor: "rgba(239,68,68,0.50)"  },
      ];

      for (const { pt, solidColor, glowColor } of gloveEntries) {
        if (!pt) continue;

        const { x: cx, y: cy } = landmarkToContainerPx(pt.x, pt.y, vt);
        const r = gloveR;

        // Zone for this palm — same function as scoring (display-space: 1-rawX)
        const zone  = getZoneFromPoint({ x: 1 - pt.x, y: pt.y });
        const match = isShooting && curTarget !== null && zone === curTarget;

        // Glow halo — green when matching target zone during shot
        ctx.beginPath();
        ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
        ctx.strokeStyle = match ? "rgba(74,222,128,0.65)" : glowColor;
        ctx.lineWidth   = 3;
        ctx.stroke();

        // Filled disc
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle   = match ? "rgba(74,222,128,0.75)" : solidColor + "cc";
        ctx.fill();
        ctx.strokeStyle = match ? "#4ade80" : solidColor;
        ctx.lineWidth   = 2;
        ctx.stroke();

        // "G" label inside disc
        ctx.font         = `bold ${Math.round(r * 0.75)}px system-ui`;
        ctx.fillStyle    = "#ffffff";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("G", cx, cy);
        ctx.textBaseline = "alphabetic";

        // Zone label next to glove (always visible — confirms which zone)
        const zoneLabel = ZONE_SHORT_LABEL[zone];
        ctx.font         = "bold 11px monospace";
        ctx.fillStyle    = match ? "rgba(74,222,128,0.95)" : "rgba(250,204,21,0.90)";
        ctx.textAlign    = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(zoneLabel, cx + r + 5, cy);
        ctx.textBaseline = "alphabetic";
      }

      // ── 3. Debug overlay ────────────────────────────────────────────────
      if (debugRef.current) {
        // Use scoring-side values (latestInputRef) for exact debug parity.
        // Fall back to computing from palmRef when ref is absent (e.g. no camera).
        const li = latestInputRef?.current;
        const lZone: ShotZone | null = li
          ? li.leftZone
          : (palmData.mpLeft  ? getZoneFromPoint({ x: 1 - palmData.mpLeft.x,  y: palmData.mpLeft.y  }) : null);
        const rZone: ShotZone | null = li
          ? li.rightZone
          : (palmData.mpRight ? getZoneFromPoint({ x: 1 - palmData.mpRight.x, y: palmData.mpRight.y }) : null);

        const lMatch = !!(curTarget && lZone === curTarget);
        const rMatch = !!(curTarget && rZone === curTarget);

        const debugLines = [
          `Target:     ${curTarget ? SHOT_ZONE_LABELS[curTarget] : "—"}`,
          `Save window:${isShooting ? " ACTIVE ✓" : " inactive"}`,
          `Left hand:  ${lZone ? SHOT_ZONE_LABELS[lZone] : "none"}${lMatch ? "  ✓ MATCH" : ""}`,
          `Right hand: ${rZone ? SHOT_ZONE_LABELS[rZone] : "none"}${rMatch ? "  ✓ MATCH" : ""}`,
          `Match: ${lMatch || rMatch ? "true" : "false"}`,
        ];

        ctx.font      = "12px monospace";
        ctx.textAlign = "left";
        const lineH   = 16;
        debugLines.forEach((line, i) => {
          const y = 14 + i * lineH;
          ctx.fillStyle = "rgba(0,0,0,0.60)";
          ctx.fillRect(4, y - 12, line.length * 7.2 + 6, lineH);
          const isMatchLine = (i === 2 && lMatch) || (i === 3 && rMatch) || (i === 4 && (lMatch || rMatch));
          ctx.fillStyle = isMatchLine ? "rgba(74,222,128,0.95)" : "rgba(250,204,21,0.95)";
          ctx.fillText(line, 6, y);
        });

        // Zone grid + forgiveness margins (dashed)
        for (const zone of ALL_SHOT_ZONES) {
          const b = SHOT_ZONES[zone];
          const f = ZONE_FORGIVENESS;
          ctx.strokeStyle = "rgba(250,204,21,0.30)";
          ctx.lineWidth   = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(
            (b.x0 - f) * w, (b.y0 - f) * h,
            (b.x1 - b.x0 + 2 * f) * w,
            (b.y1 - b.y0 + 2 * f) * h,
          );
          ctx.setLineDash([]);
        }
      }
    }

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [palmRef, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
