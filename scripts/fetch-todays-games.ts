/**
 * Fetch Today's Games Script
 * Fetches and updates games for today from the NBA API
 * 
 * Usage: npm run fetch:today
 * Schedule: Run every few hours on game days to update scores
 */

import { PrismaClient } from '@prisma/client';
import { fetchGamesByDate } from '../lib/data/nba-games-fetcher.js';

const prisma = new PrismaClient();

const CURRENT_SEASON = '2024-25';

interface GameData {
  gameId: string;
  gameDate: Date;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 5000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(` ⚠️ Attempt ${attempt} failed, retrying in ${delayMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('All retry attempts failed');
}

async function main() {
  const now = new Date();
  console.log(`🏀 Fetching today's games...`);
  console.log(`   Current time: ${now.toLocaleString()}`);
  console.log(`   Season: ${CURRENT_SEASON}`);
  
  const startTime = Date.now();

  try {
    // Fetch games from NBA API
    const games = await withRetry(() => fetchGamesByDate(now, CURRENT_SEASON), 3, 5000) as GameData[];
    console.log(`✅ Found ${games.length} games for today`);

    if (games.length === 0) {
      console.log('ℹ️  No games scheduled for today');
      return;
    }

    // Pre-fetch all teams for mapping
    const allTeams = await prisma.nBATeam.findMany({
      select: {
        id: true,
        teamId: true,
        abbreviation: true,
      },
    });
    const teamMap = new Map(allTeams.map((team) => [team.teamId, team]));

    // Filter to valid games (teams exist in DB)
    const validGames = games.filter((game) => {
      const homeTeam = teamMap.get(game.homeTeamId);
      const awayTeam = teamMap.get(game.awayTeamId);
      return homeTeam && awayTeam;
    });

    console.log(`💾 Updating ${validGames.length} games in database...\n`);

    let updated = 0;
    for (const gameData of validGames) {
      const homeTeam = teamMap.get(gameData.homeTeamId)!;
      const awayTeam = teamMap.get(gameData.awayTeamId)!;

      await prisma.nBAGame.upsert({
        where: { gameId: gameData.gameId },
        update: {
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          status: gameData.status,
        },
        create: {
          gameId: gameData.gameId,
          gameDate: gameData.gameDate,
          season: CURRENT_SEASON,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          status: gameData.status,
        },
      });

      // Format score display
      const scoreDisplay = gameData.homeScore !== null 
        ? `${gameData.homeScore}-${gameData.awayScore}` 
        : 'TBD';
      
      console.log(`   ✓ ${awayTeam.abbreviation} @ ${homeTeam.abbreviation}: ${scoreDisplay} (${gameData.status})`);
      updated++;
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n🎉 Updated ${updated} games in ${totalTime}ms`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();