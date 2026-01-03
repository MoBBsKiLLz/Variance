import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchGamesByDate } from '@/lib/data/nba-games-fetcher';
import { GameData } from '@/lib/types/nba-data';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get today in UTC to match NBA API expectations
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    const gamesData = await fetchGamesByDate(today, '2025-26');
    
    // Enrich with team data from database
    const enrichedGames = await Promise.all(
      gamesData.map(async (game: GameData) => {
        const homeTeam = await prisma.nBATeam.findUnique({
          where: { teamId: game.homeTeamId }
        });
        
        const awayTeam = await prisma.nBATeam.findUnique({
          where: { teamId: game.awayTeamId }
        });
        
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
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          status: game.status,
          gameTime: game.gameTime
        };
      })
    );
    
    // Filter: Only show games that are not final
    const filteredGames = enrichedGames.filter(game => {
      if (!game.homeTeam || !game.awayTeam) return false;
      
      // Check if game is not final
      const isFinal = game.status.toLowerCase().includes('final');
      
      return !isFinal;
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