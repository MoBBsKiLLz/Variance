import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const team1Id = searchParams.get('team1Id');
    const team2Id = searchParams.get('team2Id');
    const season = searchParams.get('season') || '2025-26';

    if (!team1Id || !team2Id) {
      return NextResponse.json(
        { error: 'team1Id and team2Id are required' },
        { status: 400 }
      );
    }

    const games = await prisma.nBAGame.findMany({
      where: {
        season: season,
        OR: [
          {
            homeTeamId: parseInt(team1Id),
            awayTeamId: parseInt(team2Id)
          },
          {
            homeTeamId: parseInt(team2Id),
            awayTeamId: parseInt(team1Id)
          }
        ]
      },
      orderBy: {
        gameDate: 'desc'
      }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching head-to-head games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}