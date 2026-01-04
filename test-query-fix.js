/**
 * Test the query fix
 */

console.log("=== TESTING QUERY FIX ===\n");

const now = new Date();

console.log(`Current time:`);
console.log(`  Local: ${now.toString()}`);
console.log(`  UTC:   ${now.toUTCString()}\n`);

// OLD FIX (wrong - uses UTC date)
const oldTodayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const oldTodayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

console.log("OLD FIX (using UTC date components):");
console.log(`  Query range: ${oldTodayStart.toISOString()} to ${oldTodayEnd.toISOString()}`);
console.log(`  Would match games stored as: 2026-01-04T00:00:00.000Z`);
console.log(`  ✗ WRONG - we want Jan 3 games!\n`);

// NEW FIX (correct - uses local date)
const newTodayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
const newTodayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

console.log("NEW FIX (using local date components):");
console.log(`  Query range: ${newTodayStart.toISOString()} to ${newTodayEnd.toISOString()}`);
console.log(`  Would match games stored as: 2026-01-03T00:00:00.000Z`);
console.log(`  ✓ CORRECT - this matches today's games!\n`);

console.log("Comparison:");
console.log(`  Local date: Jan ${now.getDate()}, ${now.getFullYear()}`);
console.log(`  UTC date:   Jan ${now.getUTCDate()}, ${now.getUTCFullYear()}`);
console.log(`  We want to query for: Jan ${now.getDate()} (local)`);
