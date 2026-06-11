"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { CameraError } from "@/src/components/goalie/types";
import { HAND_MODEL_URL, HAND_WASM_URL } from "@/src/components/goalie/types";
import type { HandPalmData, PalmPoint } from "@/src/lib/goalie/geometry";

// ---------------------------------------------------------------------------
// MediaPipe local typings (subset of @mediapipe/tasks-vision HandLandmarker)
// ---------------------------------------------------------------------------

interface MPNormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

interface MPCategory {
  /** "Left" or "Right" in MediaPipe convention (front-camera labels are swapped
   *  relative to the player — see HandPalmData jsdoc in geometry.ts). */
  categoryName: string;
  score: number;
}

interface MPHandLandmarkerResult {
  landmarks: MPNormalizedLandmark[][];
  /** One classification array per detected hand. */
  handednesses: MPCategory[][];
}

interface MPHandLandmarker {
  detectForVideo(video: HTMLVideoElement, timestamp: number): MPHandLandmarkerResult;
  close(): void;
}

// ---------------------------------------------------------------------------
// Palm-centre computation
// ---------------------------------------------------------------------------

/**
 * Indices used to compute the palm centre (MediaPipe Hand model, 21 landmarks):
 *   0  = WRIST
 *   5  = INDEX_FINGER_MCP
 *   9  = MIDDLE_FINGER_MCP
 *   13 = RING_FINGER_MCP
 *   17 = PINKY_MCP
 *
 * Averaging these 5 knuckle/wrist points gives a stable palm centroid that
 * tracks the whole hand rather than a single fingertip or wrist edge.
 */
const PALM_INDICES = [0, 5, 9, 13, 17] as const;

function computePalmCenter(landmarks: MPNormalizedLandmark[]): PalmPoint {
  let sx = 0;
  let sy = 0;
  for (const i of PALM_INDICES) {
    sx += landmarks[i].x;
    sy += landmarks[i].y;
  }
  const n = PALM_INDICES.length;
  return { x: sx / n, y: sy / n };
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export type UseHandLandmarkerReturn = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Written every rAF frame — never triggers React re-renders. */
  palmLandmarksRef: RefObject<HandPalmData | null>;
  cameraError: CameraError;
  isModelReady: boolean;
  isCameraActive: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  /** Re-assigns the live stream to videoRef.current after a video element swap. */
  reattachStream: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Loads the MediaPipe HandLandmarker model once, manages the webcam stream,
 * and runs a requestAnimationFrame detection loop.
 *
 * Palm centre data is written to `palmLandmarksRef` every frame — no React
 * state update per frame, keeping renders fast.
 */
export function useHandLandmarker(): UseHandLandmarkerReturn {
  const videoRef           = useRef<HTMLVideoElement | null>(null);
  const palmLandmarksRef   = useRef<HandPalmData | null>(null);
  const handLandmarkerRef  = useRef<MPHandLandmarker | null>(null);
  const streamRef          = useRef<MediaStream | null>(null);
  const rafRef             = useRef<number | null>(null);
  const isRunningRef       = useRef(false);

  const [cameraError,    setCameraError]    = useState<CameraError>("none");
  const [isModelReady,   setIsModelReady]   = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load the HandLandmarker model once on mount (browser-only via dynamic import).
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        const { HandLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const vision = await FilesetResolver.forVisionTasks(HAND_WASM_URL);
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: HAND_MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          handLandmarkerRef.current = landmarker as unknown as MPHandLandmarker;
          setIsModelReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[useHandLandmarker] model load failed:", err);
          setCameraError("not-found");
        }
      }
    }

    loadModel();
    return () => {
      cancelled = true;
    };
  }, []);

  // rAF detection loop — writes palm centres to palmLandmarksRef, never React state.
  const runLoop = useCallback(() => {
    const video      = videoRef.current;
    const landmarker = handLandmarkerRef.current;
    if (!isRunningRef.current || !video || !landmarker) return;

    // Wait until the video has decoded at least one frame.
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      rafRef.current = requestAnimationFrame(runLoop);
      return;
    }

    try {
      const result = landmarker.detectForVideo(video, performance.now());

      if (result.landmarks.length === 0) {
        palmLandmarksRef.current = { mpLeft: null, mpRight: null };
      } else {
        let mpLeft:  PalmPoint | null = null;
        let mpRight: PalmPoint | null = null;

        for (let i = 0; i < result.landmarks.length; i++) {
          const palm  = computePalmCenter(result.landmarks[i]);
          // MediaPipe uses the raw unmirrored frame for handedness:
          //   "Left"  → low raw-x → player's RIGHT hand after CSS mirror
          //   "Right" → high raw-x → player's LEFT hand after CSS mirror
          // We store under MediaPipe's own label; geometry.ts mirrors x before
          // zone tests so the actual label direction is irrelevant for detection.
          const label = result.handednesses[i]?.[0]?.categoryName;
          if (label === "Left") {
            mpLeft  = palm;
          } else {
            mpRight = palm;
          }
        }

        palmLandmarksRef.current = { mpLeft, mpRight };
      }
    } catch {
      // Swallow single-frame errors (e.g. video element briefly unavailable).
    }

    rafRef.current = requestAnimationFrame(runLoop);
  }, []);

  // Re-attaches the existing stream to a (possibly new) video element.
  const reattachStream = useCallback(async () => {
    const video  = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Ignore AbortError from rapid play/pause cycles.
    }
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      rafRef.current = requestAnimationFrame(runLoop);
    }
  }, [runLoop]);

  const stopCamera = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    palmLandmarksRef.current = null;
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!isModelReady) return;
    setCameraError("none");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width:  { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      isRunningRef.current = true;
      setIsCameraActive(true);
      rafRef.current = requestAnimationFrame(runLoop);
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (
        e.name === "NotFoundError" ||
        e.name === "DevicesNotFoundError" ||
        e.name === "OverconstrainedError"
      ) {
        setCameraError("not-found");
      } else if (
        e.name === "NotAllowedError" ||
        e.name === "PermissionDeniedError"
      ) {
        setCameraError("blocked");
      } else {
        setCameraError("not-found");
      }
    }
  }, [isModelReady, runLoop]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    videoRef,
    palmLandmarksRef,
    cameraError,
    isModelReady,
    isCameraActive,
    startCamera,
    stopCamera,
    reattachStream,
  };
}
