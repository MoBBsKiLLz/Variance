export type NBAStatRow = [
  teamId: number,
  teamName: string,
  gamesPlayed: number,
  wins: number,
  losses: number,
  points: number,
  fieldGoalPct: number,
  threePointPct: number,
  freeThrowPct: number,
  assists: number,
  rebounds: number,
  turnovers: number,
  offensiveRating?: number,
  defensiveRating?: number,
  pace?: number
];
 // NBA API returns arrays

export type NBATeamStat = {
  TEAM_ID: number;
  TEAM_NAME: string;
  GP: number;
  W: number;
  L: number;
  PTS: number;
  FG_PCT: number;
  FG3_PCT: number;
  FT_PCT: number;
  AST: number;
  REB: number;
  TOV: number;
  OFF_RATING?: number;
  DEF_RATING?: number;
  PACE?: number;
};

export type ProcessedTeamData = {
  teamId: number;
  abbreviation: string;
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsPerGame: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  turnoversPerGame: number;
  oppPointsPerGame: number | null;
  offensiveRating: number | null;
  defensiveRating: number | null;
  pace: number | null;
};

export function mapRowToTeamStats(row: NBAStatRow): ProcessedTeamData {
  return {
    teamId: row[0],
    abbreviation: "", // filled from team table
    name: row[1],
    gamesPlayed: row[2],
    wins: row[3],
    losses: row[4],
    pointsPerGame: row[5],
    fieldGoalPct: row[6],
    threePointPct: row[7],
    freeThrowPct: row[8],
    assistsPerGame: row[9],
    reboundsPerGame: row[10],
    turnoversPerGame: row[11],
    oppPointsPerGame: null,
    offensiveRating: row[12] ?? null,
    defensiveRating: row[13] ?? null,
    pace: row[14] ?? null
  };
}
