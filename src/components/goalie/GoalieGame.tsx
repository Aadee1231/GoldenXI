"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Sparkles } from "lucide-react";
import GoalieField from "./GoalieField";
import ReactionControls from "./ReactionControls";
import GoalieScoreCard from "./GoalieScoreCard";
import {
  BEST_SCORE_KEY,
  DIRECTIONS,
  DIRECTION_LABELS,
  REACTION_WINDOW_MS,
  TOTAL_ROUNDS,
  type Direction,
  type GamePhase,
  type RoundResult,
} from "./types";

function randomDirection(): Direction {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
}

function randomDelay(): number {
  // Short, unpredictable wait before the shot is taken.
  return 800 + Math.floor(Math.random() * 1500);
}

function scoreShot(reactionMs: number, streak: number): number {
  const speed = Math.max(
    0,
    Math.round(((REACTION_WINDOW_MS - reactionMs) / REACTION_WINDOW_MS) * 100),
  );
  const streakBonus = Math.min(streak, 5) * 10;
  return 50 + speed + streakBonus;
}

export default function GoalieGame() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [round, setRound] = useState(1);
  const [saves, setSaves] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const [target, setTarget] = useState<Direction | null>(null);
  const [pick, setPick] = useState<Direction | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  const shotStartRef = useRef<number>(0);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<GamePhase>("idle");
  const targetRef = useRef<Direction | null>(null);
  const streakRef = useRef(0);

  // Keep refs in sync so timers/handlers read fresh values.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  const clearTimers = useCallback(() => {
    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (windowTimer.current) clearTimeout(windowTimer.current);
    if (nextTimer.current) clearTimeout(nextTimer.current);
    delayTimer.current = null;
    windowTimer.current = null;
    nextTimer.current = null;
  }, []);

  // Load best score from local storage on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BEST_SCORE_KEY);
      if (stored) setBest(Number(stored) || 0);
    } catch {
      // localStorage unavailable — ignore, game still playable.
    }
    return () => clearTimers();
  }, [clearTimers]);

  const finishGame = useCallback((finalScore: number) => {
    setPhase("over");
    setBest((prevBest) => {
      const next = Math.max(prevBest, finalScore);
      try {
        window.localStorage.setItem(BEST_SCORE_KEY, String(next));
      } catch {
        // ignore persistence failures
      }
      return next;
    });
  }, []);

  const beginShot = useCallback(() => {
    const dir = randomDirection();
    setTarget(dir);
    setPick(null);
    setPhase("shooting");
    shotStartRef.current = performance.now();

    // No reaction in time → goal.
    windowTimer.current = setTimeout(() => {
      resolveRound(null);
    }, REACTION_WINDOW_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRound = useCallback(() => {
    setPhase("ready");
    setTarget(null);
    setPick(null);
    setLastResult(null);
    delayTimer.current = setTimeout(beginShot, randomDelay());
  }, [beginShot]);

  const resolveRound = useCallback(
    (selected: Direction | null) => {
      if (phaseRef.current !== "shooting") return;
      if (windowTimer.current) {
        clearTimeout(windowTimer.current);
        windowTimer.current = null;
      }

      const activeTarget = targetRef.current;
      if (!activeTarget) return;

      const reactionMs = selected
        ? Math.round(performance.now() - shotStartRef.current)
        : null;
      const saved = selected !== null && selected === activeTarget;
      const points = saved && reactionMs !== null ? scoreShot(reactionMs, streakRef.current) : 0;

      setPick(selected);
      setLastResult({
        saved,
        target: activeTarget,
        pick: selected,
        reactionMs,
        points,
      });
      setPhase("result");

      let newScore = score;
      if (saved) {
        setSaves((s) => s + 1);
        setStreak((s) => s + 1);
        newScore = score + points;
        setScore(newScore);
      } else {
        setMisses((m) => m + 1);
        setStreak(0);
      }

      nextTimer.current = setTimeout(() => {
        setRound((current) => {
          if (current >= TOTAL_ROUNDS) {
            finishGame(newScore);
            return current;
          }
          startRound();
          return current + 1;
        });
      }, 1300);
    },
    [score, startRound, finishGame],
  );

  const startGame = useCallback(() => {
    clearTimers();
    setRound(1);
    setSaves(0);
    setMisses(0);
    setStreak(0);
    setScore(0);
    setLastResult(null);
    setPick(null);
    setTarget(null);
    streakRef.current = 0;
    startRound();
  }, [clearTimers, startRound]);

  const handleSelect = useCallback(
    (dir: Direction) => {
      if (phaseRef.current !== "shooting") return;
      resolveRound(dir);
    },
    [resolveRound],
  );

  // Keyboard support: A = left, W/Space = center, D = right.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (phaseRef.current === "shooting") {
        if (key === "a" || key === "arrowleft") {
          e.preventDefault();
          handleSelect("left");
        } else if (key === "w" || key === " " || key === "arrowup") {
          e.preventDefault();
          handleSelect("center");
        } else if (key === "d" || key === "arrowright") {
          e.preventDefault();
          handleSelect("right");
        }
        return;
      }
      if (
        (phaseRef.current === "idle" || phaseRef.current === "over") &&
        (key === " " || key === "enter")
      ) {
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSelect, startGame]);

  const controlsDisabled = phase !== "shooting";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <GoalieScoreCard
        round={round}
        saves={saves}
        misses={misses}
        streak={streak}
        score={score}
        best={best}
      />

      <div className="relative">
        <GoalieField
          phase={phase}
          target={target}
          pick={pick}
          saved={lastResult?.saved ?? null}
        />

        {/* Status banner overlay */}
        <StatusBanner
          phase={phase}
          lastResult={lastResult}
          saves={saves}
          score={score}
          best={best}
          onStart={startGame}
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
    </div>
  );
}

function StatusBanner({
  phase,
  lastResult,
  saves,
  score,
  best,
  onStart,
}: {
  phase: GamePhase;
  lastResult: RoundResult | null;
  saves: number;
  score: number;
  best: number;
  onStart: () => void;
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
          {TOTAL_ROUNDS} penalties. React fast, dive the right way, and rack up
          saves.
        </p>
        <StartButton onClick={onStart} label="Start Challenge" icon={Play} />
      </Overlay>
    );
  }

  if (phase === "ready") {
    return (
      <Overlay subtle>
        <div className="flex items-center gap-2 text-lg font-bold text-yellow-300">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-yellow-400" />
          Get ready...
        </div>
      </Overlay>
    );
  }

  if (phase === "result" && lastResult) {
    return (
      <Overlay subtle>
        {lastResult.saved ? (
          <div className="text-center">
            <div className="text-3xl font-extrabold text-green-400 drop-shadow sm:text-4xl">
              SAVE! 🧤
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-200">
              +{lastResult.points} pts
              {lastResult.reactionMs !== null
                ? ` · ${lastResult.reactionMs}ms`
                : ""}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-extrabold text-red-400 drop-shadow sm:text-4xl">
              GOAL! ⚽
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-300">
              {lastResult.pick === null
                ? "Too slow!"
                : `Ball went ${DIRECTION_LABELS[lastResult.target].toLowerCase()}`}
            </div>
          </div>
        )}
      </Overlay>
    );
  }

  if (phase === "over") {
    const isBest = score >= best && score > 0;
    return (
      <Overlay>
        <h2 className="mb-1 text-2xl font-extrabold text-white sm:text-3xl">
          Full Time
        </h2>
        {isBest && (
          <div className="mb-2 flex items-center gap-1.5 rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-300 ring-1 ring-yellow-400/30">
            <Sparkles className="h-3.5 w-3.5" /> New Best!
          </div>
        )}
        <p className="mb-1 text-sm text-zinc-300">
          {saves}/{TOTAL_ROUNDS} saves
        </p>
        <div className="mb-5 text-4xl font-extrabold text-yellow-400">
          {score}
        </div>
        <StartButton onClick={onStart} label="Play Again" icon={RotateCcw} />
      </Overlay>
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
