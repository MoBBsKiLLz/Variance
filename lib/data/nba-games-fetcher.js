/**
 * NBA Games Data Fetcher
 * Fetches game results for a given season
 */

import axios from "axios";
import { NBA_HEADERS, NBA_BASE_URL, DEFAULT_SEASON } from "../constants/nba.js";

function nbaDateToLocal(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Fetch all games for a season
 */
export async function fetchSeasonGames(season = DEFAULT_SEASON) {
  try {
    console.log(`Fetching games for ${season} season...`);

    const url = `${NBA_BASE_URL}/leaguegamelog`;
    const params = {
      Counter: 0,
      DateFrom: "",
      DateTo: "",
      Direction: "DESC",
      LeagueID: "00",
      PlayerOrTeam: "T", // T for Team
      Season: season,
      SeasonType: "Regular Season",
      Sorter: "DATE",
    };

    const response = await axios.get(url, {
      headers: NBA_HEADERS,
      params,
    });

    const headers = response.data.resultSets[0].headers;
    const rows = response.data.resultSets[0].rowSet;

    const games = rows.map((row) => {
      const game = {};
      headers.forEach((header, index) => {
        game[header] = row[index];
      });
      return game;
    });

    // Group by actual game (since each game has 2 entries - one per team)
    const gameMap = new Map();

    games.forEach((game) => {
      const gameId = game.GAME_ID;

      if (!gameMap.has(gameId)) {
        gameMap.set(gameId, {
          gameId: gameId,
          gameDate: game.GAME_DATE,
          matchup: game.MATCHUP,
          teams: [],
        });
      }

      gameMap.get(gameId).teams.push({
        teamId: game.TEAM_ID,
        teamAbbreviation: game.TEAM_ABBREVIATION,
        isHome: !game.MATCHUP.includes("@"), // If no @, team is home
        points: game.PTS,
        won: game.WL === "W",
      });
    });

    // Convert map to array and structure properly
    const structuredGames = Array.from(gameMap.values())
      .map((game) => {
        const homeTeam = game.teams.find((t) => t.isHome);
        const awayTeam = game.teams.find((t) => !t.isHome);

        return {
          gameId: game.gameId,
          gameDate: nbaDateToLocal(game.gameDate),
          homeTeamId: homeTeam?.teamId,
          awayTeamId: awayTeam?.teamId,
          homeScore: homeTeam?.points,
          awayScore: awayTeam?.points,
          status: "FINAL",
        };
      })
      .filter((game) => game.homeTeamId && game.awayTeamId); // Filter out incomplete games

    console.log(`Fetched ${structuredGames.length} games for ${season}`);
    return structuredGames;
  } catch (error) {
    console.error("Error fetching season games:", error.message);
    throw error;
  }
}

/**
 * Fetch games between two specific teams
 */
export async function fetchHeadToHeadGames(
  team1Id,
  team2Id,
  season = "2025-26"
) {
  const allGames = await fetchSeasonGames(season);

  return allGames.filter(
    (game) =>
      (game.homeTeamId === team1Id && game.awayTeamId === team2Id) ||
      (game.homeTeamId === team2Id && game.awayTeamId === team1Id)
  );
}

/**
 * Fetch games for a specific date
 */
export async function fetchGamesByDate(date = new Date(), season = "2025-26") {
  try {
    // Format date as YYYY-MM-DD using US Eastern Time
    // NBA organizes games by US Eastern calendar dates
    const usEasternDateStr = date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Parse and format as YYYY-MM-DD
    const [month, day, year] = usEasternDateStr.split('/');
    const dateStr = `${year}-${month}-${day}`;

    console.log(`🏀 Fetching games for ${dateStr}...`);

    const url = `${NBA_BASE_URL}/scoreboardV2`;
    const params = {
      GameDate: dateStr,
      LeagueID: "00",
      DayOffset: 0,
    };

    const response = await axios.get(url, {
      headers: NBA_HEADERS,
      params,
    });

    console.log("Response data:", response.data); // Debug log

    const gameHeaders = response.data.resultSets[0].headers;
    const gameRows = response.data.resultSets[0].rowSet;

    const lineScoreHeaders = response.data.resultSets[1].headers;
    const lineScoreRows = response.data.resultSets[1].rowSet;

    // Map headers to indices
    const gameIdIdx = gameHeaders.indexOf("GAME_ID");
    const gameStatusIdx = gameHeaders.indexOf("GAME_STATUS_TEXT");
    const homeTeamIdIdx = gameHeaders.indexOf("HOME_TEAM_ID");
    const visitorTeamIdIdx = gameHeaders.indexOf("VISITOR_TEAM_ID");

    const lineScoreGameIdIdx = lineScoreHeaders.indexOf("GAME_ID");
    const lineScoreTeamIdIdx = lineScoreHeaders.indexOf("TEAM_ID");
    const lineScorePtsIdx = lineScoreHeaders.indexOf("PTS");

    // Group scores by game and team
    const scoresByGame = {};
    lineScoreRows.forEach((row) => {
      const gameId = row[lineScoreGameIdIdx];
      const teamId = row[lineScoreTeamIdIdx];
      const points = row[lineScorePtsIdx];

      if (!scoresByGame[gameId]) {
        scoresByGame[gameId] = {};
      }
      scoresByGame[gameId][teamId] = points;
    });

    // Get the date components from the US Eastern dateStr we already calculated
    const [parsedYear, parsedMonth, parsedDay] = dateStr.split('-').map(Number);

    const structuredGames = gameRows.map((row) => {
      const gameId = row[gameIdIdx];
      const homeTeamId = row[homeTeamIdIdx];
      const visitorTeamId = row[visitorTeamIdIdx];
      const status = row[gameStatusIdx]?.trim() || "";

      return {
        gameId: gameId,
        gameDate: new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay)),
        season: season,
        homeTeamId: homeTeamId,
        awayTeamId: visitorTeamId,
        homeScore: scoresByGame[gameId]?.[homeTeamId] || null,
        awayScore: scoresByGame[gameId]?.[visitorTeamId] || null,
        status: status,
        gameTime: status,
      };
    });

    console.log(`✓ Fetched ${structuredGames.length} games for ${dateStr}`);
    return structuredGames;
  } catch (error) {
    console.error("Error fetching games by date:", error.message);
    throw error;
  }
}
