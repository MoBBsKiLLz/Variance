/**
 * Home Court Advantage Calculator
 * 
 * Calculates the win probability adjustment for home court advantage
 * considering altitude, team-specific performance, and league averages.
 */

// High-altitude teams get additional advantage due to visiting team fatigue
const HIGH_ALTITUDE_TEAMS = {
  1610612743: 1.5,  // Denver Nuggets (5,280 ft elevation)
  1610612762: 0.8,  // Utah Jazz (4,226 ft elevation)
} as const;

export interface HomeAwayRecord {
  wins: number;
  losses: number;
}

export interface HomeCourtResult {
  totalAdvantage: number;
  breakdown: {
    base: number;
    altitude: number;
    teamSpecific: number;
  };
}

/**
 * Calculate home court advantage as win probability percentage
 * 
 * @param homeTeamId - NBA team ID of home team
 * @param awayTeamId - NBA team ID of away team
 * @param homeRecord - Home team's home record (optional)
 * @param awayRecord - Away team's away record (optional)
 * @returns Win probability adjustment (0-20%, typically 8-12%)
 */
export function calculateHomeCourtAdvantage(
  homeTeamId: number,
  awayTeamId: number,
  homeRecord?: HomeAwayRecord,
  awayRecord?: HomeAwayRecord
): HomeCourtResult {
  // Base home court advantage: ~10% win probability
  const baseAdvantage = 10.0;
  
  // Altitude bonus (additional fatigue for visiting team)
  const altitudeBonus = homeTeamId in HIGH_ALTITUDE_TEAMS 
    ? HIGH_ALTITUDE_TEAMS[homeTeamId as keyof typeof HIGH_ALTITUDE_TEAMS]
    : 0;
  
  // Team-specific adjustment based on actual home/away performance
  let teamSpecificAdj = 0;
  if (homeRecord && awayRecord) {
    const homeWinPct = homeRecord.wins / Math.max(1, homeRecord.wins + homeRecord.losses);
    const awayWinPct = awayRecord.wins / Math.max(1, awayRecord.wins + awayRecord.losses);
    
    // If home team has strong home record relative to opponent's road record
    // Award up to ±3% additional adjustment
    const performanceDiff = (homeWinPct - awayWinPct) * 3;
    teamSpecificAdj = Math.max(-3, Math.min(3, performanceDiff));
  }
  
  const totalAdvantage = baseAdvantage + altitudeBonus + teamSpecificAdj;
  
  return {
    totalAdvantage,
    breakdown: {
      base: baseAdvantage,
      altitude: altitudeBonus,
      teamSpecific: teamSpecificAdj,
    },
  };
}

/**
 * Get altitude bonus for a specific team
 */
export function getAltitudeBonus(teamId: number): number {
  return teamId in HIGH_ALTITUDE_TEAMS
    ? HIGH_ALTITUDE_TEAMS[teamId as keyof typeof HIGH_ALTITUDE_TEAMS]
    : 0;
}

/**
 * Check if a team plays at high altitude
 */
export function isHighAltitudeTeam(teamId: number): boolean {
  return teamId in HIGH_ALTITUDE_TEAMS;
}