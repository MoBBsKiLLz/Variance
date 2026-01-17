/**
 * Custom hooks for NBA data fetching operations
 * Following principles: DRY, Type Safety, TanStack Query patterns
 */

import { useState } from 'react';

type FetchStatus = 'idle' | 'success' | 'error';

interface UseFetchDataResult {
  isLoading: boolean;
  status: FetchStatus;
  message: string;
  fetchData: () => Promise<void>;
}

/**
 * Generic hook for fetching NBA data
 * @param endpoint - API endpoint to call
 * @param season - NBA season to fetch
 * @param successMessageFn - Function to generate success message from response
 */
function useFetchNBAData(
  endpoint: string,
  season: string,
  successMessageFn: (data: { teamsCount?: number; gamesCount?: number }) => string
): UseFetchDataResult {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [message, setMessage] = useState<string>('');

  const fetchData = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ season }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setStatus('success');
      setMessage(successMessageFn(data));
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, status, message, fetchData };
}

/**
 * Hook for fetching team stats
 */
export function useFetchTeams(season: string): UseFetchDataResult {
  return useFetchNBAData(
    '/api/fetch-nba-teams',
    season,
    (data) => `Successfully imported ${data.teamsCount} teams for ${season} season`
  );
}

/**
 * Hook for fetching season games
 */
export function useFetchGames(season: string): UseFetchDataResult {
  return useFetchNBAData(
    '/api/fetch-nba-games',
    season,
    (data) => `Successfully imported ${data.gamesCount} games for ${season} season`
  );
}

/**
 * Hook for fetching today's games
 */
export function useFetchTodaysGames(season: string): UseFetchDataResult {
  return useFetchNBAData(
    '/api/fetch-todays-games',
    season,
    (data) => `Successfully updated ${data.gamesCount} games for today`
  );
}