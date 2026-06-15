"use client";

/**
 * Celebration Pose-Off — Main Game Component (debugged)
 *
 * Bug fixes applied:
 *  1. Persistent video/canvas layer — never re-mounts across phase changes so
 *     the MediaPipe stream is always attached to the same DOM element.
 *  2. `score` React state added so the HUD actually re-renders when points change.
 *  3. Skeleton draw uses `pa.x * w` (not `(1−x)*w`) so it aligns with the
 *     CSS-mirrored video feed — one mirror only, not two.
 *  4. Scoring runs on a 100 ms setInterval, not a 60 fps rAF, eliminating
 *     60 setState calls/second.
 *  5. `error-load-failed` case shown on the landing screen.
 *  6. In-game "No body detected" banner when landmarks are null.
 *  7. Removed the unused `CameraView` JSX variable.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Home, Zap, AlertTriangle, Camera, Timer, X } from "lucide-react";
import Link from "next/link";
import { usePoseOffLandmarker } from "@/src/lib/pose/mediapipe";
import { matchPose, applyStreakBonus, tierFromScore, BASE_POINTS, type MatchTier } from "@/src/lib/pose/scoring";
import { POSE_TEMPLATES, pickRandomPose, type PoseTemplate } from "@/src/lib/pose/templates";
import PoseReference from "./PoseReference";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const GAME_SECS     = 30;
const POSE_HOLD_MS  = 500;
const POSE_MAX_MS   = 4500;

type Phase = "landing" | "intro" | "setup" | "countdown" | "playing" | "gameover";

type Stats = { score: number; posesHit: number; perfectHits: number; maxStreak: number };

const VIS_MSGS: Record<string, { icon: string; text: string }> = {
  "no-pose":     { icon: "🕵️", text: "No body detected — step into frame" },
  "move-back":   { icon: "↔️",  text: "Move back so your full body is visible" },
  "bad-lighting":{ icon: "💡", text: "Need better lighting" },
  "ok":          { icon: "✅", text: "Looking good! Hold steady…" },
};

const CAM_ERRS: Record<string, string> = {
  denied:    "Camera permission denied. Allow camera access and refresh.",
  "not-found": "No camera found on this device.",
  error:     "Could not start camera. Try refreshing.",
};

const TIER_COLORS: Record<MatchTier, string> = {
  PERFECT: "text-yellow-300",
  GREAT:   "text-green-300",
  CLOSE:   "text-blue-300",
  MISS:    "text-zinc-500",
};

// ---------------------------------------------------------------------------
// Skeleton canvas helper
// ---------------------------------------------------------------------------
type LMP = { x: number; y: number; visibility?: number };

const BONES: Array<[string, string]> = [
  ["leftShoulder","rightShoulder"],
  ["leftShoulder","leftElbow"],   ["leftElbow","leftWrist"],
  ["rightShoulder","rightElbow"], ["rightElbow","rightWrist"],
  ["leftShoulder","leftHip"],     ["rightShoulder","rightHip"],
  ["leftHip","rightHip"],
  ["leftHip","leftKnee"],         ["leftKnee","leftAnkle"],
  ["rightHip","rightKnee"],       ["rightKnee","rightAnkle"],
];

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  lm: Record<string, LMP>,
  w: number, h: number,
  tier: MatchTier | null,
) {
  const bright = tier === "PERFECT" ? "#facc15"
               : tier === "GREAT"   ? "#4ade80"
               : tier === "CLOSE"   ? "#60a5fa"
               : "#ffffff";

  const visLm = Object.values(lm) as LMP[];

  // Pass 1 — thick dark outline (shadow) so lines show on any background
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.lineWidth   = 14;
  ctx.lineJoin    = "round";
  ctx.lineCap     = "round";
  for (const [a, b] of BONES) {
    const pa = lm[a]; const pb = lm[b];
    if (!pa || !pb) continue;
    if ((pa.visibility ?? 1) < 0.35 || (pb.visibility ?? 1) < 0.35) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  }

  // Pass 2 — bright coloured line on top
  ctx.strokeStyle = bright;
  ctx.lineWidth   = 6;
  for (const [a, b] of BONES) {
    const pa = lm[a]; const pb = lm[b];
    if (!pa || !pb) continue;
    if ((pa.visibility ?? 1) < 0.35 || (pb.visibility ?? 1) < 0.35) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  }

  // Joints — dark ring then bright fill
  for (const n of visLm) {
    if ((n.visibility ?? 1) < 0.35) continue;
    const nx = n.x * w; const ny = n.y * h;
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.beginPath(); ctx.arc(nx, ny, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bright;
    ctx.beginPath(); ctx.arc(nx, ny, 6, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PoseOffGame() {
  const [phase,      setPhase]      = useState<Phase>("landing");
  const [pose,       setPose]       = useState<PoseTemplate>(POSE_TEMPLATES[0]);
  const [tier,       setTier]       = useState<MatchTier | null>(null);
  const [simScore,   setSimScore]   = useState<number | null>(null);
  const [streak,     setStreak]     = useState(0);
  const [score,      setScore]      = useState(0);   // FIX: state so HUD re-renders
  const [timeLeft,   setTimeLeft]   = useState(GAME_SECS);
  const [countdown,  setCountdown]  = useState(3);
  const [stats,      setStats]      = useState<Stats>({ score:0, posesHit:0, perfectHits:0, maxStreak:0 });
  const [helperText, setHelperText] = useState<string | null>(null);

  // mutable game state in refs (avoids stale closure in rAF loops)
  const phaseRef        = useRef<Phase>("landing");
  const poseRef         = useRef<PoseTemplate>(POSE_TEMPLATES[0]);
  const streakRef       = useRef(0);
  const scoreRef        = useRef(0);  // keep ref for reading in closures; setScore keeps UI in sync
  const posesHitRef     = useRef(0);
  const perfectRef      = useRef(0);
  const maxStreakRef    = useRef(0);
  const holdStartRef    = useRef<number | null>(null);
  /** Rolling 700 ms window for score smoothing — prevents single-frame MISS flickers */
  const scoreWindowRef  = useRef<Array<{ score: number; time: number }>>([]);
  const awardedRef      = useRef(false);
  const lastPoseIdRef   = useRef("");
  const poseTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef       = useRef<HTMLCanvasElement | null>(null);
  const skeletonRafRef  = useRef<number | null>(null);

  const { videoRef, landmarksRef, visibilityStatus, modelStatus, cameraStatus,
          startCamera, stopCamera, reattachStream } =
    usePoseOffLandmarker();

  // sync refs
  useEffect(() => { phaseRef.current = phase;  }, [phase]);
  useEffect(() => { poseRef.current  = pose;   }, [pose]);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  // ── Re-attach webcam stream after phase transitions that mount a new <video> ─
  // When React switches between phase branches each <video ref={videoRef}> is a
  // NEW DOM element — the old stream must be explicitly re-attached.
  useEffect(() => {
    if (phase === "countdown" || phase === "playing") {
      reattachStream();
    }
  }, [phase, reattachStream]);

  // ── Skeleton draw loop ──────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width  = video.videoWidth  || canvas.offsetWidth;
        canvas.height = video.videoHeight || canvas.offsetHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const lm = landmarksRef.current;
        if (lm) drawSkeleton(ctx, lm as unknown as Record<string, LMP>, canvas.width, canvas.height, tier);
      }
    }
    skeletonRafRef.current = requestAnimationFrame(drawLoop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, landmarksRef, tier]);

  useEffect(() => {
    if (phase === "setup" || phase === "playing" || phase === "countdown") {
      skeletonRafRef.current = requestAnimationFrame(drawLoop);
    }
    return () => { if (skeletonRafRef.current) cancelAnimationFrame(skeletonRafRef.current); };
  }, [phase, drawLoop]);

  // ── Pose scoring — 100 ms interval (not rAF) ──────────────────────────
  // 10 checks/second is plenty for a hold-to-score pose game and avoids
  // firing setState 60 times/second.
  useEffect(() => {
    if (phase !== "playing") return;

    const id = setInterval(() => {
      if (phaseRef.current !== "playing") return;
      const lm = landmarksRef.current;

      if (!lm) {
        setTier(null);
        setSimScore(null);
        holdStartRef.current = null;
        return;
      }

      const res = matchPose(lm, poseRef.current);

      // ── 700 ms rolling-max smoother ────────────────────────────────────
      // Uses the best score seen in the last 700 ms so a single noisy frame
      // can't instantly flip the display back to MISS.
      const now = performance.now();
      scoreWindowRef.current = [
        ...scoreWindowRef.current.filter(e => now - e.time < 700),
        { score: res.score, time: now },
      ];
      const displayScore = Math.max(...scoreWindowRef.current.map(e => e.score));
      const displayTier  = tierFromScore(displayScore);

      setTier(displayTier);
      setSimScore(displayScore);
      setHelperText(displayScore < 70 ? res.helperText : null);

      // ── Dev debug object (inspect via window.__poseoff_debug in console) ─
      if (process.env.NODE_ENV !== "production") {
        (globalThis as Record<string, unknown>).__poseoff_debug = {
          templateId:    poseRef.current.id,
          rawScore:      res.score,
          displayScore,
          tier:          displayTier,
          normalScore:   res.normalScore,
          mirroredScore: res.mirroredScore,
          wasMirrored:   res.wasMirrored,
          leftArmScore:  res.leftArmScore,
          rightArmScore: res.rightArmScore,
        };
      }

      if (displayTier !== "MISS") {
        if (!holdStartRef.current) holdStartRef.current = now;
        else if (!awardedRef.current && now - holdStartRef.current >= POSE_HOLD_MS) {
          const ns  = streakRef.current + 1;
          const pts = applyStreakBonus(BASE_POINTS[displayTier], ns);
          scoreRef.current += pts;
          posesHitRef.current++;
          if (displayTier === "PERFECT") perfectRef.current++;
          if (ns > maxStreakRef.current) maxStreakRef.current = ns;
          streakRef.current = ns;
          setStreak(ns);
          setScore(scoreRef.current);
          awardedRef.current = true;

          if (poseTimerRef.current) clearTimeout(poseTimerRef.current);
          poseTimerRef.current = setTimeout(() => advancePose(), 650);
        }
      } else {
        holdStartRef.current = null;
      }
    }, 100);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function advancePose() {
    const next = pickRandomPose(lastPoseIdRef.current);
    lastPoseIdRef.current = next.id;
    setPose(next);
    poseRef.current      = next;
    holdStartRef.current = null;
    awardedRef.current   = false;
    scoreWindowRef.current = [];   // clear smoothing window for the new pose
  }

  // ── Auto-timeout on stuck pose ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    if (poseTimerRef.current) clearTimeout(poseTimerRef.current);
    poseTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== "playing") return;
      if (!awardedRef.current) { streakRef.current = 0; setStreak(0); }
      advancePose();
    }, POSE_MAX_MS);
    return () => { if (poseTimerRef.current) clearTimeout(poseTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, phase]);

  // ── Countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "countdown") return;
    let n = 3;
    setCountdown(n);
    const id = setInterval(() => {
      n--;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(id);
        setTimeout(() => {
          streakRef.current   = 0; scoreRef.current   = 0;
          posesHitRef.current = 0; perfectRef.current = 0;
          maxStreakRef.current = 0; awardedRef.current = false;
          holdStartRef.current = null;
          setStreak(0); setScore(0); setTimeLeft(GAME_SECS);
          setStats({ score:0, posesHit:0, perfectHits:0, maxStreak:0 });
          const first = pickRandomPose();
          lastPoseIdRef.current = first.id;
          setPose(first);
          setPhase("playing");
        }, 600);
      }
    }, 900);
    return () => clearInterval(id);
  }, [phase]);

  // ── Game timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    gameTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(gameTimerRef.current!);
          if (poseTimerRef.current) clearTimeout(poseTimerRef.current);
          setStats({
            score:       scoreRef.current,
            posesHit:    posesHitRef.current,
            perfectHits: perfectRef.current,
            maxStreak:   maxStreakRef.current,
          });
          setPhase("gameover");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (gameTimerRef.current) clearInterval(gameTimerRef.current); };
  }, [phase]);

  // ── Auto-start camera on setup ────────────────────────────────────────
  useEffect(() => {
    if (phase === "setup" && modelStatus === "ready" && cameraStatus === "idle") startCamera();
  }, [phase, modelStatus, cameraStatus, startCamera]);

  // ── Auto-advance setup → countdown when full body held for 1.5 s ──────
  const autoStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoStartIn,  setAutoStartIn]  = useState<number | null>(null);
  const autoTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== "setup") return;

    if (visibilityStatus === "ok") {
      // Tick down display counter
      setAutoStartIn(2);
      autoTickRef.current = setInterval(() => {
        setAutoStartIn((n) => (n !== null && n > 1 ? n - 1 : n));
      }, 500);

      autoStartTimerRef.current = setTimeout(() => {
        if (phaseRef.current === "setup") setPhase("countdown");
      }, 1500);
    } else {
      if (autoStartTimerRef.current) clearTimeout(autoStartTimerRef.current);
      if (autoTickRef.current) clearInterval(autoTickRef.current);
      setAutoStartIn(null);
    }

    return () => {
      if (autoStartTimerRef.current) clearTimeout(autoStartTimerRef.current);
      if (autoTickRef.current) clearInterval(autoTickRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, visibilityStatus]);

  // ── Cleanup ────────────────────────────────────────────────────────────
  useEffect(() => () => {
    stopCamera();
    if (poseTimerRef.current) clearTimeout(poseTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  }, [stopCamera]);

  // ── Derived helpers ───────────────────────────────────────────────────
  const blocked  = cameraStatus === "denied" || cameraStatus === "not-found" || cameraStatus === "error";
  const canPlay  = cameraStatus === "active" && visibilityStatus === "ok";
  const timerPct = (timeLeft / GAME_SECS) * 100;
  const timerClr = timeLeft <= 5 ? "bg-red-400" : timeLeft <= 10 ? "bg-yellow-400" : "bg-green-400";
  const visMsg   = VIS_MSGS[visibilityStatus] ?? VIS_MSGS["no-pose"];

  const TIER_COLORS: Record<MatchTier, string> = {
    PERFECT: "text-yellow-300",
    GREAT:   "text-green-300",
    CLOSE:   "text-blue-300",
    MISS:    "text-zinc-500",
  };

  const exitGame = () => { stopCamera(); setPhase("landing"); setTier(null); setSimScore(null); setHelperText(null); };

  // =========================================================================
  // LANDING
  // =========================================================================
  if (phase === "landing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 relative">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute right-1/3 bottom-1/4 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex max-w-md flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-purple-400 ring-1 ring-purple-400/20">
            <Zap className="h-3.5 w-3.5" /> Mini-Game
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Celebration{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              Pose-Off
            </span>
          </h1>
          <p className="text-base leading-relaxed text-zinc-400">
            Match the celebration. Hold the pose. Climb the leaderboard.
          </p>
          <div className="flex gap-3 text-3xl">
            {POSE_TEMPLATES.map((p, i) => (
              <span key={p.id} title={p.name}
                className="animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                {p.emoji}
              </span>
            ))}
          </div>

          {modelStatus === "error-model-missing" && (
            <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-left ring-1 ring-red-400/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-bold text-red-300">Pose model not found</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Download <code className="rounded bg-white/10 px-1 text-yellow-300">pose_landmarker_lite.task</code> from
                  MediaPipe Models and put it at{" "}
                  <code className="rounded bg-white/10 px-1 text-yellow-300">public/models/pose_landmarker_lite.task</code>.
                </p>
              </div>
            </div>
          )}
          {modelStatus === "error-load-failed" && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-left ring-1 ring-orange-400/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
              <div>
                <p className="text-sm font-bold text-orange-300">Model failed to load</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Could not initialise MediaPipe. Check browser console for details.
                  Try refreshing, or use Chrome/Edge on desktop.
                </p>
              </div>
            </div>
          )}
          {modelStatus === "loading" && (
            <p className="text-sm text-zinc-500 animate-pulse">Loading pose model…</p>
          )}

          <p className="text-xs text-zinc-500">📷 Step back so your full body is visible on camera.</p>
          <p className="text-xs text-zinc-600 sm:hidden">📱 Rotate to landscape for best tracking.</p>

          <button
            onClick={() => setPhase("intro")}
            disabled={modelStatus === "loading" || modelStatus === "error-model-missing" || modelStatus === "error-load-failed"}
            className="mt-2 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-10 py-4 text-base font-extrabold text-black shadow-xl shadow-yellow-400/25 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Zap className="h-5 w-5" /> Start Game
          </button>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
            <Home className="h-4 w-4" /> Back to GoldenXI
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // INTRO — quick "how to play" screen
  // =========================================================================
  if (phase === "intro") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 bg-[#080808]">
        <div className="relative z-10 flex max-w-lg flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
            How to Play
          </div>
          <h2 className="text-4xl font-extrabold text-white">Copy the Celebration</h2>
          <div className="flex flex-col gap-4 text-left w-full max-w-sm">
            {[
              { n: "1", t: "Watch the left panel", d: "A stick-figure shows the pose to copy. A big name tells you what it is." },
              { n: "2", t: "Strike the pose", d: "Copy the shape with your whole body. Step back so the camera sees you from head to toe." },
              { n: "3", t: "Hold until the ring fills", d: "Stay in the pose for half a second. Perfect = max points + streak bonus!" },
              { n: "4", t: "Move fast!", d: "You have 30 seconds. The faster you nail each pose, the higher your score." },
            ].map(({ n, t, d }) => (
              <div key={n} className="flex gap-4 items-start">
                <span className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-extrabold text-black">{n}</span>
                <div>
                  <p className="font-bold text-white">{t}</p>
                  <p className="text-sm text-zinc-400">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500">📷 Stand 2–3 m back. Make sure your full body is visible.</p>
          <button onClick={() => setPhase("setup")}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-10 py-4 text-base font-extrabold text-black shadow-xl hover:scale-105 transition-transform">
            <Zap className="h-5 w-5" /> Got it — Let&apos;s Go!
          </button>
          <button onClick={() => setPhase("landing")} className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CAMERA SETUP
  // =========================================================================
  if (phase === "setup") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-4">
          <button onClick={() => { stopCamera(); setPhase("intro"); }}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-2xl font-extrabold text-white">Get in Position</h2>
          <p className="text-sm text-zinc-400">Step back so your full body is visible — head to ankles.</p>

          {blocked && (
            <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{CAM_ERRS[cameraStatus] ?? "Camera error."}</p>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
            <video ref={videoRef} className="h-full w-full object-cover" style={{ transform:"scaleX(-1)" }}
              autoPlay playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none"
              style={{ transform:"scaleX(-1)" }} />
            {cameraStatus === "starting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Camera className="h-6 w-6 animate-pulse text-white" />
                <span className="ml-2 text-sm text-white">Starting camera…</span>
              </div>
            )}
            {cameraStatus === "active" && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                {autoStartIn !== null ? (
                  <div className="flex items-center gap-2 rounded-full bg-green-500/25 px-5 py-2 text-sm font-bold text-green-300 backdrop-blur ring-1 ring-green-400/50 animate-pulse">
                    ✅ Starting in {autoStartIn}…
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold backdrop-blur ${
                    visibilityStatus === "ok" ? "bg-green-500/20 text-green-300 ring-1 ring-green-400/40" : "bg-black/60 text-zinc-300"
                  }`}>
                    <span>{visMsg.icon}</span><span>{visMsg.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {(blocked || cameraStatus === "idle") && (
            <button onClick={() => startCamera()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:border-white/40">
              <Camera className="h-4 w-4" />
              {cameraStatus === "idle" ? "Enable Camera" : "Retry Camera"}
            </button>
          )}

          {/* Manual override — shown only when auto-start is pending so user can skip the wait */}
          {autoStartIn !== null ? (
            <button onClick={() => setPhase("countdown")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-4 text-base font-extrabold text-black shadow-lg">
              <Zap className="h-5 w-5" /> Go Now!
            </button>
          ) : (
            <button onClick={() => setPhase("countdown")} disabled={!canPlay}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-4 text-base font-extrabold text-black shadow-lg disabled:opacity-30 disabled:cursor-not-allowed">
              <Zap className="h-5 w-5" />
              {canPlay ? "I'm Ready — Let's Go!" : "Waiting for full body…"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // COUNTDOWN + PLAYING — fullscreen fixed overlay; shared video/canvas node
  // so the MediaPipe stream never re-mounts between countdown → playing.
  // =========================================================================
  if (phase === "countdown" || phase === "playing") {
    return (
      <div className="fixed inset-0 z-50 bg-black overflow-hidden flex">

        {/* ── Left reference panel (desktop) ─────────────────────────── */}
        {phase === "playing" && (
          <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col border-r border-white/10 bg-black/95 overflow-hidden">
            <PoseReference pose={pose} tier={tier} simScore={simScore} />
          </aside>
        )}

        {/* ── Main camera area ────────────────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden">

          {/* Camera feed — lighter overlay so user sees themselves clearly */}
          <video ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform:"scaleX(-1)", opacity: 0.82 }}
            autoPlay playsInline muted />
          <canvas ref={canvasRef}
            className="absolute inset-0 h-full w-full pointer-events-none"
            style={{ transform:"scaleX(-1)" }} />

          {/* Subtle gradient for HUD readability only at edges */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55 pointer-events-none" />

          {/* ── COUNTDOWN overlay ───────────────────────────────────────── */}
          {phase === "countdown" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 z-20">
              <div className="text-[110px] font-extrabold leading-none text-yellow-400 drop-shadow-[0_0_60px_rgba(250,204,21,0.7)]">
                {countdown === 0 ? "GO!" : countdown}
              </div>
              <p className="mt-2 text-lg font-semibold text-white/60">Get in position!</p>
              <button onClick={exitGame}
                className="absolute top-4 left-4 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white backdrop-blur ring-1 ring-white/10">
                <X className="h-3.5 w-3.5" /> Exit
              </button>
            </div>
          )}

          {/* ── PLAYING UI ──────────────────────────────────────────────── */}
          {phase === "playing" && (
            <>
              {/* Mobile reference strip (top) */}
              <div className="lg:hidden absolute top-0 left-0 right-0 z-20 bg-black/80 border-b border-white/10 backdrop-blur">
                <PoseReference pose={pose} tier={tier} simScore={simScore} compact />
              </div>

              {/* Exit button */}
              <button onClick={exitGame}
                className="absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-xl bg-black/70 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white backdrop-blur ring-1 ring-white/10 lg:hidden">
                <X className="h-3.5 w-3.5" /> Exit
              </button>
              <button onClick={exitGame}
                className="hidden lg:flex absolute top-3 right-3 z-30 items-center gap-1.5 rounded-xl bg-black/70 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white backdrop-blur ring-1 ring-white/10">
                <X className="h-3.5 w-3.5" /> Exit
              </button>

              {/* HUD — score / timer / streak */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
                <div className="rounded-xl bg-black/70 px-4 py-2 backdrop-blur ring-1 ring-white/10 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Score</p>
                  <p className="text-2xl font-extrabold tabular-nums text-yellow-400 leading-none">{score.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5 rounded-xl bg-black/70 px-4 py-2 backdrop-blur ring-1 ring-white/10">
                    <Timer className="h-4 w-4 text-zinc-400" />
                    <span className={`text-2xl font-extrabold tabular-nums leading-none ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
                      {timeLeft}
                    </span>
                  </div>
                  <div className="h-1.5 w-28 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${timerClr}`} style={{ width:`${timerPct}%` }} />
                  </div>
                </div>
                <div className="rounded-xl bg-black/70 px-4 py-2 backdrop-blur ring-1 ring-white/10 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Streak</p>
                  <p className="text-2xl font-extrabold tabular-nums text-orange-400 leading-none">{streak}{streak >= 3 ? "🔥" : ""}</p>
                </div>
              </div>

              {/* Large center tier label */}
              {tier && tier !== "MISS" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                  style={{ top: "30%", bottom: "40%" }}>
                  <span className={`text-7xl font-black tracking-widest drop-shadow-[0_0_30px_currentColor] ${TIER_COLORS[tier]}`}>
                    {tier}
                  </span>
                </div>
              )}

              {/* Helper text / visibility feedback */}
              <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 pointer-events-none">
                {visibilityStatus !== "ok" && (
                  <div className="rounded-full bg-black/75 px-5 py-2 text-sm font-semibold text-zinc-300 backdrop-blur ring-1 ring-white/10">
                    {visMsg.icon} {visMsg.text}
                  </div>
                )}
                {visibilityStatus === "ok" && helperText && (
                  <div className="rounded-full bg-black/75 px-5 py-2 text-sm font-bold text-yellow-300 backdrop-blur ring-1 ring-yellow-400/30">
                    ↗ {helperText}
                  </div>
                )}
              </div>

              {/* Accuracy bar — bottom of screen */}
              {simScore !== null && (
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tabular-nums text-zinc-400 w-8 text-right">{simScore}%</span>
                    <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-150 ${
                          simScore >= 88 ? "bg-yellow-400" : simScore >= 70 ? "bg-green-400" : simScore >= 45 ? "bg-blue-400" : "bg-zinc-600"
                        }`}
                        style={{ width:`${simScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 w-14">
                      {simScore >= 88 ? "PERFECT" : simScore >= 70 ? "GREAT" : simScore >= 45 ? "CLOSE" : "MISS"}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // GAME OVER
  // =========================================================================
  const tierLabel =
    stats.score >= 800 ? "🏆 World Class"
    : stats.score >= 500 ? "⭐ Solid Celebration"
    : stats.score >= 250 ? "👍 Getting There"
    : "💪 Keep Practising";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-yellow-500/8 blur-3xl" />
        <div className="absolute right-1/3 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
          Game Over
        </div>

        <div>
          <p className="text-sm text-zinc-400">Final Score</p>
          <p className="text-7xl font-extrabold tabular-nums text-yellow-400 drop-shadow-[0_0_24px_rgba(250,204,21,0.4)]">
            {stats.score.toLocaleString()}
          </p>
          <p className="mt-1 text-base font-bold text-white">{tierLabel}</p>
        </div>

        {/* Stats grid */}
        <div className="grid w-full grid-cols-3 gap-3">
          {[
            { label: "Poses Hit",    value: stats.posesHit },
            { label: "Perfects",     value: stats.perfectHits },
            { label: "Best Streak",  value: stats.maxStreak },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] py-4">
              <p className="text-xl font-extrabold text-white">{value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Streak bonus note */}
        {stats.maxStreak >= 3 && (
          <p className="text-xs text-zinc-400">
            🔥 Streak bonus applied — {stats.maxStreak >= 8 ? "2×" : stats.maxStreak >= 5 ? "1.5×" : "1.2×"} multiplier reached!
          </p>
        )}

        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => { stopCamera(); setTimeout(() => setPhase("setup"), 100); }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-4 text-base font-extrabold text-black shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40"
          >
            <RotateCcw className="h-5 w-5" /> Play Again
          </button>
          <Link href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 py-3.5 text-sm font-semibold text-white hover:border-white/40">
            <Home className="h-4 w-4" /> Back to GoldenXI
          </Link>
        </div>
      </div>
    </div>
  );
}
