/**
 * Official 2026 FIFA World Cup Knockout Stage Template
 * 
 * This file contains the fixed bracket structure for the knockout rounds.
 * Match slots are predetermined and follow FIFA's official tournament regulations.
 * 
 * IMPORTANT: This is factual tournament structure data (match numbers, dates, venues).
 * No FIFA branding, logos, or official UI elements are included.
 */

export type BracketSlot = 
  | `${1 | 2}${"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L"}`
  | "3_vs_1A"
  | "3_vs_1B"
  | "3_vs_1D"
  | "3_vs_1E"
  | "3_vs_1G"
  | "3_vs_1I"
  | "3_vs_1K"
  | "3_vs_1L";

export type GroupLabel = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export type KnockoutMatchTemplate = {
  matchNumber: number;
  round: "r32" | "r16" | "qf" | "sf" | "final";
  slotA: BracketSlot | string; // string for "Winner Match X"
  slotB: BracketSlot | string;
  allowedThirdGroups?: GroupLabel[]; // Only for third-place slots
  date: string;
  displayDate: string;
  stadium: string;
  city: string;
};

/**
 * Official Round of 32 bracket structure
 * Based on 2026 FIFA World Cup regulations
 */
export const ROUND_OF_32_TEMPLATE: KnockoutMatchTemplate[] = [
  {
    matchNumber: 73,
    round: "r32",
    slotA: "2A",
    slotB: "2B",
    date: "2026-06-28",
    displayDate: "Sunday, June 28",
    stadium: "SoFi Stadium",
    city: "Los Angeles",
  },
  {
    matchNumber: 74,
    round: "r32",
    slotA: "1E",
    slotB: "3_vs_1E",
    allowedThirdGroups: ["A", "B", "C", "D", "F"],
    date: "2026-06-29",
    displayDate: "Monday, June 29",
    stadium: "Gillette Stadium",
    city: "Boston",
  },
  {
    matchNumber: 75,
    round: "r32",
    slotA: "1F",
    slotB: "2C",
    date: "2026-06-29",
    displayDate: "Monday, June 29",
    stadium: "Estadio BBVA",
    city: "Monterrey",
  },
  {
    matchNumber: 76,
    round: "r32",
    slotA: "1C",
    slotB: "2F",
    date: "2026-06-29",
    displayDate: "Monday, June 29",
    stadium: "NRG Stadium",
    city: "Houston",
  },
  {
    matchNumber: 77,
    round: "r32",
    slotA: "1I",
    slotB: "3_vs_1I",
    allowedThirdGroups: ["C", "D", "F", "G", "H"],
    date: "2026-06-30",
    displayDate: "Tuesday, June 30",
    stadium: "MetLife Stadium",
    city: "New York/New Jersey",
  },
  {
    matchNumber: 78,
    round: "r32",
    slotA: "2E",
    slotB: "2I",
    date: "2026-06-30",
    displayDate: "Tuesday, June 30",
    stadium: "AT&T Stadium",
    city: "Dallas",
  },
  {
    matchNumber: 79,
    round: "r32",
    slotA: "1A",
    slotB: "3_vs_1A",
    allowedThirdGroups: ["C", "E", "F", "H", "I"],
    date: "2026-06-30",
    displayDate: "Tuesday, June 30",
    stadium: "Estadio Azteca",
    city: "Mexico City",
  },
  {
    matchNumber: 80,
    round: "r32",
    slotA: "1L",
    slotB: "3_vs_1L",
    allowedThirdGroups: ["E", "H", "I", "J", "K"],
    date: "2026-07-01",
    displayDate: "Wednesday, July 1",
    stadium: "Mercedes-Benz Stadium",
    city: "Atlanta",
  },
  {
    matchNumber: 81,
    round: "r32",
    slotA: "1D",
    slotB: "3_vs_1D",
    allowedThirdGroups: ["B", "E", "F", "I", "J"],
    date: "2026-07-01",
    displayDate: "Wednesday, July 1",
    stadium: "Levi's Stadium",
    city: "San Francisco Bay Area",
  },
  {
    matchNumber: 82,
    round: "r32",
    slotA: "1G",
    slotB: "3_vs_1G",
    allowedThirdGroups: ["A", "E", "H", "I", "J"],
    date: "2026-07-01",
    displayDate: "Wednesday, July 1",
    stadium: "Lumen Field",
    city: "Seattle",
  },
  {
    matchNumber: 83,
    round: "r32",
    slotA: "2K",
    slotB: "2L",
    date: "2026-07-02",
    displayDate: "Thursday, July 2",
    stadium: "BMO Field",
    city: "Toronto",
  },
  {
    matchNumber: 84,
    round: "r32",
    slotA: "1H",
    slotB: "2J",
    date: "2026-07-02",
    displayDate: "Thursday, July 2",
    stadium: "SoFi Stadium",
    city: "Los Angeles",
  },
  {
    matchNumber: 85,
    round: "r32",
    slotA: "1B",
    slotB: "3_vs_1B",
    allowedThirdGroups: ["E", "F", "G", "I", "J"],
    date: "2026-07-02",
    displayDate: "Thursday, July 2",
    stadium: "BC Place",
    city: "Vancouver",
  },
  {
    matchNumber: 86,
    round: "r32",
    slotA: "1J",
    slotB: "2H",
    date: "2026-07-03",
    displayDate: "Friday, July 3",
    stadium: "Hard Rock Stadium",
    city: "Miami",
  },
  {
    matchNumber: 87,
    round: "r32",
    slotA: "1K",
    slotB: "3_vs_1K",
    allowedThirdGroups: ["D", "E", "I", "J", "L"],
    date: "2026-07-03",
    displayDate: "Friday, July 3",
    stadium: "Arrowhead Stadium",
    city: "Kansas City",
  },
  {
    matchNumber: 88,
    round: "r32",
    slotA: "2D",
    slotB: "2G",
    date: "2026-07-03",
    displayDate: "Friday, July 3",
    stadium: "AT&T Stadium",
    city: "Dallas",
  },
];

/**
 * Official Round of 16 bracket structure
 */
export const ROUND_OF_16_TEMPLATE: KnockoutMatchTemplate[] = [
  {
    matchNumber: 89,
    round: "r16",
    slotA: "Winner Match 74",
    slotB: "Winner Match 77",
    date: "2026-07-05",
    displayDate: "Sunday, July 5",
    stadium: "Gillette Stadium",
    city: "Boston",
  },
  {
    matchNumber: 90,
    round: "r16",
    slotA: "Winner Match 73",
    slotB: "Winner Match 75",
    date: "2026-07-05",
    displayDate: "Sunday, July 5",
    stadium: "Estadio BBVA",
    city: "Monterrey",
  },
  {
    matchNumber: 91,
    round: "r16",
    slotA: "Winner Match 76",
    slotB: "Winner Match 78",
    date: "2026-07-06",
    displayDate: "Monday, July 6",
    stadium: "NRG Stadium",
    city: "Houston",
  },
  {
    matchNumber: 92,
    round: "r16",
    slotA: "Winner Match 79",
    slotB: "Winner Match 80",
    date: "2026-07-06",
    displayDate: "Monday, July 6",
    stadium: "Estadio Azteca",
    city: "Mexico City",
  },
  {
    matchNumber: 93,
    round: "r16",
    slotA: "Winner Match 83",
    slotB: "Winner Match 84",
    date: "2026-07-07",
    displayDate: "Tuesday, July 7",
    stadium: "BMO Field",
    city: "Toronto",
  },
  {
    matchNumber: 94,
    round: "r16",
    slotA: "Winner Match 81",
    slotB: "Winner Match 82",
    date: "2026-07-07",
    displayDate: "Tuesday, July 7",
    stadium: "Levi's Stadium",
    city: "San Francisco Bay Area",
  },
  {
    matchNumber: 95,
    round: "r16",
    slotA: "Winner Match 86",
    slotB: "Winner Match 88",
    date: "2026-07-08",
    displayDate: "Wednesday, July 8",
    stadium: "Hard Rock Stadium",
    city: "Miami",
  },
  {
    matchNumber: 96,
    round: "r16",
    slotA: "Winner Match 85",
    slotB: "Winner Match 87",
    date: "2026-07-08",
    displayDate: "Wednesday, July 8",
    stadium: "BC Place",
    city: "Vancouver",
  },
];

/**
 * Official Quarterfinals bracket structure
 */
export const QUARTERFINALS_TEMPLATE: KnockoutMatchTemplate[] = [
  {
    matchNumber: 97,
    round: "qf",
    slotA: "Winner Match 89",
    slotB: "Winner Match 90",
    date: "2026-07-10",
    displayDate: "Friday, July 10",
    stadium: "SoFi Stadium",
    city: "Los Angeles",
  },
  {
    matchNumber: 98,
    round: "qf",
    slotA: "Winner Match 93",
    slotB: "Winner Match 94",
    date: "2026-07-10",
    displayDate: "Friday, July 10",
    stadium: "Arrowhead Stadium",
    city: "Kansas City",
  },
  {
    matchNumber: 99,
    round: "qf",
    slotA: "Winner Match 91",
    slotB: "Winner Match 92",
    date: "2026-07-11",
    displayDate: "Saturday, July 11",
    stadium: "MetLife Stadium",
    city: "New York/New Jersey",
  },
  {
    matchNumber: 100,
    round: "qf",
    slotA: "Winner Match 95",
    slotB: "Winner Match 96",
    date: "2026-07-11",
    displayDate: "Saturday, July 11",
    stadium: "AT&T Stadium",
    city: "Dallas",
  },
];

/**
 * Official Semifinals bracket structure
 */
export const SEMIFINALS_TEMPLATE: KnockoutMatchTemplate[] = [
  {
    matchNumber: 101,
    round: "sf",
    slotA: "Winner Match 97",
    slotB: "Winner Match 98",
    date: "2026-07-14",
    displayDate: "Tuesday, July 14",
    stadium: "AT&T Stadium",
    city: "Dallas",
  },
  {
    matchNumber: 102,
    round: "sf",
    slotA: "Winner Match 99",
    slotB: "Winner Match 100",
    date: "2026-07-15",
    displayDate: "Wednesday, July 15",
    stadium: "Mercedes-Benz Stadium",
    city: "Atlanta",
  },
];

/**
 * Official Final bracket structure
 */
export const FINAL_TEMPLATE: KnockoutMatchTemplate[] = [
  {
    matchNumber: 104,
    round: "final",
    slotA: "Winner Match 101",
    slotB: "Winner Match 102",
    date: "2026-07-19",
    displayDate: "Sunday, July 19",
    stadium: "MetLife Stadium",
    city: "New York/New Jersey",
  },
];

/**
 * Complete knockout template combining all rounds
 */
export const KNOCKOUT_TEMPLATE = [
  ...ROUND_OF_32_TEMPLATE,
  ...ROUND_OF_16_TEMPLATE,
  ...QUARTERFINALS_TEMPLATE,
  ...SEMIFINALS_TEMPLATE,
  ...FINAL_TEMPLATE,
];
