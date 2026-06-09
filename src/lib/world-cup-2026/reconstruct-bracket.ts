/**
 * Reconstruct a full knockout bracket (R32 -> Final) from a user's saved picks.
 *
 * This is a pure function (no network / no React) extracted so it can run both
 * on the client wizard and on the server (e.g. the public bracket page) to
 * render an identical, read-only bracket visualization.
 */

import type { GroupRankingInput, Match } from "@/src/types";
import { buildOfficialRoundOf32 } from "./build-knockout-bracket";
import type { QualifiedTeam, TeamsDataByGroup } from "./bracket-resolver";

export type ReconstructedTeam = {
  id: string;
  name: string;
  code: string;
  flag_emoji: string | null;
  flag_code: string | null;
};

export type ReconstructedMatch = {
  id: string;
  round: KnockoutRound;
  homeTeam: ReconstructedTeam | null;
  awayTeam: ReconstructedTeam | null;
  winnerId: string | null;
};

export type KnockoutRound = "r32" | "r16" | "qf" | "sf" | "final";

export type ReconstructedRound = {
  round: KnockoutRound;
  label: string;
  matches: ReconstructedMatch[];
};

const ROUND_LABELS: Record<KnockoutRound, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-finals",
  sf: "Semi-finals",
  final: "Final",
};

function toReconstructedTeam(t: QualifiedTeam | null): ReconstructedTeam | null {
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    code: t.code,
    flag_emoji: t.flag_emoji ?? null,
    flag_code: t.flag_code ?? null,
  };
}

/**
 * @returns ordered rounds with resolved teams and winners, or null when the
 * bracket cannot be reconstructed (e.g. incomplete group/third-place picks).
 */
export function reconstructKnockoutBracket(
  groupRankings: GroupRankingInput[],
  thirdPlacePicks: string[],
  knockoutPicks: Record<string, string | null>,
  teamsData: TeamsDataByGroup,
  knockoutMatches: Match[]
): ReconstructedRound[] | null {
  if (thirdPlacePicks.length !== 8) return null;

  let r32;
  try {
    r32 = buildOfficialRoundOf32(groupRankings, teamsData, thirdPlacePicks);
  } catch {
    return null;
  }

  const qualified = r32.qualifiedTeams;
  const byRound = (r: string) => knockoutMatches.filter((m) => m.round === r);

  const r32Db = byRound("r32");
  const r32Matches: ReconstructedMatch[] = r32.matches.map((tm, index) => {
    const dbMatch = r32Db[index];
    const id = dbMatch?.id || `r32-${index}`;
    return {
      id,
      round: "r32",
      homeTeam: toReconstructedTeam(tm.homeTeam),
      awayTeam: toReconstructedTeam(tm.awayTeam),
      winnerId: dbMatch ? knockoutPicks[dbMatch.id] || null : null,
    };
  });

  const buildNext = (
    prev: ReconstructedMatch[],
    nextDb: Match[],
    round: KnockoutRound
  ): ReconstructedMatch[] => {
    const out: ReconstructedMatch[] = [];
    for (let i = 0; i < nextDb.length; i++) {
      const m1 = prev[i * 2];
      const m2 = prev[i * 2 + 1];
      const homeTeam =
        m1 && m1.winnerId
          ? toReconstructedTeam(qualified.find((t) => t.id === m1.winnerId) || null)
          : null;
      const awayTeam =
        m2 && m2.winnerId
          ? toReconstructedTeam(qualified.find((t) => t.id === m2.winnerId) || null)
          : null;
      const dbMatch = nextDb[i];
      if (dbMatch) {
        out.push({
          id: dbMatch.id,
          round,
          homeTeam,
          awayTeam,
          winnerId: knockoutPicks[dbMatch.id] || null,
        });
      }
    }
    return out;
  };

  const r16 = buildNext(r32Matches, byRound("r16"), "r16");
  const qf = buildNext(r16, byRound("qf"), "qf");
  const sf = buildNext(qf, byRound("sf"), "sf");
  const final = buildNext(sf, byRound("final"), "final");

  const rounds: ReconstructedRound[] = [
    { round: "r32", label: ROUND_LABELS.r32, matches: r32Matches },
    { round: "r16", label: ROUND_LABELS.r16, matches: r16 },
    { round: "qf", label: ROUND_LABELS.qf, matches: qf },
    { round: "sf", label: ROUND_LABELS.sf, matches: sf },
    { round: "final", label: ROUND_LABELS.final, matches: final },
  ];

  return rounds;
}
