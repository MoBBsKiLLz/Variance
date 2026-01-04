/**
 * Fetch Today's Games
 * Fetches and stores games for today from the NBA API
 */

import { PrismaClient } from '@prisma/client';
import { fetchGamesByDate } from '../lib/data/nba-games-fetcher.js';

const prisma = new PrismaClient();

async function fetchTodaysGames() {
  try {
    const now = new Date();
    console.log(`Current local time: ${now.toString()}\n`);

    console.log('Fetching games for today from NBA API...');
    const games = await fetchGamesByDate(now, '2025-26');

    console.log(`Found ${games.length} games\n`);

    if (games.length === 0) {
      console.log('No games found for today');
      return;
    }

    // Pre-fetch all teams
    const allTeams = await prisma.nBATeam.findMany({
      select: {
        id: true,
        teamId: true
      }
    });

    const teamMap = new Map(allTeams.map(team => [team.teamId, team.id]));

    // Filter to valid games
    const validGames = games.filter(game => {
      const homeTeam = teamMap.get(game.homeTeamId);
      const awayTeam = teamMap.get(game.awayTeamId);
      return homeTeam && awayTeam;
    });

    console.log(`Updating ${validGames.length} games in database...\n`);

    // Update games one by one
    for (const gameData of validGames) {
      const homeTeamId = teamMap.get(gameData.homeTeamId);
      const awayTeamId = teamMap.get(gameData.awayTeamId);

      const homeTeam = allTeams.find(t => t.id === homeTeamId);
      const awayTeam = allTeams.find(t => t.id === awayTeamId);

      await prisma.nBAGame.upsert({
        where: { gameId: gameData.gameId },
        update: {
          gameDate: gameData.gameDate,
          season: '2025-26',
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          status: gameData.status
        },
        create: {
          gameId: gameData.gameId,
          gameDate: gameData.gameDate,
          season: '2025-26',
          homeTeamId: homeTeamId,
          awayTeamId: awayTeamId,
          homeScore: gameData.homeScore,
          awayScore: gameData.awayScore,
          status: gameData.status
        }
      });

      console.log(`✓ Updated game ${gameData.gameId}: ${gameData.gameDate.toISOString()} - ${gameData.status}`);
    }

    console.log(`\n✅ Successfully updated ${validGames.length} games for today`);

  } catch (error) {
    console.error('Error fetching today\'s games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fetchTodaysGames();
