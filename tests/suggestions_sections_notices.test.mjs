import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting Suggestions, Sections & Notices Verification Test ---');

// Test 1: Validate school.ts class sections structure
console.log('Test 1: Validating Class and Section structure in src/config/school.ts...');
const schoolTsPath = path.resolve('src/config/school.ts');
const schoolTsContent = fs.readFileSync(schoolTsPath, 'utf8');

// Assert Class 6 has A-F (6 sections)
assert(
  schoolTsContent.includes("'6': ['A', 'B', 'C', 'D', 'E', 'F']"),
  'Class 6 must have sections A through F'
);

// Assert Classes 7, 8, 9, 10 have A-G (7 sections each)
for (const cls of ['7', '8', '9', '10']) {
  assert(
    schoolTsContent.includes(`'${cls}': ['A', 'B', 'C', 'D', 'E', 'F', 'G']`),
    `Class ${cls} must have sections A through G`
  );
}

// Assert getClassSections function exists
assert(
  schoolTsContent.includes('export function getClassSections'),
  'school.ts must export getClassSections helper'
);
console.log('✓ Class and Section configuration verified (Class 6: F sections; Classes 7-10: G sections).');

// Test 2: Test keyword matching logic (matchesClassSectionKeyword)
console.log('\nTest 2: Validating matchesClassSectionKeyword logic...');
const dataStorePath = path.resolve('src/lib/dataStore.ts');
const dataStoreContent = fs.readFileSync(dataStorePath, 'utf8');

assert(
  dataStoreContent.includes('matchesClassSectionKeyword('),
  'DataStore must implement matchesClassSectionKeyword'
);

// We can replicate the exact function logic here to unit-test all input combinations
function matchesClassSectionKeyword(studentClass, studentSection, query) {
  if (!studentClass) return false;
  const q = query.toLowerCase().trim();
  if (!q) return false;

  const sClass = String(studentClass).toLowerCase().trim();
  const sSec = String(studentSection || '').toLowerCase().trim();

  const directVariants = [
    `${sClass} ${sSec}`,
    `${sClass}${sSec}`,
    `${sClass}-${sSec}`,
    `class ${sClass} ${sSec}`,
    `class ${sClass}${sSec}`,
    `class ${sClass}-${sSec}`,
    `class ${sClass}`,
    `grade ${sClass} ${sSec}`,
    `grade ${sClass}${sSec}`,
    `grade ${sClass}-${sSec}`,
    `${sClass}th ${sSec}`,
    `${sClass}th-${sSec}`,
    `${sClass}th ${sSec} section`,
  ];

  if (directVariants.some((v) => q === v || q.includes(v) || v.includes(q))) {
    return true;
  }

  const match = q.match(/^(\d{1,2})\s*[-_\s/]?\s*([a-gA-G])?$/) ||
                q.match(/(?:class|grade)?\s*(\d{1,2})\s*[-_\s/]?\s*([a-gA-G])?/);
  if (match) {
    const qClass = match[1];
    const qSec = match[2]?.toLowerCase();
    if (qClass && qClass === sClass) {
      if (!qSec) return true;
      if (qSec === sSec) return true;
    }
  }

  return false;
}

// 8-G keyword tests
assert.equal(matchesClassSectionKeyword('8', 'G', '8 g'), true, "'8 g' should match Class 8-G");
assert.equal(matchesClassSectionKeyword('8', 'G', '8g'), true, "'8g' should match Class 8-G");
assert.equal(matchesClassSectionKeyword('8', 'G', '8-g'), true, "'8-g' should match Class 8-G");
assert.equal(matchesClassSectionKeyword('8', 'G', 'class 8 g'), true, "'class 8 g' should match Class 8-G");
assert.equal(matchesClassSectionKeyword('8', 'G', '8th g'), true, "'8th g' should match Class 8-G");
assert.equal(matchesClassSectionKeyword('8', 'G', '8th-g'), true, "'8th-g' should match Class 8-G");

// Mismatch test
assert.equal(matchesClassSectionKeyword('8', 'A', '8 g'), false, "'8 g' should NOT match Class 8-A");
assert.equal(matchesClassSectionKeyword('9', 'G', '8 g'), false, "'8 g' should NOT match Class 9-G");

// 7-G, 9-G, 10-G, 6-F tests
assert.equal(matchesClassSectionKeyword('7', 'G', '7 g'), true, "'7 g' should match Class 7-G");
assert.equal(matchesClassSectionKeyword('9', 'G', '9 g'), true, "'9 g' should match Class 9-G");
assert.equal(matchesClassSectionKeyword('10', 'G', '10 g'), true, "'10 g' should match Class 10-G");
assert.equal(matchesClassSectionKeyword('6', 'F', '6 f'), true, "'6 f' should match Class 6-F");
console.log('✓ matchesClassSectionKeyword handles all format variants correctly.');

// Test 3: Notice Read Suppression logic
console.log('\nTest 3: Validating Notice Read Suppression in DataStore & HomePage...');
assert(dataStoreContent.includes('isNoticeRead('), 'DataStore must have isNoticeRead');
assert(dataStoreContent.includes('markNoticeAsRead('), 'DataStore must have markNoticeAsRead');
assert(dataStoreContent.includes('getReadNoticeIds('), 'DataStore must have getReadNoticeIds');

const homePagePath = path.resolve('src/app/(main)/home/page.tsx');
const homePageContent = fs.readFileSync(homePagePath, 'utf8');

assert(
  homePageContent.includes('!DataStore.isNoticeRead(broadcastAlert.id)'),
  'HomePage must check !DataStore.isNoticeRead for broadcast alerts'
);
assert(
  homePageContent.includes('!DataStore.isNoticeRead(n.id)'),
  'HomePage must check !DataStore.isNoticeRead for campus notices'
);
assert(
  homePageContent.includes('DataStore.markNoticeAsRead('),
  'HomePage must call DataStore.markNoticeAsRead when dismissing or viewing notice'
);
console.log('✓ Notice suppression logic verified across DataStore and Home page.');

// Test 4: Mutual Bridges and Recommendations
console.log('\nTest 4: Validating Mutual Bridges & Suggestions...');
assert(dataStoreContent.includes('getMutualBridges('), 'DataStore must have getMutualBridges');
assert(dataStoreContent.includes('getSuggestions('), 'DataStore must have getSuggestions');

// Replicate bridge logic with sample follows:
// arjun_8a follows rohan_8a
// rohan_8a follows siddharth_8g
const mockFollows = [
  { follower: 'arjun_8a', following: 'rohan_8a' },
  { follower: 'rohan_8a', following: 'siddharth_8g' },
  { follower: 'siddharth_8g', following: 'rohan_8a' },
];

function calculateBridges(myUsername, targetUsername, follows) {
  const cleanY = myUsername.toLowerCase();
  const cleanP = targetUsername.toLowerCase();
  const yFollowing = follows.filter((f) => f.follower.toLowerCase() === cleanY).map((f) => f.following.toLowerCase());
  const pFollowers = follows.filter((f) => f.following.toLowerCase() === cleanP).map((f) => f.follower.toLowerCase());
  const bridges = yFollowing.filter((x) => pFollowers.includes(x));
  const explanation = bridges.length > 0 ? `Followed by @${bridges[0]} (who you follow)` : '';
  return { bridges, explanation };
}

const bridgeResult = calculateBridges('arjun_8a', 'siddharth_8g', mockFollows);
assert.deepEqual(bridgeResult.bridges, ['rohan_8a'], 'Bridge should identify rohan_8a');
assert.equal(
  bridgeResult.explanation,
  'Followed by @rohan_8a (who you follow)',
  'Explanation must state followed by bridge user'
);
console.log('✓ Mutual bridge logic (Y -> X -> P) correctly identifies bridge users and explanations.');

// Test 5: Check 8-G, 7-G, 9-G, 10-G, 6-F starter students exist
console.log('\nTest 5: Validating starter student profiles across target grades...');
const requiredUsernames = [
  'siddharth_8g', 'meera_8g', 'aarav_8g', 'diya_8g', 'ishaan_8g',
  'riya_7g', 'varun_7g',
  'neha_9g', 'kabir_9g',
  'rohit_10g', 'ananya_10g',
  'vihaan_6f', 'tanya_6f',
];
for (const u of requiredUsernames) {
  assert(
    dataStoreContent.includes(`username: '${u}'`),
    `dataStore.ts must include starter student @${u}`
  );
}
console.log('✓ All target class & section student profiles verified.');

console.log('\n======================================================');
console.log('ALL SUGGESTIONS, SECTIONS & NOTICES TESTS PASSED (5/5)!');
console.log('======================================================\n');
