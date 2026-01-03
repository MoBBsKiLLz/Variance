import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchGamesByDate } from '@/lib/data/nba-games-fetcher';
import { GameData } from '@/lib/types/nba-data';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Always fetch fresh data from NBA API
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const gamesData = await fetchGamesByDate(today, '2025-26');

    // Enrich with team data from database (this is static, doesn't need to be live)
    const enrichedGames = await Promise.all(
      gamesData.map(async (game: GameData) => {
        const homeTeam = await prisma.nBATeam.findUnique({
          where: { teamId: game.homeTeamId }
        });

        const awayTeam = await prisma.nBATeam.findUnique({
          where: { teamId: game.awayTeamId }
        });

        // Determine if game is final
        const isFinal = game.status.toLowerCase().includes('final');

        return {
          gameId: game.gameId,
          gameDate: game.gameDate,
          homeTeam: homeTeam ? {
            id: homeTeam.id,
            abbreviation: homeTeam.abbreviation,
            name: homeTeam.name
          } : null,
          awayTeam: awayTeam ? {
            id: awayTeam.id,
            abbreviation: awayTeam.abbreviation,
            name: awayTeam.name
          } : null,
          // Only show scores if game is final
          homeScore: isFinal ? game.homeScore : null,
          awayScore: isFinal ? game.awayScore : null,
          status: game.status,
          gameTime: game.gameTime,
          isFinal: isFinal
        };
      })
    );

    // Filter: Show scheduled games OR final games (hide in-progress)
    const filteredGames = enrichedGames.filter(game => {
      if (!game.homeTeam || !game.awayTeam) return false;
      return true; // Show all games
    });

    return NextResponse.json(filteredGames);
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