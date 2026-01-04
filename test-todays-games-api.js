/**
 * Test: Fetch TODAY's games from NBA API
 * This will show us what date the NBA API assigns to games happening today
 */

import { fetchGamesByDate } from './lib/data/nba-games-fetcher.js';

async function testTodaysGamesFromAPI() {
  try {
    const now = new Date();

    console.log("=== CURRENT TIME INFO ===\n");
    console.log(`Local time: ${now.toString()}`);
    console.log(`UTC time:   ${now.toUTCString()}`);
    console.log(`ISO string: ${now.toISOString()}\n`);

    console.log("=== FETCHING TODAY'S GAMES FROM NBA API ===\n");
    console.log("Using current date to fetch games...\n");

    // Fetch games for today
    const games = await fetchGamesByDate(now, "2025-26");

    console.log(`Found ${games.length} games for today\n`);

    if (games.length === 0) {
      console.log("No games found. This might mean:");
      console.log("1. There are no games scheduled today");
      console.log("2. The API uses a different date format");
      console.log("3. The date parameter needs to be adjusted\n");

      // Try yesterday
      console.log("=== TRYING YESTERDAY ===\n");
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayGames = await fetchGamesByDate(yesterday, "2025-26");
      console.log(`Found ${yesterdayGames.length} games for yesterday\n`);

      if (yesterdayGames.length > 0) {
        console.log("First 5 yesterday's games:");
        yesterdayGames.slice(0, 5).forEach((game, i) => {
          console.log(`${i + 1}. Game ${game.gameId}`);
          console.log(`   Stored date: ${game.gameDate.toISOString()}`);
          console.log(`   Status: ${game.status}\n`);
        });
      }

      // Try tomorrow
      console.log("=== TRYING TOMORROW ===\n");
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowGames = await fetchGamesByDate(tomorrow, "2025-26");
      console.log(`Found ${tomorrowGames.length} games for tomorrow\n`);

      if (tomorrowGames.length > 0) {
        console.log("First 5 tomorrow's games:");
        tomorrowGames.slice(0, 5).forEach((game, i) => {
          console.log(`${i + 1}. Game ${game.gameId}`);
          console.log(`   Stored date: ${game.gameDate.toISOString()}`);
          console.log(`   Status: ${game.status}\n`);
        });
      }
    } else {
      console.log("Games found for TODAY:\n");
      games.forEach((game, i) => {
        console.log(`${i + 1}. Game ${game.gameId}`);
        console.log(`   Date created: ${game.gameDate.toISOString()}`);
        console.log(`   Date string:  ${game.gameDate.toString()}`);
        console.log(`   Home: ${game.homeTeamId}, Away: ${game.awayTeamId}`);
        console.log(`   Status: ${game.status}\n`);
      });
    }

    // Also test with specific dates
    console.log("\n=== TESTING SPECIFIC DATES ===\n");

    // Create a date for Jan 3, 2026 in local time
    const jan3Local = new Date(2026, 0, 3);  // Month is 0-indexed
    console.log(`Testing with Jan 3, 2026 (local): ${jan3Local.toString()}`);
    const jan3Games = await fetchGamesByDate(jan3Local, "2025-26");
    console.log(`Found ${jan3Games.length} games\n`);

    if (jan3Games.length > 0) {
      console.log("Games for Jan 3:");
      jan3Games.slice(0, 5).forEach((game, i) => {
        console.log(`  ${i + 1}. ${game.gameId}: ${game.gameDate.toISOString()} - ${game.status}`);
      });
    }

  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  }
}

testTodaysGamesFromAPI();
