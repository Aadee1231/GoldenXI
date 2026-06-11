"use client";

import type { GamePhase } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Z-index stack (all relative to the shared video container):
//   net / glow          10–11
//   result flash        12
//   grass / spot        13–14
//   ShotBall            16   (in CameraGoalieMode)
//   glove impact burst  18   (in CameraGoalieMode)
//   result overlays     20   (Overlay component)
//   posts / crossbar    25   (always frame the view, even above overlays)
//   tracking badge      30
// ─────────────────────────────────────────────────────────────────────────────

const POST_W  = "4.5%";
const BAR_H   = "5%";
const GRASS_H = "11%";

type Props = { phase: GamePhase };

export default function GoalFrame({ phase }: Props) {
  const isGoal      = phase === "goal";
  const isSaved     = phase === "saved";
  const isResult    = isGoal || isSaved;
  const showShooter = phase === "whistle" || phase === "runup";

  return (
    <>
      {/* ── Net grid (full area, shakes on goal) ─────────────────────────── */}
      <div
        className={`absolute inset-0 pointer-events-none${isGoal ? " goalie-net-shake" : ""}`}
        style={{
          zIndex: 10,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "20px 16px",
        }}
      />

      {/* ── Net depth tint (darker at top → feels like looking into the net) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 10,
          background:
            "linear-gradient(180deg, rgba(10,20,60,0.22) 0%, rgba(5,15,30,0.08) 55%, transparent 100%)",
        }}
      />

      {/* ── Stadium floor glow (gold, from below) ───────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 11,
          background:
            "radial-gradient(ellipse at 50% 115%, rgba(250,204,21,0.10) 0%, transparent 55%)",
        }}
      />

      {/* ── Result flash overlay ─────────────────────────────────────────── */}
      {isResult && (
        <div
          className={`absolute inset-0 pointer-events-none ${isGoal ? "goalie-goal-flash" : "goalie-save-flash"}`}
          style={{
            zIndex: 12,
            background: isGoal
              ? "rgba(239,68,68,0.30)"
              : "rgba(74,222,128,0.22)",
          }}
        />
      )}

      {/* ── Grass strip ──────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 13, height: GRASS_H }}
      >
        {/* Base grass */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(16,100,44,0.80) 40%, rgba(8,62,22,0.97) 100%)",
          }}
        />
        {/* Mowing stripes */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0px, transparent 22px, rgba(0,0,0,0.16) 22px, rgba(0,0,0,0.16) 44px)",
          }}
        />
        {/* Pitch top edge */}
        <div className="absolute inset-x-0 top-0" style={{ height: 1.5, background: "rgba(255,255,255,0.32)" }} />
        {/* Penalty area box */}
        <div
          className="absolute"
          style={{
            top: "22%",
            bottom: 0,
            left: "18%",
            right: "18%",
            border: "1.5px solid rgba(255,255,255,0.30)",
            borderBottom: "none",
          }}
        />
        {/* Penalty-area line at bottom */}
        <div
          className="absolute"
          style={{
            bottom: 0,
            left: "18%",
            right: "18%",
            height: 1.5,
            background: "rgba(255,255,255,0.36)",
          }}
        />
      </div>

      {/* ── Penalty spot dot (y=86% matches ShotBall SPOT_Y=0.86) ────────── */}
      <div
        className="absolute pointer-events-none"
        style={{ zIndex: 14, bottom: "14%", left: "50%", transform: "translateX(-50%)" }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.75)",
            boxShadow: "0 0 8px rgba(255,255,255,0.55)",
          }}
        />
      </div>

      {/* ── Shooter silhouette (whistle + runup only) ─────────────────────── */}
      {showShooter && (
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 14,
            bottom: "14.5%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <ShooterIcon isRunup={phase === "runup"} />
        </div>
      )}

      {/* ── Left post (full height) ───────────────────────────────────────── */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ zIndex: 25, left: 0, width: POST_W }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #efefef 0%, #d0d0d0 22%, #929292 60%, #606060 100%)",
            boxShadow:
              "inset -4px 0 10px rgba(0,0,0,0.45), 4px 0 18px rgba(0,0,0,0.65)",
          }}
        />
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: "34%", background: "linear-gradient(90deg, rgba(255,255,255,0.55) 0%, transparent 100%)" }}
        />
        <div className="absolute inset-y-0 right-0" style={{ width: 2, background: "rgba(250,204,21,0.35)" }} />
      </div>

      {/* ── Right post (full height) ──────────────────────────────────────── */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ zIndex: 25, right: 0, width: POST_W }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(270deg, #efefef 0%, #d0d0d0 22%, #929292 60%, #606060 100%)",
            boxShadow:
              "inset 4px 0 10px rgba(0,0,0,0.45), -4px 0 18px rgba(0,0,0,0.65)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0"
          style={{ width: "34%", background: "linear-gradient(270deg, rgba(255,255,255,0.55) 0%, transparent 100%)" }}
        />
        <div className="absolute inset-y-0 left-0" style={{ width: 2, background: "rgba(250,204,21,0.35)" }} />
      </div>

      {/* ── Crossbar (full width, z-26 to cap the post tops at corners) ───── */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ zIndex: 26, height: BAR_H }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #efefef 0%, #d0d0d0 22%, #929292 60%, #606060 100%)",
            boxShadow:
              "inset 0 -4px 10px rgba(0,0,0,0.45), 0 4px 18px rgba(0,0,0,0.65)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0"
          style={{ height: "34%", background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)" }}
        />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 2, background: "rgba(250,204,21,0.35)" }} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shooter silhouette
// ─────────────────────────────────────────────────────────────────────────────

function ShooterIcon({ isRunup }: { isRunup: boolean }) {
  return (
    <div
      style={{
        opacity: 0.55,
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.9))",
      }}
    >
      <svg
        viewBox="0 0 20 42"
        width={18}
        height={38}
        fill="rgba(230,230,230,0.9)"
        className={isRunup ? "animate-bounce" : ""}
        style={{ animationDuration: isRunup ? "0.5s" : undefined }}
        aria-hidden="true"
      >
        {/* Head */}
        <circle cx="10" cy="5" r="4" />
        {/* Torso */}
        <path d="M7 9 C6.5 14 6 17 6 22 L8 22 L10 15 L12 22 L14 22 C14 17 13.5 14 13 9 Z" />
        {/* Left arm */}
        <path d="M7 12 L3 19 L4.5 19.5 L8 13 Z" />
        {/* Right arm */}
        <path d="M13 12 L17 19 L15.5 19.5 L12 13 Z" />
        {/* Left leg */}
        <path d="M8 22 L6 40 L8 40 L10 26 Z" />
        {/* Right leg */}
        <path d="M12 22 L14 40 L12 40 L10 26 Z" />
      </svg>
    </div>
  );
}
