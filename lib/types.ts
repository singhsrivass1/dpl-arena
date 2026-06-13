export type Category = "DOBA" | "Non-DOBA";
export type Role = "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";
export type FixtureStatus = "upcoming" | "live" | "completed" | "cancelled";
export type LiveStatus = "upcoming" | "live" | "innings_break" | "completed";

export interface Team {
  id: string;
  name: string;
  emoji: string | null;
  captain: string | null;
  vice_captain: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  category: Category;
  role: Role;
  team: string;
  matches: number;
  runs: number;
  wickets: number;
  highest_score: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
}

export interface Fixture {
  id: string;
  team_a: string;
  team_b: string;
  match_date: string | null;
  venue: string | null;
  round: string | null;
  status: FixtureStatus;
  created_at: string;
}

export interface Result {
  id: string;
  fixture_id: string | null;
  winner: string | null;
  summary: string | null;
  score_a: string | null;
  score_b: string | null;
  created_at: string;
}

export interface LiveMatch {
  id: string;
  fixture_id: string | null;
  batting_team: string | null;
  bowling_team: string | null;
  runs: number;
  wickets: number;
  overs: number;
  striker: string | null;
  non_striker: string | null;
  bowler: string | null;
  extras: number;
  last_over: string | null;
  status: LiveStatus;
  updated_at: string;
}

export interface LiveBatting {
  id: string;
  live_match_id: string;
  player_name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal: string;
  order_no: number;
}

export interface LiveBowling {
  id: string;
  live_match_id: string;
  player_name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  order_no: number;
}
