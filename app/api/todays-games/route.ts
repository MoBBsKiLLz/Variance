import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; 
export const revalidate = 0;

export async function GET() {
  try {
    // Get today's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    // Fetch games from database that happened today or are scheduled for today
    const games = await prisma.nBAGame.findMany({
      where: {
        gameDate: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            abbreviation: true,
            name: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            abbreviation: true,
            name: true
          }
        }
      },
      orderBy: {
        gameDate: 'asc'
      }
    });

    // Format the response
    const formattedGames = games.map(game => ({
      gameId: game.gameId,
      gameDate: game.gameDate,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      status: game.status,
      gameTime: game.status,
      isFinal: game.status.toLowerCase().includes('final')
    }));

    // Filter: Only show scheduled or final games (hide in-progress to avoid stale data)
    const filteredGames = formattedGames.filter(game => {
      const isFinal = game.isFinal;
      const isScheduled = game.status.toLowerCase().includes('pm') || 
                         game.status.toLowerCase().includes('am') ||
                         game.gameTime.toLowerCase().includes('pm') ||
                         game.gameTime.toLowerCase().includes('am');
      
      return isScheduled || isFinal;
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