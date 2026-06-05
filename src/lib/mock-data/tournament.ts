export type MockTeam = {
  id: string;
  name: string;
  code: string;
  flag: string;
  seed: number;
};

export type MockMatch = {
  id: string;
  homeTeam: MockTeam | null;
  awayTeam: MockTeam | null;
  winnerId: string | null;
  round: "r16" | "qf" | "sf" | "final";
  matchIndex: number;
};

export type BracketState = {
  r16: MockMatch[];
  qf: MockMatch[];
  sf: MockMatch[];
  final: MockMatch[];
  champion: MockTeam | null;
};

export const MOCK_TEAMS: MockTeam[] = [
  { id: "bra", name: "Brazil",       code: "BRA", flag: "🇧🇷", seed: 1  },
  { id: "arg", name: "Argentina",    code: "ARG", flag: "🇦🇷", seed: 2  },
  { id: "fra", name: "France",       code: "FRA", flag: "🇫🇷", seed: 3  },
  { id: "eng", name: "England",      code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", seed: 4  },
  { id: "ger", name: "Germany",      code: "GER", flag: "🇩🇪", seed: 5  },
  { id: "esp", name: "Spain",        code: "ESP", flag: "🇪🇸", seed: 6  },
  { id: "por", name: "Portugal",     code: "POR", flag: "🇵🇹", seed: 7  },
  { id: "ned", name: "Netherlands",  code: "NED", flag: "🇳🇱", seed: 8  },
  { id: "uru", name: "Uruguay",      code: "URU", flag: "🇺🇾", seed: 9  },
  { id: "col", name: "Colombia",     code: "COL", flag: "🇨🇴", seed: 10 },
  { id: "usa", name: "USA",          code: "USA", flag: "🇺🇸", seed: 11 },
  { id: "mex", name: "Mexico",       code: "MEX", flag: "🇲🇽", seed: 12 },
  { id: "mor", name: "Morocco",      code: "MAR", flag: "🇲🇦", seed: 13 },
  { id: "sen", name: "Senegal",      code: "SEN", flag: "🇸🇳", seed: 14 },
  { id: "jpn", name: "Japan",        code: "JPN", flag: "🇯🇵", seed: 15 },
  { id: "aus", name: "Australia",    code: "AUS", flag: "🇦🇺", seed: 16 },
];

function makeR16(): MockMatch[] {
  const pairs: [number, number][] = [
    [0, 15], [7, 8],
    [3, 12], [4, 11],
    [2, 13], [5, 10],
    [1, 14], [6, 9],
  ];
  return pairs.map(([a, b], i) => ({
    id: `r16-${i}`,
    homeTeam: MOCK_TEAMS[a],
    awayTeam: MOCK_TEAMS[b],
    winnerId: null,
    round: "r16" as const,
    matchIndex: i,
  }));
}

function makeEmptyRound(
  round: "qf" | "sf" | "final",
  count: number
): MockMatch[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${round}-${i}`,
    homeTeam: null,
    awayTeam: null,
    winnerId: null,
    round,
    matchIndex: i,
  }));
}

export function createInitialBracket(): BracketState {
  return {
    r16: makeR16(),
    qf: makeEmptyRound("qf", 4),
    sf: makeEmptyRound("sf", 2),
    final: makeEmptyRound("final", 1),
    champion: null,
  };
}
