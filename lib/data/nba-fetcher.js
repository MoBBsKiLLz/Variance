import axios from 'axios';

/**
 * NBA Data Fetcher
 * Fetches team statistics from the official NBA Stats API
 */

// NBA Stats API requires these headers
const NBA_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com'
};

const NBA_BASE_URL = 'https://stats.nba.com/stats';

/** 
 * Fetch team stats for current season
 */
async function fetchTeamStats(season = '2024-25') {
 try {
    const url = `${NBA_BASE_URL}/leaguedashteamstats`;
    const params = {
        Conference: '',
        DateFrom: '',
        DateTo: '',
        Division: '',
        GameScope: '',
        GameSegment: '',
        Height: '',
        LastNGames: 0,
        LeagueID: '00',
        Location: '',
        MeasureType: 'Base',
        Month: 0,
        OpponentTeamID: 0,
        Outcome: '',
        PORound: 0,
        PaceAdjust: 'N',
        PerMode: 'PerGame',
        Period: 0,
        PlayerExperience: '',
        PlayerPosition: '',
        PlusMinus: 'N',
        Rank: 'N',
        Season: season,
        SeasonSegment: '',
        SeasonType: 'Regular Season',
        ShotClockRange: '',
        StarterBench: '',
        TeamID: 0,
        TwoWay: 0,
        VsConference: '',
        VsDivision: ''
    };

    const response = await axios.get(url, {
        headers: NBA_HEADERS,
        params
    });

    const headers = response.data.resultSets[0].headers;
    const rows = response.data.resultSets[0].rowSet;

    const teamStats = rows.map(row => {
        const stats = {};
        headers.forEach((header, index) => {
            stats[header] = row[index];
        });
        return stats;
    });

    console.log(`Fetched stats for ${teamStats.length} teams (${season})`);
    return teamStats;
 } catch (error) {
    console.error('Error fetching team stats:', error.message);
    throw error;
 }
}

/**
 * Fetch advanced team stats (offensive/defensive ratings, pace)
 */
async function fetchAdvancedTeamStats(season = '2024-25') {
    try {
        const url = `${NBA_BASE_URL}/leaguedashteamstats`;
        const params = {
            Conference: '',
            DateFrom: '',
            DateTo: '',
            Division: '',
            GameScope: '',
            GameSegment: '',
            Height: '',
            LastNGames: 0,
            LeagueID: '00',
            Location: '',
            MeasureType: 'Advanced',
            Month: 0,
            OpponentTeamID: 0,
            Outcome: '',
            PORound: 0,
            PaceAdjust: 'N',
            PerMode: 'PerGame',
            Period: 0,
            PlayerExperience: '',
            PlayerPosition: '',
            PlusMinus: 'N',
            Rank: 'N',
            Season: season,
            SeasonSegment: '',
            SeasonType: 'Regular Season',
            ShotClockRange: '',
            StarterBench: '',
            TeamID: 0,
            TwoWay: 0,
            VsConference: '',
            VsDivision: ''  
        };

        const response = await axios.get(url, {
            headers: NBA_HEADERS,
            params
        });

        const headers = response.data.resultSets[0].headers;
        const rows = response.data.resultSets[0].rowSet;

        const advancedStats = rows.map(row => {
            const stats = {};
            headers.forEach((header, index) => {
                stats[header] = row[index];
            });
            return stats;
        });

        console.log(`Fetched advanced stats for ${advancedStats.length} teams (${season})`);
        return advancedStats;
    } catch (error) {
            console.error('Error fetching advanced team stats:', error.message);
            throw error;
    }
}

/**
 * Main function to fetch all NBA data
 */
async function fetchAllNBAData() {
    console.log('Starting NBA data fetch...\n');

    try { 
        const teamStats = await fetchTeamStats('2024-25');

        // Small delay to be polite to the API
        await new Promise(resolve => setTimeout(resolve, 1000));

        const advancedStats = await fetchAdvancedTeamStats('2024-25');

        // Combine the data
        const combinedData = teamStats.map(team => {
            const advanced = advancedStats.find(a => a.TEAM_ID === team.TEAM_ID);
            return {
                teamId: team.TEAM_ID,
                abbreviation: team.TEAM_ABBREVIATION,
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
                oppPointsPerGame: team.OPP_PTS || null,
                offensiveRating: advanced?.OFF_RATING || null,
                defensiveRating: advanced?.DEF_RATING || null,
                pace: advanced?.PACE || null
            };
        });

        console.log('\nData fetch complete.\n');
        return combinedData;
    } catch (error) {
        console.error('Error fetching NBA data:', error.message);
        throw error;
    }
}

export {
    fetchTeamStats,
    fetchAdvancedTeamStats,
    fetchAllNBAData
};