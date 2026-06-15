"use client";

/**
 * DEV-ONLY UTILITY — Pose Template Recorder for Celebration Pose-Off
 *
 * Not linked in the public navbar.
 * Access at /admin/pose-recorder — protected by the admin layout
 * (ADMIN_EMAILS env var + Supabase auth).
 *
 * Usage:
 *   1. Stand in front of the webcam showing full body.
 *   2. Strike a celebration pose.
 *   3. Fill in metadata fields.
 *   4. Click "Capture Pose" — joint angles are frozen from the current frame.
 *   5. Adjust weights if needed (they should sum to 1.00).
 *   6. Click "Copy JSON" and paste into POSE_TEMPLATES in
 *      /src/lib/pose/templates.ts, then add a silhouette in PoseCard.tsx.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Camera, Check, Copy, Crosshair, X } from "lucide-react";
import { usePoseOffLandmarker } from "@/src/lib/pose/mediapipe";
import type { PoseLandmarks } from "@/src/lib/pose/scoring";
import type { PoseJoint } from "@/src/lib/pose/templates";

// ---------------------------------------------------------------------------
// Geometry helpers — duplicated from scoring.ts (private there, standalone here)
// ---------------------------------------------------------------------------

function angleDeg(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const m = (v: { x: number; y: number }) => Math.sqrt(v.x ** 2 + v.y ** 2);
  const m1 = m(ab), m2 = m(cb);
  if (m1 === 0 || m2 === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180) / Math.PI;
}

function snapshotAngles(lm: PoseLandmarks): Record<PoseJoint, number> {
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
// Skeleton drawing — same mirror convention as PoseOffGame (x*w, CSS scaleX(-1))
// ---------------------------------------------------------------------------

type LMP = { x: number; y: number; visibility?: number };
const BONES: [keyof PoseLandmarks, keyof PoseLandmarks][] = [
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"],   ["leftElbow",  "leftWrist"],
  ["rightShoulder","rightElbow"],  ["rightElbow", "rightWrist"],
  ["leftShoulder", "leftHip"],     ["rightShoulder", "rightHip"],
  ["leftHip",      "rightHip"],
  ["leftHip",      "leftKnee"],    ["leftKnee",  "leftAnkle"],
  ["rightHip",     "rightKnee"],   ["rightKnee", "rightAnkle"],
];

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  lm: PoseLandmarks,
  w: number,
  h: number,
) {
  ctx.strokeStyle = "#facc15";
  ctx.fillStyle   = "#facc15";
  ctx.lineWidth   = 2.5;
  ctx.globalAlpha = 0.85;

  for (const [a, b] of BONES) {
    const pa = lm[a] as LMP; const pb = lm[b] as LMP;
    if (!pa || !pb) continue;
    if ((pa.visibility ?? 1) < 0.4 || (pb.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  }
  for (const n of Object.values(lm) as LMP[]) {
    if ((n.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.arc(n.x * w, n.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JOINTS: PoseJoint[] = [
  "leftElbow", "rightElbow",
  "leftShoulder", "rightShoulder",
  "leftHip", "rightHip",
  "leftKnee", "rightKnee",
];

const DEFAULT_WEIGHTS: Record<PoseJoint, number> = {
  leftElbow: 0.20, rightElbow: 0.20,
  leftShoulder: 0.15, rightShoulder: 0.15,
  leftHip: 0.10, rightHip: 0.10,
  leftKnee: 0.05, rightKnee: 0.05,
};

// ---------------------------------------------------------------------------
// Shared input / label styles
// ---------------------------------------------------------------------------

const INPUT = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-yellow-400/50 focus:outline-none transition-colors";
const LABEL = "mb-1 block text-xs font-semibold text-zinc-500";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PoseRecorderPage() {
  const {
    videoRef, landmarksRef, visibilityStatus,
    modelStatus, cameraStatus, startCamera, stopCamera,
  } = usePoseOffLandmarker();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef    = useRef<number | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [poseId,      setPoseId]      = useState("");
  const [poseName,    setPoseName]    = useState("");
  const [emoji,       setEmoji]       = useState("🎉");
  const [cue,         setCue]         = useState("");
  const [description, setDescription] = useState("");
  const [tolerance,   setTolerance]   = useState(22);
  const [difficulty,  setDifficulty]  = useState("medium");
  const [mirrorOk,    setMirrorOk]    = useState(true);

  // ── Capture state ─────────────────────────────────────────────────────────
  const [captured,  setCaptured]  = useState<Record<PoseJoint, number> | null>(null);
  const [weights,   setWeights]   = useState<Record<PoseJoint, number>>({ ...DEFAULT_WEIGHTS });
  const [captureAt, setCaptureAt] = useState<Date | null>(null);
  const [copied,    setCopied]    = useState(false);

  // Auto-start camera once model is ready
  useEffect(() => {
    if (modelStatus === "ready" && cameraStatus === "idle") startCamera();
  }, [modelStatus, cameraStatus, startCamera]);

  // ── Skeleton draw loop ────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (canvas && video && video.videoWidth > 0) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const lm = landmarksRef.current;
        if (lm) drawSkeleton(ctx, lm, canvas.width, canvas.height);
      }
    }
    rafRef.current = requestAnimationFrame(drawLoop);
  }, [videoRef, landmarksRef]);

  useEffect(() => {
    if (cameraStatus === "active") {
      rafRef.current = requestAnimationFrame(drawLoop);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cameraStatus, drawLoop]);

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    const lm = landmarksRef.current;
    if (!lm) return;
    setCaptured(snapshotAngles(lm));
    setCaptureAt(new Date());
  }, [landmarksRef]);

  // ── JSON builder — auto-updates when any dependency changes ───────────────
  const buildJson = useCallback((): string => {
    if (!captured) return "";
    return JSON.stringify(
      {
        id:               poseId      || "my-pose",
        name:             poseName    || "My Pose",
        emoji:            emoji       || "🎉",
        cue:              cue         || "Hold this pose!",
        description:      description || "",
        defaultTolerance: tolerance,
        joints: JOINTS.map((joint) => ({
          joint,
          target: Math.round(captured[joint] * 10) / 10,
          weight: Math.round(weights[joint] * 100) / 100,
        })),
      },
      null,
      2,
    );
  }, [captured, poseId, poseName, emoji, cue, description, tolerance, weights]);

  const handleCopy = useCallback(async () => {
    const json = buildJson();
    if (!json) return;
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildJson]);

  const totalWeight = JOINTS.reduce((s, j) => s + (weights[j] ?? 0), 0);
  const weightOk    = Math.abs(totalWeight - 1) < 0.001;
  const canCapture  = cameraStatus === "active" && visibilityStatus === "ok";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0a0a]/90 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <div className="flex items-center gap-2.5">
            <Crosshair className="h-5 w-5 text-yellow-400" />
            <span className="text-base font-bold text-white">Pose Recorder</span>
            <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-orange-400 ring-1 ring-orange-500/30">
              Dev Only
            </span>
          </div>
        </div>
        <p className="mt-0.5 pl-[5.5rem] text-xs text-zinc-600">
          Stand in frame → strike a pose → Capture → Copy JSON → paste into
          <code className="ml-1 rounded bg-white/5 px-1 text-yellow-300/70">
            src/lib/pose/templates.ts
          </code>
        </p>
      </div>

      {/* ── Two-column body ────────────────────────────────────────────── */}
      <div className="grid gap-6 p-6 lg:grid-cols-2">

        {/* ── LEFT: Camera + skeleton ──────────────────────────────────── */}
        <div className="space-y-3">
          {/* Camera feed */}
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
              autoPlay playsInline muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Model loading spinner */}
            {modelStatus === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-yellow-400" />
                <p className="text-xs text-zinc-400">Loading pose model…</p>
              </div>
            )}

            {/* Model error */}
            {(modelStatus === "error-model-missing" || modelStatus === "error-load-failed") && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
                <div className="flex items-start gap-3 text-left">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="text-sm font-bold text-red-300">
                      {modelStatus === "error-model-missing"
                        ? "Model file not found"
                        : "Model failed to load"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {modelStatus === "error-model-missing"
                        ? "Place pose_landmarker_lite.task in /public/models/"
                        : "Check browser console — try Chrome/Edge."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Camera starting */}
            {cameraStatus === "starting" && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60">
                <Camera className="h-5 w-5 animate-pulse text-white" />
                <p className="text-xs text-white">Starting camera…</p>
              </div>
            )}

            {/* Visibility status badge */}
            {cameraStatus === "active" && (
              <div className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                visibilityStatus === "ok"
                  ? "bg-green-500/20 text-green-300 ring-1 ring-green-400/40"
                  : "bg-black/70 text-zinc-300"
              }`}>
                {visibilityStatus === "ok"           && "✅ Full body visible — ready to capture"}
                {visibilityStatus === "no-pose"      && "👤 No body detected — step into frame"}
                {visibilityStatus === "move-back"    && "↔️ Move back so full body is visible"}
                {visibilityStatus === "bad-lighting" && "💡 Better lighting needed"}
              </div>
            )}
          </div>

          {/* Camera controls */}
          <div className="flex flex-wrap items-center gap-2">
            {(cameraStatus === "idle" || cameraStatus === "denied" ||
              cameraStatus === "not-found" || cameraStatus === "error") && (
              <button
                onClick={() => startCamera()}
                disabled={modelStatus !== "ready"}
                className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Camera className="h-4 w-4" />
                {cameraStatus === "idle" ? "Start Camera" : "Retry Camera"}
              </button>
            )}
            {cameraStatus === "active" && (
              <button
                onClick={() => stopCamera()}
                className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" /> Stop Camera
              </button>
            )}
            {(cameraStatus === "denied" || cameraStatus === "not-found" || cameraStatus === "error") && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {cameraStatus === "denied"    && "Camera access denied — check browser permissions"}
                {cameraStatus === "not-found" && "No webcam found on this device"}
                {cameraStatus === "error"     && "Camera error — try refreshing"}
              </p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Form + Capture + Output ───────────────────────────── */}
        <div className="space-y-5">

          {/* Pose metadata */}
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Pose Metadata
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>ID</label>
                <input
                  type="text" value={poseId}
                  onChange={(e) => setPoseId(e.target.value)}
                  placeholder="arms-wide"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Name</label>
                <input
                  type="text" value={poseName}
                  onChange={(e) => setPoseName(e.target.value)}
                  placeholder="Arms Wide"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Emoji</label>
                <input
                  type="text" value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🎉"
                  maxLength={4}
                  className={`${INPUT} text-center text-2xl`}
                />
              </div>
              <div>
                <label className={LABEL}>Tolerance (°)</label>
                <input
                  type="number" value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  min={5} max={60}
                  className={INPUT}
                />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Player Cue</label>
                <input
                  type="text" value={cue}
                  onChange={(e) => setCue(e.target.value)}
                  placeholder="Spread both arms out wide!"
                  className={INPUT}
                />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Description</label>
                <input
                  type="text" value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Extend both arms to shoulder height"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>
                  Difficulty{" "}
                  <span className="font-normal text-zinc-600">(info only)</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={INPUT}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label className={LABEL}>
                  Mirror Allowed{" "}
                  <span className="font-normal text-zinc-600">(info only)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 py-2">
                  <input
                    type="checkbox" checked={mirrorOk}
                    onChange={(e) => setMirrorOk(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5"
                  />
                  <span className="text-sm text-zinc-300">{mirrorOk ? "Yes" : "No"}</span>
                </label>
              </div>
            </div>
          </section>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={!canCapture}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-3.5 text-base font-extrabold text-black shadow-lg shadow-yellow-400/20 transition-all hover:shadow-yellow-400/40 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Crosshair className="h-5 w-5" />
            {canCapture ? "Capture Pose" : "Waiting for full body…"}
          </button>

          {/* Captured angles table */}
          {captured && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Captured Angles
                  {captureAt && (
                    <span className="ml-2 font-normal normal-case text-zinc-600">
                      {captureAt.toLocaleTimeString()}
                    </span>
                  )}
                </h2>
                <span className={`text-xs font-bold tabular-nums ${weightOk ? "text-green-400" : "text-orange-400"}`}>
                  Σ = {totalWeight.toFixed(2)}
                  {!weightOk && " ≠ 1.00 ⚠️"}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Joint
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Angle (°)
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {JOINTS.map((joint, i) => (
                      <tr
                        key={joint}
                        className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                      >
                        <td className="px-3 py-2 font-mono text-xs text-zinc-300">{joint}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm font-bold text-yellow-400">
                          {captured[joint].toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            value={weights[joint]}
                            onChange={(e) =>
                              setWeights((w) => ({
                                ...w,
                                [joint]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            step={0.05} min={0} max={1}
                            className="w-16 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-right font-mono text-xs text-white focus:border-yellow-400/50 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-600">
                Weights should sum to 1.00. Higher weight = joint counts more toward the match score.
              </p>
            </section>
          )}

          {/* JSON output */}
          {captured && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  JSON Template
                </h2>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    copied
                      ? "bg-green-500/20 text-green-300"
                      : "border border-white/20 text-zinc-300 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {copied
                    ? <><Check className="h-3.5 w-3.5" /> Copied!</>
                    : <><Copy className="h-3.5 w-3.5" /> Copy JSON</>
                  }
                </button>
              </div>

              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/80 p-4 text-xs font-mono leading-relaxed text-zinc-300">
                {buildJson()}
              </pre>

              <p className="mt-1.5 text-[10px] text-zinc-600">
                Paste into <code className="text-yellow-300/70">POSE_TEMPLATES</code> in{" "}
                <code className="text-yellow-300/70">src/lib/pose/templates.ts</code>.
                Then add a silhouette case in <code className="text-yellow-300/70">PoseCard.tsx</code>.
                {difficulty !== "medium" || !mirrorOk
                  ? ` Note: difficulty="${difficulty}", mirrorAllowed=${mirrorOk} — add to type if needed.`
                  : ""}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
