/**
 * Raw NBA API Response Test
 * Shows the actual raw date strings from the NBA API
 */

import axios from "axios";
import { NBA_HEADERS, NBA_BASE_URL } from "./lib/constants/nba.js";

async function testRawApiResponse() {
  try {
    console.log("=== FETCHING RAW NBA API RESPONSE ===\n");

    const url = `${NBA_BASE_URL}/leaguegamelog`;
    const params = {
      Counter: 0,
      DateFrom: "",
      DateTo: "",
      Direction: "DESC",
      LeagueID: "00",
      PlayerOrTeam: "T",
      Season: "2025-26",
      SeasonType: "Regular Season",
      Sorter: "DATE",
    };

    const response = await axios.get(url, {
      headers: NBA_HEADERS,
      params,
    });

    const headers = response.data.resultSets[0].headers;
    const rows = response.data.resultSets[0].rowSet;

    console.log("Column headers:");
    console.log(headers.join(", "));
    console.log();

    // Find the GAME_DATE column index
    const gameDateIdx = headers.indexOf("GAME_DATE");
    const gameIdIdx = headers.indexOf("GAME_ID");
    const matchupIdx = headers.indexOf("MATCHUP");

    console.log(`GAME_DATE column index: ${gameDateIdx}\n`);

    // Show first 20 unique games
    const seenGames = new Set();
    let count = 0;

    console.log("First 20 games with RAW date strings:\n");

    for (const row of rows) {
      const gameId = row[gameIdIdx];

      if (!seenGames.has(gameId) && count < 20) {
        seenGames.add(gameId);
        count++;

        const rawDate = row[gameDateIdx];
        const matchup = row[matchupIdx];

        console.log(`${count}. Game ${gameId}`);
        console.log(`   Raw GAME_DATE from API: "${rawDate}" (type: ${typeof rawDate})`);
        console.log(`   Matchup: ${matchup}`);

        // Test the conversion
        const [year, month, day] = rawDate.split("-").map(Number);
        const convertedDate = new Date(Date.UTC(year, month - 1, day));
        console.log(`   After conversion: ${convertedDate.toISOString()}`);
        console.log(`   Local display: ${convertedDate.toString()}\n`);
      }
    }

    // Group by raw date string
    console.log("\n=== GAMES GROUPED BY RAW DATE STRING ===\n");

    const dateGroups = {};
    const processedGames = new Set();

    rows.forEach(row => {
      const gameId = row[gameIdIdx];
      if (!processedGames.has(gameId)) {
        processedGames.add(gameId);
        const rawDate = row[gameDateIdx];

        if (!dateGroups[rawDate]) {
          dateGroups[rawDate] = [];
        }
        dateGroups[rawDate].push(gameId);
      }
    });

    // Show only dates from early January 2026
    Object.keys(dateGroups)
      .filter(date => date >= '2026-01-01' && date <= '2026-01-05')
      .sort()
      .forEach(date => {
        const [year, month, day] = date.split("-").map(Number);
        const convertedDate = new Date(Date.UTC(year, month - 1, day));

        console.log(`Raw date "${date}" (${dateGroups[date].length} games)`);
        console.log(`  Converts to: ${convertedDate.toISOString()}`);
        console.log(`  Displays as: ${convertedDate.toString()}\n`);
      });

  } catch (error) {
    console.error("Error:", error.message);
  }
}

testRawApiResponse();
