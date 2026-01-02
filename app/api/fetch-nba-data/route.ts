import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NBAStatRow, NBATeamStat, ProcessedTeamData } from '@/lib/types/nba-data';

const prisma = new PrismaClient();

// Import the fetcher - we'll need to convert it to TypeScript or import properly
async function fetchNBAData(season: string): Promise<ProcessedTeamData[]> {
    const axios = (await import('axios')).default;

    const NBA_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nba.com/',
        'Origin': 'https://www.nba.com'
    };

    const NBA_BASE_URL = 'https://stats.nba.com/stats';

    const TEAM_ABBREVIATIONS: Record<number, string> = {
        1610612737: 'ATL', 1610612738: 'BOS', 1610612739: 'CLE', 1610612740: 'NOP',
        1610612741: 'CHI', 1610612742: 'DAL', 1610612743: 'DEN', 1610612744: 'GSW',
        1610612745: 'HOU', 1610612746: 'LAC', 1610612747: 'LAL', 1610612748: 'MIA',
        1610612749: 'MIL', 1610612750: 'MIN', 1610612751: 'BKN', 1610612752: 'NYK',
        1610612753: 'ORL', 1610612754: 'IND', 1610612755: 'PHI', 1610612756: 'PHX',
        1610612757: 'POR', 1610612758: 'SAC', 1610612759: 'SAS', 1610612760: 'OKC',
        1610612761: 'TOR', 1610612762: 'UTA', 1610612763: 'MEM', 1610612764: 'WAS',
        1610612765: 'DET', 1610612766: 'CHA',
    };

    // Fetch team stats
    const teamStatsResponse = await axios.get(`${NBA_BASE_URL}/leaguedashteamstats`, {
        headers: NBA_HEADERS,
        params: {
            Conference: '', DateFrom: '', DateTo: '', Division: '', GameScope: '',
            GameSegment: '', Height: '', LastNGames: 0, LeagueID: '00', Location: '',
            MeasureType: 'Base', Month: 0, OpponentTeamID: 0, Outcome: '', PORound: 0,
            PaceAdjust: 'N', PerMode: 'PerGame', Period: 0, PlayerExperience: '',
            PlayerPosition: '', PlusMinus: 'N', Rank: 'N', Season: season,
            SeasonSegment: '', SeasonType: 'Regular Season', ShotClockRange: '',
            StarterBench: '', TeamID: 0, TwoWay: 0, VsConference: '', VsDivision: ''
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch advanced stats
    const advancedStatsResponse = await axios.get(`${NBA_BASE_URL}/leaguedashteamstats`, {
        headers: NBA_HEADERS,
        params: {
            Conference: '', DateFrom: '', DateTo: '', Division: '', GameScope: '',
            GameSegment: '', Height: '', LastNGames: 0, LeagueID: '00', Location: '',
            MeasureType: 'Advanced', Month: 0, OpponentTeamID: 0, Outcome: '', PORound: 0,
            PaceAdjust: 'N', PerMode: 'PerGame', Period: 0, PlayerExperience: '',
            PlayerPosition: '', PlusMinus: 'N', Rank: 'N', Season: season,
            SeasonSegment: '', SeasonType: 'Regular Season', ShotClockRange: '',
            StarterBench: '', TeamID: 0, TwoWay: 0, VsConference: '', VsDivision: ''
        }
    });

    const headers = teamStatsResponse.data.resultSets[0].headers as string[];
    const rows = teamStatsResponse.data.resultSets[0].rowSet as NBAStatRow[];
    const advancedHeaders = advancedStatsResponse.data.resultSets[0].headers as string[];
    const advancedRows = advancedStatsResponse.data.resultSets[0].rowSet as NBAStatRow[];

    const teamStats = rows.map((row: NBAStatRow): NBATeamStat => {
        const stats: Record<string, string | number | null> = {};
        headers.forEach((header: string, index: number) => {
            stats[header] = row[index] ?? null;
        });
        return stats as NBATeamStat;
    });

    const advancedStats = advancedRows.map((row: NBAStatRow): NBATeamStat => {
        const stats: Record<string, string | number | null> = {};
        advancedHeaders.forEach((header: string, index: number) => {
            stats[header] = row[index] ?? null;
        });
        return stats as NBATeamStat;
    });

    return teamStats.map((team: NBATeamStat): ProcessedTeamData => {
        const advanced = advancedStats.find((a: NBATeamStat) => a.TEAM_ID === team.TEAM_ID);
        return {
            teamId: team.TEAM_ID,
            abbreviation: TEAM_ABBREVIATIONS[team.TEAM_ID] || 'UNK',
            name: team.TEAM_NAME,
            gamesPlayed: team.GP,
            wins: team.W,
            losses: team.L,
            pointsPerGame: team.PTS,
            fieldGoalPct: team.FG_PCT,
            threePointPct: team.FG3_PCT,
            freeThrowPct: team.FT_PCT,
            assistsPerGame: team.AST,
            reboundsPerGame: team.REB,
            turnoversPerGame: team.TOV,
            oppPointsPerGame: null,
            offensiveRating: advanced?.OFF_RATING || null,
            defensiveRating: advanced?.DEF_RATING || null,
            pace: advanced?.PACE || null
        };
    });
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

        const teamsData = await fetchNBAData(season);

        let teamsCount = 0;

        for (const teamData of teamsData) {
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

            teamsCount++;
        }

        return NextResponse.json({
            success: true,
            season,
            teamsCount
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