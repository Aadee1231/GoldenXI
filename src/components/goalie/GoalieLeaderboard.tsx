"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy, RefreshCw, Keyboard, Camera } from "lucide-react";
import {
  fetchTopGoalieScores,
  type GoalieGameMode,
  type GoalieLeaderboardRow,
} from "@/src/lib/goalie/goalieScores";

type Props = {
  /** Filter to a specific mode. Omit to show the combined all-time board. */
  mode?: GoalieGameMode;
  /** Increment this to force a re-fetch (e.g. after score submission). */
  refreshKey?: number;
};

const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

const ModeIcon = ({ mode }: { mode: string }) =>
  mode === "camera"
    ? <Camera className="h-3 w-3 text-purple-400" />
    : <Keyboard className="h-3 w-3 text-blue-400" />;

export default function GoalieLeaderboard({ mode, refreshKey = 0 }: Props) {
  const [rows, setRows]       = useState<GoalieLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchTopGoalieScores(mode, 10);
      setRows(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  // Fetch on mount and whenever refreshKey increments (after score submission).
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div
      className="rounded-2xl border border-white/10 p-4"
      style={{
        background: "linear-gradient(145deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.02) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-400" />
        <h3
          className="text-sm font-extrabold uppercase tracking-wider"
          style={{
            background: "linear-gradient(90deg, #facc15, #fbbf24)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Top Keepers
        </h3>
        {mode && (
          <span className="text-xs font-normal capitalize text-zinc-500">
            · {mode}
          </span>
        )}

        {/* Refresh button */}
        <button
          type="button"
          onClick={load}
          aria-label="Refresh leaderboard"
          className="ml-auto rounded-full p-1 text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Body */}
      {loading && rows.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-xl bg-white/5"
              style={{ opacity: 1 - i * 0.16 }}
            />
          ))}
        </div>
      ) : error ? (
        <p className="py-2 text-center text-xs text-zinc-500">
          Could not load scores.{" "}
          <button type="button" onClick={load} className="underline hover:text-zinc-300">
            Retry
          </button>
        </p>
      ) : rows.length === 0 ? (
        <p className="py-2 text-center text-sm text-zinc-500">
          No scores yet — be the first!
        </p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row, i) => {
            const isGold   = i === 0;
            const isSilver = i === 1;
            const isBronze = i === 2;
            const accentBg = isGold
              ? "linear-gradient(90deg,rgba(250,204,21,0.14),rgba(250,204,21,0.04))"
              : isSilver
                ? "linear-gradient(90deg,rgba(192,192,192,0.10),rgba(192,192,192,0.03))"
                : isBronze
                  ? "linear-gradient(90deg,rgba(180,100,50,0.09),rgba(180,100,50,0.02))"
                  : "rgba(255,255,255,0.025)";
            const nameColor = isGold
              ? "text-yellow-300"
              : isSilver
                ? "text-zinc-300"
                : "text-white/85";
            const scoreColor = isGold
              ? "text-yellow-400"
              : isSilver
                ? "text-zinc-300"
                : "text-zinc-400";

            return (
              <li
                key={row.id}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition"
                style={{
                  background: accentBg,
                  boxShadow: isGold ? "0 0 0 1px rgba(250,204,21,0.12)" : undefined,
                }}
              >
                {/* Rank / medal */}
                <span className="w-6 shrink-0 text-center text-base leading-none">
                  {MEDAL[i] ?? (
                    <span className="text-[11px] font-bold tabular-nums text-zinc-600">
                      {i + 1}
                    </span>
                  )}
                </span>

                {/* Name */}
                <span className={`min-w-0 flex-1 truncate font-semibold ${nameColor}`}>
                  {row.display_name}
                </span>

                {/* Mode icon — only shown when not filtered by mode */}
                {!mode && (
                  <span title={row.mode}>
                    <ModeIcon mode={row.mode} />
                  </span>
                )}

                {/* Accuracy badge */}
                {row.accuracy !== null && (
                  <span className="hidden text-[10px] font-semibold tabular-nums text-zinc-600 sm:block">
                    {row.accuracy.toFixed(0)}%
                  </span>
                )}

                {/* Score */}
                <span className={`w-16 text-right text-sm font-extrabold tabular-nums ${scoreColor}`}>
                  {row.score.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
