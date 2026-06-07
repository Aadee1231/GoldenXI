export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  created_at: string;
  updated_at: string;
};

export type Tournament = {
  id: string;
  name: string;
  season: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

export type Team = {
  id: string;
  tournament_id: string;
  name: string;
  code: string;
  flag_emoji: string | null;
  group_label: string | null;
  created_at: string;
};

export type MatchRound = "group" | "r16" | "qf" | "sf" | "final";

export type Match = {
  id: string;
  tournament_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  winner_id: string | null;
  round: MatchRound;
  match_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Bracket = {
  id: string;
  user_id: string;
  tournament_id: string;
  name: string;
  points_earned: number;
  is_locked: boolean;
  status: "draft" | "submitted" | "scored";
  created_at: string;
  updated_at: string;
};

export type BracketPick = {
  id: string;
  bracket_id: string;
  match_id: string;
  picked_team_id: string | null;
  is_correct: boolean | null;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  tournament_id: string;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  bracket_id: string | null;
  joined_at: string;
};

export type GroupMemberWithProfile = GroupMember & {
  profile: Profile;
  bracket: Bracket | null;
};

export type GroupWithDetails = Group & {
  tournament: Tournament;
  members: GroupMemberWithProfile[];
  creator: Profile;
};
