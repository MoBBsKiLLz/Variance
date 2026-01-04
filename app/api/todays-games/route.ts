import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; 
export const revalidate = 0;

export async function GET() {
  try {
    // Get today's date in US Eastern Time (NBA's primary timezone)
    // This ensures consistency regardless of where the server is deployed
    const now = new Date();
    const usEasternDateStr = now.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Parse the US date string (format: MM/DD/YYYY)
    const [month, day, year] = usEasternDateStr.split('/').map(Number);

    // Create date range using US Eastern date components
    const todayStart = new Date(Date.UTC(year, month - 1, day));
    const todayEnd = new Date(Date.UTC(year, month - 1, day + 1));

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
    
    return NextResponse.json(formattedGames);
  } catch (error) {
    console.error('Error fetching today\'s games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s games' },
      { status: 500 }
    );
  }
}