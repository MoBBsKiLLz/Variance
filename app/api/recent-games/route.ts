import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const season = searchParams.get('season') || '2025-26';

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      );
    }

    const games = await prisma.nBAGame.findMany({
      where: {
        season: season,
        OR: [
          { homeTeamId: parseInt(teamId) },
          { awayTeamId: parseInt(teamId) }
        ],
        status: 'FINAL'
      },
      orderBy: {
        gameDate: 'desc'
      },
      take: limit
    });

    // Calculate recent form metrics
    let wins = 0;
    let totalPointsScored = 0;
    let totalPointsAllowed = 0;
    let totalOffensiveRating = 0;
    let totalDefensiveRating = 0;

    const gamesData = games.map(game => {
      const isHome = game.homeTeamId === parseInt(teamId);
      const teamScore = isHome ? game.homeScore : game.awayScore;
      const oppScore = isHome ? game.awayScore : game.homeScore;

      if (teamScore && oppScore) {
        if (teamScore > oppScore) wins++;
        totalPointsScored += teamScore;
        totalPointsAllowed += oppScore;

        // Estimate possessions (simple formula: FGA + 0.4*FTA - ORB + TOV)
        // Since we don't have all these stats, use a simplified version
        const estimatedPossessions = (teamScore + oppScore) / 2.2; // Rough estimate

        totalOffensiveRating += (teamScore / estimatedPossessions) * 100;
        totalDefensiveRating += (oppScore / estimatedPossessions) * 100;
      }

      return {
        gameId: game.gameId,
        date: game.gameDate,
        isHome,
        teamScore,
        oppScore,
        won: teamScore && oppScore && teamScore > oppScore
      };
    });

    const gamesPlayed = gamesData.filter(g => g.teamScore !== null).length;

    return NextResponse.json({
      games: gamesData,
      recentForm: {
        gamesPlayed,
        wins,
        losses: gamesPlayed - wins,
        winPct: gamesPlayed > 0 ? wins / gamesPlayed : 0,
        avgPointsScored: gamesPlayed > 0 ? totalPointsScored / gamesPlayed : 0,
        avgPointsAllowed: gamesPlayed > 0 ? totalPointsAllowed / gamesPlayed : 0,
        recentOffensiveRating: gamesPlayed > 0 ? totalOffensiveRating / gamesPlayed : null,
        recentDefensiveRating: gamesPlayed > 0 ? totalDefensiveRating / gamesPlayed : null
      }
    });
  } catch (error) {
    console.error('Error fetching recent games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent games' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}