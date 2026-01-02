export type TeamStats = {
  season: string;
  wins: number;
  losses: number;
  pointsPerGame: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  turnoversPerGame: number;
  offensiveRating: number | null;
  defensiveRating: number | null;
  pace: number | null;
};

export type Team = {
  id: number;
  abbreviation: string;
  name: string;
  city: string;
  teamStats: TeamStats[];
};