/**
 * NBA Data Fetcher - PRODUCTION OPTIMIZED FOR GITHUB ACTIONS
 * 
 * Handles NBA Stats API reliability issues with:
 * - Extended timeouts (GitHub Actions has 10 minute limit)
 * - Aggressive retry logic
 * - Sequential calls (avoids rate limiting)
 * - Better error handling
 */

import axios from "axios";
import { NBA_HEADERS, NBA_BASE_URL, TEAM_ABBREVIATIONS, DEFAULT_SEASON } from "../constants/nba.js";

// Production configuration for GitHub Actions
const CONFIG = {
  TIMEOUT_MS: 30000,        // 30 seconds per request (we have time in GitHub Actions)
  MAX_RETRIES: 3,           // Try up to 3 times
  RETRY_DELAY_MS: 2000,     // 2 second base delay
  API_CALL_DELAY_MS: 1000,  // 1 second between different API calls
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry(fn, label, maxRetries = CONFIG.MAX_RETRIES) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`[${label}] Attempt ${attempt}/${maxRetries + 1}...`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt <= maxRetries) {
        const delay = CONFIG.RETRY_DELAY_MS * attempt; // Exponential backoff
        console.warn(
          `[${label}] Attempt ${attempt} failed: ${error.message}. ` +
          `Retrying in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

async function fetchTeamStats(season = DEFAULT_SEASON) {
  const url = `${NBA_BASE_URL}/leaguedashteamstats`;
  const params = {
    Conference: "",
    DateFrom: "",
    DateTo: "",
    Division: "",
    GameScope: "",
    GameSegment: "",
    Height: "",
    LastNGames: 0,
    LeagueID: "00",
    Location: "",
    MeasureType: "Base",
    Month: 0,
    OpponentTeamID: 0,
    Outcome: "",
    PORound: 0,
    PaceAdjust: "N",
    PerMode: "PerGame",
    Period: 0,
    PlayerExperience: "",
    PlayerPosition: "",
    PlusMinus: "N",
    Rank: "N",
    Season: season,
    SeasonSegment: "",
    SeasonType: "Regular Season",
    ShotClockRange: "",
    StarterBench: "",
    TeamID: 0,
    TwoWay: 0,
    VsConference: "",
    VsDivision: "",
  };

  const response = await axios.get(url, {
    headers: NBA_HEADERS,
    params,
    timeout: CONFIG.TIMEOUT_MS,
  });

  const headers = response.data.resultSets[0].headers;
  const rows = response.data.resultSets[0].rowSet;

  const teamStats = rows.map((row) => {
    const stats = {};
    headers.forEach((header, index) => {
      stats[header] = row[index];
    });
    return stats;
  });

  console.log(`[fetchTeamStats] Got ${teamStats.length} teams`);
  return teamStats;
}

async function fetchAdvancedTeamStats(season = DEFAULT_SEASON) {
  const url = `${NBA_BASE_URL}/leaguedashteamstats`;
  const params = {
    Conference: "",
    DateFrom: "",
    DateTo: "",
    Division: "",
    GameScope: "",
    GameSegment: "",
    Height: "",
    LastNGames: 0,
    LeagueID: "00",
    Location: "",
    MeasureType: "Advanced",
    Month: 0,
    OpponentTeamID: 0,
    Outcome: "",
    PORound: 0,
    PaceAdjust: "N",
    PerMode: "PerGame",
    Period: 0,
    PlayerExperience: "",
    PlayerPosition: "",
    PlusMinus: "N",
    Rank: "N",
    Season: season,
    SeasonSegment: "",
    SeasonType: "Regular Season",
    ShotClockRange: "",
    StarterBench: "",
    TeamID: 0,
    TwoWay: 0,
    VsConference: "",
    VsDivision: "",
  };

  const response = await axios.get(url, {
    headers: NBA_HEADERS,
    params,
    timeout: CONFIG.TIMEOUT_MS,
  });

  const headers = response.data.resultSets[0].headers;
  const rows = response.data.resultSets[0].rowSet;

  const advancedStats = rows.map((row) => {
    const stats = {};
    headers.forEach((header, index) => {
      stats[header] = row[index];
    });
    return stats;
  });

  console.log(`[fetchAdvancedTeamStats] Got ${advancedStats.length} teams`);
  return advancedStats;
}

export async function fetchAllNBAData(season = DEFAULT_SEASON) {
  console.log(`[fetchAllNBAData] Starting fetch for ${season}...`);
  const startTime = Date.now();

  try {
    // Fetch basic stats with retry
    const teamStats = await withRetry(
      () => fetchTeamStats(season),
      "teamStats"
    );

    // Delay between API calls
    await sleep(CONFIG.API_CALL_DELAY_MS);

    // Fetch advanced stats with retry
    const advancedStats = await withRetry(
      () => fetchAdvancedTeamStats(season),
      "advancedStats"
    );

    // Combine the data
    const combinedData = teamStats.map((team) => {
      const advanced = advancedStats.find((a) => a.TEAM_ID === team.TEAM_ID);
      
      return {
        teamId: team.TEAM_ID,
        abbreviation: TEAM_ABBREVIATIONS[team.TEAM_ID] || "UNK",
        name: team.TEAM_NAME,
        gamesPlayed: team.GP,
        wins: team.W,
        losses: team.L,
        pointsPerGame: team.PTS,
        fieldGoalPct: team.FG_PCT,
        threePointPct: team.FG3_PCT,
        freeThrowPct: team.FT_PCT,
        assistsPerGame: team.AST,
        reboundsPerGame: team.REB,
        turnoversPerGame: team.TOV,
        oppPointsPerGame: team.OPP_PTS || 0,
        offensiveRating: advanced?.OFF_RATING || null,
        defensiveRating: advanced?.DEF_RATING || null,
        pace: advanced?.PACE || null,
      };
    });

    const duration = Date.now() - startTime;
    console.log(`[fetchAllNBAData] Complete: ${combinedData.length} teams in ${duration}ms`);
    
    return combinedData;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[fetchAllNBAData] Failed after ${duration}ms:`, error.message);
    console.error(`[fetchAllNBAData] This usually means:`);
    console.error(`  1. NBA API is having issues`);
    console.error(`  2. NBA API is blocking cloud provider IPs`);
    console.error(`  3. Network connectivity problems`);
    console.error(`[fetchAllNBAData] Try running this locally instead.`);
    throw error;
  }
}

export { fetchTeamStats, fetchAdvancedTeamStats };