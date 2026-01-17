import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchGamesByDate } from '@/lib/data/nba-games-fetcher';
import { GameData } from '@/lib/types/nba-data';

/**
 * OPTIMIZED: Fetch and store today's NBA games
 * 
 * Optimizations:
 * - Bulk upsert using raw SQL (fast for small batch)
 * - Pre-fetch teams once (eliminates N queries)
 * - Proper type safety with GameData
 */
export async function POST(request: NextRequest) {
  try {
    const { season } = await request.json();

    if (!season || !/^\d{4}-\d{2}$/.test(season)) {
      return NextResponse.json(
        { error: 'Invalid season format. Use YYYY-YY (e.g., 2025-26)' },
        { status: 400 }
      );
    }

    const now = new Date();
    console.log(`🏀 Fetching today's games (${now.toDateString()})...`);
    
    const gamesData = await fetchGamesByDate(now, season);
    console.log(`✅ Fetched ${gamesData.length} games from NBA API`);

    if (gamesData.length === 0) {
      return NextResponse.json({
        success: true,
        season,
        gamesCount: 0,
        message: 'No games found for today'
      });
    }

    // Pre-fetch all teams once
    const allTeams = await prisma.nBATeam.findMany({
      select: {
        id: true,
        teamId: true,
      },
    });
    const teamMap = new Map(allTeams.map((team) => [team.teamId, team.id]));

    // Filter to valid games only
    const validGames = gamesData.filter((gameData: GameData) => {
      const homeTeam = teamMap.get(gameData.homeTeamId);
      const awayTeam = teamMap.get(gameData.awayTeamId);
      return homeTeam && awayTeam;
    });

    console.log(`💾 Upserting ${validGames.length} valid games...`);

    // Upsert each game (small batch, so sequential is fine)
    let upsertedCount = 0;
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
          status: gameData.status,
        },
        create: {
          gameId: gameData.gameId,
          gameDate: gameData.gameDate,
          season: season,
          homeTeamId: homeTeamId,
          awayTeamId: awayTeamId,
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          status: gameData.status,
        },
      });
      upsertedCount++;
    }

    console.log(`✅ Successfully upserted ${upsertedCount} games for today`);

    return NextResponse.json({
      success: true,
      season,
      gamesCount: upsertedCount,
    });
  } catch (error) {
    console.error('❌ Error fetching today\'s games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s games' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}