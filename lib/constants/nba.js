export const NBA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nba.com/',
  'Origin': 'https://www.nba.com'
};

export const NBA_BASE_URL = 'https://stats.nba.com/stats';

export const TEAM_ABBREVIATIONS = {
  1610612737: 'ATL', // Atlanta Hawks
  1610612738: 'BOS', // Boston Celtics
  1610612739: 'CLE', // Cleveland Cavaliers
  1610612740: 'NOP', // New Orleans Pelicans
  1610612741: 'CHI', // Chicago Bulls
  1610612742: 'DAL', // Dallas Mavericks
  1610612743: 'DEN', // Denver Nuggets
  1610612744: 'GSW', // Golden State Warriors
  1610612745: 'HOU', // Houston Rockets
  1610612746: 'LAC', // LA Clippers
  1610612747: 'LAL', // Los Angeles Lakers
  1610612748: 'MIA', // Miami Heat
  1610612749: 'MIL', // Milwaukee Bucks
  1610612750: 'MIN', // Minnesota Timberwolves
  1610612751: 'BKN', // Brooklyn Nets
  1610612752: 'NYK', // New York Knicks
  1610612753: 'ORL', // Orlando Magic
  1610612754: 'IND', // Indiana Pacers
  1610612755: 'PHI', // Philadelphia 76ers
  1610612756: 'PHX', // Phoenix Suns
  1610612757: 'POR', // Portland Trail Blazers
  1610612758: 'SAC', // Sacramento Kings
  1610612759: 'SAS', // San Antonio Spurs
  1610612760: 'OKC', // Oklahoma City Thunder
  1610612761: 'TOR', // Toronto Raptors
  1610612762: 'UTA', // Utah Jazz
  1610612763: 'MEM', // Memphis Grizzlies
  1610612764: 'WAS', // Washington Wizards
  1610612765: 'DET', // Detroit Pistons
  1610612766: 'CHA', // Charlotte Hornets
};

export const DEFAULT_SEASON = '2025-26';

// Generate season options (current year and past 5 years)
export function getSeasonOptions() {
  const currentYear = new Date().getFullYear();
  const seasons = [];
  for (let i = 0; i < 6; i++) {
    const startYear = currentYear - i;
    const endYear = startYear + 1;
    seasons.push(`${startYear}-${endYear.toString().slice(-2)}`);
  }
  return seasons;
}