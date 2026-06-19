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
      { teamCode: "CAN", position: 1 },
      { teamCode: "SUI", position: 2 },
      { teamCode: "BIH", position: 3 },
      { teamCode: "QAT", position: 4 },
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
      { teamCode: "AUS", position: 2 },
      { teamCode: "TUR", position: 3 },
      { teamCode: "PAR", position: 4 },
    ],
  },

  E: {
    isFinal: false,
    standings: [
      { teamCode: "GER", position: 1 },
      { teamCode: "CIV", position: 2 },
      { teamCode: "ECU", position: 3 },
      { teamCode: "CUW", position: 4 },
    ],
  },

  F: {
    isFinal: false,
    standings: [
      { teamCode: "SWE", position: 1 },
      { teamCode: "JPN", position: 2 },
      { teamCode: "NED", position: 3 },
      { teamCode: "TUN", position: 4 },
    ],
  },

  G: {
    isFinal: false,
    standings: [
      { teamCode: "NZL", position: 1 },
      { teamCode: "IRN", position: 2 },
      { teamCode: "BEL", position: 3 },
      { teamCode: "EGY", position: 4 },
    ],
  },

  H: {
    isFinal: false,
    standings: [
      { teamCode: "URU", position: 1 },
      { teamCode: "KSA", position: 2 },
      { teamCode: "ESP", position: 3 },
      { teamCode: "CPV", position: 4 },
    ],
  },

  I: {
    isFinal: false,
    standings: [
      { teamCode: "NOR", position: 1 },
      { teamCode: "FRA", position: 2 },
      { teamCode: "SEN", position: 3 },
      { teamCode: "IRQ", position: 4 },
    ],
  }, 

  J: {
    isFinal: false,
    standings: [
      { teamCode: "ARG", position: 1 },
      { teamCode: "AUT", position: 2 },
      { teamCode: "JOR", position: 3 },
      { teamCode: "ALG", position: 4 },
    ],
  },

  K: {
    isFinal: false,
    standings: [
      { teamCode: "COL", position: 1 },
      { teamCode: "COD", position: 2 },
      { teamCode: "POR", position: 3 },
      { teamCode: "UZB", position: 4 },
    ],
  },

  L: {
    isFinal: false,
    standings: [
      { teamCode: "ENG", position: 1 },
      { teamCode: "GHA", position: 2 },
      { teamCode: "PAN", position: 3 },
      { teamCode: "CRO", position: 4 },
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
