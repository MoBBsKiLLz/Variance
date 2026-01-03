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

    let gamesCount = 0;

    for (const gameData of gamesData) {
      const homeTeam = await prisma.nBATeam.findUnique({
        where: { teamId: gameData.homeTeamId }
      });
      
      const awayTeam = await prisma.nBATeam.findUnique({
        where: { teamId: gameData.awayTeamId }
      });
      
      if (!homeTeam || !awayTeam) {
        continue;
      }
      
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
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          status: gameData.status
        }
      });
      
      gamesCount++;
    }

    console.log(`Imported ${gamesCount} games`);

    return NextResponse.json({
      success: true,
      season,
      gamesCount
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