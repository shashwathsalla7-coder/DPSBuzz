import assert from 'assert';

console.log('====================================================');
console.log('🔥 DPS BUZZ STREAK RESET & NEW USER INTRO TEST SUITE');
console.log('====================================================\n');

// IST Date Helper
function getISTDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(date));
}

function getISTYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
}

function computeUserStreak(userPosts, lastRecordedDate = '') {
  const todayIST = getISTDate();
  const yesterdayIST = getISTYesterday();

  const postDates = new Set();
  for (const p of userPosts) {
    const dt = getISTDate(p.createdAt);
    if (dt) postDates.add(dt);
  }
  if (lastRecordedDate) {
    const sDate = getISTDate(lastRecordedDate);
    if (sDate) postDates.add(sDate);
  }

  const sortedDates = Array.from(postDates).sort().reverse();

  if (sortedDates.length === 0) {
    return { streakDays: 0, postedToday: false };
  }

  const newestDate = sortedDates[0];

  if (newestDate === todayIST) {
    // User posted today in IST
    let count = 0;
    let checkDate = new Date();
    while (true) {
      const checkStr = getISTDate(checkDate);
      if (postDates.has(checkStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return { streakDays: Math.max(1, count), postedToday: true };
  }

  if (newestDate === yesterdayIST) {
    // User posted yesterday, has not posted today yet
    let count = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const checkStr = getISTDate(checkDate);
      if (postDates.has(checkStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return { streakDays: Math.max(1, count), postedToday: false };
  }

  // User's newest post was before yesterday: missed at least 1 day!
  // STREAK IS REMOVED (0)!
  return { streakDays: 0, postedToday: false };
}

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${total}: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${total}: ${name}`);
    console.error(`   Error: ${err.message}\n`);
  }
}

// TEST 1: New user with zero posts has 0 streak (no hardcoded 4)
runTest('New user with zero posts has streak = 0 and postedToday = false', () => {
  const res = computeUserStreak([]);
  assert.strictEqual(res.streakDays, 0, 'Streak must be 0 for user with no posts');
  assert.strictEqual(res.postedToday, false, 'postedToday must be false');
});

// TEST 2: User who did NOT post today or yesterday has streak reset to 0
runTest('User who missed posting for 2 or more days has streak removed (resets to 0)', () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const posts = [
    { id: 'p1', createdAt: threeDaysAgo.toISOString() }
  ];

  const res = computeUserStreak(posts);
  assert.strictEqual(res.streakDays, 0, 'Streak must be reset to 0 when user missed posting');
  assert.strictEqual(res.postedToday, false, 'postedToday must be false');
});

// TEST 3: User who posted today has active streak = 1 and postedToday = true
runTest('User who posted today has streak = 1 and postedToday = true', () => {
  const posts = [
    { id: 'p2', createdAt: new Date().toISOString() }
  ];

  const res = computeUserStreak(posts);
  assert.strictEqual(res.streakDays, 1, 'Streak should be 1 after posting today');
  assert.strictEqual(res.postedToday, true, 'postedToday must be true');
});

// TEST 4: User who posted yesterday and today has consecutive streak = 2
runTest('User who posted yesterday and today has consecutive streak = 2', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const posts = [
    { id: 'p_today', createdAt: new Date().toISOString() },
    { id: 'p_yest', createdAt: yesterday.toISOString() }
  ];

  const res = computeUserStreak(posts);
  assert.strictEqual(res.streakDays, 2, 'Streak should be 2 for 2 consecutive days');
  assert.strictEqual(res.postedToday, true);
});

// TEST 5: User who posted yesterday but has NOT posted today has streak = 1, postedToday = false
runTest('User who posted yesterday but NOT today maintains streak from yesterday with postedToday = false', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const posts = [
    { id: 'p_yest_only', createdAt: yesterday.toISOString() }
  ];

  const res = computeUserStreak(posts);
  assert.strictEqual(res.streakDays, 1, 'Streak should be 1 from yesterday');
  assert.strictEqual(res.postedToday, false, 'postedToday must be false until they post today');
});

// TEST 6: User with broken consecutive sequence (posted 3 days ago and today, but missed 2 days ago)
runTest('Missed day in middle resets streak sequence: only consecutive recent days count', () => {
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

  const posts = [
    { id: 'p_today', createdAt: new Date().toISOString() },
    { id: 'p_old', createdAt: fourDaysAgo.toISOString() }
  ];

  const res = computeUserStreak(posts);
  assert.strictEqual(res.streakDays, 1, 'Streak must be 1 (old streak was lost due to missed days)');
  assert.strictEqual(res.postedToday, true);
});

console.log(`\n====================================================`);
console.log(`📊 SUMMARY: ${passed}/${total} TESTS PASSED`);
if (passed === total) {
  console.log(`🎉 ALL STREAK RESET & CALCULATION TESTS PASSED!`);
} else {
  console.log(`⚠️ SOME TESTS FAILED`);
}
console.log(`====================================================\n`);
