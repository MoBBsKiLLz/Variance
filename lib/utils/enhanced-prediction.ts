/**
 * Enhanced Prediction Algorithm v2.0
 * 
 * Improvements over v1.0:
 * - Pythagorean win expectation instead of raw win%
 * - Home court advantage integration
 * - Four factors support (when available)
 * - Confidence scoring based on multiple factors
 * 
 * Target accuracy: 68-70% (up from 65%)
 */

import { calculateHomeCourtAdvantage, HomeAwayRecord } from './home-court-advantage';
import { analyzePythagorean } from './pythagorean-expectation';

export interface EnhancedTeamStats {
  teamId: number;
  abbreviation: string;
  name: string;
  
  // Core efficiency metrics
  offensiveRating: number;
  defensiveRating: number;
  
  // Record and expectations
  wins: number;
  losses: number;
  totalPointsScored: number;
  totalPointsAllowed: number;
  
  // Home/Away splits (for home court advantage)
  homeRecord?: HomeAwayRecord;
  awayRecord?: HomeAwayRecord;
  
  // Four factors (optional, Phase 1 Week 2)
  fourFactors?: {
    offensive: FourFactors;
    defensive: FourFactors;
  };
}

export interface FourFactors {
  effectiveFGPct: number;
  turnoverPct: number;
  offensiveReboundPct: number;
  freeThrowRate: number;
}

export interface PredictionResult {
  teamAWinProbability: number;
  teamBWinProbability: number;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  components: {
    base: number;
    homeAdvantage: number;
    fourFactors?: number;
  };
  keyInsights: string[];
}

/**
 * Enhanced prediction weights (Phase 1)
 */
const WEIGHTS = {
  offensiveRating: 0.28,      // 28%
  defensiveRating: 0.28,      // 28%
  pythagoreanWinPct: 0.14,    // 14%
  homeCourtAdvantage: 0.15,   // 15%
  fourFactors: 0.10,          // 10%
  restDifferential: 0.05,     // 5% (Phase 1 Week 3)
};

/**
 * Calculate enhanced matchup prediction with contextual factors
 * 
 * @param teamA - Enhanced stats for team A
 * @param teamB - Enhanced stats for team B
 * @param isTeamAHome - Is team A playing at home?
 * @returns Complete prediction with confidence and breakdowns
 */
export function calculateEnhancedPrediction(
  teamA: EnhancedTeamStats,
  teamB: EnhancedTeamStats,
  isTeamAHome: boolean
): PredictionResult {
  const keyInsights: string[] = [];
  
  // Step 1: Calculate Pythagorean expectations
  const pythagA = analyzePythagorean(
    teamA.wins,
    teamA.losses,
    teamA.totalPointsScored,
    teamA.totalPointsAllowed
  );
  
  const pythagB = analyzePythagorean(
    teamB.wins,
    teamB.losses,
    teamB.totalPointsScored,
    teamB.totalPointsAllowed
  );
  
  // Track luck factors for insights
  if (Math.abs(pythagA.luckFactor) > 0.10) {
    keyInsights.push(
      `${teamA.abbreviation} has ${pythagA.regression === 'negative' ? 'overperformed' : 'underperformed'} ` +
      `their point differential (${(pythagA.luckFactor * 100).toFixed(1)}% luck factor)`
    );
  }
  
  if (Math.abs(pythagB.luckFactor) > 0.10) {
    keyInsights.push(
      `${teamB.abbreviation} has ${pythagB.regression === 'negative' ? 'overperformed' : 'underperformed'} ` +
      `their point differential (${(pythagB.luckFactor * 100).toFixed(1)}% luck factor)`
    );
  }
  
  // Step 2: Calculate composite ratings with Pythagorean instead of raw win%
  const ratingA = (
    teamA.offensiveRating * WEIGHTS.offensiveRating +
    (100 - teamA.defensiveRating) * WEIGHTS.defensiveRating +
    pythagA.pythagoreanWinPct * 100 * WEIGHTS.pythagoreanWinPct
  );
  
  const ratingB = (
    teamB.offensiveRating * WEIGHTS.offensiveRating +
    (100 - teamB.defensiveRating) * WEIGHTS.defensiveRating +
    pythagB.pythagoreanWinPct * 100 * WEIGHTS.pythagoreanWinPct
  );
  
  // Step 3: Base probability from ratings (70% of total weight)
  const baseProbA = ratingA / (ratingA + ratingB);
  
  // Step 4: Home court advantage adjustment (15% of total weight)
  let homeAdvantageAdjustment = 0;
  if (isTeamAHome) {
    const homeAdv = calculateHomeCourtAdvantage(
      teamA.teamId,
      teamB.teamId,
      teamA.homeRecord,
      teamB.awayRecord
    );
    homeAdvantageAdjustment = homeAdv.totalAdvantage / 100 * WEIGHTS.homeCourtAdvantage;
    
    if (homeAdv.breakdown.altitude > 0) {
      keyInsights.push(
        `${teamA.abbreviation} gets ${homeAdv.breakdown.altitude.toFixed(1)}% altitude advantage`
      );
    }
  } else {
    const homeAdv = calculateHomeCourtAdvantage(
      teamB.teamId,
      teamA.teamId,
      teamB.homeRecord,
      teamA.awayRecord
    );
    homeAdvantageAdjustment = -(homeAdv.totalAdvantage / 100 * WEIGHTS.homeCourtAdvantage);
    
    if (homeAdv.breakdown.altitude > 0) {
      keyInsights.push(
        `${teamB.abbreviation} gets ${homeAdv.breakdown.altitude.toFixed(1)}% altitude advantage`
      );
    }
  }
  
  // Step 5: Four factors matchup (10% of total weight) - if available
  let fourFactorsAdjustment = 0;
  if (teamA.fourFactors && teamB.fourFactors) {
    fourFactorsAdjustment = calculateFourFactorsAdvantage(
      teamA.fourFactors,
      teamB.fourFactors
    ) * WEIGHTS.fourFactors;
    
    // Note: Four factors implementation coming in Week 2
  }
  
  // Step 6: Combine all components
  let finalProbA = baseProbA + homeAdvantageAdjustment + fourFactorsAdjustment;
  
  // Ensure probability stays within bounds [1%, 99%]
  finalProbA = Math.max(0.01, Math.min(0.99, finalProbA));
  
  // Step 7: Calculate confidence
  const confidence = calculateConfidenceLevel(
    ratingA,
    ratingB,
    finalProbA,
    teamA.wins + teamA.losses,
    teamB.wins + teamB.losses
  );
  
  // Step 8: Add rating differential insight
  const ratingDiff = Math.abs(ratingA - ratingB);
  if (ratingDiff > 10) {
    keyInsights.push(
      `Large rating differential (${ratingDiff.toFixed(1)} points) favors ${ratingA > ratingB ? teamA.abbreviation : teamB.abbreviation}`
    );
  }
  
  return {
    teamAWinProbability: finalProbA * 100,
    teamBWinProbability: (1 - finalProbA) * 100,
    confidence: confidence.level,
    confidenceScore: confidence.score,
    components: {
      base: baseProbA * 100,
      homeAdvantage: homeAdvantageAdjustment * 100,
      fourFactors: fourFactorsAdjustment * 100,
    },
    keyInsights,
  };
}

/**
 * Calculate four factors advantage (placeholder for Week 2)
 */
function calculateFourFactorsAdvantage(
  teamAFactors: { offensive: FourFactors; defensive: FourFactors },
  teamBFactors: { offensive: FourFactors; defensive: FourFactors }
): number {
  // TODO: Implement in Week 2
  // Compare team A offense vs team B defense
  // Weight by importance: eFG% 40%, TOV% 25%, OREB% 20%, FTRate 15%
  return 0;
}

/**
 * Calculate prediction confidence based on multiple factors
 */
function calculateConfidenceLevel(
  ratingA: number,
  ratingB: number,
  finalProb: number,
  gamesPlayedA: number,
  gamesPlayedB: number
): { level: 'high' | 'medium' | 'low'; score: number } {
  let confidenceScore = 50; // Start at 50
  
  // Factor 1: Rating differential (larger diff = higher confidence)
  const ratingDiff = Math.abs(ratingA - ratingB);
  if (ratingDiff > 15) {
    confidenceScore += 25;
  } else if (ratingDiff > 10) {
    confidenceScore += 15;
  } else if (ratingDiff > 5) {
    confidenceScore += 5;
  } else {
    confidenceScore -= 10; // Close matchup = lower confidence
  }
  
  // Factor 2: Sample size (more games = higher confidence)
  const minGamesPlayed = Math.min(gamesPlayedA, gamesPlayedB);
  if (minGamesPlayed >= 30) {
    confidenceScore += 15;
  } else if (minGamesPlayed >= 20) {
    confidenceScore += 10;
  } else if (minGamesPlayed >= 10) {
    confidenceScore += 5;
  } else {
    confidenceScore -= 15; // Very early season
  }
  
  // Factor 3: Prediction extremity (very lopsided = higher confidence)
  const probDistance = Math.abs(finalProb - 0.5);
  if (probDistance > 0.25) {
    confidenceScore += 10;
  } else if (probDistance < 0.10) {
    confidenceScore -= 10; // Toss-up game
  }
  
  // Cap confidence score
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));
  
  // Determine confidence level
  let level: 'high' | 'medium' | 'low';
  if (confidenceScore >= 75) {
    level = 'high';
  } else if (confidenceScore >= 50) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return { level, score: confidenceScore };
}