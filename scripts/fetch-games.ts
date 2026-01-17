/**
 * Fetch Games Script - For GitHub Actions
 * Fetches and stores NBA season games without timeout limits
 */

import { PrismaClient } from '@prisma/client';
import { fetchSeasonGames } from '../lib/data/nba-games-fetcher.js';

const prisma = new PrismaClient();

interface SeasonGameData {
  gameId: string;
  gameDate: Date;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

async function main() {
  const season = process.argv[2] || '2025-26';
  
  console.log(`🏀 Fetching NBA games for season ${season}...`);
  const startTime = Date.now();

  try {
    // Fetch games from NBA API
    const gamesData = await fetchSeasonGames(season) as SeasonGameData[];
    const apiTime = Date.now() - startTime;
    console.log(`✅ Fetched ${gamesData.length} games from NBA API in ${apiTime}ms`);

    // Pre-fetch all teams
    console.log(`🔍 Loading teams...`);
    const allTeams = await prisma.nBATeam.findMany({
      select: {
        id: true,
        teamId: true,
      },
    });
    const teamMap = new Map(allTeams.map((team) => [team.teamId, team.id]));
    console.log(`✅ Loaded ${allTeams.length} teams`);

    // Validate and prepare games
    const validGames = gamesData
      .filter((gameData) => {
        const homeTeam = teamMap.get(gameData.homeTeamId);
        const awayTeam = teamMap.get(gameData.awayTeamId);
        return homeTeam && awayTeam;
      })
      .map((gameData) => ({
        gameId: gameData.gameId,
        gameDate: gameData.gameDate,
        season: season,
        homeTeamId: teamMap.get(gameData.homeTeamId)!,
        awayTeamId: teamMap.get(gameData.awayTeamId)!,
        homeScore: gameData.homeScore,
        awayScore: gameData.awayScore,
        status: gameData.status,
      }));

    console.log(`💾 Storing ${validGames.length} valid games...`);

    // Bulk delete + insert
    const dbStartTime = Date.now();
    
    const deleteResult = await prisma.nBAGame.deleteMany({
      where: { season: season },
    });
    console.log(`   Deleted ${deleteResult.count} existing games`);

    const insertResult = await prisma.nBAGame.createMany({
      data: validGames,
      skipDuplicates: true,
    });
    console.log(`   Inserted ${insertResult.count} games`);

    const dbTime = Date.now() - dbStartTime;
    const totalTime = Date.now() - startTime;

    console.log(`✅ Database operations completed in ${dbTime}ms`);
    console.log(`🎉 Total execution time: ${totalTime}ms`);
    console.log(`✅ Successfully stored ${insertResult.count} games for ${season}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
