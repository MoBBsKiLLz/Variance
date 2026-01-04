/**
 * Fetch NBA Data Script
 * Fetches NBA team statistics and stores them in the database
 */

import { prisma } from '@/lib/prisma';
import { fetchAllNBAData } from '../lib/data/nba-fetcher.js';

async function seedNBATeams() {
    console.log('Starting NBA data import...\n');

    try {
        // Fetch data from NBA API
        const teamsData = await fetchAllNBAData();

        console.log('Storing data in the database...\n');

        const season = '2025-26';
        let teamsCreated = 0;
        let statsCreated = 0;

        for (const teamData of teamsData) {
            // Create or update team
            const team = await prisma.nBATeam.upsert({
                where: { teamId: teamData.teamId },
                update: {
                    abbreviation: teamData.abbreviation,
                    name: teamData.name,
                    conference: 'Unknown',
                    division: 'Unknown',
                    city: teamData.name.split(' ').slice(0, -1).join(' ')
                },
                create: {
                    teamId: teamData.teamId,
                    abbreviation: teamData.abbreviation,
                    name: teamData.name,
                    conference: 'Unknown',
                    division: 'Unknown',
                    city: teamData.name.split(' ').slice(0, -1).join(' ')
                }
            });

            teamsCreated++;

            // Create or update team stats
            await prisma.nBATeamStats.upsert({
                where: {
                    teamId_season: {
                        teamId: team.id,
                        season: season
                    }
                },
                update: {
                    gamesPlayed: teamData.gamesPlayed,
                    wins: teamData.wins,
                    losses: teamData.losses,
                    pointsPerGame: teamData.pointsPerGame,
                    fieldGoalPct: teamData.fieldGoalPct,
                    threePointPct: teamData.threePointPct,
                    freeThrowPct: teamData.freeThrowPct,
                    assistsPerGame: teamData.assistsPerGame,
                    reboundsPerGame: teamData.reboundsPerGame,
                    turnoversPerGame: teamData.turnoversPerGame,
                    oppPointsPerGame: teamData.oppPointsPerGame || 0,
                    oppFieldGoalPct: 0,
                    oppThreePointPct: 0,
                    offensiveRating: teamData.offensiveRating,
                    defensiveRating: teamData.defensiveRating,
                    pace: teamData.pace,
                    lastUpdated: new Date()
                },
                create: {
                    teamId: team.id,
                    season: season,
                    gamesPlayed: teamData.gamesPlayed,
                    wins: teamData.wins,
                    losses: teamData.losses,
                    pointsPerGame: teamData.pointsPerGame,
                    fieldGoalPct: teamData.fieldGoalPct,
                    threePointPct: teamData.threePointPct,
                    freeThrowPct: teamData.freeThrowPct,
                    assistsPerGame: teamData.assistsPerGame,
                    reboundsPerGame: teamData.reboundsPerGame,
                    turnoversPerGame: teamData.turnoversPerGame,
                    oppPointsPerGame: teamData.oppPointsPerGame || 0,
                    oppFieldGoalPct: 0,
                    oppThreePointPct: 0,
                    offensiveRating: teamData.offensiveRating,
                    defensiveRating: teamData.defensiveRating,
                    pace: teamData.pace
                }
            });

            statsCreated++;
            console.log(` ${team.abbreviation} - ${team.name}`);
        }

        console.log(`\n Import complete!`);
        console.log(` Teams: ${teamsCreated}`);
        console.log(` Stats records: ${statsCreated}\n`);

    } catch (error) {
        console.error('Error importing NBA data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedNBATeams()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });