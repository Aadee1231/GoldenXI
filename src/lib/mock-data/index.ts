import type { Team } from "@/src/types";

const MOCK_TOURNAMENT_ID = "00000000-0000-0000-0000-000000000001";

export const MOCK_TEAMS: Team[] = [
  { id: "bra", tournament_id: MOCK_TOURNAMENT_ID, name: "Brazil",      code: "BRA", flag_emoji: "🇧🇷", group_label: "A", created_at: "" },
  { id: "arg", tournament_id: MOCK_TOURNAMENT_ID, name: "Argentina",   code: "ARG", flag_emoji: "🇦🇷", group_label: "A", created_at: "" },
  { id: "fra", tournament_id: MOCK_TOURNAMENT_ID, name: "France",      code: "FRA", flag_emoji: "🇫🇷", group_label: "B", created_at: "" },
  { id: "eng", tournament_id: MOCK_TOURNAMENT_ID, name: "England",     code: "ENG", flag_emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group_label: "B", created_at: "" },
  { id: "ger", tournament_id: MOCK_TOURNAMENT_ID, name: "Germany",     code: "GER", flag_emoji: "🇩🇪", group_label: "C", created_at: "" },
  { id: "spa", tournament_id: MOCK_TOURNAMENT_ID, name: "Spain",       code: "ESP", flag_emoji: "🇪🇸", group_label: "C", created_at: "" },
  { id: "por", tournament_id: MOCK_TOURNAMENT_ID, name: "Portugal",    code: "POR", flag_emoji: "🇵🇹", group_label: "D", created_at: "" },
  { id: "ned", tournament_id: MOCK_TOURNAMENT_ID, name: "Netherlands", code: "NED", flag_emoji: "🇳🇱", group_label: "D", created_at: "" },
];
