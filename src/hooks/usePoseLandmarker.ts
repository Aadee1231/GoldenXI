"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type {
  CameraError,
  GoaliePoseLandmarks,
} from "@/src/components/goalie/types";
import {
  POSE_MODEL_URL,
  POSE_WASM_URL,
} from "@/src/components/goalie/types";

// ---------------------------------------------------------------------------
// Minimal local typings for the subset of MediaPipe API we use, so we can
// dynamic-import without `@ts-expect-error` on every call.
// ---------------------------------------------------------------------------
interface MPNormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}
interface MPPoseLandmarkerResult {
  landmarks: MPNormalizedLandmark[][];
}
interface MPPoseLandmarker {
  detectForVideo(
    video: HTMLVideoElement,
    timestamp: number,
  ): MPPoseLandmarkerResult;
  close(): void;
}

// MediaPipe Pose landmark indices (full-body model)
const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
} as const;

export type UsePoseLandmarkerReturn = {
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarksRef: RefObject<GoaliePoseLandmarks | null>;
  cameraError: CameraError;
  isModelReady: boolean;
  isCameraActive: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  /** Re-assigns the live stream to videoRef.current after a video element swap. */
  reattachStream: () => Promise<void>;
};

/**
 * Loads the MediaPipe PoseLandmarker model once, manages the webcam stream,
 * and runs a requestAnimationFrame detection loop.
 *
 * Landmark data is written to `landmarksRef` every frame — no React state
 * update per frame, keeping renders fast.
 */
export function usePoseLandmarker(): UsePoseLandmarkerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarksRef = useRef<GoaliePoseLandmarks | null>(null);

  const poseLandmarkerRef = useRef<MPPoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const [cameraError, setCameraError] = useState<CameraError>("none");
  const [isModelReady, setIsModelReady] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load the pose landmarker model once on mount (browser-only via dynamic import).
  useEffect(() => {
    let cancelled = false;
    async function loadModel() {
      try {
        const { PoseLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const vision = await FilesetResolver.forVisionTasks(POSE_WASM_URL);
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: POSE_MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          poseLandmarkerRef.current =
            landmarker as unknown as MPPoseLandmarker;
          setIsModelReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[usePoseLandmarker] model load failed:", err);
          setCameraError("not-found");
        }
      }
    }
    loadModel();
    return () => {
      cancelled = true;
    };
  }, []);

  // rAF detection loop — writes to landmarksRef, never to React state.
  const runLoop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = poseLandmarkerRef.current;
    if (!isRunningRef.current || !video || !landmarker) return;

    // Wait until the video has decoded at least one frame.
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      rafRef.current = requestAnimationFrame(runLoop);
      return;
    }

    const result = landmarker.detectForVideo(video, performance.now());

    if (result.landmarks.length > 0) {
      const lm = result.landmarks[0];
      landmarksRef.current = {
        nose: {
          x: lm[LM.NOSE].x,
          y: lm[LM.NOSE].y,
          visibility: lm[LM.NOSE].visibility,
        },
        leftShoulder: {
          x: lm[LM.LEFT_SHOULDER].x,
          y: lm[LM.LEFT_SHOULDER].y,
          visibility: lm[LM.LEFT_SHOULDER].visibility,
        },
        rightShoulder: {
          x: lm[LM.RIGHT_SHOULDER].x,
          y: lm[LM.RIGHT_SHOULDER].y,
          visibility: lm[LM.RIGHT_SHOULDER].visibility,
        },
        leftWrist: {
          x: lm[LM.LEFT_WRIST].x,
          y: lm[LM.LEFT_WRIST].y,
          visibility: lm[LM.LEFT_WRIST].visibility,
        },
        rightWrist: {
          x: lm[LM.RIGHT_WRIST].x,
          y: lm[LM.RIGHT_WRIST].y,
          visibility: lm[LM.RIGHT_WRIST].visibility,
        },
      };
    } else {
      landmarksRef.current = null;
    }

    rafRef.current = requestAnimationFrame(runLoop);
  }, []);

  // Re-attaches the existing stream to a (possibly new) video element.
  // Call this after a stage transition where the <video> DOM node is replaced.
  const reattachStream = useCallback(async () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Ignore AbortError from rapid play/pause cycles.
    }
    // Resume detection loop if it stalled while the element was gone.
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    landmarksRef.current = null;
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!isModelReady) return;
    setCameraError("none");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
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
    landmarksRef,
    cameraError,
    isModelReady,
    isCameraActive,
    startCamera,
    stopCamera,
    reattachStream,
  };
}
