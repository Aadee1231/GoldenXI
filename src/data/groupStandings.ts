/**
 * LIVE GROUP STAGE STANDINGS
 * ==========================
 * Update this file after each round of group-stage matches, then commit + redeploy.
 *
 * How to update positions:
 *   1. Edit the `position` for each team to reflect current standings (1 = top, 4 = bottom).
 *   2. Each position value (1–4) must appear exactly once per group.
 *   3. Set `isFinal: true` once that group's final match day is complete.
 *   4. Groups omitted from this file award 0 provisional points.
 *
 * Scoring per group (non-cumulative — only highest tier awarded):
 *   - 3 pts: exact full 1–4 order correct
 *   - 2 pts: correct top-2 teams in any order
 *   - 1 pt:  correct top-3 teams in any order
 *   - 0 pts: none of the above
 * Max per group: 3 pts.  Max total: 12 groups × 3 = 36 pts.
 *
 * Team codes (FIFA 3-letter) by group:
 *   A: MEX RSA KOR CZE
 *   B: CAN BIH QAT SUI
 *   C: BRA MAR HAI SCO
 *   D: USA PAR AUS TUR
 *   E: GER CUW CIV ECU
 *   F: NED JPN SWE TUN
 *   G: BEL EGY IRN NZL
 *   H: ESP CPV KSA URU
 *   I: FRA SEN IRQ NOR
 *   J: ARG ALG AUT JOR
 *   K: POR COD UZB COL
 *   L: ENG CRO GHA PAN
 */

export type GroupStandingEntry = {
  teamCode: string;
  position: number;
};

export type GroupStanding = {
  isFinal: boolean;
  standings: GroupStandingEntry[];
};

export const groupStandings: Record<string, GroupStanding> = {
  A: {
    isFinal: false,
    standings: [
      { teamCode: "MEX", position: 1 },
      { teamCode: "KOR", position: 2 },
      { teamCode: "CZE", position: 3 },
      { teamCode: "RSA", position: 4 },
    ],
  },

  B: {
    isFinal: false,
    standings: [
      { teamCode: "SUI", position: 1 },
      { teamCode: "CAN", position: 2 },
      { teamCode: "QAT", position: 3 },
      { teamCode: "BIH", position: 4 },
    ],
  },

  C: {
    isFinal: false,
    standings: [
      { teamCode: "SCO", position: 1 },
      { teamCode: "MAR", position: 2 },
      { teamCode: "BRA", position: 3 },
      { teamCode: "HAI", position: 4 },
    ],
  },

  D: {
    isFinal: false,
    standings: [
      { teamCode: "USA", position: 1 },
      { teamCode: "TUR", position: 2 },
      { teamCode: "AUS", position: 3 },
      { teamCode: "PAR", position: 4 },
    ],
  },


  // Add groups here as their real results come in.
  // Groups not listed give 0 provisional points.
};

/**
 * Returns true if any listed group is not yet finalized.
 * Used to show the "provisional" note on the leaderboard.
 */
export function hasProvisionalGroups(): boolean {
  return Object.values(groupStandings).some((g) => !g.isFinal);
}
