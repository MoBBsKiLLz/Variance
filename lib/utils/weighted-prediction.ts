import type { RecentForm } from '@/lib/types/team';

type TeamStats = {
  offensiveRating: number | null;
  defensiveRating: number | null;
  wins: number;
  losses: number;
};

/**
 * Calculate weighted ratings that emphasize recent performance
 * 70% weight to last 10 games, 30% to season stats
 */
export function calculateWeightedRatings(
  seasonStats: TeamStats,
  recentForm: RecentForm | null
): {
  weightedOffensiveRating: number;
  weightedDefensiveRating: number;
  formTrend: 'hot' | 'cold' | 'neutral';
} {
  if (!seasonStats.offensiveRating || !seasonStats.defensiveRating) {
    return {
      weightedOffensiveRating: 0,
      weightedDefensiveRating: 0,
      formTrend: 'neutral'
    };
  }

  // If no recent form data, just use season stats
  if (!recentForm || !recentForm.recentOffensiveRating || !recentForm.recentDefensiveRating) {
    return {
      weightedOffensiveRating: seasonStats.offensiveRating,
      weightedDefensiveRating: seasonStats.defensiveRating,
      formTrend: 'neutral'
    };
  }

  // Weight: 70% recent (last 10 games), 30% season
  const RECENT_WEIGHT = 0.70;
  const SEASON_WEIGHT = 0.30;

  const weightedOffensiveRating = 
    (recentForm.recentOffensiveRating * RECENT_WEIGHT) + 
    (seasonStats.offensiveRating * SEASON_WEIGHT);

  const weightedDefensiveRating = 
    (recentForm.recentDefensiveRating * RECENT_WEIGHT) + 
    (seasonStats.defensiveRating * SEASON_WEIGHT);

  // Determine form trend
  const recentNetRating = recentForm.recentOffensiveRating - recentForm.recentDefensiveRating;
  const seasonNetRating = seasonStats.offensiveRating - seasonStats.defensiveRating;
  const netRatingDiff = recentNetRating - seasonNetRating;

  let formTrend: 'hot' | 'cold' | 'neutral' = 'neutral';
  if (netRatingDiff > 3) formTrend = 'hot';
  if (netRatingDiff < -3) formTrend = 'cold';

  return {
    weightedOffensiveRating,
    weightedDefensiveRating,
    formTrend
  };
}

/**
 * Get human-readable form description
 */
export function getFormDescription(
  recentForm: RecentForm | null,
  formTrend: 'hot' | 'cold' | 'neutral'
): string {
  if (!recentForm || recentForm.gamesPlayed === 0) {
    return 'No recent games';
  }

  const record = `${recentForm.wins}-${recentForm.losses}`;
  
  if (formTrend === 'hot') {
    return `🔥 Hot (${record} in last ${recentForm.gamesPlayed})`;
  } else if (formTrend === 'cold') {
    return `🧊 Cold (${record} in last ${recentForm.gamesPlayed})`;
  } else {
    return `${record} in last ${recentForm.gamesPlayed}`;
  }
}