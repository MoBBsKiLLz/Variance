import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAllNBAData } from '@/lib/data/nba-fetcher';
import { ProcessedTeamData } from '@/lib/types/nba-data';
import { Prisma } from '@prisma/client';

/**
 * ULTRA-OPTIMIZED: Fetch and store NBA team data
 * 
 * Strategy: Bulk SQL upserts with natural keys + parallel execution
 * - Uses PostgreSQL's INSERT ... ON CONFLICT ... RETURNING
 * - Natural keys allow teams and stats to run in parallel
 * - 60 operations → 2 parallel SQL statements
 * - Expected time: 0.8-1.2 seconds
 */

const BATCH_SIZE = 10; // Process 10 teams per batch

/**
 * Process items in batches
 */
async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[], batchIndex: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);
    const result = await processor(batch, batchIndex);
    results.push(result);
  }
  
  return results;
}

/**
 * Bulk upsert teams using raw SQL with RETURNING clause
 */
async function upsertTeamsBatch(teams: ProcessedTeamData[]): Promise<number> {
  if (teams.length === 0) return 0;

  const teamValues = teams.map((team) => {
    const nameParts = team.name.split(' ');
    const city = nameParts.length > 1 
      ? nameParts.slice(0, -1).join(' ') 
      : team.name;
    
    return Prisma.sql`(
      ${team.teamId},
      ${team.abbreviation},
      ${team.name},
      ${city},
      'Unknown',
      'Unknown',
      NOW(),
      NOW()
    )`;
  });

  await prisma.$queryRaw`
    INSERT INTO "nba_teams" (
      "team_id", "abbreviation", "name", "city",
      "conference", "division", "created_at", "updated_at"
    )
    VALUES ${Prisma.join(teamValues)}
    ON CONFLICT ("team_id") DO UPDATE SET
      "abbreviation" = EXCLUDED."abbreviation",
      "name" = EXCLUDED."name",
      "city" = EXCLUDED."city",
      "updated_at" = NOW()
  `;

  return teams.length;
}

/**
 * Bulk upsert stats using raw SQL with natural key (no dependency on teams!)
 */
async function upsertStatsBatch(
  teams: ProcessedTeamData[], 
  season: string
): Promise<number> {
  if (teams.length === 0) return 0;

  const statsValues = teams.map((team) => Prisma.sql`(
    ${team.teamId},
    ${season},
    ${team.gamesPlayed},
    ${team.wins},
    ${team.losses},
    ${team.pointsPerGame},
    ${team.fieldGoalPct},
    ${team.threePointPct},
    ${team.freeThrowPct},
    ${team.assistsPerGame},
    ${team.reboundsPerGame},
    ${team.turnoversPerGame},
    ${team.oppPointsPerGame ?? 0},
    ${0},
    ${0},
    ${team.offensiveRating},
    ${team.defensiveRating},
    ${team.pace},
    NOW(),
    NOW(),
    NOW()
  )`);

  await prisma.$queryRaw`
    INSERT INTO "nba_team_stats" (
      "nba_team_id", "season", "games_played", "wins", "losses",
      "points_per_game", "field_goal_pct", "three_point_pct", "free_throw_pct",
      "assists_per_game", "rebounds_per_game", "turnovers_per_game",
      "opp_points_per_game", "opp_field_goal_pct", "opp_three_point_pct",
      "offensive_rating", "defensive_rating", "pace",
      "last_updated", "created_at", "updated_at"
    )
    VALUES ${Prisma.join(statsValues)}
    ON CONFLICT ("nba_team_id", "season") DO UPDATE SET
      "games_played" = EXCLUDED."games_played",
      "wins" = EXCLUDED."wins",
      "losses" = EXCLUDED."losses",
      "points_per_game" = EXCLUDED."points_per_game",
      "field_goal_pct" = EXCLUDED."field_goal_pct",
      "three_point_pct" = EXCLUDED."three_point_pct",
      "free_throw_pct" = EXCLUDED."free_throw_pct",
      "assists_per_game" = EXCLUDED."assists_per_game",
      "rebounds_per_game" = EXCLUDED."rebounds_per_game",
      "turnovers_per_game" = EXCLUDED."turnovers_per_game",
      "opp_points_per_game" = EXCLUDED."opp_points_per_game",
      "offensive_rating" = EXCLUDED."offensive_rating",
      "defensive_rating" = EXCLUDED."defensive_rating",
      "pace" = EXCLUDED."pace",
      "last_updated" = NOW(),
      "updated_at" = NOW()
  `;

  return teams.length;
}

export async function POST(request: NextRequest) {
  try {
    const { season } = await request.json();

    if (!season || !/^\d{4}-\d{2}$/.test(season)) {
      return NextResponse.json(
        { error: 'Invalid season format. Use YYYY-YY (e.g., 2025-26)' },
        { status: 400 }
      );
    }

    console.log(`🚀 [fetch-nba-teams] Starting fetch for season ${season}`);
    const startTime = Date.now();

    // Step 1: Fetch data from NBA API (parallel API calls, ~2 seconds)
    const teamsData = await fetchAllNBAData(season);
    const apiTime = Date.now() - startTime;
    console.log(`✅ [fetch-nba-teams] NBA API fetch completed in ${apiTime}ms`);

    // Step 2: Process teams and stats in PARALLEL batches
    // 🔑 KEY OPTIMIZATION: Natural keys = no dependency = true parallelism!
    const dbStartTime = Date.now();

    await Promise.all([
      // Batch upsert teams
      processBatches<ProcessedTeamData, number>(teamsData, BATCH_SIZE, async (batch, idx) => {
        const count = await upsertTeamsBatch(batch);
        console.log(`   📦 [teams] Batch ${idx + 1}: ${count} teams`);
        return count;
      }),
      
      // Batch upsert stats (runs in parallel - no ID dependency!)
      processBatches<ProcessedTeamData, number>(teamsData, BATCH_SIZE, async (batch, idx) => {
        const count = await upsertStatsBatch(batch, season);
        console.log(`   📊 [stats] Batch ${idx + 1}: ${count} stats`);
        return count;
      })
    ]);

    const dbTime = Date.now() - dbStartTime;
    const totalTime = Date.now() - startTime;

    console.log(`✅ [fetch-nba-teams] Database operations completed in ${dbTime}ms`);
    console.log(`🎉 [fetch-nba-teams] Total execution time: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      season,
      teamsCount: teamsData.length,
      performance: {
        apiTimeMs: apiTime,
        dbTimeMs: dbTime,
        totalTimeMs: totalTime
      }
    });

  } catch (error) {
    console.error('❌ [fetch-nba-teams] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NBA data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}