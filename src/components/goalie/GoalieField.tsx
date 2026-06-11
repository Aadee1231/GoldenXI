"use client";

import { useEffect, useRef } from "react";
import type { Direction, GamePhase } from "./types";

type GoalieFieldProps = {
  phase: GamePhase;
  target: Direction | null;
  pick: Direction | null;
  saved: boolean | null;
  round: number;
  /** Ball-flight transition duration in ms — matches the save window. */
  flightMs?: number;
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
  round,
  flightMs = 850,
}: GoalieFieldProps) {
  const netRef = useRef<HTMLDivElement>(null);

  // Replay net-shake CSS animation on each goal by forcing a DOM reflow.
  useEffect(() => {
    if (phase === "goal") {
      const el = netRef.current;
      if (!el) return;
      el.classList.remove("goalie-net-shake");
      void el.offsetWidth;
      el.classList.add("goalie-net-shake");
    }
  }, [phase, saved]);

  const ballMoving = phase === "shot" || phase === "saved" || phase === "goal";

  // Ball rests on the penalty spot until a shot is taken.
  const ballLeft = ballMoving && target ? BALL_X[target] : "50%";
  const ballTop = ballMoving && target ? "20%" : "82%";
  const ballScale = ballMoving && target ? 0.7 : 1;

  // Keeper dives toward the chosen direction once the player reacts.
  const keeperDir = pick;
  const keeperLeft = keeperDir ? KEEPER_X[keeperDir] : "50%";
  const keeperTilt =
    keeperDir === "left" ? "-22deg" : keeperDir === "right" ? "22deg" : "0deg";
  const keeperDrop =
    keeperDir === "left" || keeperDir === "right" ? "12%" : "0%";

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Stadium frame — night sky with floodlights */}
      <div
        ref={netRef}
        className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/60"
        style={{
          background:
            "linear-gradient(180deg,#06091a 0%,#080e1e 40%,#050d14 70%,#030c09 100%)",
        }}
      >
        {/* Floodlight beams */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 left-[20%] h-56 w-48 -rotate-12 opacity-50"
            style={{ background: "radial-gradient(ellipse, rgba(255,250,200,0.18) 0%, transparent 65%)", filter: "blur(12px)" }} />
          <div className="absolute -top-12 right-[20%] h-56 w-48 rotate-12 opacity-50"
            style={{ background: "radial-gradient(ellipse, rgba(200,220,255,0.15) 0%, transparent 65%)", filter: "blur(12px)" }} />
          {/* Centre pitch glow */}
          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-40"
            style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(30,160,60,0.35) 0%, transparent 68%)" }} />
        </div>

        <div className="relative aspect-[3/2] w-full px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
          {/* ── Goal net (SVG — two-axis grid + depth shadow) ──────────────── */}
          <svg
            viewBox="0 0 300 200"
            className="absolute inset-x-4 top-5 h-[58%] w-[calc(100%-2rem)]"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {/* Fine horizontal lines */}
              <pattern id="gf-net-h" width="18" height="14" patternUnits="userSpaceOnUse">
                <line x1="0" y1="14" x2="18" y2="14" stroke="rgba(255,255,255,0.13)" strokeWidth="0.9" />
              </pattern>
              {/* Fine vertical lines */}
              <pattern id="gf-net-v" width="18" height="14" patternUnits="userSpaceOnUse">
                <line x1="18" y1="0" x2="18" y2="14" stroke="rgba(255,255,255,0.10)" strokeWidth="0.9" />
              </pattern>
              {/* Net depth gradient — darker top, lighter bottom */}
              <linearGradient id="gf-net-depth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(20,60,130,0.25)" />
                <stop offset="100%" stopColor="rgba(10,25,50,0.08)" />
              </linearGradient>
              {/* Post gradient — chrome look */}
              <linearGradient id="gf-post-l" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#e8e8e8" />
                <stop offset="28%"  stopColor="#c0c0c0" />
                <stop offset="70%"  stopColor="#787878" />
                <stop offset="100%" stopColor="#484848" />
              </linearGradient>
              <linearGradient id="gf-post-r" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#484848" />
                <stop offset="30%"  stopColor="#787878" />
                <stop offset="72%"  stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#e8e8e8" />
              </linearGradient>
              <linearGradient id="gf-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#e8e8e8" />
                <stop offset="28%"  stopColor="#c0c0c0" />
                <stop offset="70%"  stopColor="#787878" />
                <stop offset="100%" stopColor="#484848" />
              </linearGradient>
            </defs>

            {/* Net depth fill */}
            <rect x="20" y="18" width="260" height="152" fill="url(#gf-net-depth)" />
            {/* Horizontal grid */}
            <rect x="20" y="18" width="260" height="152" fill="url(#gf-net-h)" />
            {/* Vertical grid */}
            <rect x="20" y="18" width="260" height="152" fill="url(#gf-net-v)" />

            {/* Post drop-shadows */}
            <rect x="16" y="14" width="10" height="162" rx="2" fill="rgba(0,0,0,0.45)" transform="translate(3,3)" />
            <rect x="274" y="14" width="10" height="162" rx="2" fill="rgba(0,0,0,0.45)" transform="translate(-3,3)" />

            {/* Left post */}
            <rect x="14" y="14" width="10" height="162" rx="2" fill="url(#gf-post-l)" />
            {/* Gold seam left post */}
            <rect x="23" y="14" width="1.5" height="162" fill="rgba(250,204,21,0.28)" />

            {/* Right post */}
            <rect x="276" y="14" width="10" height="162" rx="2" fill="url(#gf-post-r)" />
            {/* Gold seam right post */}
            <rect x="276" y="14" width="1.5" height="162" fill="rgba(250,204,21,0.28)" />

            {/* Crossbar drop-shadow */}
            <rect x="14" y="9" width="272" height="10" rx="2" fill="rgba(0,0,0,0.45)" transform="translate(0,3)" />
            {/* Crossbar */}
            <rect x="14" y="9" width="272" height="10" rx="2" fill="url(#gf-bar)" />
            {/* Gold seam crossbar */}
            <rect x="14" y="18" width="272" height="1.5" fill="rgba(250,204,21,0.28)" />
          </svg>

          {/* ── Target zones (inside net area) ─────────────────────────────── */}
          <div className="absolute inset-x-4 top-5 flex h-[58%] w-[calc(100%-2rem)]">
            {(["left", "center", "right"] as Direction[]).map((dir) => {
              const isTarget = ballMoving && target === dir;
              const isGoal   = isTarget && saved === false;
              const isSave   = isTarget && saved === true;
              return (
                <div
                  key={dir}
                  className="relative flex-1 overflow-hidden transition-all duration-200"
                  style={{
                    borderLeft:  dir !== "left"   ? "1px solid rgba(255,255,255,0.06)" : undefined,
                    borderRight: dir !== "right"  ? "1px solid rgba(255,255,255,0.06)" : undefined,
                    background: isGoal
                      ? "rgba(239,68,68,0.14)"
                      : isSave
                        ? "rgba(74,222,128,0.12)"
                        : isTarget
                          ? "rgba(250,204,21,0.10)"
                          : "transparent",
                  }}
                >
                  {/* Pulsing highlight on active target */}
                  {isTarget && !isSave && !isGoal && (
                    <div
                      className="absolute inset-0 goalie-target-pulse"
                      style={{ background: "rgba(250,204,21,0.12)" }}
                    />
                  )}
                  {/* Corner accent on target */}
                  {isTarget && (
                    <>
                      <div className="absolute top-0 left-0 h-4 w-4 border-l-2 border-t-2"
                        style={{ borderColor: isGoal ? "rgba(239,68,68,0.7)" : isSave ? "rgba(74,222,128,0.7)" : "rgba(250,204,21,0.7)" }} />
                      <div className="absolute top-0 right-0 h-4 w-4 border-r-2 border-t-2"
                        style={{ borderColor: isGoal ? "rgba(239,68,68,0.7)" : isSave ? "rgba(74,222,128,0.7)" : "rgba(250,204,21,0.7)" }} />
                      <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2"
                        style={{ borderColor: isGoal ? "rgba(239,68,68,0.7)" : isSave ? "rgba(74,222,128,0.7)" : "rgba(250,204,21,0.7)" }} />
                      <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2"
                        style={{ borderColor: isGoal ? "rgba(239,68,68,0.7)" : isSave ? "rgba(74,222,128,0.7)" : "rgba(250,204,21,0.7)" }} />
                    </>
                  )}
                  <span
                    className="absolute left-1/2 top-1.5 -translate-x-1/2 select-none text-[9px] font-black uppercase tracking-widest transition-all duration-200"
                    style={{ color: isTarget ? (isGoal ? "rgba(248,113,113,0.9)" : isSave ? "rgba(74,222,128,0.9)" : "rgba(250,204,21,0.9)") : "rgba(255,255,255,0.10)" }}
                  >
                    {dir === "left" ? "L" : dir === "center" ? "C" : "R"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Keeper (gloves) ────────────────────────────────────────────── */}
          <div
            className="absolute z-10 transition-all duration-280 ease-out"
            style={{
              left: keeperLeft,
              top: `calc(50% + ${keeperDrop})`,
              transform: `translateX(-50%) rotate(${keeperTilt})`,
              filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.7))",
            }}
          >
            <span className="text-2xl sm:text-3xl">🧤</span>
          </div>

          {/* ── Ball ───────────────────────────────────────────────────────── */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all ease-out"
            style={{
              left: ballLeft,
              top: ballTop,
              transitionDuration: ballMoving ? `${flightMs}ms` : "300ms",
              transform: `translate(-50%, -50%) scale(${ballScale})`,
              filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.7))",
            }}
          >
            <div className="relative h-9 w-9 sm:h-11 sm:w-11">
              <div className="absolute inset-0 rounded-full bg-white shadow-lg shadow-black/50 ring-2 ring-black/20" />
              <div className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl">
                <span className={ballMoving ? "goalie-ball-spin block" : "block"}>⚽</span>
              </div>
            </div>
          </div>

          {/* ── Penalty pitch (grass + lines) ──────────────────────────────── */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[42%] overflow-hidden rounded-b-3xl"
          >
            {/* Base grass */}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(18,95,42,0.6) 0%, rgba(9,60,25,0.85) 55%, rgba(5,38,14,0.97) 100%)" }} />
            {/* Mowing stripes */}
            <div className="absolute inset-0"
              style={{ backgroundImage: "repeating-linear-gradient(90deg,transparent 0px,transparent 24px,rgba(0,0,0,0.18) 24px,rgba(0,0,0,0.18) 48px)" }} />
            {/* Pitch-top edge line */}
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "rgba(255,255,255,0.28)" }} />
            {/* Penalty area box */}
            <div className="absolute"
              style={{ bottom: 0, left: "18%", right: "18%", top: "28%", border: "1.5px solid rgba(255,255,255,0.28)", borderBottom: "none" }} />
            {/* Penalty spot */}
            <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2"
              style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.80)", boxShadow: "0 0 6px rgba(255,255,255,0.5)" }} />
          </div>

          {/* ── Save / Goal result flash ────────────────────────────────────── */}
          {(phase === "saved" || phase === "goal") && saved !== null && (
            <div
              key={`flash-${round}`}
              aria-hidden="true"
              className={[
                "pointer-events-none absolute inset-0 rounded-3xl",
                saved ? "goalie-save-flash" : "goalie-goal-flash",
              ].join(" ")}
              style={{ background: saved ? "rgba(74,222,128,0.22)" : "rgba(239,68,68,0.28)" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
