export type KnockoutRound = "R32" | "R16" | "QF" | "SF" | "FINAL";

export type KnockoutFixture = {
  id: string;
  round: KnockoutRound;
  team1: string;
  team2: string;
  winnerTeamCode: string | null;
};

export const qualifiedThirdPlaceTeamCodes = [
  "BIH",
  "PAR",
  "ECU",
  "SWE",
  "SEN",
  "ALG",
  "COD",
  "GHA",
] as const;

export const knockoutFixtures: KnockoutFixture[] = [
  { id: "R32-01", round: "R32", team1: "RSA", team2: "CAN", winnerTeamCode: null },
  { id: "R32-02", round: "R32", team1: "BRA", team2: "JPN", winnerTeamCode: null },
  { id: "R32-03", round: "R32", team1: "GER", team2: "PAR", winnerTeamCode: null },
  { id: "R32-04", round: "R32", team1: "NED", team2: "MAR", winnerTeamCode: null },
  { id: "R32-05", round: "R32", team1: "CIV", team2: "NOR", winnerTeamCode: null },
  { id: "R32-06", round: "R32", team1: "FRA", team2: "SWE", winnerTeamCode: null },
  { id: "R32-07", round: "R32", team1: "MEX", team2: "ECU", winnerTeamCode: null },
  { id: "R32-08", round: "R32", team1: "ENG", team2: "COD", winnerTeamCode: null },
  { id: "R32-09", round: "R32", team1: "BEL", team2: "SEN", winnerTeamCode: null },
  { id: "R32-10", round: "R32", team1: "USA", team2: "BIH", winnerTeamCode: null },
  { id: "R32-11", round: "R32", team1: "ESP", team2: "AUT", winnerTeamCode: null },
  { id: "R32-12", round: "R32", team1: "POR", team2: "CRO", winnerTeamCode: null },
  { id: "R32-13", round: "R32", team1: "SUI", team2: "ALG", winnerTeamCode: null },
  { id: "R32-14", round: "R32", team1: "AUS", team2: "EGY", winnerTeamCode: null },
  { id: "R32-15", round: "R32", team1: "ARG", team2: "CPV", winnerTeamCode: null },
  { id: "R32-16", round: "R32", team1: "COL", team2: "GHA", winnerTeamCode: null },
];
