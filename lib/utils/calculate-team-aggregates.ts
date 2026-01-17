/**
 * Calculate game aggregates for teams
 * Used to compute Pythagorean expectation and home/away splits
 */

import { prisma } from '@/lib/prisma';
import { calculatePythagoreanExpectation } from '@/lib/utils/pythagorean-expectation';

export interface TeamGameAggregates {
  teamId: number;
  totalPointsScored: number;
  totalPointsAllowed: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
  pythagoreanWinPct: number;
  luckFactor: number;
}

/**
 * Calculate aggregates from all games for a given season
 */
export async function calculateTeamAggregates(
  season: string
): Promise<Record<number, TeamGameAggregates>> {
  // Fetch all games for the season
  const games = await prisma.nBAGame.findMany({
    where: { season },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  // Initialize aggregates for each team
  const aggregates: Record<number, TeamGameAggregates> = {};

  // Process each game
  for (const game of games) {
    const homeTeamId = game.homeTeam.teamId;
    const awayTeamId = game.awayTeam.teamId;
    
    // Initialize team aggregates if not exists
    if (!aggregates[homeTeamId]) {
      aggregates[homeTeamId] = {
        teamId: homeTeamId,
        totalPointsScored: 0,
        totalPointsAllowed: 0,
        homeWins: 0,
        homeLosses: 0,
        awayWins: 0,
        awayLosses: 0,
        pythagoreanWinPct: 0,
        luckFactor: 0,
      };
    }
    
    if (!aggregates[awayTeamId]) {
      aggregates[awayTeamId] = {
        teamId: awayTeamId,
        totalPointsScored: 0,
        totalPointsAllowed: 0,
        homeWins: 0,
        homeLosses: 0,
        awayWins: 0,
        awayLosses: 0,
        pythagoreanWinPct: 0,
        luckFactor: 0,
      };
    }

    // Only process completed games
    if (game.status === 'FINAL' && game.homeScore !== null && game.awayScore !== null) {
      // Home team stats
      aggregates[homeTeamId].totalPointsScored += game.homeScore;
      aggregates[homeTeamId].totalPointsAllowed += game.awayScore;
      
      if (game.homeScore > game.awayScore) {
        aggregates[homeTeamId].homeWins++;
      } else {
        aggregates[homeTeamId].homeLosses++;
      }

      // Away team stats
      aggregates[awayTeamId].totalPointsScored += game.awayScore;
      aggregates[awayTeamId].totalPointsAllowed += game.homeScore;
      
      if (game.awayScore > game.homeScore) {
        aggregates[awayTeamId].awayWins++;
      } else {
        aggregates[awayTeamId].awayLosses++;
      }
    }
  }

  // Calculate Pythagorean expectations and luck factors
  Object.values(aggregates).forEach((agg) => {
    if (agg.totalPointsScored > 0 && agg.totalPointsAllowed > 0) {
      agg.pythagoreanWinPct = calculatePythagoreanExpectation(
        agg.totalPointsScored,
        agg.totalPointsAllowed
      );
      
      const totalGames = agg.homeWins + agg.homeLosses + agg.awayWins + agg.awayLosses;
      const actualWins = agg.homeWins + agg.awayWins;
      const actualWinPct = totalGames > 0 ? actualWins / totalGames : 0;
      
      agg.luckFactor = actualWinPct - agg.pythagoreanWinPct;
    }
  });

  return aggregates;
}