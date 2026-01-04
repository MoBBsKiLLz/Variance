import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSeasonGames } from '@/lib/data/nba-games-fetcher';

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

    // Filter and prepare games
    const validGames = gamesData
      .filter(gameData => {
        const homeTeam = teamMap.get(gameData.homeTeamId);
        const awayTeam = teamMap.get(gameData.awayTeamId);
        return homeTeam && awayTeam;
      })
      .map(gameData => ({
        gameId: gameData.gameId,
        gameDate: gameData.gameDate,
        season: season,
        homeTeamId: teamMap.get(gameData.homeTeamId)!,
        awayTeamId: teamMap.get(gameData.awayTeamId)!,
        homeScore: gameData.homeScore,
        awayScore: gameData.awayScore,
        status: gameData.status
      }));

    console.log(`Processing ${validGames.length} games...`);

    // Delete existing games for this season first
    await prisma.nBAGame.deleteMany({
      where: { season: season }
    });

    // Bulk insert all games at once
    const result = await prisma.nBAGame.createMany({
      data: validGames,
      skipDuplicates: true
    });

    console.log(`Imported ${result.count} games`);

    return NextResponse.json({
      success: true,
      season,
      gamesCount: result.count
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