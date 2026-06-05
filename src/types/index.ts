export type Team = {
  id: string;
  name: string;
  group: string;
  flag: string;
};

export type Match = {
  id: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number | null;
  awayScore: number | null;
  round: "group" | "r16" | "qf" | "sf" | "final";
  completed: boolean;
};

export type Bracket = {
  id: string;
  userId: string;
  name: string;
  matches: Match[];
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  points: number;
  rank: number;
};

export type Group = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  members: User[];
};
