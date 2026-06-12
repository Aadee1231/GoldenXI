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
 * Scoring applied per team:
 *   - Predicted 1st AND currently 1st  → 3 pts  (exact)
 *   - Predicted 2nd AND currently 2nd  → 3 pts  (exact)
 *   - Predicted 1st AND currently 2nd  → 1 pt   (both top-2, wrong position)
 *   - Predicted 2nd AND currently 1st  → 1 pt   (both top-2, wrong position)
 *   - Predicted 3rd AND currently 3rd  → 2 pts  (exact)
 *   - Predicted 4th AND currently 4th  → 2 pts  (exact)
 *   - Otherwise                        → 0 pts
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
      { teamCode: "BIH", position: 2 },
      { teamCode: "QAT", position: 3 },
      { teamCode: "SUI", position: 4 },
    ],
  },
  C: {
    isFinal: false,
    standings: [
      { teamCode: "BRA", position: 1 },
      { teamCode: "MAR", position: 2 },
      { teamCode: "HAI", position: 3 },
      { teamCode: "SCO", position: 4 },
    ],
  },
  D: {
    isFinal: false,
    standings: [
      { teamCode: "USA", position: 1 },
      { teamCode: "PAR", position: 2 },
      { teamCode: "AUS", position: 3 },
      { teamCode: "TUR", position: 4 },
    ],
  },
  E: {
    isFinal: false,
    standings: [
      { teamCode: "GER", position: 1 },
      { teamCode: "CUW", position: 2 },
      { teamCode: "CIV", position: 3 },
      { teamCode: "ECU", position: 4 },
    ],
  },
  F: {
    isFinal: false,
    standings: [
      { teamCode: "NED", position: 1 },
      { teamCode: "JPN", position: 2 },
      { teamCode: "SWE", position: 3 },
      { teamCode: "TUN", position: 4 },
    ],
  },
  G: {
    isFinal: false,
    standings: [
      { teamCode: "BEL", position: 1 },
      { teamCode: "EGY", position: 2 },
      { teamCode: "IRN", position: 3 },
      { teamCode: "NZL", position: 4 },
    ],
  },
  H: {
    isFinal: false,
    standings: [
      { teamCode: "ESP", position: 1 },
      { teamCode: "CPV", position: 2 },
      { teamCode: "KSA", position: 3 },
      { teamCode: "URU", position: 4 },
    ],
  },
  I: {
    isFinal: false,
    standings: [
      { teamCode: "FRA", position: 1 },
      { teamCode: "SEN", position: 2 },
      { teamCode: "IRQ", position: 3 },
      { teamCode: "NOR", position: 4 },
    ],
  },
  J: {
    isFinal: false,
    standings: [
      { teamCode: "ARG", position: 1 },
      { teamCode: "ALG", position: 2 },
      { teamCode: "AUT", position: 3 },
      { teamCode: "JOR", position: 4 },
    ],
  },
  K: {
    isFinal: false,
    standings: [
      { teamCode: "POR", position: 1 },
      { teamCode: "COD", position: 2 },
      { teamCode: "UZB", position: 3 },
      { teamCode: "COL", position: 4 },
    ],
  },
  L: {
    isFinal: false,
    standings: [
      { teamCode: "ENG", position: 1 },
      { teamCode: "CRO", position: 2 },
      { teamCode: "GHA", position: 3 },
      { teamCode: "PAN", position: 4 },
    ],
  },
};

/**
 * Returns true if any listed group is not yet finalized.
 * Used to show the "provisional" note on the leaderboard.
 */
export function hasProvisionalGroups(): boolean {
  return Object.values(groupStandings).some((g) => !g.isFinal);
}
