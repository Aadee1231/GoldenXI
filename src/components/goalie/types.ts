export type Direction = "left" | "center" | "right";

export type GamePhase = "idle" | "ready" | "shooting" | "result" | "over";

export type RoundResult = {
  saved: boolean;
  target: Direction;
  pick: Direction | null;
  reactionMs: number | null;
  points: number;
};

export const TOTAL_ROUNDS = 10;
export const REACTION_WINDOW_MS = 1300;
export const BEST_SCORE_KEY = "goldenxi_goalie_best_v1";

export const DIRECTIONS: Direction[] = ["left", "center", "right"];

export const DIRECTION_LABELS: Record<Direction, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};
