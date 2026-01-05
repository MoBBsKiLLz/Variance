import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAllNBAData } from '@/lib/data/nba-fetcher';

export async function POST(request: NextRequest) {
    try {
        const { season } = await request.json();

        if (!season || !/^\d{4}-\d{2}$/.test(season)) {
            return NextResponse.json(
                { error: 'Invalid season format. Use YYYY-YY (e.g., 2025-26)' },
                { status: 400 }
            );
        }

        // Use the shared function from nba-fetcher.js
        const teamsData = await fetchAllNBAData(season);

        for (const teamData of teamsData) {
            // Upsert team
            const team = await prisma.nBATeam.upsert({
                where: { teamId: teamData.teamId },
                update: {
                    abbreviation: teamData.abbreviation,
                    name: teamData.name,
                    conference: 'Unknown',
                    division: 'Unknown',
                    city: teamData.name.split(' ').slice(0, -1).join(' '),
                },
                create: {
                    teamId: teamData.teamId,
                    abbreviation: teamData.abbreviation,
                    name: teamData.name,
                    conference: 'Unknown',
                    division: 'Unknown',
                    city: teamData.name.split(' ').slice(0, -1).join(' '),
                },
            });

            // Upsert season stats
            await prisma.nBATeamStats.upsert({
                where: {
                    teamId_season: {
                        teamId: team.id,
                        season,
                    },
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
                    oppPointsPerGame: teamData.oppPointsPerGame ?? 0,
                    oppFieldGoalPct: 0,
                    oppThreePointPct: 0,
                    offensiveRating: teamData.offensiveRating,
                    defensiveRating: teamData.defensiveRating,
                    pace: teamData.pace,
                    lastUpdated: new Date(),
                },
                create: {
                    teamId: team.id,
                    season,
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
                    oppPointsPerGame: teamData.oppPointsPerGame ?? 0,
                    oppFieldGoalPct: 0,
                    oppThreePointPct: 0,
                    offensiveRating: teamData.offensiveRating,
                    defensiveRating: teamData.defensiveRating,
                    pace: teamData.pace,
                },
            });
        }

        return NextResponse.json({
            success: true,
            season,
            teamsCount: teamsData.length
        });

    } catch (error) {
        console.error('Error fetching NBA data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch NBA data' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}