import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const teams = await prisma.nBATeam.findMany({
      include: {
        teamStats: {
          where: {
            season: '2025-26'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}