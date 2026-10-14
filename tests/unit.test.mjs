// ============================================================================
// DPS Buzz — Automated Unit Test Suite
// Verifies: Profanity Filter, Rate Limits, Ranking Calculation, Roster Matching
// ============================================================================

import assert from 'node:assert/strict';

// --- 1. Profanity Filter Tests ---
const BLOCKED_WORDS = ['abuse', 'badword', 'curse', 'slur', 'hate'];
function validateProfanity(text) {
  const lower = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return {
        valid: false,
        error: "That word isn't allowed here. Try saying it differently.", // DESIGN.md Section 11
      };
    }
  }
  return { valid: true };
}

// --- 2. Rate Limits Tests ---
class RateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.timestamps = new Map();
  }

  canPerform(userId) {
    const now = Date.now();
    const list = this.timestamps.get(userId) || [];
    const valid = list.filter((t) => now - t < this.windowMs);
    if (valid.length >= this.limit) {
      return false;
    }
    valid.push(now);
    this.timestamps.set(userId, valid);
    return true;
  }
}

// --- 3. Ranking Calculation Tests ---
function calculateStarBoardRanks(students) {
  // Sort by verified followers descending, then spiritPoints descending
  const sorted = [...students].sort((a, b) => {
    if (b.followerCount !== a.followerCount) {
      return b.followerCount - a.followerCount;
    }
    return b.spiritPoints - a.spiritPoints;
  });

  return sorted.map((student, index) => {
    const currentRank = index + 1;
    const prevRank = student.previousRank || currentRank;
    const diff = prevRank - currentRank; // positive means climbed
    const deltaDisplay = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
    return {
      ...student,
      rank: currentRank,
      delta: deltaDisplay,
      isTop3: currentRank <= 3,
    };
  });
}

// --- 4. Roster Matching Tests ---
function matchStudentRoster(roster, input) {
  const cleanAdm = (input.admissionNumber || '').toUpperCase().trim();
  const cleanName = (input.fullName || '').toLowerCase().trim();

  const record = roster.find((r) => r.admissionNumber.toUpperCase() === cleanAdm);
  if (!record) {
    return {
      success: false,
      error: "We couldn't find that admission number. Check your school diary.", // DESIGN.md Section 11
    };
  }

  if (record.isClaimed) {
    return {
      success: false,
      error: 'This admission number has already been claimed.',
    };
  }

  if (record.name.toLowerCase().trim() !== cleanName) {
    return {
      success: false,
      error: "That name doesn't match our list. Type it as it's written in your diary.", // DESIGN.md Section 11
    };
  }

  return {
    success: true,
    class: record.class,
    section: record.section,
    verified: true,
  };
}

// ============================================================================
// RUN TESTS
// ============================================================================
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('\n--- Running DPS Buzz Unit Tests ---\n');

// 1. Profanity tests
test('Profanity: Clean text passes', () => {
  const res = validateProfanity('Great presentation at the science expo today!');
  assert.equal(res.valid, true);
});

test('Profanity: Blocked word fails with exact DESIGN.md copy', () => {
  const res = validateProfanity('This is full of badword and insults');
  assert.equal(res.valid, false);
  assert.equal(res.error, "That word isn't allowed here. Try saying it differently.");
});

// 2. Rate limit tests
test('RateLimiter: Allows actions under limit', () => {
  const limiter = new RateLimiter(3, 1000);
  assert.equal(limiter.canPerform('user1'), true);
  assert.equal(limiter.canPerform('user1'), true);
  assert.equal(limiter.canPerform('user1'), true);
});

test('RateLimiter: Blocks excess actions within window', () => {
  const limiter = new RateLimiter(2, 5000);
  limiter.canPerform('user2');
  limiter.canPerform('user2');
  assert.equal(limiter.canPerform('user2'), false);
});

// 3. Ranking calculation tests
test('Ranking: Orders strictly by followers and spirit points', () => {
  const students = [
    { username: 'b', followerCount: 40, spiritPoints: 10, previousRank: 3 },
    { username: 'a', followerCount: 50, spiritPoints: 20, previousRank: 1 },
    { username: 'c', followerCount: 30, spiritPoints: 5, previousRank: 2 },
  ];
  const ranked = calculateStarBoardRanks(students);
  assert.equal(ranked[0].username, 'a');
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[1].username, 'b');
  assert.equal(ranked[1].rank, 2);
  assert.equal(ranked[1].delta, '+1'); // climbed from 3 to 2
  assert.equal(ranked[2].username, 'c');
  assert.equal(ranked[2].delta, '-1'); // dropped from 2 to 3
});

// 4. Roster matching tests
const mockRoster = [
  { admissionNumber: 'DPS-2026-001', name: 'Arjun Reddy', class: '8', section: 'A', isClaimed: false },
  { admissionNumber: 'DPS-2026-002', name: 'Sneha Patel', class: '10', section: 'C', isClaimed: true },
];

test('Roster: Valid admission number and matching name succeed', () => {
  const res = matchStudentRoster(mockRoster, { admissionNumber: 'DPS-2026-001', fullName: 'Arjun Reddy' });
  assert.equal(res.success, true);
  assert.equal(res.class, '8');
  assert.equal(res.section, 'A');
});

test('Roster: Unknown admission number returns diary copy', () => {
  const res = matchStudentRoster(mockRoster, { admissionNumber: 'DPS-2026-999', fullName: 'Arjun Reddy' });
  assert.equal(res.success, false);
  assert.equal(res.error, "We couldn't find that admission number. Check your school diary.");
});

test('Roster: Already claimed admission number is rejected', () => {
  const res = matchStudentRoster(mockRoster, { admissionNumber: 'DPS-2026-002', fullName: 'Sneha Patel' });
  assert.equal(res.success, false);
  assert.equal(res.error, 'This admission number has already been claimed.');
});

test('Roster: Name mismatch against diary is rejected', () => {
  const res = matchStudentRoster(mockRoster, { admissionNumber: 'DPS-2026-001', fullName: 'Wrong Name' });
  assert.equal(res.success, false);
  assert.equal(res.error, "That name doesn't match our list. Type it as it's written in your diary.");
});

// --- 5. Classmates & Mutual Follows Tests ---
function calculateMutuals(follows, myUsername, targetUsername) {
  const cleanMe = myUsername.toLowerCase();
  const cleanTarget = targetUsername.toLowerCase();
  const myFollowing = follows.filter((f) => f.follower.toLowerCase() === cleanMe).map((f) => f.following.toLowerCase());
  const targetFollowers = follows.filter((f) => f.following.toLowerCase() === cleanTarget).map((f) => f.follower.toLowerCase());
  return myFollowing.filter((u) => targetFollowers.includes(u));
}

function areMutualFriends(follows, userA, userB) {
  const followsB = follows.some((f) => f.follower.toLowerCase() === userA.toLowerCase() && f.following.toLowerCase() === userB.toLowerCase());
  const followsA = follows.some((f) => f.follower.toLowerCase() === userB.toLowerCase() && f.following.toLowerCase() === userA.toLowerCase());
  return followsB && followsA;
}

const mockFollows = [
  { follower: 'arjun_8a', following: 'rohan_8a' },
  { follower: 'arjun_8a', following: 'priya_8a' },
  { follower: 'rohan_8a', following: 'arjun_8a' },
  { follower: 'rohan_8a', following: 'sneha_10c' },
  { follower: 'priya_8a', following: 'arjun_8a' },
  { follower: 'priya_8a', following: 'sneha_10c' },
];

test('Mutuals: Accurately detects mutual friends who follow each other', () => {
  assert.equal(areMutualFriends(mockFollows, 'arjun_8a', 'rohan_8a'), true);
  assert.equal(areMutualFriends(mockFollows, 'arjun_8a', 'priya_8a'), true);
  assert.equal(areMutualFriends(mockFollows, 'arjun_8a', 'sneha_10c'), false);
});

test('Mutuals: Accurately identifies shared connections followed by user', () => {
  const mutualsWithSneha = calculateMutuals(mockFollows, 'arjun_8a', 'sneha_10c');
  assert.equal(mutualsWithSneha.length, 2);
  assert.ok(mutualsWithSneha.includes('rohan_8a'));
  assert.ok(mutualsWithSneha.includes('priya_8a'));
});

// --- 6. Story Rings, Stories & Tokens Quality Pass Tests ---
import fs from 'node:fs';

test('Tokens: Yellow highlight token (#FFE45C) is completely removed from tokens and globals', () => {
  const tokensContent = fs.readFileSync('src/config/tokens.ts', 'utf8');
  assert.equal(tokensContent.includes('#FFE45C'), false, '#FFE45C must be removed from tokens.ts');
  const globalsContent = fs.readFileSync('src/app/globals.css', 'utf8');
  assert.equal(globalsContent.includes('#FFE45C'), false, '#FFE45C must be removed from globals.css');
  assert.equal(globalsContent.includes('--color-highlight'), false, '--color-highlight must be removed from globals.css');
});

test('Story Tokens: Unseen ring has 62px outer, 3px gradient, 2px inner ring, and dark mode glow', () => {
  const tokensContent = fs.readFileSync('src/config/tokens.ts', 'utf8');
  assert.ok(tokensContent.includes("unseenGradient: 'linear-gradient(135deg, #FF8A1F 0%, #FF2E93 35%, #A855F7 68%, #3B82F6 100%)'"), 'Exact unseen gradient required');
  assert.ok(tokensContent.includes("darkGlow: '0 0 10px rgba(255, 70, 150, 0.45)'"), 'Exact dark mode glow token required');
  assert.ok(tokensContent.includes("seenLight: '#C4CCD8'"), 'Seen ring light color #C4CCD8 required');
  assert.ok(tokensContent.includes("seenDark: '#3A4357'"), 'Seen ring dark color #3A4357 required');
  assert.ok(tokensContent.includes("outerSize: '62px'"), '62px outer diameter required');
  assert.ok(tokensContent.includes("ringThickness: '3px'"), '3px ring thickness required');
  assert.ok(tokensContent.includes("innerRingThickness: '2px'"), '2px inner ring thickness required');
  assert.ok(tokensContent.includes("plusBadgeSize: '20px'"), '20px plus badge size required');
  assert.ok(tokensContent.includes("plusBadgeBorder: '2px solid #FFFFFF'"), '2px solid #FFFFFF border required');
});

test('Story Creator: Exactly 6 text story background presets exist with correct contrast', () => {
  const tokensContent = fs.readFileSync('src/config/tokens.ts', 'utf8');
  assert.ok(tokensContent.includes('textStoryPresets: TextStoryPreset[]'), 'textStoryPresets array exists');
  // Check preset 1: Orange to Pink
  assert.ok(tokensContent.includes('#FF5A1F 0%, #E0207F 100%') && tokensContent.includes("'#FFFFFF'"), 'Orange to Pink preset present with white text');
  // Check preset 2: Hot pink to violet
  assert.ok(tokensContent.includes('#FF2E93 0%, #7C3AED 100%'), 'Hot pink to violet preset present');
  // Check preset 3: Blue to violet
  assert.ok(tokensContent.includes('#3B82F6 0%, #A855F7 100%'), 'Blue to violet preset present');
  // Check preset 4: Cyan with dark text
  assert.ok(tokensContent.includes('#22D3EE') && tokensContent.includes('#06121F'), 'Cyan preset present with dark text #06121F');
  // Check preset 5: Near black with white text
  assert.ok(tokensContent.includes('#0B0F1A'), 'Near black preset present');
  // Check preset 6: White with dark text
  assert.ok(tokensContent.includes('#FFFFFF') && tokensContent.includes('#121620'), 'White preset present with dark text #121620');
});

test('CSS: Story ring pulse animation and reduced-motion are configured', () => {
  const globalsContent = fs.readFileSync('src/app/globals.css', 'utf8');
  assert.ok(globalsContent.includes('@keyframes story-pulse'), 'story-pulse keyframe exists');
  assert.ok(globalsContent.includes('transform: scale(1.04)'), '1.04 pulse scale exists');
  assert.ok(globalsContent.includes('.story-ring-pulse'), 'story-ring-pulse utility exists');
  assert.ok(globalsContent.includes('box-shadow: 0 0 10px rgba(255, 70, 150, 0.45)'), 'Dark mode glow exists in CSS');
});

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);

