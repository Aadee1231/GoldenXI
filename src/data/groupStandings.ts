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
      { teamCode: "SUI", position: 3 },
      { teamCode: "QAT", position: 4 },
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
