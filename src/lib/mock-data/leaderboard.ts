export type LeaderboardEntry = {
  rank: number;
  bracket_id: string;
  bracket_name: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  points_earned: number;
  champion_name: string | null;
  champion_flag: string | null;
  created_at: string;
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    bracket_id: "mock-1",
    bracket_name: "The Perfect XI",
    user_id: "u1",
    username: "soccerking99",
    avatar_url: null,
    points_earned: 142,
    champion_name: "Brazil",
    champion_flag: "🇧🇷",
    created_at: "2026-06-01T10:00:00Z",
  },
  {
    rank: 2,
    bracket_id: "mock-2",
    bracket_name: "Golden Bracket",
    user_id: "u2",
    username: "tactician_fc",
    avatar_url: null,
    points_earned: 138,
    champion_name: "France",
    champion_flag: "🇫🇷",
    created_at: "2026-06-01T11:30:00Z",
  },
  {
    rank: 3,
    bracket_id: "mock-3",
    bracket_name: "Vamos España",
    user_id: "u3",
    username: "LaLiga_fan",
    avatar_url: null,
    points_earned: 131,
    champion_name: "Spain",
    champion_flag: "🇪🇸",
    created_at: "2026-06-02T08:15:00Z",
  },
  {
    rank: 4,
    bracket_id: "mock-4",
    bracket_name: "Three Lions Rise",
    user_id: "u4",
    username: "WembleyWatcher",
    avatar_url: null,
    points_earned: 124,
    champion_name: "England",
    champion_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    created_at: "2026-06-02T09:00:00Z",
  },
  {
    rank: 5,
    bracket_id: "mock-5",
    bracket_name: "La Albiceleste",
    user_id: "u5",
    username: "pampagoal",
    avatar_url: null,
    points_earned: 119,
    champion_name: "Argentina",
    champion_flag: "🇦🇷",
    created_at: "2026-06-03T14:20:00Z",
  },
  {
    rank: 6,
    bracket_id: "mock-6",
    bracket_name: "Atlas Lions Rule",
    user_id: "u6",
    username: "NorthAfricaFC",
    avatar_url: null,
    points_earned: 112,
    champion_name: "Morocco",
    champion_flag: "🇲🇦",
    created_at: "2026-06-03T16:45:00Z",
  },
  {
    rank: 7,
    bracket_id: "mock-7",
    bracket_name: "Samba Dreams",
    user_id: "u7",
    username: "RioTactics",
    avatar_url: null,
    points_earned: 108,
    champion_name: "Brazil",
    champion_flag: "🇧🇷",
    created_at: "2026-06-04T07:10:00Z",
  },
  {
    rank: 8,
    bracket_id: "mock-8",
    bracket_name: "Der Klassiker",
    user_id: "u8",
    username: "BundesligaBoss",
    avatar_url: null,
    points_earned: 101,
    champion_name: "Germany",
    champion_flag: "🇩🇪",
    created_at: "2026-06-04T12:00:00Z",
  },
];
