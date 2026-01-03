type Game = {
  id: number;
  gameId: string;
  gameDate: Date;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
};

type MatchupHistory = {
  gamesPlayed: number;
  team1Wins: number;
  team2Wins: number;
  avgPointDifferential: number; // Positive favors team1, negative favors team2
  recentForm: number; // -1 to 1, based on last 3 games
  confidenceAdjustment: number; // How much to adjust the prediction
};

/**
 * Calculate matchup history between two teams
 */
export function calculateMatchupHistory(
  team1Id: number,
  team2Id: number,
  games: Game[]
): MatchupHistory {
  if (games.length === 0) {
    return {
      gamesPlayed: 0,
      team1Wins: 0,
      team2Wins: 0,
      avgPointDifferential: 0,
      recentForm: 0,
      confidenceAdjustment: 0
    };
  }

  let team1Wins = 0;
  let team2Wins = 0;
  let totalPointDiff = 0;

  // Calculate wins and point differential
  games.forEach(game => {
    if (game.homeScore === null || game.awayScore === null) return;

    const team1IsHome = game.homeTeamId === team1Id;
    const team1Score = team1IsHome ? game.homeScore : game.awayScore;
    const team2Score = team1IsHome ? game.awayScore : game.homeScore;
    
    const pointDiff = team1Score - team2Score;
    totalPointDiff += pointDiff;

    if (pointDiff > 0) {
      team1Wins++;
    } else {
      team2Wins++;
    }
  });

  const avgPointDifferential = totalPointDiff / games.length;

  // Calculate recent form (last 3 games weighted more heavily)
  const recentGames = games.slice(0, Math.min(3, games.length));
  let recentPoints = 0;
  
  recentGames.forEach(game => {
    if (game.homeScore === null || game.awayScore === null) return;
    
    const team1IsHome = game.homeTeamId === team1Id;
    const team1Score = team1IsHome ? game.homeScore : game.awayScore;
    const team2Score = team1IsHome ? game.awayScore : game.homeScore;
    
    if (team1Score > team2Score) {
      recentPoints += 1;
    } else {
      recentPoints -= 1;
    }
  });

  const recentForm = recentGames.length > 0 ? recentPoints / recentGames.length : 0;

  // Calculate confidence adjustment
  // This will modify our prediction based on matchup history
  // More games = more confidence in the adjustment
  const gameWeight = Math.min(games.length / 4, 1); // Cap at 4 games for full weight
  const recordDominance = (team1Wins - team2Wins) / games.length; // -1 to 1
  
  // Combine point differential and record, weighted by number of games
  const confidenceAdjustment = (
    (avgPointDifferential * 0.6) + // Point diff matters more
    (recordDominance * 10 * 0.4)    // Record matters less
  ) * gameWeight;

  return {
    gamesPlayed: games.length,
    team1Wins,
    team2Wins,
    avgPointDifferential,
    recentForm,
    confidenceAdjustment
  };
}

/**
 * Adjust prediction based on matchup history
 */
export function adjustPredictionWithHistory(
  baseNetRatingDiff: number,
  matchupHistory: MatchupHistory
): {
  adjustedNetRatingDiff: number;
  adjustmentAmount: number;
  historicalContext: string;
} {
  const adjustmentAmount = matchupHistory.confidenceAdjustment;
  const adjustedNetRatingDiff = baseNetRatingDiff + adjustmentAmount;

  let historicalContext = '';
  
  if (matchupHistory.gamesPlayed === 0) {
    historicalContext = 'No previous matchups this season';
  } else if (matchupHistory.gamesPlayed === 1) {
    historicalContext = `1 previous game (${matchupHistory.team1Wins > 0 ? 'Won' : 'Lost'})`;
  } else {
    const record = `${matchupHistory.team1Wins}-${matchupHistory.team2Wins}`;
    const avgDiff = Math.abs(matchupHistory.avgPointDifferential).toFixed(1);
    
    if (matchupHistory.team1Wins > matchupHistory.team2Wins) {
      historicalContext = `Leads season series ${record} (avg margin: +${avgDiff})`;
    } else if (matchupHistory.team2Wins > matchupHistory.team1Wins) {
      historicalContext = `Trails season series ${record} (avg margin: -${avgDiff})`;
    } else {
      historicalContext = `Season series tied ${record}`;
    }
  }

  return {
    adjustedNetRatingDiff,
    adjustmentAmount,
    historicalContext
  };
}

/**
 * Calculate home court advantage adjustment
 * NBA home teams typically have a 2-3 point advantage
 */
export function calculateHomeCourtAdvantage(
  team1IsHome: boolean | null,
  team1Stats: { wins: number; losses: number },
  team2Stats: { wins: number; losses: number }
): {
  adjustment: number;
  description: string;
} {
  if (team1IsHome === null) {
    return {
      adjustment: 0,
      description: 'Neutral court (no advantage)'
    };
  }

  // NBA average home court advantage is about 2.5 points
  const baseHomeAdvantage = 2.5;
  
  // Better teams tend to have stronger home court advantage
  const team1WinPct = team1Stats.wins / (team1Stats.wins + team1Stats.losses);
  const team2WinPct = team2Stats.wins / (team2Stats.wins + team2Stats.losses);
  
  // Scale home advantage based on team quality (better teams = stronger home court)
  const qualityMultiplier = team1IsHome ? 
    (0.8 + (team1WinPct * 0.4)) : 
    (0.8 + (team2WinPct * 0.4));
  
  const homeAdvantage = baseHomeAdvantage * qualityMultiplier;
  
  const adjustment = team1IsHome ? homeAdvantage : -homeAdvantage;
  
  const description = team1IsHome 
    ? `Team 1 home court advantage (+${homeAdvantage.toFixed(1)} pts)`
    : `Team 2 home court advantage (-${homeAdvantage.toFixed(1)} pts)`;
  
  return {
    adjustment,
    description
  };
}