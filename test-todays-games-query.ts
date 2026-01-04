/**
 * Test Today's Games Query
 * Simulates the query that the API route uses
 */

import { prisma } from './lib/prisma';

async function testTodaysGamesQuery() {
  try {
    console.log("=== TESTING TODAY'S GAMES QUERY ===\n");

    const now = new Date();
    console.log(`Current time:`);
    console.log(`  Local: ${now.toString()}`);
    console.log(`  UTC:   ${now.toUTCString()}\n`);

    // Use LOCAL date components to create UTC midnight timestamps
    // This matches how games are stored in the database
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

    console.log(`Query parameters:`);
    console.log(`  Local date: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    console.log(`  Start (UTC): ${todayStart.toISOString()}`);
    console.log(`  End (UTC):   ${todayEnd.toISOString()}\n`);

    // Query the database
    const games = await prisma.nBAGame.findMany({
      where: {
        gameDate: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            abbreviation: true,
            name: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            abbreviation: true,
            name: true
          }
        }
      },
      orderBy: {
        gameDate: 'asc'
      }
    });

    console.log(`Found ${games.length} games for today:\n`);

    if (games.length === 0) {
      console.log("❌ No games found. This is the problem!\n");

      // Check what games we have around this date
      console.log("Looking for games nearby...\n");

      const nearbyGames = await prisma.nBAGame.findMany({
        where: {
          gameDate: {
            gte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 2)),
            lt: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 2))
          }
        },
        select: {
          gameId: true,
          gameDate: true,
          status: true
        },
        orderBy: {
          gameDate: 'desc'
        }
      });

      console.log("Games within +/- 2 days:");
      nearbyGames.forEach(game => {
        console.log(`  ${game.gameDate.toISOString()} - Game ${game.gameId} - ${game.status}`);
      });
    } else {
      console.log("✅ SUCCESS! Games found:\n");
      games.forEach((game, i) => {
        console.log(`${i + 1}. ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`);
        console.log(`   Game ID: ${game.gameId}`);
        console.log(`   Date: ${game.gameDate.toISOString()}`);
        console.log(`   Status: ${game.status}\n`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testTodaysGamesQuery();
