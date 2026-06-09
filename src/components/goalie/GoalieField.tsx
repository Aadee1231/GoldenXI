import type { Direction, GamePhase } from "./types";

type GoalieFieldProps = {
  phase: GamePhase;
  target: Direction | null;
  pick: Direction | null;
  saved: boolean | null;
};

// Horizontal position (as a CSS left %) of the ball for each target zone.
const BALL_X: Record<Direction, string> = {
  left: "18%",
  center: "50%",
  right: "82%",
};

// Horizontal position of the keeper's gloves when diving.
const KEEPER_X: Record<Direction, string> = {
  left: "20%",
  center: "50%",
  right: "80%",
};

export default function GoalieField({
  phase,
  target,
  pick,
  saved,
}: GoalieFieldProps) {
  const ballMoving = phase === "shooting" || phase === "result";

  // Ball rests on the penalty spot until a shot is taken.
  const ballLeft = ballMoving && target ? BALL_X[target] : "50%";
  const ballTop = ballMoving && target ? "20%" : "82%";
  const ballScale = ballMoving && target ? 0.7 : 1;

  // Keeper dives toward the chosen direction once the player reacts.
  const keeperDir = pick ?? (phase === "shooting" ? null : null);
  const keeperLeft = keeperDir ? KEEPER_X[keeperDir] : "50%";
  const keeperTilt =
    keeperDir === "left" ? "-22deg" : keeperDir === "right" ? "22deg" : "0deg";
  const keeperDrop =
    keeperDir === "left" || keeperDir === "right" ? "12%" : "0%";

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Night sky / stadium glow */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a1023] via-[#0a0f1a] to-[#06150d] shadow-2xl shadow-black/50">
        {/* Floodlight beams */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
        >
          <div className="absolute -top-10 left-1/4 h-48 w-40 -rotate-12 bg-gradient-to-b from-yellow-200/20 to-transparent blur-2xl" />
          <div className="absolute -top-10 right-1/4 h-48 w-40 rotate-12 bg-gradient-to-b from-blue-200/20 to-transparent blur-2xl" />
        </div>

        <div className="relative aspect-[3/2] w-full px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
          {/* Goal frame (SVG only) */}
          <svg
            viewBox="0 0 300 200"
            className="absolute inset-x-4 top-5 h-[58%] w-[calc(100%-2rem)]"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Net */}
            <defs>
              <pattern
                id="goalie-net"
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 14 0 L 0 0 0 14"
                  fill="none"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect
              x="20"
              y="20"
              width="260"
              height="150"
              fill="url(#goalie-net)"
            />
            {/* Posts + crossbar */}
            <rect x="14" y="14" width="10" height="162" rx="2" fill="#f4f4f5" />
            <rect
              x="276"
              y="14"
              width="10"
              height="162"
              rx="2"
              fill="#f4f4f5"
            />
            <rect x="14" y="10" width="272" height="10" rx="2" fill="#ffffff" />
          </svg>

          {/* Target zones */}
          <div className="absolute inset-x-4 top-5 flex h-[58%] w-[calc(100%-2rem)]">
            {(["left", "center", "right"] as Direction[]).map((dir) => {
              const isTarget = ballMoving && target === dir;
              return (
                <div
                  key={dir}
                  className={[
                    "flex-1 border-x border-dashed transition-colors duration-200",
                    isTarget
                      ? saved === false
                        ? "border-red-400/40 bg-red-500/10"
                        : "border-yellow-400/40 bg-yellow-400/10"
                      : "border-white/5",
                  ].join(" ")}
                />
              );
            })}
          </div>

          {/* Keeper (gloves) */}
          <div
            className="absolute z-10 -translate-x-1/2 transition-all duration-300 ease-out"
            style={{
              left: keeperLeft,
              top: `calc(50% + ${keeperDrop})`,
              transform: `translateX(-50%) rotate(${keeperTilt})`,
            }}
          >
            <div className="flex items-center gap-1">
              <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:text-3xl">
                🧤
              </span>
            </div>
          </div>

          {/* Ball */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all ease-out"
            style={{
              left: ballLeft,
              top: ballTop,
              transitionDuration: ballMoving ? "650ms" : "300ms",
              transform: `translate(-50%, -50%) scale(${ballScale})`,
            }}
          >
            <div className="relative h-9 w-9 sm:h-11 sm:w-11">
              <div className="absolute inset-0 rounded-full bg-white shadow-lg shadow-black/40 ring-2 ring-black/10" />
              <div className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl">
                ⚽
              </div>
            </div>
          </div>

          {/* Penalty spot + pitch */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[42%] overflow-hidden rounded-b-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-green-700/30 to-green-900/40" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
            <div className="absolute bottom-[18%] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
