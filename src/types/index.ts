export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  public_bracket: boolean;
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
  flag_code: string | null;
  group_label: string | null;
  created_at: string;
};

export type MatchRound = "group" | "r32" | "r16" | "qf" | "sf" | "final";

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
  submitted_at: string | null;
  locked_at: string | null;
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
  invite_policy: "admin_only" | "members";
  leaderboard_visibility: "always" | "after_lock" | "after_first_result";
  bracket_visibility: "status_only" | "after_lock" | "always";
  lock_at: string | null;
  allow_late_join: boolean;
  description: string | null;
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

export type LeaderboardEntry = {
  rank: number;
  bracket_id: string;
  bracket_name: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_score: number;
  correct_picks: number;
  champion_name: string | null;
  champion_flag: string | null;
  champion_code: string | null;
  submitted_at: string | null;
  is_eligible?: boolean;
  eligibility_status?: "eligible" | "not_submitted" | "submitted_late" | "edited_after_lock";
};

export type GroupSettings = {
  invite_policy: "admin_only" | "members";
  leaderboard_visibility: "always" | "after_lock" | "after_first_result";
  bracket_visibility: "status_only" | "after_lock" | "always";
  lock_at: string | null;
  allow_late_join: boolean;
  description: string | null;
};

export type InvitePreview = {
  group_id: string;
  group_name: string;
  tournament_id: string;
  tournament_name: string;
  member_count: number;
  invite_policy: "admin_only" | "members";
  allow_late_join: boolean;
  lock_at: string | null;
  is_locked: boolean;
};

export type PublicBracketData = {
  bracket_id: string;
  bracket_name: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  points_earned: number;
  is_locked: boolean;
  status: "draft" | "submitted" | "scored";
  submitted_at: string | null;
  champion_name: string | null;
  champion_code: string | null;
  champion_flag: string | null;
  total_picks: number;
  public_bracket: boolean;
};

export type GroupPick = {
  id: string;
  bracket_id: string;
  group_label: string;
  team_id: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type GroupRankingInput = {
  group_label: string;
  team_id: string;
  position: number;
};

export type ThirdPlacePick = {
  id: string;
  bracket_id: string;
  team_id: string;
  created_at: string;
};

export type ThirdPlacePickInput = {
  team_id: string;
};

export type BracketWizardState = {
  groupRankings: GroupRankingInput[];
  thirdPlacePicks: string[];
  knockoutPicks: Record<string, string | null>;
  currentStep: "groups" | "third-place" | "knockout" | "review";
};

export type CompleteBracketData = {
  bracket: Bracket;
  groupPicks: GroupPick[];
  thirdPlacePicks: ThirdPlacePick[];
  knockoutPicks: BracketPick[];
};
