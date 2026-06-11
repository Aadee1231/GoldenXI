"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { CheckCircle2, Circle, AlertTriangle, Loader2 } from "lucide-react";
import type { CameraError } from "./types";
import PoseOverlay from "./PoseOverlay";
import type { HandPalmData } from "@/src/lib/goalie/geometry";
import { toMirroredX } from "@/src/lib/goalie/geometry";

type CalibrationProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  palmRef: RefObject<HandPalmData | null>;
  cameraError: CameraError;
  isModelReady: boolean;
  isCameraActive: boolean;
  onStart: () => void;
  onEnableCamera: () => void;
};

type Check = { label: string; ok: boolean };

/**
 * Minimum mirrored-x separation between the two palm centres.
 * 0.20 ≈ 20 % of frame width — satisfied at ~1 m distance with arms apart.
 */
const MIN_PALM_SPREAD = 0.20;

/**
 * How long (ms) both hands must be detected continuously before the countdown
 * starts. Prevents accidental triggers from a single-frame detection.
 */
const STABLE_HOLD_MS = 800;

const CAMERA_ERROR_MSG: Record<CameraError, string> = {
  "none":      "",
  "not-found": "No camera found. Connect a webcam and refresh.",
  "blocked":   "Camera access blocked. Allow camera permission in your browser, then refresh.",
  "no-pose":   "Hands not detected. Make sure both hands are clearly visible.",
  "too-close": "You are too close to the camera — step back a bit.",
  "too-far":   "You are too far from the camera — step closer.",
};

export default function CameraCalibration({
  videoRef,
  palmRef,
  cameraError,
  isModelReady,
  isCameraActive,
  onStart,
  onEnableCamera,
}: CalibrationProps) {
  const [checks, setChecks] = useState<Check[]>([
    { label: "Left hand detected",  ok: false },
    { label: "Right hand detected", ok: false },
    { label: "Hands spread apart",  ok: false },
  ]);

  // countdown: null = not running, 3/2/1 = ticking
  const [countdown, setCountdown] = useState<number | null>(null);

  // Stable refs so rAF callbacks never capture stale values
  const stableStartRef    = useRef<number | null>(null);
  const countingDownRef   = useRef(false);
  const timersRef         = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onStartRef        = useRef(onStart);
  useEffect(() => { onStartRef.current = onStart; }, [onStart]);

  // Measure video display size for PoseOverlay
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 480 });
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Cancel countdown — safe to call multiple times
  const cancelCountdown = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    countingDownRef.current = false;
    setCountdown(null);
  }, []);

  // rAF loop: compute calibration checks + stability hold + auto-countdown
  useEffect(() => {
    if (!isCameraActive) return;
    let rafId: number;

    function tick() {
      rafId = requestAnimationFrame(tick);
      const pd = palmRef.current;

      let lOk = false;
      let rOk = false;
      let sOk = false;

      if (pd) {
        lOk = pd.mpLeft  !== null;
        rOk = pd.mpRight !== null;
        if (pd.mpLeft && pd.mpRight) {
          const mx1 = toMirroredX(pd.mpLeft.x);
          const mx2 = toMirroredX(pd.mpRight.x);
          sOk = Math.abs(mx1 - mx2) >= MIN_PALM_SPREAD;
        }
      }

      const allOk = lOk && rOk && sOk;

      // Batch check update only when something changed
      setChecks((prev) => {
        const next: Check[] = [
          { label: "Left hand detected",  ok: lOk },
          { label: "Right hand detected", ok: rOk },
          { label: "Hands spread apart",  ok: sOk },
        ];
        return prev.every((c, i) => c.ok === next[i].ok) ? prev : next;
      });

      if (allOk) {
        // Begin stability timer
        if (stableStartRef.current === null) {
          stableStartRef.current = performance.now();
        }

        // Once stable long enough, fire the countdown
        if (
          !countingDownRef.current &&
          performance.now() - stableStartRef.current >= STABLE_HOLD_MS
        ) {
          countingDownRef.current = true;
          setCountdown(3);
          timersRef.current = [
            setTimeout(() => { if (countingDownRef.current) setCountdown(2); }, 1000),
            setTimeout(() => { if (countingDownRef.current) setCountdown(1); }, 2000),
            setTimeout(() => {
              if (!countingDownRef.current) return;
              countingDownRef.current = false;
              setCountdown(null);
              onStartRef.current();
            }, 3000),
          ];
        }
      } else {
        // Hands lost — reset stability and abort any running countdown
        stableStartRef.current = null;
        if (countingDownRef.current) {
          timersRef.current.forEach(clearTimeout);
          timersRef.current = [];
          countingDownRef.current = false;
          setCountdown(null);
        }
      }
    }

    tick();
    return () => {
      cancelAnimationFrame(rafId);
      cancelCountdown();
    };
  }, [isCameraActive, palmRef, cancelCountdown]);

  // Space / Enter shortcut — start immediately once all checks pass
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space" && e.code !== "Enter") return;
      if (!checks.every((c) => c.ok)) return;
      e.preventDefault();
      cancelCountdown();
      onStartRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checks, cancelCountdown]);

  // Cleanup on unmount
  useEffect(() => () => cancelCountdown(), [cancelCountdown]);

  const allOk = checks.every((c) => c.ok);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Video container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black"
        style={{ aspectRatio: "4/3" }}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
        />

        {isCameraActive && (
          <PoseOverlay
            palmRef={palmRef}
            phase="idle"
            target={null}
            result={null}
            width={size.w}
            height={size.h}
          />
        )}

        {/* Auto-start countdown overlay on the video */}
        {countdown !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-[2px]">
            <p className="text-sm font-semibold tracking-wide text-zinc-300">
              Hands detected — starting in
            </p>
            <span
              key={countdown}
              className="goalie-count text-8xl font-extrabold text-yellow-400 drop-shadow-lg"
              style={{ textShadow: "0 0 40px rgba(250,204,21,0.6)" }}
            >
              {countdown}
            </span>
            <p className="mt-1 text-xs text-zinc-400">
              Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-zinc-200">Space</kbd> or{" "}
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-zinc-200">Enter</kbd> to start now
            </p>
          </div>
        )}

        {/* Model loading overlay */}
        {!isModelReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
            <p className="text-sm font-semibold text-zinc-300">Loading hand model…</p>
          </div>
        )}

        {/* Enable camera prompt */}
        {isModelReady && !isCameraActive && cameraError === "none" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <p className="max-w-[260px] text-center text-sm text-zinc-300">
              Allow camera access to play with motion controls.
            </p>
            <button
              type="button"
              onClick={onEnableCamera}
              className="rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 active:scale-95"
            >
              Enable Camera
            </button>
          </div>
        )}

        {/* Camera error overlay */}
        {cameraError !== "none" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-semibold text-red-300">
              {CAMERA_ERROR_MSG[cameraError]}
            </p>
          </div>
        )}
      </div>

      {/* Checklist panel */}
      {isCameraActive && cameraError === "none" && (
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Calibration checklist
          </p>

          <ul className="space-y-2">
            {checks.map(({ label, ok }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium">
                {ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-600" />
                )}
                <span className={ok ? "text-white" : "text-zinc-500"}>{label}</span>
              </li>
            ))}
          </ul>

          {/* Status line below checklist */}
          <div className="mt-4 min-h-[2.5rem]">
            {countdown !== null ? (
              <p className="text-center text-sm font-semibold text-yellow-400">
                Starting in {countdown}…
              </p>
            ) : allOk ? (
              <p className="text-center text-sm text-zinc-400">
                Hold steady…{" "}
                <span className="text-zinc-500">
                  or press{" "}
                  <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-zinc-300">Space</kbd>
                  {" / "}
                  <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-zinc-300">Enter</kbd>
                </span>
              </p>
            ) : (
              <p className="text-center text-sm text-zinc-500">
                Get both hands in view to continue…
              </p>
            )}
          </div>

          {/* Safety copy */}
          <p className="mt-3 text-center text-xs text-zinc-600">
            Move your hands to save — do not dive.
          </p>
        </div>
      )}
    </div>
  );
}
