/**
 * Database Date Test
 * Queries actual games from the database to see how dates are stored
 */

import { prisma } from './lib/prisma';

async function testDatabaseDates() {
  try {
    console.log("=== DATABASE DATE INSPECTION ===\n");

    // Fetch some recent games
    const games = await prisma.nBAGame.findMany({
      take: 10,
      orderBy: {
        gameDate: 'desc'
      },
      select: {
        gameId: true,
        gameDate: true,
        season: true,
        homeTeam: {
          select: {
            abbreviation: true
          }
        },
        awayTeam: {
          select: {
            abbreviation: true
          }
        }
      }
    });

    console.log(`Found ${games.length} recent games:\n`);

    games.forEach((game, index) => {
      console.log(`${index + 1}. Game ${game.gameId}`);
      console.log(`   Date stored in DB: ${game.gameDate.toISOString()}`);
      console.log(`   Date as string:    ${game.gameDate.toString()}`);
      console.log(`   Matchup: ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`);
      console.log(`   Season: ${game.season}`);

      // Extract just the date part
      const dateOnly = game.gameDate.toISOString().split('T')[0];
      console.log(`   Date part only:    ${dateOnly}\n`);
    });

    // Check for games that should be on 2026-01-03
    console.log("=== CHECKING FOR JAN 3, 2026 GAMES ===\n");

    const jan3Start = new Date('2026-01-03T00:00:00.000Z');
    const jan3End = new Date('2026-01-04T00:00:00.000Z');

    const jan3Games = await prisma.nBAGame.findMany({
      where: {
        gameDate: {
          gte: jan3Start,
          lt: jan3End
        }
      },
      select: {
        gameId: true,
        gameDate: true,
        homeTeam: {
          select: {
            abbreviation: true
          }
        },
        awayTeam: {
          select: {
            abbreviation: true
          }
        }
      }
    });

    console.log(`Games stored with date 2026-01-03: ${jan3Games.length}`);
    jan3Games.forEach(game => {
      console.log(`  - ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}: ${game.gameDate.toISOString()}`);
    });

    // Check for games that are stored as 2026-01-02 (the bug)
    console.log("\n=== CHECKING FOR JAN 2, 2026 GAMES (potential bug) ===\n");

    const jan2Start = new Date('2026-01-02T00:00:00.000Z');
    const jan2End = new Date('2026-01-03T00:00:00.000Z');

    const jan2Games = await prisma.nBAGame.findMany({
      where: {
        gameDate: {
          gte: jan2Start,
          lt: jan2End
        }
      },
      select: {
        gameId: true,
        gameDate: true,
        homeTeam: {
          select: {
            abbreviation: true
          }
        },
        awayTeam: {
          select: {
            abbreviation: true
          }
        }
      }
    });

    console.log(`Games stored with date 2026-01-02: ${jan2Games.length}`);
    jan2Games.forEach(game => {
      console.log(`  - ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}: ${game.gameDate.toISOString()}`);
    });

    // Check what "today's games" query would return
    console.log("\n=== SIMULATING TODAY'S GAMES QUERY ===\n");

    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Local time:   ${now.toString()}\n`);

    // Using the NEW correct method
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

    console.log(`Query range (UTC-based):`);
    console.log(`  Start: ${todayStart.toISOString()}`);
    console.log(`  End:   ${todayEnd.toISOString()}\n`);

    const todaysGames = await prisma.nBAGame.findMany({
      where: {
        gameDate: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      select: {
        gameId: true,
        gameDate: true,
        status: true,
        homeTeam: {
          select: {
            abbreviation: true
          }
        },
        awayTeam: {
          select: {
            abbreviation: true
          }
        }
      }
    });

    console.log(`Today's games found: ${todaysGames.length}`);
    todaysGames.forEach(game => {
      console.log(`  - ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`);
      console.log(`    Stored as: ${game.gameDate.toISOString()}`);
      console.log(`    Status: ${game.status}\n`);
    });

  } catch (error) {
    console.error("Error testing database dates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseDates();
