"use client";

import { useCallback, useRef, useState } from "react";
import {
  submitGoalieScore,
  type SubmitScorePayload,
  type SubmitResult,
} from "@/src/lib/goalie/goalieScores";

export type UseGoalieScoreReturn = {
  /** True while the network request is in-flight. */
  submitting: boolean;
  /** The result of the last submission attempt, or null before any attempt. */
  scoreResult: SubmitResult | null;
  /**
   * Submit the score exactly once per game session.
   * Subsequent calls within the same session are silently ignored.
   * Call `reset()` when a new game starts to allow re-submission.
   */
  submitOnce: (payload: SubmitScorePayload) => Promise<void>;
  /**
   * Reset submission state. Call this at the start of each new game so the
   * next game-over can submit its score.
   */
  reset: () => void;
};

/**
 * Hook that wraps submitGoalieScore with:
 *   · Idempotency guard — only the first call per session fires (ref-based,
 *     so it survives re-renders without becoming a dep).
 *   · Automatic retry allowance on unexpected (non-auth) errors.
 *   · Clean reset between games.
 */
export function useGoalieScore(): UseGoalieScoreReturn {
  const [submitting, setSubmitting]     = useState(false);
  const [scoreResult, setScoreResult]   = useState<SubmitResult | null>(null);

  // Ref-based flag so it is NOT a dep of submitOnce — prevents the effect
  // that watches phase==="over" from looping if it lists submitOnce as a dep.
  const submittedRef = useRef(false);

  const submitOnce = useCallback(async (payload: SubmitScorePayload) => {
    // Guard: already submitted this session — do nothing.
    if (submittedRef.current) return;
    submittedRef.current = true;

    setSubmitting(true);
    try {
      const res = await submitGoalieScore(payload);
      setScoreResult(res);

      // On unexpected errors (not auth errors), allow a retry.
      if (!res.ok && res.error !== "Sign in to save your score to the leaderboard.") {
        submittedRef.current = false;
      }
    } catch {
      setScoreResult({ ok: false, error: "Unexpected error — score not saved." });
      submittedRef.current = false; // allow retry
    } finally {
      setSubmitting(false);
    }
  }, []); // stable — no deps needed because all mutable values are in refs or closures

  const reset = useCallback(() => {
    submittedRef.current = false;
    setScoreResult(null);
    setSubmitting(false);
  }, []);

  return { submitting, scoreResult, submitOnce, reset };
}
