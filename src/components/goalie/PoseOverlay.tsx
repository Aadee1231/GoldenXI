"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  ALL_SHOT_ZONES,
  SHOT_ZONES,
  SHOT_ZONE_LABELS,
  ZONE_FORGIVENESS,
  GLOVE_RADIUS_NORM,
  TARGET_POCKET_CENTERS,
  getZoneFromPoint,
  computeVideoTransform,
  landmarkToContainerPx,
  type ShotZone,
  type HandPalmData,
  type PocketSize,
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
  leftZone:          ShotZone | null;
  rightZone:         ShotZone | null;
  leftPoint:         { x: number; y: number } | null;
  rightPoint:        { x: number; y: number } | null;
  leftInPocket:      boolean;
  rightInPocket:     boolean;
  leftEnteredPocket: boolean;
  rightEnteredPocket:boolean;
  pocketSize:        PocketSize | null;
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
  /** Active target pocket size (normalised). Passed so the canvas pocket matches scoring exactly. */
  pocketSize?: PocketSize;
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
  pocketSize,
}: Props) {
  const debug = showDebug ?? SHOW_DEBUG;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep refs for values read inside the rAF loop (avoids stale closure).
  const phaseRef      = useRef(phase);
  const targetRef     = useRef(target);
  const resultRef     = useRef(result);
  const debugRef      = useRef(debug);
  const pocketSizeRef = useRef(pocketSize);

  useEffect(() => { phaseRef.current      = phase;      }, [phase]);
  useEffect(() => { targetRef.current     = target;     }, [target]);
  useEffect(() => { resultRef.current     = result;     }, [result]);
  useEffect(() => { debugRef.current      = debug;      }, [debug]);
  useEffect(() => { pocketSizeRef.current = pocketSize; }, [pocketSize]);

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

      // ── 1. Zone backgrounds & borders (always faint) ───────────────────────
      for (const zone of ALL_SHOT_ZONES) {
        const b = SHOT_ZONES[zone];
        const px = b.x0 * w;
        const py = b.y0 * h;
        const pw = (b.x1 - b.x0) * w;
        const ph = (b.y1 - b.y0) * h;

        if (revealTarget) {
          ctx.fillStyle   = "rgba(0,0,0,0.06)";
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeStyle = "rgba(255,255,255,0.10)";
          ctx.lineWidth   = 1;
          ctx.strokeRect(px, py, pw, ph);
        } else if (debugRef.current) {
          ctx.fillStyle   = ZONE_IDLE_FILL[zone];
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeStyle = ZONE_IDLE_BORDER[zone];
          ctx.lineWidth   = 1;
          ctx.strokeRect(px, py, pw, ph);
          ctx.font         = "bold 12px system-ui";
          ctx.fillStyle    = ZONE_IDLE_BORDER[zone];
          ctx.textAlign    = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(ZONE_SHORT_LABEL[zone], px + pw / 2, py + ph - 4);
          ctx.textBaseline = "alphabetic";
        }
      }

      // ── 1b. Target pocket highlight ──────────────────────────────────────
      if (revealTarget && curTarget !== null) {
        const pc  = TARGET_POCKET_CENTERS[curTarget];
        const ps  = pocketSizeRef.current;
        const pw2 = ps ? ps.w * w : 0.22 * w;
        const ph2 = ps ? ps.h * h : 0.20 * h;
        const ppx = (pc.x - (ps ? ps.w / 2 : 0.11)) * w;
        const ppy = (pc.y - (ps ? ps.h / 2 : 0.10)) * h;

        if (isResult) {
          const saved = curResult?.saved;
          ctx.fillStyle   = saved ? "rgba(74,222,128,0.28)" : "rgba(248,113,113,0.28)";
          ctx.fillRect(ppx, ppy, pw2, ph2);
          ctx.strokeStyle = saved ? "rgba(74,222,128,0.95)" : "rgba(248,113,113,0.95)";
          ctx.lineWidth   = 2.5;
          ctx.strokeRect(ppx + 1, ppy + 1, pw2 - 2, ph2 - 2);

          ctx.font         = "bold 13px system-ui";
          ctx.fillStyle    = saved ? "rgba(74,222,128,0.95)" : "rgba(248,113,113,0.95)";
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(SHOT_ZONE_LABELS[curTarget], ppx + pw2 / 2, ppy + ph2 / 2);
          ctx.textBaseline = "alphabetic";
        } else {
          const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
          ctx.fillStyle   = `rgba(250,204,21,${(0.10 + pulse * 0.20).toFixed(2)})`;
          ctx.fillRect(ppx, ppy, pw2, ph2);
          ctx.strokeStyle = `rgba(250,204,21,${(0.65 + pulse * 0.30).toFixed(2)})`;
          ctx.lineWidth   = 1.5 + pulse * 2;
          ctx.strokeRect(ppx + 1, ppy + 1, pw2 - 2, ph2 - 2);

          ctx.font         = "bold 12px system-ui";
          ctx.fillStyle    = `rgba(250,204,21,${(0.70 + pulse * 0.25).toFixed(2)})`;
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(SHOT_ZONE_LABELS[curTarget], ppx + pw2 / 2, ppy + ph2 / 2);
          ctx.textBaseline = "alphabetic";
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

      // Use scoring-side pocket flags from latestInputRef for match detection
      const li          = latestInputRef?.current;
      const lInPocket   = li?.leftInPocket      ?? false;
      const rInPocket   = li?.rightInPocket     ?? false;
      const lEnteredPkt = li?.leftEnteredPocket  ?? false;
      const rEnteredPkt = li?.rightEnteredPocket ?? false;

      for (const { pt, solidColor, glowColor } of gloveEntries) {
        if (!pt) continue;

        const { x: cx, y: cy } = landmarkToContainerPx(pt.x, pt.y, vt);
        const r = gloveR;

        const zone  = getZoneFromPoint({ x: 1 - pt.x, y: pt.y });
        const isLeft = pt === palmData.mpLeft;
        const inPkt  = isLeft ? lInPocket  : rInPocket;
        const entered = isLeft ? lEnteredPkt : rEnteredPkt;
        const match = isShooting && (entered || inPkt);

        // Glow halo — green when inside target pocket during shot
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

        // Zone label next to glove
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
        const lZone: ShotZone | null = li
          ? li.leftZone
          : (palmData.mpLeft  ? getZoneFromPoint({ x: 1 - palmData.mpLeft.x,  y: palmData.mpLeft.y  }) : null);
        const rZone: ShotZone | null = li
          ? li.rightZone
          : (palmData.mpRight ? getZoneFromPoint({ x: 1 - palmData.mpRight.x, y: palmData.mpRight.y }) : null);

        const pktW = li?.pocketSize?.w ?? pocketSizeRef.current?.w;
        const pktH = li?.pocketSize?.h ?? pocketSizeRef.current?.h;
        const saveEligible = lEnteredPkt || rEnteredPkt;

        const debugLines = [
          `Target:     ${curTarget ? SHOT_ZONE_LABELS[curTarget] : "—"}`,
          `Pocket:     ${pktW !== undefined ? `${pktW.toFixed(2)}×${pktH?.toFixed(2)}` : "—"}`,
          `Save window:${isShooting ? " ACTIVE ✓" : " inactive"}`,
          `L zone:     ${lZone ? SHOT_ZONE_LABELS[lZone] : "none"}${lInPocket ? " ✓PKT" : ""}${lEnteredPkt ? " ENTERED" : ""}`,
          `R zone:     ${rZone ? SHOT_ZONE_LABELS[rZone] : "none"}${rInPocket ? " ✓PKT" : ""}${rEnteredPkt ? " ENTERED" : ""}`,
          `Eligible:   ${saveEligible}`,
        ];

        ctx.font      = "12px monospace";
        ctx.textAlign = "left";
        const lineH   = 16;
        debugLines.forEach((line, i) => {
          const y = 14 + i * lineH;
          ctx.fillStyle = "rgba(0,0,0,0.60)";
          ctx.fillRect(4, y - 12, line.length * 7.2 + 6, lineH);
          const hi = saveEligible && (i === 3 || i === 4 || i === 5);
          ctx.fillStyle = hi ? "rgba(74,222,128,0.95)" : "rgba(250,204,21,0.95)";
          ctx.fillText(line, 6, y);
        });

        // Zone grid (faint dashed)
        for (const zone of ALL_SHOT_ZONES) {
          const b = SHOT_ZONES[zone];
          const f = ZONE_FORGIVENESS;
          ctx.strokeStyle = "rgba(250,204,21,0.20)";
          ctx.lineWidth   = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(
            (b.x0 - f) * w, (b.y0 - f) * h,
            (b.x1 - b.x0 + 2 * f) * w,
            (b.y1 - b.y0 + 2 * f) * h,
          );
          ctx.setLineDash([]);
        }

        // Pocket outlines for all zones (dashed cyan)
        const ps = pocketSizeRef.current;
        if (ps) {
          for (const zone of ALL_SHOT_ZONES) {
            const pc = TARGET_POCKET_CENTERS[zone];
            ctx.strokeStyle = zone === curTarget
              ? "rgba(74,222,128,0.50)"
              : "rgba(34,211,238,0.25)";
            ctx.lineWidth   = 1;
            ctx.setLineDash([3, 5]);
            ctx.strokeRect(
              (pc.x - ps.w / 2) * w, (pc.y - ps.h / 2) * h,
              ps.w * w, ps.h * h,
            );
            ctx.setLineDash([]);
          }
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
