/**
 * NBA API Date Test
 * Fetches games from the NBA API to see what date format they return
 */

import { fetchSeasonGames } from './lib/data/nba-games-fetcher.js';

async function testApiDates() {
  try {
    console.log("=== FETCHING GAMES FROM NBA API ===\n");
    console.log("This will show us what date strings the NBA API returns...\n");

    const games = await fetchSeasonGames('2025-26');

    // Show the first 20 games to see the dates
    console.log(`Total games fetched: ${games.length}\n`);
    console.log("First 20 games:\n");

    games.slice(0, 20).forEach((game, index) => {
      console.log(`${index + 1}. Game ${game.gameId}`);
      console.log(`   gameDate object: ${game.gameDate}`);
      console.log(`   gameDate ISO:    ${game.gameDate.toISOString()}`);
      console.log(`   gameDate string: ${game.gameDate.toString()}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   Home: ${game.homeTeamId}, Away: ${game.awayTeamId}\n`);
    });

    // Find games from early January 2026
    const janGames = games.filter(game => {
      const dateStr = game.gameDate.toISOString().substring(0, 10);
      return dateStr >= '2026-01-01' && dateStr <= '2026-01-05';
    });

    console.log(`\n=== GAMES FROM JAN 1-5, 2026 ===\n`);
    console.log(`Found ${janGames.length} games\n`);

    const dateGroups = {};
    janGames.forEach(game => {
      const dateStr = game.gameDate.toISOString().substring(0, 10);
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = [];
      }
      dateGroups[dateStr].push(game);
    });

    Object.keys(dateGroups).sort().forEach(dateStr => {
      console.log(`${dateStr}: ${dateGroups[dateStr].length} games`);
      dateGroups[dateStr].forEach(game => {
        console.log(`  - Game ${game.gameId}: ${game.gameDate.toISOString()}`);
      });
      console.log();
    });

  } catch (error) {
    console.error("Error testing API dates:", error);
  }
}

testApiDates();
