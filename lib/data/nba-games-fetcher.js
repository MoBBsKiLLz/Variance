/**
 * NBA Games Data Fetcher
 * Fetches game results for a given season
 */

import axios from 'axios';
import { NBA_HEADERS, NBA_BASE_URL, DEFAULT_SEASON } from '../constants/nba.js';

/**
 * Fetch all games for a season
 */
export async function fetchSeasonGames(season = DEFAULT_SEASON) {
  try {
    console.log(`Fetching games for ${season} season...`);
    
    const url = `${NBA_BASE_URL}/leaguegamelog`;
    const params = {
      Counter: 0,
      DateFrom: '',
      DateTo: '',
      Direction: 'DESC',
      LeagueID: '00',
      PlayerOrTeam: 'T',  // T for Team
      Season: season,
      SeasonType: 'Regular Season',
      Sorter: 'DATE'
    };
    
    const response = await axios.get(url, {
      headers: NBA_HEADERS,
      params
    });
    
    const headers = response.data.resultSets[0].headers;
    const rows = response.data.resultSets[0].rowSet;
    
    const games = rows.map(row => {
      const game = {};
      headers.forEach((header, index) => {
        game[header] = row[index];
      });
      return game;
    });
    
    // Group by actual game (since each game has 2 entries - one per team)
    const gameMap = new Map();
    
    games.forEach(game => {
      const gameId = game.GAME_ID;
      
      if (!gameMap.has(gameId)) {
        gameMap.set(gameId, {
          gameId: gameId,
          gameDate: game.GAME_DATE,
          matchup: game.MATCHUP,
          teams: []
        });
      }
      
      gameMap.get(gameId).teams.push({
        teamId: game.TEAM_ID,
        teamAbbreviation: game.TEAM_ABBREVIATION,
        isHome: !game.MATCHUP.includes('@'), // If no @, team is home
        points: game.PTS,
        won: game.WL === 'W'
      });
    });
    
    // Convert map to array and structure properly
    const structuredGames = Array.from(gameMap.values()).map(game => {
      const homeTeam = game.teams.find(t => t.isHome);
      const awayTeam = game.teams.find(t => !t.isHome);
      
      return {
        gameId: game.gameId,
        gameDate: new Date(game.gameDate),
        homeTeamId: homeTeam?.teamId,
        awayTeamId: awayTeam?.teamId,
        homeScore: homeTeam?.points,
        awayScore: awayTeam?.points,
        status: 'FINAL'
      };
    }).filter(game => game.homeTeamId && game.awayTeamId); // Filter out incomplete games
    
    console.log(`Fetched ${structuredGames.length} games for ${season}`);
    return structuredGames;
    
  } catch (error) {
    console.error('Error fetching season games:', error.message);
    throw error;
  }
}

/**
 * Fetch games between two specific teams
 */
export async function fetchHeadToHeadGames(team1Id, team2Id, season = '2025-26') {
  const allGames = await fetchSeasonGames(season);
  
  return allGames.filter(game => 
    (game.homeTeamId === team1Id && game.awayTeamId === team2Id) ||
    (game.homeTeamId === team2Id && game.awayTeamId === team1Id)
  );
}