/**
 * Fetch Teams Script - For GitHub Actions
 * Fetches and stores NBA team data without timeout limits
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { fetchAllNBAData } from '../lib/data/nba-fetcher.js';

const prisma = new PrismaClient();

interface ProcessedTeamData {
  teamId: number;
  abbreviation: string;
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsPerGame: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  turnoversPerGame: number;
  oppPointsPerGame: number;
  offensiveRating: number | null;
  defensiveRating: number | null;
  pace: number | null;
}

const BATCH_SIZE = 10;

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

async function main() {
  const season = process.argv[2] || '2025-26';
  
  console.log(`🚀 Fetching NBA team data for season ${season}...`);
  const startTime = Date.now();

  try {
    // Fetch data from NBA API
    const teamsData = await fetchAllNBAData(season) as ProcessedTeamData[];
    const apiTime = Date.now() - startTime;
    console.log(`✅ NBA API fetch completed in ${apiTime}ms`);

    // Process teams and stats in parallel
    const dbStartTime = Date.now();

    await Promise.all([
      processBatches<ProcessedTeamData, number>(teamsData, BATCH_SIZE, async (batch, idx) => {
        const count = await upsertTeamsBatch(batch);
        console.log(`   📦 [teams] Batch ${idx + 1}: ${count} teams`);
        return count;
      }),
      
      processBatches<ProcessedTeamData, number>(teamsData, BATCH_SIZE, async (batch, idx) => {
        const count = await upsertStatsBatch(batch, season);
        console.log(`   📊 [stats] Batch ${idx + 1}: ${count} stats`);
        return count;
      })
    ]);

    const dbTime = Date.now() - dbStartTime;
    const totalTime = Date.now() - startTime;

    console.log(`✅ Database operations completed in ${dbTime}ms`);
    console.log(`🎉 Total execution time: ${totalTime}ms`);
    console.log(`✅ Successfully updated ${teamsData.length} teams for ${season}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
