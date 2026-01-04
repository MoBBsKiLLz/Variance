/**
 * Date Handling Test Suite
 * This file tests date conversion and storage to diagnose timezone issues
 */

// Test the nbaDateToLocal function
function nbaDateToLocal(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

console.log("=== DATE CONVERSION TESTS ===\n");

// Test 1: NBA date string to Date object
const testDate1 = "2026-01-03";
const converted1 = nbaDateToLocal(testDate1);
console.log(`Test 1: NBA date "${testDate1}"`);
console.log(`  Converted to: ${converted1.toISOString()}`);
console.log(`  Expected:     2026-01-03T00:00:00.000Z`);
console.log(`  Match: ${converted1.toISOString() === "2026-01-03T00:00:00.000Z" ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 2: Another date
const testDate2 = "2026-01-15";
const converted2 = nbaDateToLocal(testDate2);
console.log(`Test 2: NBA date "${testDate2}"`);
console.log(`  Converted to: ${converted2.toISOString()}`);
console.log(`  Expected:     2026-01-15T00:00:00.000Z`);
console.log(`  Match: ${converted2.toISOString() === "2026-01-15T00:00:00.000Z" ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 3: Edge case - December
const testDate3 = "2025-12-31";
const converted3 = nbaDateToLocal(testDate3);
console.log(`Test 3: NBA date "${testDate3}"`);
console.log(`  Converted to: ${converted3.toISOString()}`);
console.log(`  Expected:     2025-12-31T00:00:00.000Z`);
console.log(`  Match: ${converted3.toISOString() === "2025-12-31T00:00:00.000Z" ? "✓ PASS" : "✗ FAIL"}\n`);

console.log("=== CURRENT TIMEZONE INFO ===\n");
const now = new Date();
console.log(`Current local time: ${now.toString()}`);
console.log(`Current UTC time:   ${now.toUTCString()}`);
console.log(`Timezone offset:    ${now.getTimezoneOffset()} minutes`);
console.log(`Timezone offset:    ${now.getTimezoneOffset() / 60} hours\n`);

console.log("=== TODAY'S DATE QUERY TEST ===\n");

// Test how we're creating "today" for queries
const nowTest = new Date();

// OLD METHOD (incorrect)
const todayStartOld = new Date(nowTest.getFullYear(), nowTest.getMonth(), nowTest.getDate());
const todayEndOld = new Date(nowTest.getFullYear(), nowTest.getMonth(), nowTest.getDate() + 1);

// NEW METHOD (correct)
const todayStartNew = new Date(Date.UTC(nowTest.getUTCFullYear(), nowTest.getUTCMonth(), nowTest.getUTCDate()));
const todayEndNew = new Date(Date.UTC(nowTest.getUTCFullYear(), nowTest.getUTCMonth(), nowTest.getUTCDate() + 1));

console.log("Old method (using local timezone):");
console.log(`  Start: ${todayStartOld.toISOString()}`);
console.log(`  End:   ${todayEndOld.toISOString()}\n`);

console.log("New method (using UTC):");
console.log(`  Start: ${todayStartNew.toISOString()}`);
console.log(`  End:   ${todayEndNew.toISOString()}\n`);

console.log("=== DATE PARSING BREAKDOWN ===\n");

const sampleNbaDate = "2026-01-03";
const parts = sampleNbaDate.split("-").map(Number);
console.log(`Input string: "${sampleNbaDate}"`);
console.log(`Split parts: [${parts.join(", ")}]`);
console.log(`  year: ${parts[0]}`);
console.log(`  month (from string): ${parts[1]}`);
console.log(`  month - 1 (for JS): ${parts[1] - 1}`);
console.log(`  day: ${parts[2]}`);
console.log(`\nDate.UTC(${parts[0]}, ${parts[1] - 1}, ${parts[2]}) = ${Date.UTC(parts[0], parts[1] - 1, parts[2])}`);
console.log(`new Date(Date.UTC(...)) = ${new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toISOString()}\n`);
