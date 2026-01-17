import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateEnhancedPrediction, EnhancedTeamStats } from '@/lib/utils/enhanced-prediction';

export const dynamic = 'force-dynamic';

/**
 * Enhanced Matchup Prediction API
 * 
 * Now includes:
 * - Pythagorean win expectations
 * - Home court advantage
 * - Confidence scoring
 * - Key insights
 */

export async function POST(request: NextRequest) {
  try {
    const { teamAId, teamBId, isTeamAHome, season } = await request.json();

    if (!teamAId || !teamBId) {
      return NextResponse.json(
        { error: 'Both team IDs are required' },
        { status: 400 }
      );
    }

    const currentSeason = season || '2025-26';

    // Fetch both teams with their stats
    const [teamA, teamB] = await Promise.all([
      prisma.nBATeam.findUnique({
        where: { id: parseInt(teamAId) },
        include: {
          teamStats: {
            where: { season: currentSeason },
            take: 1,
          },
        },
      }),
      prisma.nBATeam.findUnique({
        where: { id: parseInt(teamBId) },
        include: {
          teamStats: {
            where: { season: currentSeason },
            take: 1,
          },
        },
      }),
    ]);

    if (!teamA || !teamB) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 }
      );
    }

    const statsA = teamA.teamStats[0];
    const statsB = teamB.teamStats[0];

    if (!statsA || !statsB) {
      return NextResponse.json(
        { error: 'Team statistics not available for this season' },
        { status: 404 }
      );
    }

    // Map database stats to enhanced prediction format
    const enhancedTeamA: EnhancedTeamStats = {
      teamId: teamA.teamId,
      abbreviation: teamA.abbreviation,
      name: teamA.name,
      offensiveRating: statsA.offensiveRating || 110,
      defensiveRating: statsA.defensiveRating || 110,
      wins: statsA.wins,
      losses: statsA.losses,
      totalPointsScored: statsA.totalPointsScored || statsA.pointsPerGame * statsA.gamesPlayed,
      totalPointsAllowed: statsA.totalPointsAllowed || statsA.oppPointsPerGame * statsA.gamesPlayed,
      homeRecord: {
        wins: statsA.homeWins,
        losses: statsA.homeLosses,
      },
      awayRecord: {
        wins: statsA.awayWins,
        losses: statsA.awayLosses,
      },
    };

    const enhancedTeamB: EnhancedTeamStats = {
      teamId: teamB.teamId,
      abbreviation: teamB.abbreviation,
      name: teamB.name,
      offensiveRating: statsB.offensiveRating || 110,
      defensiveRating: statsB.defensiveRating || 110,
      wins: statsB.wins,
      losses: statsB.losses,
      totalPointsScored: statsB.totalPointsScored || statsB.pointsPerGame * statsB.gamesPlayed,
      totalPointsAllowed: statsB.totalPointsAllowed || statsB.oppPointsPerGame * statsB.gamesPlayed,
      homeRecord: {
        wins: statsB.homeWins,
        losses: statsB.homeLosses,
      },
      awayRecord: {
        wins: statsB.awayWins,
        losses: statsB.awayLosses,
      },
    };

    // Calculate enhanced prediction
    const prediction = calculateEnhancedPrediction(
      enhancedTeamA,
      enhancedTeamB,
      isTeamAHome ?? true // Default to team A home if not specified
    );

    // Return enhanced prediction with team details
    return NextResponse.json({
      teamA: {
        id: teamA.id,
        teamId: teamA.teamId,
        name: teamA.name,
        abbreviation: teamA.abbreviation,
        record: `${statsA.wins}-${statsA.losses}`,
        homeRecord: `${statsA.homeWins}-${statsA.homeLosses}`,
        awayRecord: `${statsA.awayWins}-${statsA.awayLosses}`,
        offensiveRating: statsA.offensiveRating,
        defensiveRating: statsA.defensiveRating,
        pythagoreanWinPct: statsA.pythagoreanWinPct,
        luckFactor: statsA.luckFactor,
      },
      teamB: {
        id: teamB.id,
        teamId: teamB.teamId,
        name: teamB.name,
        abbreviation: teamB.abbreviation,
        record: `${statsB.wins}-${statsB.losses}`,
        homeRecord: `${statsB.homeWins}-${statsB.homeLosses}`,
        awayRecord: `${statsB.awayWins}-${statsB.awayLosses}`,
        offensiveRating: statsB.offensiveRating,
        defensiveRating: statsB.defensiveRating,
        pythagoreanWinPct: statsB.pythagoreanWinPct,
        luckFactor: statsB.luckFactor,
      },
      prediction,
      isTeamAHome,
      season: currentSeason,
    });

  } catch (error) {
    console.error('Error calculating matchup:', error);
    return NextResponse.json(
      { error: 'Failed to calculate matchup prediction' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}