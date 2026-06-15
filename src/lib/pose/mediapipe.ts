"use client";

/**
 * Celebration Pose-Off — MediaPipe PoseLandmarker hook
 *
 * Loads the lite pose model from /public/models/pose_landmarker_lite.task,
 * opens the webcam, and runs a requestAnimationFrame detection loop.
 *
 * All pose data is written into `landmarksRef` every frame — no React state
 * update per frame, so renders stay fast.
 *
 * Completely independent of the Goalie game hooks.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { PoseLandmarks, VisibilityStatus } from "./scoring";
import { checkVisibility } from "./scoring";

// ---------------------------------------------------------------------------
// Minimal local typings for MediaPipe tasks-vision
// ---------------------------------------------------------------------------

interface MPLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface MPPoseLandmarkerResult {
  landmarks: MPLandmark[][];
}

interface MPPoseLandmarker {
  detectForVideo(video: HTMLVideoElement, timestamp: number): MPPoseLandmarkerResult;
  close(): void;
}

// ---------------------------------------------------------------------------
// Landmark indices (MediaPipe full-body)
// ---------------------------------------------------------------------------

const LM_IDX = {
  LEFT_SHOULDER:  11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW:     13,
  RIGHT_ELBOW:    14,
  LEFT_WRIST:     15,
  RIGHT_WRIST:    16,
  LEFT_HIP:       23,
  RIGHT_HIP:      24,
  LEFT_KNEE:      25,
  RIGHT_KNEE:     26,
  LEFT_ANKLE:     27,
  RIGHT_ANKLE:    28,
} as const;

// ---------------------------------------------------------------------------
// Model path
// ---------------------------------------------------------------------------

export const MODEL_PATH = "/models/pose_landmarker_lite.task";
export const WASM_CDN   = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

// ---------------------------------------------------------------------------
// Hook types
// ---------------------------------------------------------------------------

export type ModelStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error-model-missing"
  | "error-load-failed";

export type CameraStatus =
  | "idle"
  | "starting"
  | "active"
  | "denied"
  | "not-found"
  | "error";

export type UsePoseOffLandmarkerReturn = {
  videoRef:         RefObject<HTMLVideoElement | null>;
  landmarksRef:     RefObject<PoseLandmarks | null>;
  visibilityStatus: VisibilityStatus;
  modelStatus:      ModelStatus;
  cameraStatus:     CameraStatus;
  startCamera:      () => Promise<void>;
  stopCamera:       () => void;
  /** Re-attaches the running stream to videoRef.current after a phase
   *  transition mounts a new <video> element. Call in a useEffect. */
  reattachStream:   () => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePoseOffLandmarker(): UsePoseOffLandmarkerReturn {
  const videoRef       = useRef<HTMLVideoElement | null>(null);
  const landmarksRef   = useRef<PoseLandmarks | null>(null);
  const landmarkerRef  = useRef<MPPoseLandmarker | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const rafRef         = useRef<number | null>(null);
  const isRunningRef   = useRef(false);

  const [modelStatus,  setModelStatus]  = useState<ModelStatus>("idle");
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [visibilityStatus, setVisibilityStatus] = useState<VisibilityStatus>("no-pose");

  // ── Load model on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadModel() {
      setModelStatus("loading");
      try {
        // Quick HEAD check — surfaces missing-file error before a slow load.
        const probe = await fetch(MODEL_PATH, { method: "HEAD" });
        if (!probe.ok) {
          if (!cancelled) setModelStatus("error-model-missing");
          return;
        }

        const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

        const sharedOpts = {
          runningMode:                "VIDEO" as const,
          numPoses:                   1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence:  0.5,
          minTrackingConfidence:      0.5,
        };

        // Try GPU first for performance; silently fall back to CPU if unavailable.
        let landmarker: MPPoseLandmarker;
        try {
          landmarker = (await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: "GPU" },
            ...sharedOpts,
          })) as unknown as MPPoseLandmarker;
        } catch {
          console.warn("[usePoseOffLandmarker] GPU delegate unavailable, falling back to CPU");
          landmarker = (await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
            ...sharedOpts,
          })) as unknown as MPPoseLandmarker;
        }

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setModelStatus("ready");
        } else {
          landmarker.close();
        }
      } catch (err) {
        console.error("[usePoseOffLandmarker] model load error:", err);
        if (!cancelled) setModelStatus("error-load-failed");
      }
    }
    loadModel();
    return () => { cancelled = true; };
  }, []);

  // Throttle: only call detectForVideo at most once per DETECT_INTERVAL_MS (~15 fps).
  // Calling it at 60fps burns CPU/GPU for no visible improvement in a pose game.
  const DETECT_INTERVAL_MS = 67;
  const lastDetectRef = useRef(0);
  const prevVisRef    = useRef<VisibilityStatus>("no-pose");

  // ── rAF detection loop ───────────────────────────────────────────────────
  const runLoop = useCallback(() => {
    if (!isRunningRef.current) return;

    const video      = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) {
      rafRef.current = requestAnimationFrame(runLoop);
      return;
    }

    // Wait for at least one decoded frame.
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.paused || video.ended) {
      rafRef.current = requestAnimationFrame(runLoop);
      return;
    }

    // Throttle detection — rAF still runs at display rate so the loop stays alive.
    const now = performance.now();
    if (now - lastDetectRef.current < DETECT_INTERVAL_MS) {
      rafRef.current = requestAnimationFrame(runLoop);
      return;
    }
    lastDetectRef.current = now;

    try {
      const result = landmarker.detectForVideo(video, now);

      if (result.landmarks.length > 0) {
        const raw = result.landmarks[0];
        const lm: PoseLandmarks = {
          leftShoulder:  raw[LM_IDX.LEFT_SHOULDER],
          rightShoulder: raw[LM_IDX.RIGHT_SHOULDER],
          leftElbow:     raw[LM_IDX.LEFT_ELBOW],
          rightElbow:    raw[LM_IDX.RIGHT_ELBOW],
          leftWrist:     raw[LM_IDX.LEFT_WRIST],
          rightWrist:    raw[LM_IDX.RIGHT_WRIST],
          leftHip:       raw[LM_IDX.LEFT_HIP],
          rightHip:      raw[LM_IDX.RIGHT_HIP],
          leftKnee:      raw[LM_IDX.LEFT_KNEE],
          rightKnee:     raw[LM_IDX.RIGHT_KNEE],
          leftAnkle:     raw[LM_IDX.LEFT_ANKLE],
          rightAnkle:    raw[LM_IDX.RIGHT_ANKLE],
        };
        landmarksRef.current = lm;
        // Only setState when the value actually changes — avoids re-renders every frame.
        const vis = checkVisibility(lm);
        if (vis !== prevVisRef.current) {
          prevVisRef.current = vis;
          setVisibilityStatus(vis);
        }
      } else {
        landmarksRef.current = null;
        if (prevVisRef.current !== "no-pose") {
          prevVisRef.current = "no-pose";
          setVisibilityStatus("no-pose");
        }
      }
    } catch (err) {
      console.warn("[usePoseOffLandmarker] detectForVideo error:", err);
    }

    rafRef.current = requestAnimationFrame(runLoop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-attach stream after phase-driven video element re-mount ─────────────
  // When the parent conditionally renders a new <video ref={videoRef}>, React
  // sets the ref to the new element but the stream is still on the old one.
  // Call this in a useEffect after any phase change that mounts a new <video>.
  const reattachStream = useCallback(() => {
    const video  = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    if (video.srcObject === stream) return; // already attached — nothing to do
    video.srcObject = stream;
    video.play().catch((err) =>
      console.warn("[usePoseOffLandmarker] reattachStream play() rejected:", err)
    );
  }, []);

  // ── Camera control ────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    landmarksRef.current = null;
    setCameraStatus("idle");
    setVisibilityStatus("no-pose");
  }, []);

  const startCamera = useCallback(async () => {
    if (modelStatus !== "ready") return;
    setCameraStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach((t) => t.stop()); return; }
      video.srcObject = stream;
      await video.play();
      isRunningRef.current = true;
      setCameraStatus("active");
      rafRef.current = requestAnimationFrame(runLoop);
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setCameraStatus("denied");
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setCameraStatus("not-found");
      } else {
        setCameraStatus("error");
      }
    }
  }, [modelStatus, runLoop]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      // Release WASM model memory.
      try { landmarkerRef.current?.close(); } catch { /* ignore */ }
    };
  }, []);

  return {
    videoRef,
    landmarksRef,
    visibilityStatus,
    modelStatus,
    cameraStatus,
    startCamera,
    stopCamera,
    reattachStream,
  };
}
