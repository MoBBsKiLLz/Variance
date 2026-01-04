/**
 * Fetch NBA Games Script
 * Fetches and stores game results in the database
 */

import { prisma } from '../lib/prisma.ts';
import { fetchSeasonGames } from '../lib/data/nba-games-fetcher.js';

async function importGames(season = '2025-26') {
  console.log(`Starting NBA games import for ${season}...\n`);
  
  try {
    // Fetch games from NBA API
    const gamesData = await fetchSeasonGames(season);
    
    console.log('\nStoring games in database...\n');
    
    let gamesCreated = 0;
    
    for (const gameData of gamesData) {
      // Find the team database IDs from their NBA team IDs
      const homeTeam = await prisma.nBATeam.findUnique({
        where: { teamId: gameData.homeTeamId }
      });
      
      const awayTeam = await prisma.nBATeam.findUnique({
        where: { teamId: gameData.awayTeamId }
      });
      
      if (!homeTeam || !awayTeam) {
        console.log(`Skipping game ${gameData.gameId} - teams not found in database`);
        continue;
      }
      
      // Create or update game
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
      
      gamesCreated++;
      
      if (gamesCreated % 50 === 0) {
        console.log(`Imported ${gamesCreated} games...`);
      }
    }
    
    console.log(`\nImport complete!`);
    console.log(`   Games imported: ${gamesCreated}\n`);
    
  } catch (error) {
    console.error('Error importing games:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get season from command line args or use default
const season = process.argv[2] || '2025-26';

importGames(season)
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });