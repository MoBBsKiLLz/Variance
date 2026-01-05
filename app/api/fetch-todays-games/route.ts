import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchGamesByDate } from '@/lib/data/nba-games-fetcher';
import { GameData } from '@/lib/types/nba-data';

export async function POST(request: NextRequest) {
  try {
    const { season } = await request.json();

    const now = new Date();
    console.log('Fetching today\'s games from NBA API...');
    
    const games = await fetchGamesByDate(now, season);

    if (games.length === 0) {
      return NextResponse.json({
        success: true,
        season,
        gamesCount: 0,
        message: 'No games found for today'
      });
    }

    // Pre-fetch all teams
    const allTeams = await prisma.nBATeam.findMany({
      select: {
        id: true,
        teamId: true
      }
    });

    const teamMap = new Map(allTeams.map(team => [team.teamId, team.id]));

    // Filter to valid games
    const validGames = games.filter((game: GameData) => {
      const homeTeam = teamMap.get(game.homeTeamId);
      const awayTeam = teamMap.get(game.awayTeamId);
      return homeTeam && awayTeam;
    });

    // Update games
    for (const gameData of validGames) {
      const homeTeamId = teamMap.get(gameData.homeTeamId)!;
      const awayTeamId = teamMap.get(gameData.awayTeamId)!;

      await prisma.nBAGame.upsert({
        where: { gameId: gameData.gameId },
        update: {
          gameDate: gameData.gameDate,
          season: season,
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          status: gameData.status
        },
        create: {
          gameId: gameData.gameId,
          gameDate: gameData.gameDate,
          season: season,
          homeTeamId: homeTeamId,
          awayTeamId: awayTeamId,
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          status: gameData.status
        }
      });
    }

    console.log(`Updated ${validGames.length} games for today`);

    return NextResponse.json({
      success: true,
      season,
      gamesCount: validGames.length
    });

  } catch (error) {
    console.error('Error fetching today\'s games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s games' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}