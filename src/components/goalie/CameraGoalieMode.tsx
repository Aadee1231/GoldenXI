"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { RotateCcw, Sparkles, ArrowLeft, Zap } from "lucide-react";
import GoalieLeaderboard from "./GoalieLeaderboard";
import { useGoalieScore } from "@/src/hooks/useGoalieScore";
import { fetchUserGoalieBest } from "@/src/lib/goalie/goalieScores";
import { useHandLandmarker } from "@/src/hooks/useHandLandmarker";
import PoseOverlay from "./PoseOverlay";
import ShotBall from "./ShotBall";
import GoalieScoreCard from "./GoalieScoreCard";
import GoalFrame from "./GoalFrame";
import {
  STARTING_LIVES,
  BEST_SCORE_KEY,
  WHISTLE_MS,
  RESULT_MS,
  READY_X_MIN,
  READY_X_MAX,
  READY_HOLD_MS,
  READY_MAX_WAIT_MS,
  type GamePhase,
} from "./types";
import {
  getDifficultyForShot,
  pickWeightedZone,
  difficultyDebugLines,
  DIFFICULTY_STAGES,
} from "@/src/lib/goalie/difficulty";
import { useGameAudio } from "./useGameAudio";
import {
  SHOT_ZONE_LABELS,
  zoneCenterDisplay,
  getZoneFromPoint,
  palmInZone,
  type ShotZone,
} from "@/src/lib/goalie/geometry";

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
function scoreShot(reactionMs: number, flightWindowMs: number, streak: number): number {
  const speed = Math.max(
    0,
    Math.round(((flightWindowMs - reactionMs) / flightWindowMs) * 100),
  );
  const streakBonus = Math.min(streak, 5) * 10;
  return 50 + speed + streakBonus;
}


// ---------------------------------------------------------------------------
// Camera-mode round result
// ---------------------------------------------------------------------------
type CameraRoundResult = {
  saved: boolean;
  target: ShotZone;
  pick: ShotZone | null;
  reactionMs: number | null;
  points: number;
};

// ---------------------------------------------------------------------------
// Detection tuning
// ---------------------------------------------------------------------------

/** Zone names ordered 1-6 for dev-mode keyboard forcing (keys 1-6). */
const DEV_ZONE_MAP: Record<string, ShotZone> = {
  "1": "top-left",    "2": "top-middle",    "3": "top-right",
  "4": "bottom-left", "5": "bottom-middle", "6": "bottom-right",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Overlay({
  children,
  subtle = false,
}: {
  children: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <div
      className={[
        "absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl px-6 text-center",
        subtle ? "bg-black/40" : "bg-black/75 backdrop-blur-sm",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function StartButton({
  onClick,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  label: string;
  icon: typeof RotateCcw;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-8 py-3 text-sm font-extrabold text-black transition hover:bg-yellow-300 active:scale-95"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type CameraGoalieModeProps = { onBack?: () => void };

export default function CameraGoalieMode({ onBack }: CameraGoalieModeProps) {
  const {
    videoRef,
    palmLandmarksRef,
    cameraError,
    isModelReady,
    isCameraActive,
    startCamera,
    stopCamera,
  } = useHandLandmarker();

  // Game state
  const [phase, setPhase]           = useState<GamePhase>("idle");
  const [shot, setShot]             = useState(1);
  const [lives, setLives]           = useState(STARTING_LIVES);
  const [saves, setSaves]           = useState(0);
  const [misses, setMisses]         = useState(0);
  const [streak, setStreak]         = useState(0);
  const [score, setScore]           = useState(0);
  const [best, setBest]             = useState(0);
  const [target, setTarget]         = useState<ShotZone | null>(null);
  const [pick, setPick]             = useState<ShotZone | null>(null);
  const [lastResult, setLastResult] = useState<CameraRoundResult | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [trackingWarn, setTrackingWarn]   = useState(false);
  const [bestStreak, setBestStreak]       = useState(0);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [curFlightMs, setCurFlightMs]     = useState(DIFFICULTY_STAGES[0].flightMs);
  const [shotIsCurved, setShotIsCurved]   = useState(false);
  const [showDebug, setShowDebug]         = useState(false);
  const [forcedZone, setForcedZone]       = useState<ShotZone | null>(null);
  const [readyValid, setReadyValid]       = useState(false);
  const [countdown, setCountdown]         = useState<number | null>(null);

  // Auto-start camera once the hand model is ready (skips the calibration screen).
  useEffect(() => {
    if (isModelReady && !isCameraActive) void startCamera();
  }, [isModelReady, isCameraActive, startCamera]);

  const recentZonesRef = useRef<ShotZone[]>([]);

  const forcedZoneRef = useRef<ShotZone | null>(null);
  useEffect(() => { forcedZoneRef.current = forcedZone; }, [forcedZone]);

  // Refs for timer callbacks
  const phaseRef         = useRef<GamePhase>("idle");
  const targetRef        = useRef<ShotZone | null>(null);
  const streakRef        = useRef(0);
  const bestStreakRef    = useRef(0);
  const savesRef         = useRef(0);
  const missesRef        = useRef(0);
  const livesRef         = useRef(STARTING_LIVES);
  const shotsRef         = useRef(1);
  const reactionTimesRef = useRef<number[]>([]);
  const shotStartRef     = useRef(0);
  const delayTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs to break circular dep chains
  const beginWhistleRef  = useRef<() => void>(() => {});
  const beginReadyRef    = useRef<() => void>(() => {});

  // Ready-phase polling
  const readyCheckRafRef = useRef<number | null>(null);
  const readySinceRef    = useRef<number | null>(null);
  const readyMaxWaitRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enter-zone tracking (reset fresh at each beginShot)
  const leftPrevInTargetRef   = useRef(false);
  const rightPrevInTargetRef  = useRef(false);
  const leftEnteredTargetRef  = useRef(false);
  const rightEnteredTargetRef = useRef(false);
  const leftAtShotStartRef    = useRef<ShotZone | null>(null);
  const rightAtShotStartRef   = useRef<ShotZone | null>(null);

  // Keep refs in sync
  useEffect(() => { phaseRef.current         = phase;         }, [phase]);
  useEffect(() => { targetRef.current        = target;        }, [target]);
  useEffect(() => { streakRef.current        = streak;        }, [streak]);
  useEffect(() => { bestStreakRef.current    = bestStreak;    }, [bestStreak]);
  useEffect(() => { savesRef.current         = saves;         }, [saves]);
  useEffect(() => { missesRef.current        = misses;        }, [misses]);
  useEffect(() => { livesRef.current         = lives;         }, [lives]);
  useEffect(() => { shotsRef.current         = shot;          }, [shot]);
  useEffect(() => { reactionTimesRef.current = reactionTimes; }, [reactionTimes]);

  // Video container size for overlays
  const containerRef  = useRef<HTMLDivElement>(null);
  const [videoSize, setVideoSize] = useState({ w: 640, h: 480 });
  const videoSizeRef  = useRef({ w: 640, h: 480 });
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const next = { w: Math.round(width), h: Math.round(height) };
      setVideoSize(next);
      videoSizeRef.current = next;
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Load best score: localStorage first (instant), then DB (authoritative).
  useEffect(() => {
    try {
      const s = localStorage.getItem(BEST_SCORE_KEY);
      if (s) setBest(Number(s) || 0);
    } catch { /* ignore */ }
    fetchUserGoalieBest().then((dbBest) => {
      if (dbBest !== null) {
        setBest((prev) => {
          const next = Math.max(prev, dbBest);
          try { localStorage.setItem(BEST_SCORE_KEY, String(next)); } catch {}
          return next;
        });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Submission hook
  const { submitting, scoreResult, submitOnce, reset: resetSubmission } = useGoalieScore();

  // ── Audio ────────────────────────────────────────────────────────────────
  const { muted, toggleMute, initAudio, startAmbient, stopAmbient,
          playWhistle, playKick, playSave, playGoal, playCheer } = useGameAudio();
  const sfxRef = useRef({ initAudio, startAmbient, stopAmbient, playWhistle, playKick, playSave, playGoal, playCheer });
  useEffect(() => {
    sfxRef.current = { initAudio, startAmbient, stopAmbient, playWhistle, playKick, playSave, playGoal, playCheer };
  }, [initAudio, startAmbient, stopAmbient, playWhistle, playKick, playSave, playGoal, playCheer]);

  const pendingPayloadRef = useRef<{
    score: number; saves: number; goalsAllowed: number; shotsFaced: number;
    reactionTimes: number[]; bestStreak: number;
  } | null>(null);

  const clearTimers = useCallback(() => {
    if (delayTimer.current)      { clearTimeout(delayTimer.current);      delayTimer.current      = null; }
    if (windowTimer.current)     { clearTimeout(windowTimer.current);     windowTimer.current     = null; }
    if (nextTimer.current)       { clearTimeout(nextTimer.current);       nextTimer.current       = null; }
    if (readyMaxWaitRef.current) { clearTimeout(readyMaxWaitRef.current); readyMaxWaitRef.current = null; }
    if (readyCheckRafRef.current !== null) {
      cancelAnimationFrame(readyCheckRafRef.current);
      readyCheckRafRef.current = null;
    }
  }, []);

  const finishGame = useCallback((finalScore: number) => {
    setPhase("gameOver");
    sfxRef.current.stopAmbient();
    setBest((prev) => {
      const next = Math.max(prev, finalScore);
      try { localStorage.setItem(BEST_SCORE_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Auto-submit score when game ends.
  useEffect(() => {
    if (phase !== "gameOver") return;
    const p = pendingPayloadRef.current;
    if (!p) return;
    void submitOnce({
      mode:          "camera",
      score:         p.score,
      saves:         p.saves,
      goalsAllowed:  p.goalsAllowed,
      shotsFaced:    p.shotsFaced,
      reactionTimes: p.reactionTimes,
      bestStreak:    p.bestStreak,
      metadata: {
        detection_method: "zone_based",
        difficulty_ramp:  "step_flight_ms",
      },
    });
  }, [phase, submitOnce]);

  // Refresh leaderboard after successful submission.
  useEffect(() => {
    if (scoreResult?.ok === true) setLeaderboardRefreshKey((k) => k + 1);
  }, [scoreResult]);

  // Zone polling during "shot" phase
  const poseCheckRafRef = useRef<number | null>(null);
  const debugDisplayRef = useRef<HTMLPreElement>(null);
  const handSeenRef     = useRef(false);
  const goalReasonRef   = useRef<"wrong-zone" | "no-hands">("no-hands");

  // Latest hand zones — written every rAF, read by pollHandZone.
  // Do NOT use React state here; frame-perfect read without re-renders.
  const latestCameraInputRef = useRef<{
    leftZone:   ShotZone | null;
    rightZone:  ShotZone | null;
    leftPoint:  { x: number; y: number } | null;
    rightPoint: { x: number; y: number } | null;
  }>({ leftZone: null, rightZone: null, leftPoint: null, rightPoint: null });

  // ── resolveRound ───────────────────────────────────────────────────────────
  const resolveRound = useCallback(
    (selected: ShotZone | null, forced = false) => {
      if (phaseRef.current !== "shot") return;

      // Compute result before setting guard so phaseRef reflects actual outcome
      const activeTarget = targetRef.current;
      if (!activeTarget) return;
      const saved = selected !== null && selected === activeTarget;

      // Immediate guard — prevents double-resolve between windowTimer and pollPose
      phaseRef.current = saved ? "saved" : "goal";

      if (!forced && windowTimer.current) {
        clearTimeout(windowTimer.current);
        windowTimer.current = null;
      }

      // Stop pose polling
      if (poseCheckRafRef.current !== null) {
        cancelAnimationFrame(poseCheckRafRef.current);
        poseCheckRafRef.current = null;
      }

      const reactionMs  = selected
        ? Math.round(performance.now() - shotStartRef.current)
        : null;
      const flight      = curFlightMs;
      const points      = saved && reactionMs !== null
        ? scoreShot(reactionMs, flight, streakRef.current)
        : 0;

      const newSaves         = saved ? savesRef.current + 1 : savesRef.current;
      const newMisses        = saved ? missesRef.current : missesRef.current + 1;
      const newLives         = saved ? livesRef.current  : livesRef.current - 1;
      const newStreak        = saved ? streakRef.current + 1 : 0;
      const newBestStreak    = Math.max(bestStreakRef.current, newStreak);
      const newReactionTimes = saved && reactionMs !== null
        ? [...reactionTimesRef.current, reactionMs]
        : reactionTimesRef.current;
      const newScore = saved ? score + points : score;

      setSaves(newSaves);
      setMisses(newMisses);  missesRef.current = newMisses;
      if (!saved) { setLives(newLives); livesRef.current = newLives; }
      setStreak(newStreak);
      setBestStreak(newBestStreak);
      setScore(newScore);
      setReactionTimes(newReactionTimes);
      streakRef.current = newStreak;

      setPick(selected);
      setLastResult({ saved, target: activeTarget, pick: selected, reactionMs, points });
      setPhase(saved ? "saved" : "goal");

      if (saved) { sfxRef.current.playSave(); if (newStreak >= 3) sfxRef.current.playCheer(); }
      else sfxRef.current.playGoal();

      pendingPayloadRef.current = {
        score: newScore, saves: newSaves, goalsAllowed: newMisses,
        shotsFaced: shotsRef.current,
        reactionTimes: newReactionTimes, bestStreak: newBestStreak,
      };

      nextTimer.current = setTimeout(() => {
        if (newLives <= 0) { finishGame(newScore); return; }
        const nextShot = shotsRef.current + 1;
        shotsRef.current = nextShot;
        setShot(nextShot);
        beginReadyRef.current();
      }, RESULT_MS);
    },
    [score, finishGame],
  );

  // ── beginShot ──────────────────────────────────────────────────────────────
  const beginShot = useCallback(() => {
    // ── Difficulty stage for this shot ──────────────────────────────────────
    const stage = getDifficultyForShot(shotsRef.current);
    const { flightMs: flight, forgiveness } = stage;

    // ── Zone selection: weighted random + anti-repeat ───────────────────────
    const zone = pickWeightedZone(stage.zoneWeights, recentZonesRef.current, forcedZoneRef.current);
    setForcedZone(null);
    forcedZoneRef.current = null;
    recentZonesRef.current = [zone, ...recentZonesRef.current].slice(0, 2);

    // ── Curved shot visual at Pressure (21+) and Elite (31+) stages ─────────
    setShotIsCurved(stage.minShot >= 21);

    setCurFlightMs(flight);
    setTarget(zone);
    targetRef.current = zone;
    setPick(null);
    shotStartRef.current = performance.now();
    handSeenRef.current  = false;
    latestCameraInputRef.current = { leftZone: null, rightZone: null, leftPoint: null, rightPoint: null };

    // ── Snapshot hand positions at shot start for enter-zone detection ────────────
    // A save only counts when a hand ENTERS the target zone during the shot,
    // not when it is already there at the start (camping exploit fix).
    {
      const pd0 = palmLandmarksRef.current;
      const lp0 = pd0?.mpLeft  ?? null;
      const rp0 = pd0?.mpRight ?? null;
      const ld0 = lp0 ? { x: 1 - lp0.x, y: lp0.y } : null;
      const rd0 = rp0 ? { x: 1 - rp0.x, y: rp0.y } : null;
      const leftNow0  = ld0 ? getZoneFromPoint(ld0) : null;
      const rightNow0 = rd0 ? getZoneFromPoint(rd0) : null;
      leftAtShotStartRef.current    = leftNow0;
      rightAtShotStartRef.current   = rightNow0;
      leftPrevInTargetRef.current   = ld0 ? palmInZone(ld0.x, ld0.y, zone, forgiveness) : false;
      rightPrevInTargetRef.current  = rd0 ? palmInZone(rd0.x, rd0.y, zone, forgiveness) : false;
      leftEnteredTargetRef.current  = false;
      rightEnteredTargetRef.current = false;
    }

    // → Set phaseRef DIRECTLY before the rAF loop starts.
    // setPhase() is async (queues a React re-render); the useEffect that syncs
    // phaseRef runs AFTER the next paint, which is too late — the first rAF
    // frame would see phaseRef.current === "runup" and exit without rescheduling,
    // killing the loop permanently.  Direct assignment fixes this race.
    phaseRef.current = "shot";
    setPhase("shot");

    // Timeout: save window ends, no matching zone found → goal
    sfxRef.current.playKick();
    windowTimer.current = setTimeout(() => {
      goalReasonRef.current = handSeenRef.current ? "wrong-zone" : "no-hands";
      resolveRound(null, true);
    }, flight);

    // ── Zone polling loop ─────────────────────────────────────────────────────
    // Save rule: leftZone === targetZone  ||  rightZone === targetZone
    // Nothing else.  No collision.  No motion.  No ball distance.
    // Coordinates: raw MediaPipe x → display-space via (1 − rawX), y unchanged.
    // getZoneFromPoint is the single canonical zone function; PoseOverlay uses it too.
    function pollHandZone() {
      if (phaseRef.current !== "shot") return;

      const pd = palmLandmarksRef.current;

      // Convert raw MediaPipe coords → display-space (mirror x, y unchanged)
      const lp = pd?.mpLeft  ?? null;
      const rp = pd?.mpRight ?? null;
      const leftDisplay  = lp ? { x: 1 - lp.x, y: lp.y } : null;
      const rightDisplay = rp ? { x: 1 - rp.x, y: rp.y } : null;

      const leftZone  = leftDisplay  ? getZoneFromPoint(leftDisplay)  : null;
      const rightZone = rightDisplay ? getZoneFromPoint(rightDisplay) : null;

      // Update shared ref so PoseOverlay debug shows IDENTICAL values to scoring
      latestCameraInputRef.current = { leftZone, rightZone, leftPoint: leftDisplay, rightPoint: rightDisplay };

      if (lp || rp) handSeenRef.current = true;
      setTrackingWarn(!lp && !rp);

      const targetZone = targetRef.current!;

      // ── Enter-zone detection — forgiveness-aware palmInZone ─────────────────
      const leftNowInTarget  = leftDisplay  ? palmInZone(leftDisplay.x, leftDisplay.y, targetZone, forgiveness) : false;
      const rightNowInTarget = rightDisplay ? palmInZone(rightDisplay.x, rightDisplay.y, targetZone, forgiveness) : false;

      if (!leftPrevInTargetRef.current  && leftNowInTarget)  leftEnteredTargetRef.current  = true;
      if (!rightPrevInTargetRef.current && rightNowInTarget) rightEnteredTargetRef.current = true;

      leftPrevInTargetRef.current  = leftNowInTarget;
      rightPrevInTargetRef.current = rightNowInTarget;

      const saveEligible = leftEnteredTargetRef.current || rightEnteredTargetRef.current;

      if (debugDisplayRef.current) {
        const elapsed = performance.now() - shotStartRef.current;
        debugDisplayRef.current.textContent = [
          ...difficultyDebugLines(stage, shotsRef.current),
          `── SHOT DEBUG ──────────────────────`,
          `Target zone:            ${SHOT_ZONE_LABELS[targetZone]}`,
          `Left zone @ start:      ${leftAtShotStartRef.current  ? SHOT_ZONE_LABELS[leftAtShotStartRef.current]  : "none"}`,
          `Right zone @ start:     ${rightAtShotStartRef.current ? SHOT_ZONE_LABELS[rightAtShotStartRef.current] : "none"}`,
          `Left zone now:          ${leftZone  ? SHOT_ZONE_LABELS[leftZone]  : "none"}`,
          `Right zone now:         ${rightZone ? SHOT_ZONE_LABELS[rightZone] : "none"}`,
          `Left entered target:    ${leftEnteredTargetRef.current}`,
          `Right entered target:   ${rightEnteredTargetRef.current}`,
          `Save eligible:          ${saveEligible}`,
          `t=${elapsed.toFixed(0)}ms / ${flight}ms`,
        ].join("\n");
      }

      if (saveEligible) {
        resolveRound(targetZone);
        return;
      }

      poseCheckRafRef.current = requestAnimationFrame(pollHandZone);
    }
    poseCheckRafRef.current = requestAnimationFrame(pollHandZone);
  }, [resolveRound, palmLandmarksRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── beginRunup ─────────────────────────────────────────────────────────────
  const beginRunup = useCallback(() => {
    setPhase("runup");
    setTrackingWarn(false);
    const stage = getDifficultyForShot(shotsRef.current);
    const runupDelay = stage.runupMinMs + Math.floor(Math.random() * (stage.runupMaxMs - stage.runupMinMs));
    delayTimer.current = setTimeout(beginShot, runupDelay);
  }, [beginShot]);

  // ── beginWhistle ───────────────────────────────────────────────────────────
  const beginWhistle = useCallback(() => {
    setPhase("whistle");
    setTarget(null);
    setPick(null);
    setLastResult(null);
    setTrackingWarn(false);
    sfxRef.current.playWhistle();
    delayTimer.current = setTimeout(beginRunup, WHISTLE_MS);
  }, [beginRunup]);

  // Keep refs in sync so callbacks always call the latest closure.
  useEffect(() => { beginWhistleRef.current = beginWhistle; }, [beginWhistle]);

  // ── beginReady ──────────────────────────────────────────────────────────
  // Polls hand positions after each round result. Both visible hands must stay
  // within the center band (x in [READY_X_MIN, READY_X_MAX]) for READY_HOLD_MS
  // before the next whistle fires. Prevents pre-positioning between rounds.
  const beginReady = useCallback(() => {
    phaseRef.current = "ready";
    setPhase("ready");
    setReadyValid(false);
    readySinceRef.current = null;

    // Safety valve: if tracking is lost or player stalls, proceed after max wait
    readyMaxWaitRef.current = setTimeout(() => {
      if (phaseRef.current === "ready") beginWhistleRef.current();
    }, READY_MAX_WAIT_MS);

    function pollReady() {
      if (phaseRef.current !== "ready") return;

      const pd = palmLandmarksRef.current;
      const lp = pd?.mpLeft  ?? null;
      const rp = pd?.mpRight ?? null;
      const leftDx  = lp ? { x: 1 - lp.x, y: lp.y } : null;
      const rightDx = rp ? { x: 1 - rp.x, y: rp.y } : null;

      // A hand counts as "ready" if it's not visible OR within the center band
      const handOk = (pt: { x: number } | null) =>
        pt === null || (pt.x >= READY_X_MIN && pt.x <= READY_X_MAX);
      const valid = handOk(leftDx) && handOk(rightDx);
      setReadyValid(valid);

      if (debugDisplayRef.current) {
        const held = readySinceRef.current !== null
          ? (performance.now() - readySinceRef.current).toFixed(0) + "ms"
          : "not started";
        debugDisplayRef.current.textContent = [
          `── READY DEBUG ───────────────────`,
          `Ready stance valid: ${valid}`,
          `Left  x: ${leftDx  ? leftDx.x.toFixed(3)  : "none"} (band ${READY_X_MIN}–${READY_X_MAX})`,
          `Right x: ${rightDx ? rightDx.x.toFixed(3) : "none"}`,
          `Hold timer: ${held} / ${READY_HOLD_MS}ms`,
        ].join("\n");
      }

      if (valid) {
        if (readySinceRef.current === null) {
          readySinceRef.current = performance.now();
        } else if (performance.now() - readySinceRef.current >= READY_HOLD_MS) {
          if (readyMaxWaitRef.current) { clearTimeout(readyMaxWaitRef.current); readyMaxWaitRef.current = null; }
          beginWhistleRef.current();
          return;
        }
      } else {
        readySinceRef.current = null;
      }

      readyCheckRafRef.current = requestAnimationFrame(pollReady);
    }
    readyCheckRafRef.current = requestAnimationFrame(pollReady);
  }, [palmLandmarksRef]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { beginReadyRef.current = beginReady; }, [beginReady]);

  // ── Dev / debug keyboard handler ────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`") { e.preventDefault(); setShowDebug(prev => !prev); return; }
      if (phase === "idle" || phase === "gameOver") return;
      if (DEV_ZONE_MAP[e.key]) {
        setForcedZone(DEV_ZONE_MAP[e.key]);
        forcedZoneRef.current = DEV_ZONE_MAP[e.key];
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // ── startGame ──────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearTimers();
    if (poseCheckRafRef.current !== null) {
      cancelAnimationFrame(poseCheckRafRef.current);
      poseCheckRafRef.current = null;
    }
    setSaves(0); setMisses(0); setStreak(0); setScore(0);
    setShot(1); setLives(STARTING_LIVES);
    setTarget(null); setPick(null); setLastResult(null);
    setReactionTimes([]); setTrackingWarn(false); setBestStreak(0);
    setCurFlightMs(DIFFICULTY_STAGES[0].flightMs);
    recentZonesRef.current   = [];
    streakRef.current        = 0;
    bestStreakRef.current    = 0;
    savesRef.current         = 0;
    missesRef.current        = 0;
    livesRef.current         = STARTING_LIVES;
    shotsRef.current         = 1;
    reactionTimesRef.current = [];
    pendingPayloadRef.current = null;
    resetSubmission();
    sfxRef.current.initAudio();
    setCountdown(3);
  }, [clearTimers, resetSubmission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers(); // also cancels readyCheckRaf + readyMaxWait via clearTimers
      if (poseCheckRafRef.current !== null) {
        cancelAnimationFrame(poseCheckRafRef.current);
      }
    };
  }, [clearTimers]);

  // ── Countdown before first shot ──────────────────────────────────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      sfxRef.current.startAmbient();
      beginWhistleRef.current();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const isBest = score >= best && score > 0;

  // Ball target position for ShotBall overlay
  const ballTarget = target ? zoneCenterDisplay(target) : null;

  return (
    <div className="w-full">
      {/* Back button — only shown when an upstream back handler is provided */}
      {onBack && (
        <button
          type="button"
          onClick={() => { stopCamera(); onBack(); }}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-zinc-400 transition hover:text-yellow-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Switch mode
        </button>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px] lg:gap-5 lg:items-start">
          {/* Stats panel: scorecard + leaderboard — right col on desktop, top on mobile */}
          <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
            <GoalieScoreCard
              shot={shot}
              lives={lives}
              saves={saves}
              streak={streak}
              score={score}
              best={best}
              muted={muted}
              onToggleMute={toggleMute}
            />
            <GoalieLeaderboard mode="camera" refreshKey={leaderboardRefreshKey} />
          </div>

          {/* Camera + goal-frame overlay — left col on desktop */}
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-2xl bg-black lg:col-start-1 lg:row-start-1"
            style={{ aspectRatio: "16/9" }}
          >
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
              playsInline
              muted
            />

            {/* Phase flash effects */}
            {phase === "saved" && (
              <div key={`sf-${shot}`} className="pointer-events-none absolute inset-0 z-10 rounded-2xl goalie-save-flash" style={{ background: "rgba(74,222,128,0.40)" }} />
            )}
            {phase === "goal" && (
              <div key={`gf-${shot}`} className="pointer-events-none absolute inset-0 z-10 rounded-2xl goalie-goal-flash" style={{ background: "rgba(239,68,68,0.40)" }} />
            )}

            {/* Goal frame: net, posts, crossbar, grass, shooter silhouette */}
            <GoalFrame phase={phase} />

            <PoseOverlay
              palmRef={palmLandmarksRef}
              phase={phase}
              target={target}
              result={lastResult ? { saved: lastResult.saved } : null}
              width={videoSize.w}
              height={videoSize.h}
              videoRef={videoRef}
              showDebug={showDebug}
              latestInputRef={latestCameraInputRef}
            />

            {/* Ball — shot / saved / goal phases */}
            {(phase === "shot" || phase === "saved" || phase === "goal") && ballTarget && (
              <ShotBall
                key={shot}
                targetX={ballTarget.x}
                targetY={ballTarget.y}
                flightMs={curFlightMs}
                curved={shotIsCurved}
              />
            )}

            {/* Glove impact burst on save */}
            {phase === "saved" && ballTarget && (
              <div
                className="absolute pointer-events-none goalie-impact-burst"
                style={{
                  zIndex: 18,
                  width: 80,
                  height: 80,
                  left: `${ballTarget.x * 100}%`,
                  top: `${ballTarget.y * 100}%`,
                  borderRadius: "50%",
                  background: "rgba(250,204,21,0.38)",
                  border: "2.5px solid rgba(250,204,21,0.65)",
                }}
              />
            )}

            {/* Debug overlay — toggle with backtick key */}
            {showDebug && (phase === "shot" || phase === "ready") && (
              <pre
                ref={debugDisplayRef}
                className="pointer-events-none absolute bottom-2 left-2 z-40 rounded bg-black/80 p-1.5 text-[10px] leading-tight font-mono text-yellow-300"
              />
            )}

            {/* Dev mode: forced next zone indicator */}
            {forcedZone && (
              <div className="pointer-events-none absolute top-2 right-2 z-40 rounded bg-yellow-400/90 px-2 py-0.5 text-[10px] font-bold text-black">
                DEV: next → {SHOT_ZONE_LABELS[forcedZone]}
              </div>
            )}

            {/* Tracking-lost badge */}
            {trackingWarn && phase === "shot" && (
              <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-red-500/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                ⚠ Hands not detected
              </div>
            )}

            {/* Ready-stance overlay */}
            {phase === "ready" && (
              <Overlay subtle>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="text-3xl">🧤</div>
                  <p className="text-sm font-extrabold uppercase tracking-widest text-white">
                    Get ready
                  </p>
                  {readyValid ? (
                    <div className="mt-1 flex items-center gap-1.5 rounded-full bg-green-400/15 px-3 py-1 text-xs font-bold text-green-400"
                      style={{ border: "1px solid rgba(74,222,128,0.35)" }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      Holding…
                    </div>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-yellow-300">
                      Return hands to center
                    </p>
                  )}
                </div>
              </Overlay>
            )}

            {/* Whistle overlay */}
            {phase === "whistle" && (
              <Overlay subtle>
                <div className="goalie-count text-5xl drop-shadow-[0_0_16px_rgba(250,204,21,0.6)]">📣</div>
                <p className="mt-2 text-sm font-extrabold tracking-widest text-yellow-300 uppercase">
                  Penalty kick!
                </p>
              </Overlay>
            )}

            {/* runup — no overlay, pure suspense */}

            {/* Save result overlay */}
            {phase === "saved" && lastResult && (
              <Overlay subtle>
                <div className="text-center">
                  <div
                    className="goalie-pop text-5xl font-extrabold sm:text-6xl"
                    style={{
                      color: "#4ade80",
                      textShadow: "0 0 20px rgba(74,222,128,0.8), 0 0 40px rgba(74,222,128,0.4)",
                    }}
                  >
                    SAVE! 🧤
                  </div>
                  {lastResult.points > 0 && (
                    <div className="mt-2 text-base font-bold text-zinc-100">
                      +{lastResult.points} pts
                      {lastResult.reactionMs !== null && (
                        <span className="ml-2 text-sm font-normal text-zinc-400">
                          · {lastResult.reactionMs}ms
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Overlay>
            )}

            {/* Goal result overlay */}
            {phase === "goal" && lastResult && (
              <Overlay subtle>
                <div className="text-center">
                  <div
                    className="goalie-pop text-5xl font-extrabold sm:text-6xl"
                    style={{
                      color: "#f87171",
                      textShadow: "0 0 24px rgba(239,68,68,0.9), 0 0 48px rgba(239,68,68,0.4)",
                    }}
                  >
                    GOAL! ⚽
                  </div>
                  <div className="mt-2 text-sm font-semibold text-zinc-300">
                    {lastResult.pick === null
                      ? goalReasonRef.current === "no-hands"
                        ? "Hands not detected"
                        : "Wrong zone"
                      : `Ball went ${SHOT_ZONE_LABELS[lastResult.target].toLowerCase()}`}
                  </div>
                </div>
              </Overlay>
            )}

            {/* Countdown overlay — shown above everything while counting 3-2-1 */}
            {countdown !== null && (
              <div className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-black/65 backdrop-blur-[2px]">
                <span
                  key={countdown}
                  className="goalie-count font-black leading-none text-white"
                  style={{
                    fontSize: "clamp(6rem, 18vw, 11rem)",
                    textShadow: "0 0 60px rgba(250,204,21,0.7), 0 0 120px rgba(250,204,21,0.25)",
                  }}
                >
                  {countdown}
                </span>
              </div>
            )}

            {/* Idle overlay */}
            {phase === "idle" && countdown === null && (
              <Overlay>
                <div className="mb-1 text-2xl font-extrabold text-white sm:text-3xl">
                  Goalkeeper{" "}
                  <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                    Mode
                  </span>
                </div>
                <p className="mb-5 max-w-[220px] text-center text-sm text-zinc-400">
                  Move your hands to save. 3 lives — every goal costs one.
                </p>
                {(!isModelReady || !isCameraActive) ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
                      {!isModelReady ? "Loading model…" : "Starting camera…"}
                    </div>
                    {cameraError !== "none" && (
                      <p className="mt-1 text-xs text-red-400">Camera error — allow access and refresh.</p>
                    )}
                  </div>
                ) : (
                  <StartButton onClick={startGame} label="Start Challenge" icon={Zap} />
                )}
              </Overlay>
            )}

            {/* Game Over overlay */}
            {phase === "gameOver" && (() => {
              const fastest = reactionTimes.length > 0 ? Math.min(...reactionTimes) : null;
              const avg = reactionTimes.length > 0
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
                : null;
              const gameOverStats = [
                { label: "Saves",       value: String(saves),                            textColor: "#4ade80", borderColor: "rgba(74,222,128,0.2)",  bg: "rgba(74,222,128,0.08)"  },
                { label: "Shots",       value: String(shot),                             textColor: "#60a5fa", borderColor: "rgba(96,165,250,0.2)",  bg: "rgba(96,165,250,0.08)"  },
                { label: "Goals In",    value: String(misses),                           textColor: "#f87171", borderColor: "rgba(248,113,113,0.2)", bg: "rgba(248,113,113,0.08)" },
                { label: "Best Streak", value: String(bestStreak),                       textColor: "#fb923c", borderColor: "rgba(251,146,60,0.2)",  bg: "rgba(251,146,60,0.08)"  },
                { label: "Fastest",     value: fastest !== null ? `${fastest}ms` : "—", textColor: "#38bdf8", borderColor: "rgba(56,189,248,0.2)",  bg: "rgba(56,189,248,0.08)"  },
                { label: "Avg React",   value: avg     !== null ? `${avg}ms`     : "—", textColor: "#c084fc", borderColor: "rgba(192,132,252,0.2)", bg: "rgba(192,132,252,0.08)" },
              ];
              return (
                <Overlay>
                  <div className="goalie-card-in w-full flex flex-col items-center">
                    <h2 className="mb-1 text-2xl font-extrabold text-white sm:text-3xl">Game Over</h2>
                    {isBest && (
                      <div
                        className="mb-3 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-yellow-300 goalie-new-best"
                        style={{ background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.35)" }}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> New Best!
                      </div>
                    )}
                    <div className="mb-4 goalie-pop text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Score</div>
                      <div
                        className="text-6xl font-extrabold tabular-nums"
                        style={{ color: "#facc15", textShadow: "0 0 32px rgba(250,204,21,0.5)" }}
                      >
                        {score}
                      </div>
                    </div>
                    <div className="mb-4 grid w-full max-w-[280px] grid-cols-3 gap-2">
                      {gameOverStats.map(({ label, value, textColor, borderColor, bg }, i) => (
                        <div
                          key={label}
                          className="goalie-stat-reveal flex flex-col items-center rounded-xl px-2 py-2.5"
                          style={{ border: `1px solid ${borderColor}`, background: bg, animationDelay: `${i * 80}ms`, opacity: 0 }}
                        >
                          <span className="text-xl font-extrabold tabular-nums" style={{ color: textColor }}>{value}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 text-center leading-tight">{label}</span>
                        </div>
                      ))}
                    </div>
                    <StartButton onClick={startGame} label="Play Again" icon={RotateCcw} />
                    {submitting && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                        <span className="h-2 w-2 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
                        Saving score…
                      </div>
                    )}
                    {scoreResult?.ok === true && (
                      <p className="mt-3 text-xs font-semibold text-green-400">✓ Score saved</p>
                    )}
                    {scoreResult?.ok === false && (
                      <p className="mt-3 max-w-[200px] text-center text-xs text-zinc-500">{scoreResult.error}</p>
                    )}
                  </div>
                </Overlay>
              );
            })()}
          </div>
        </div>
    </div>
  );
}
