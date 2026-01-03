import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchSeasonGames } from '@/lib/data/nba-games-fetcher';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { season } = await request.json();

    if (!season || !/^\d{4}-\d{2}$/.test(season)) {
      return NextResponse.json(
        { error: 'Invalid season format. Use YYYY-YY (e.g., 2025-26)' },
        { status: 400 }
      );
    }

    console.log('Fetching game results...');
    const gamesData = await fetchSeasonGames(season);

    // Pre-fetch all teams once
    const allTeams = await prisma.nBATeam.findMany({
      select: {
        id: true,
        teamId: true
      }
    });

    // Create a lookup map for faster team ID resolution
    const teamMap = new Map(allTeams.map(team => [team.teamId, team.id]));

    // Filter games to only those with valid teams
    const validGames = gamesData.filter(gameData => {
      const homeTeam = teamMap.get(gameData.homeTeamId);
      const awayTeam = teamMap.get(gameData.awayTeamId);
      return homeTeam && awayTeam;
    });

    // Helper function to process in batches
    async function processBatch<T, R>(
      items: T[], 
      batchSize: number, 
      processor: (item: T) => Promise<R>
    ): Promise<R[]> {
      const results: R[] = [];
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
      }
      return results;
    }

    // Upsert games in batches of 10
    await processBatch(validGames, 10, async (gameData) => {
      const homeTeamId = teamMap.get(gameData.homeTeamId)!;
      const awayTeamId = teamMap.get(gameData.awayTeamId)!;

      return prisma.nBAGame.upsert({
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
    });

    console.log(`Imported ${validGames.length} games`);

    return NextResponse.json({
      success: true,
      season,
      gamesCount: validGames.length
    });

  } catch (error) {
    console.error('Error fetching NBA games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NBA games' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}