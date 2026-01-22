const NBA_EXPONENT = 13.91;

export function calculatePythagoreanExpectation(
  pointsScored: number,
  pointsAllowed: number
): number {
  if (pointsAllowed === 0) return 1.0;
  
  const scoredPower = Math.pow(pointsScored, NBA_EXPONENT);
  const allowedPower = Math.pow(pointsAllowed, NBA_EXPONENT);
  
  return scoredPower / (scoredPower + allowedPower);
}

export function calculateLuckFactor(
  actualWinPct: number,
  pythagoreanExpectation: number
): number {
  // Positive = overperforming (due for regression)
  // Negative = underperforming (due for improvement)
  return actualWinPct - pythagoreanExpectation;
}

export interface TeamExpectation {
  pythagoreanWinPct: number;
  luckFactor: number;
  regression: 'positive' | 'negative' | 'neutral';
}

export function analyzePythagorean(
  wins: number,
  losses: number,
  pointsScored: number,
  pointsAllowed: number
): TeamExpectation {
  const gamesPlayed = wins + losses;
  const actualWinPct = wins / gamesPlayed;
  const pythagoreanWinPct = calculatePythagoreanExpectation(pointsScored, pointsAllowed);
  const luckFactor = calculateLuckFactor(actualWinPct, pythagoreanWinPct);
  
  let regression: 'positive' | 'negative' | 'neutral';
  if (luckFactor > 0.05) {
    regression = 'negative'; // Overperforming, expect decline
  } else if (luckFactor < -0.05) {
    regression = 'positive'; // Underperforming, expect improvement
  } else {
    regression = 'neutral';
  }
  
  return {
    pythagoreanWinPct,
    luckFactor,
    regression,
  };
}