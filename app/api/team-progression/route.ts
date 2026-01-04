import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const teamId = searchParams.get('teamId');
        const season = searchParams.get('season') || '2025-26';

        if (!teamId) {
            return NextResponse.json(
                { error: 'teamId is required' },
                { status: 400 }
            );
        }

        // Get all games for this team in chronological order
        const games = await prisma.nBAGame.findMany({
            where: {
                season: season,
                OR: [
                    { homeTeamId: parseInt(teamId) },
                    { awayTeamId: parseInt(teamId) }
                ]
            },
            orderBy: {
                gameDate: 'asc'
            }
        });

        // Calculate running stats
        let wins = 0;
        let losses = 0;
        let totalPoints = 0;
        let totalPointsAllowed = 0;
        let gamesPlayed = 0;

        const progression = games.map(game => {
            const isHome = game.homeTeamId === parseInt(teamId);
            const teamScore = isHome ? game.homeScore : game.awayScore;
            const oppScore = isHome ? game.awayScore : game.homeScore;

            if (teamScore !== null && oppScore !== null) {
                gamesPlayed++;
                totalPoints += teamScore;
                totalPointsAllowed += oppScore;

                if (teamScore > oppScore) {
                    wins++;
                } else {
                    losses++;
                }
            }

            return {
                date: game.gameDate.toISOString(),
                gameNumber: gamesPlayed,
                wins,
                losses,
                winPct: gamesPlayed > 0 ? Number((wins / gamesPlayed).toFixed(3)) : 0,
                avgPointsScored: gamesPlayed > 0 ? Number((totalPoints / gamesPlayed).toFixed(1)) : 0,
                avgPointsAllowed: gamesPlayed > 0 ? Number((totalPointsAllowed / gamesPlayed).toFixed(1)) : 0,
                pointDifferential: teamScore && oppScore ? teamScore - oppScore : 0,
                result: teamScore && oppScore && teamScore > oppScore ? 'W' : 'L'
            };
        });

        return NextResponse.json(progression);
    } catch (error) {
        console.error('Error fetching team progression:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team progression' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}