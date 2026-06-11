"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Sparkles } from "lucide-react";
import { useGameAudio } from "./useGameAudio";
import GoalieField from "./GoalieField";
import ReactionControls from "./ReactionControls";
import GoalieScoreCard from "./GoalieScoreCard";
import GoalieLeaderboard from "./GoalieLeaderboard";
import { useGoalieScore } from "@/src/hooks/useGoalieScore";
import { fetchUserGoalieBest } from "@/src/lib/goalie/goalieScores";
import {
  BEST_SCORE_KEY,
  DIRECTIONS,
  DIRECTION_LABELS,
  WHISTLE_MS,
  RUNUP_MIN_MS,
  RUNUP_MAX_MS,
  SHOT_LOCKOUT_MS,
  RESULT_MS,
  STARTING_LIVES,
  ballFlightMs,
  type Direction,
  type GamePhase,
  type RoundResult,
} from "./types";

function randomDirection(): Direction {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
}

function randomRunupDelay(): number {
  return RUNUP_MIN_MS + Math.floor(Math.random() * (RUNUP_MAX_MS - RUNUP_MIN_MS));
}

function scoreShot(reactionMs: number, flightWindowMs: number, streak: number): number {
  const speed = Math.max(
    0,
    Math.round(((flightWindowMs - reactionMs) / flightWindowMs) * 100),
  );
  const streakBonus = Math.min(streak, 5) * 10;
  return 50 + speed + streakBonus;
}

export default function GoalieGame() {
  const [phase, setPhase]       = useState<GamePhase>("idle");
  const [shot, setShot]         = useState(1);
  const [lives, setLives]       = useState(STARTING_LIVES);
  const [saves, setSaves]       = useState(0);
  const [misses, setMisses]     = useState(0);
  const [streak, setStreak]     = useState(0);
  const [score, setScore]       = useState(0);
  const [best, setBest]         = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [target, setTarget]     = useState<Direction | null>(null);
  const [pick, setPick]         = useState<Direction | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [bestStreak, setBestStreak] = useState(0);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [curFlightMs, setCurFlightMs] = useState(ballFlightMs(0));

  const shotStartRef     = useRef<number>(0);
  const delayTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef         = useRef<GamePhase>("idle");
  const targetRef        = useRef<Direction | null>(null);
  const streakRef        = useRef(0);
  const bestStreakRef    = useRef(0);
  const savesRef         = useRef(0);
  const missesRef        = useRef(0);
  const livesRef         = useRef(STARTING_LIVES);
  const shotsRef         = useRef(1);
  const reactionTimesRef = useRef<number[]>([]);

  // Ref to break the circular callback chain: resolveRound → beginWhistle
  const beginWhistleRef  = useRef<() => void>(() => {});

  // Keep refs in sync so timer callbacks always read fresh values.
  useEffect(() => { phaseRef.current         = phase;         }, [phase]);
  useEffect(() => { targetRef.current        = target;        }, [target]);
  useEffect(() => { streakRef.current        = streak;        }, [streak]);
  useEffect(() => { bestStreakRef.current    = bestStreak;    }, [bestStreak]);
  useEffect(() => { savesRef.current         = saves;         }, [saves]);
  useEffect(() => { missesRef.current        = misses;        }, [misses]);
  useEffect(() => { livesRef.current         = lives;         }, [lives]);
  useEffect(() => { shotsRef.current         = shot;          }, [shot]);
  useEffect(() => { reactionTimesRef.current = reactionTimes; }, [reactionTimes]);

  const clearTimers = useCallback(() => {
    if (delayTimer.current)  { clearTimeout(delayTimer.current);  delayTimer.current  = null; }
    if (windowTimer.current) { clearTimeout(windowTimer.current); windowTimer.current = null; }
    if (nextTimer.current)   { clearTimeout(nextTimer.current);   nextTimer.current   = null; }
  }, []);

  // Load best score: localStorage first (instant), then DB (authoritative).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BEST_SCORE_KEY);
      if (stored) setBest(Number(stored) || 0);
    } catch { /* localStorage unavailable */ }
    fetchUserGoalieBest().then((dbBest) => {
      if (dbBest !== null) {
        setBest((prev) => {
          const next = Math.max(prev, dbBest);
          try { window.localStorage.setItem(BEST_SCORE_KEY, String(next)); } catch {}
          return next;
        });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

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

  const finishGame = useCallback((finalScore: number) => {
    setPhase("gameOver");
    sfxRef.current.stopAmbient();
    setBest((prevBest) => {
      const next = Math.max(prevBest, finalScore);
      try { window.localStorage.setItem(BEST_SCORE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Auto-submit score when game ends.
  useEffect(() => {
    if (phase !== "gameOver") return;
    const p = pendingPayloadRef.current;
    if (!p) return;
    void submitOnce({
      mode:          "keyboard",
      score:         p.score,
      saves:         p.saves,
      goalsAllowed:  p.goalsAllowed,
      shotsFaced:    p.shotsFaced,
      reactionTimes: p.reactionTimes,
      bestStreak:    p.bestStreak,
      metadata: {
        input_method:    "keyboard_arrow_keys",
        difficulty_ramp: "progressive_flight_ms",
      },
    });
  }, [phase, submitOnce]);

  useEffect(() => {
    if (scoreResult?.ok === true) setLeaderboardRefreshKey((k) => k + 1);
  }, [scoreResult]);

  // ── resolveRound ──────────────────────────────────────────────────────────
  // Uses beginWhistleRef (not beginWhistle directly) to avoid a circular dep
  // chain: resolveRound → beginWhistle → beginRunup → beginShot → resolveRound.
  const resolveRound = useCallback(
    (selected: Direction | null) => {
      if (phaseRef.current !== "shot") return;
      if (windowTimer.current) { clearTimeout(windowTimer.current); windowTimer.current = null; }

      const activeTarget = targetRef.current;
      if (!activeTarget) return;

      const reactionMs = selected
        ? Math.round(performance.now() - shotStartRef.current)
        : null;
      const saved   = selected !== null && selected === activeTarget;
      const flight  = ballFlightMs(savesRef.current);
      const points  = saved && reactionMs !== null
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
        beginWhistleRef.current();
      }, RESULT_MS);
    },
    [score, finishGame],
  );

  // ── beginShot ─────────────────────────────────────────────────────────────
  const beginShot = useCallback(() => {
    const dir    = randomDirection();
    const flight = ballFlightMs(savesRef.current);
    setCurFlightMs(flight);
    setTarget(dir);
    setPick(null);
    setPhase("shot");
    shotStartRef.current = performance.now();
    windowTimer.current  = setTimeout(() => resolveRound(null), flight);
    sfxRef.current.playKick();
  }, [resolveRound]);

  // ── beginRunup ────────────────────────────────────────────────────────────
  const beginRunup = useCallback(() => {
    setPhase("runup");
    delayTimer.current = setTimeout(beginShot, randomRunupDelay());
  }, [beginShot]);

  // ── beginWhistle ──────────────────────────────────────────────────────────
  const beginWhistle = useCallback(() => {
    setPhase("whistle");
    setTarget(null);
    setPick(null);
    setLastResult(null);
    sfxRef.current.playWhistle();
    delayTimer.current = setTimeout(beginRunup, WHISTLE_MS);
  }, [beginRunup]);

  // Keep the ref in sync so resolveRound always calls the latest closure.
  useEffect(() => { beginWhistleRef.current = beginWhistle; }, [beginWhistle]);

  // ── startGame ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearTimers();
    setShot(1); setLives(STARTING_LIVES);
    setSaves(0); setMisses(0); setStreak(0); setScore(0);
    setLastResult(null); setPick(null); setTarget(null);
    setReactionTimes([]); setBestStreak(0);
    setCurFlightMs(ballFlightMs(0));
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
    sfxRef.current.startAmbient();
    beginWhistle();
  }, [clearTimers, resetSubmission, beginWhistle]);

  // ── handleSelect ──────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (dir: Direction) => {
      if (phaseRef.current !== "shot") return;
      // Lockout: ignore input in the first SHOT_LOCKOUT_MS after the kick
      if (performance.now() - shotStartRef.current < SHOT_LOCKOUT_MS) return;
      resolveRound(dir);
    },
    [resolveRound],
  );

  // Keyboard support: A = left, W/Space = center, D = right.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (phaseRef.current === "shot") {
        if (key === "a" || key === "arrowleft") { e.preventDefault(); handleSelect("left"); }
        else if (key === "w" || key === " " || key === "arrowup") { e.preventDefault(); handleSelect("center"); }
        else if (key === "d" || key === "arrowright") { e.preventDefault(); handleSelect("right"); }
        return;
      }
      if (
        (phaseRef.current === "idle" || phaseRef.current === "gameOver") &&
        (key === " " || key === "enter")
      ) {
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSelect, startGame]);

  const controlsDisabled = phase !== "shot";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
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

      <div className="relative">
        <GoalieField
          phase={phase}
          target={target}
          pick={pick}
          saved={lastResult?.saved ?? null}
          round={shot}
          flightMs={curFlightMs}
        />

        <StatusBanner
          phase={phase}
          lastResult={lastResult}
          saves={saves}
          goalsAllowed={misses}
          shotsFaced={shot}
          bestStreak={bestStreak}
          score={score}
          best={best}
          onStart={startGame}
          reactionTimes={reactionTimes}
          submitting={submitting}
          scoreResult={scoreResult}
        />
      </div>

      <ReactionControls
        onSelect={handleSelect}
        disabled={controlsDisabled}
        pick={pick}
      />

      <p className="text-center text-xs text-zinc-500">
        Dive the right way before the ball beats you. Keyboard:{" "}
        <span className="font-semibold text-zinc-300">A</span> left,{" "}
        <span className="font-semibold text-zinc-300">W / Space</span> center,{" "}
        <span className="font-semibold text-zinc-300">D</span> right.
      </p>

      <GoalieLeaderboard mode="keyboard" refreshKey={leaderboardRefreshKey} />
    </div>
  );
}

// ── StatusBanner ─────────────────────────────────────────────────────────────

function StatusBanner({
  phase,
  lastResult,
  saves,
  goalsAllowed,
  shotsFaced,
  bestStreak,
  score,
  best,
  onStart,
  reactionTimes,
  submitting,
  scoreResult,
}: {
  phase: GamePhase;
  lastResult: RoundResult | null;
  saves: number;
  goalsAllowed: number;
  shotsFaced: number;
  bestStreak: number;
  score: number;
  best: number;
  onStart: () => void;
  reactionTimes: number[];
  submitting: boolean;
  scoreResult: import("@/src/hooks/useGoalieScore").UseGoalieScoreReturn["scoreResult"];
}) {
  if (phase === "idle") {
    return (
      <Overlay>
        <h2 className="mb-2 text-2xl font-extrabold text-white sm:text-3xl">
          Goalkeeper{" "}
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            Reaction
          </span>
        </h2>
        <p className="mb-5 max-w-xs text-sm text-zinc-300">
          3 lives. Every goal costs one — survive as long as you can.
        </p>
        <StartButton onClick={onStart} label="Start Challenge" icon={Play} />
      </Overlay>
    );
  }

  if (phase === "whistle") {
    return (
      <Overlay subtle>
        <div className="goalie-count text-5xl drop-shadow-[0_0_16px_rgba(250,204,21,0.6)]">📣</div>
        <p className="mt-2 text-sm font-extrabold tracking-widest text-yellow-300 uppercase">
          Penalty kick!
        </p>
      </Overlay>
    );
  }

  // runup: no overlay — pure suspense while the striker runs up
  if (phase === "runup") return null;

  if (phase === "saved" && lastResult) {
    return (
      <Overlay subtle>
        <div className="relative text-center">
          <div
            className="goalie-pop text-4xl font-extrabold sm:text-5xl"
            style={{ color: "#4ade80", textShadow: "0 0 24px rgba(74,222,128,0.9), 0 0 48px rgba(74,222,128,0.4)" }}
          >
            SAVE! 🧤
          </div>
          {lastResult.points > 0 && (
            <div className="mt-1.5 text-sm font-bold text-zinc-100">
              +{lastResult.points} pts
              {lastResult.reactionMs !== null && (
                <span className="ml-2 text-xs font-normal text-zinc-400">
                  · {lastResult.reactionMs}ms
                </span>
              )}
            </div>
          )}
        </div>
      </Overlay>
    );
  }

  if (phase === "goal" && lastResult) {
    return (
      <Overlay subtle>
        <div className="text-center">
          <div
            className="goalie-pop text-4xl font-extrabold sm:text-5xl"
            style={{ color: "#f87171", textShadow: "0 0 24px rgba(239,68,68,0.9), 0 0 48px rgba(239,68,68,0.4)" }}
          >
            GOAL! ⚽
          </div>
          <div className="mt-1.5 text-sm font-semibold text-zinc-300">
            {lastResult.pick === null
              ? "Too slow!"
              : `Ball went ${DIRECTION_LABELS[lastResult.target].toLowerCase()}`}
          </div>
        </div>
      </Overlay>
    );
  }

  if (phase === "gameOver") {
    const isBest  = score >= best && score > 0;
    const fastest = reactionTimes.length ? Math.min(...reactionTimes) : null;
    const avg     = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : null;
    const statStyle = (i: number): CSSProperties => ({
      animationDelay: `${i * 80}ms`,
      opacity: 0,
    });
    const stats = [
      { label: "Saves",       value: String(saves),                              textColor: "#4ade80",  borderColor: "rgba(74,222,128,0.2)",   bg: "rgba(74,222,128,0.08)"  },
      { label: "Shots",       value: String(shotsFaced),                         textColor: "#60a5fa",  borderColor: "rgba(96,165,250,0.2)",   bg: "rgba(96,165,250,0.08)"  },
      { label: "Goals In",    value: String(goalsAllowed),                       textColor: "#f87171",  borderColor: "rgba(248,113,113,0.2)",  bg: "rgba(248,113,113,0.08)" },
      { label: "Best Streak", value: String(bestStreak),                         textColor: "#fb923c",  borderColor: "rgba(251,146,60,0.2)",   bg: "rgba(251,146,60,0.08)"  },
      { label: "Fastest",     value: fastest !== null ? `${fastest}ms` : "—",   textColor: "#38bdf8",  borderColor: "rgba(56,189,248,0.2)",   bg: "rgba(56,189,248,0.08)"  },
      { label: "Avg React",   value: avg     !== null ? `${avg}ms`     : "—",   textColor: "#c084fc",  borderColor: "rgba(192,132,252,0.2)",  bg: "rgba(192,132,252,0.08)" },
    ] as const;
    return (
      <Overlay>
        <div className="goalie-card-in w-full flex flex-col items-center">
          <h2 className="mb-1 text-2xl font-extrabold text-white sm:text-3xl">
            Game Over
          </h2>
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

          <div className="mb-5 grid w-full max-w-[280px] grid-cols-3 gap-2">
            {stats.map(({ label, value, textColor, borderColor, bg }, i) => (
              <div
                key={label}
                className="goalie-stat-reveal flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5"
                style={{ ...statStyle(i), border: `1px solid ${borderColor}`, background: bg }}
              >
                <span className="text-xl font-extrabold tabular-nums" style={{ color: textColor }}>{value}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <StartButton onClick={onStart} label="Play Again" icon={RotateCcw} />
          <ScoreSubmissionStatus submitting={submitting} result={scoreResult} />
        </div>
      </Overlay>
    );
  }

  return null;
}

// ── Helper UI components ──────────────────────────────────────────────────────

function ScoreSubmissionStatus({
  submitting,
  result,
}: {
  submitting: boolean;
  result: import("@/src/hooks/useGoalieScore").UseGoalieScoreReturn["scoreResult"];
}) {
  if (submitting) {
    return (
      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
        <span className="h-2 w-2 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
        Saving score…
      </div>
    );
  }
  if (result?.ok === true) {
    return <p className="mt-3 text-xs font-semibold text-green-400">✓ Score saved</p>;
  }
  if (result?.ok === false) {
    return (
      <p className="mt-3 max-w-[200px] text-center text-xs text-zinc-500">
        {result.error}
      </p>
    );
  }
  return null;
}

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
        "pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-6 text-center",
        subtle ? "bg-black/30" : "bg-black/60 backdrop-blur-sm",
      ].join(" ")}
    >
      <div className="pointer-events-auto flex flex-col items-center">
        {children}
      </div>
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
  icon: typeof Play;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-7 py-3.5 text-base font-bold text-black shadow-lg shadow-yellow-400/30 transition-all hover:scale-105 hover:shadow-yellow-400/50 active:scale-95"
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
