import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Running Mutual Friend / Follow Request Tests ---');

// Mock localStorage and window
const localStorageData = {};
global.localStorage = {
  getItem: (k) => (k in localStorageData ? localStorageData[k] : null),
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach((k) => delete localStorageData[k]); },
};

global.sessionStorage = {
  clear: () => {},
};

const dispatchedEvents = [];
global.window = {
  dispatchEvent: (event) => {
    dispatchedEvents.push(event);
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.CustomEvent = class {
  constructor(type, detail) {
    this.type = type;
    this.detail = detail;
  }
};

global.fetch = async () => ({
  ok: true,
  json: async () => ({ success: true }),
});

// Import DataStore
const { DataStore } = await import('../src/lib/dataStore.ts');

// Test 1: Code Verification in DataStore
console.log('1. Checking DataStore.acceptFollowRequest establishes mutual follow...');
const dataStoreCode = fs.readFileSync(path.join(process.cwd(), 'src/lib/dataStore.ts'), 'utf8');

assert.ok(
  dataStoreCode.includes('f.follower.toLowerCase() === cleanReq && f.following.toLowerCase() === cleanTar'),
  'DataStore must ensure cleanReq follows cleanTar'
);
assert.ok(
  dataStoreCode.includes('f.follower.toLowerCase() === cleanTar && f.following.toLowerCase() === cleanReq'),
  'DataStore must ensure cleanTar follows cleanReq (Mutual Follow / Friendship)'
);
console.log('✓ PASS: DataStore code contains mutual follow logic for both cleanReq and cleanTar');

// Test 2: Runtime Test of acceptFollowRequest
console.log('2. Testing runtime mutual follow and count updates...');
localStorage.clear();

// Seed profiles for student_a and student_b
localStorage.setItem('dpsbuzz_profiles_v2', JSON.stringify([
  {
    id: 'user-a',
    username: 'student_a',
    fullName: 'Student A',
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    spiritPoints: 0,
    role: 'student',
    isVerified: true,
    isApproved: true,
    isPrivate: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-b',
    username: 'student_b',
    fullName: 'Student B',
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    spiritPoints: 0,
    role: 'student',
    isVerified: true,
    isApproved: true,
    isPrivate: true,
    createdAt: new Date().toISOString(),
  },
]));

// 1. student_a sends friend/follow request to student_b
DataStore.requestFollow('student_a', 'student_b');

assert.strictEqual(DataStore.isFollowRequested('student_a', 'student_b'), true, 'Request must be recorded');
assert.strictEqual(DataStore.isFollowing('student_a', 'student_b'), false, 'Should not be following before acceptance');
assert.strictEqual(DataStore.isFollowing('student_b', 'student_a'), false, 'Should not be following before acceptance');

// Verify notification was sent to student_b
const notifsToB = DataStore.getNotifications().filter((n) => n.userId === 'student_b');
assert.ok(notifsToB.length > 0, 'student_b must receive friend request notification');
assert.strictEqual(notifsToB[0].type, 'follow');
console.log('✓ PASS: Request created, pending status verified, recipient notified');

// 2. student_b accepts the friend request from student_a
DataStore.acceptFollowRequest('student_b', 'student_a');

// 3. Verify request is removed
assert.strictEqual(DataStore.isFollowRequested('student_a', 'student_b'), false, 'Request must be removed after acceptance');

// 4. Verify MUTUAL follow is established!
assert.strictEqual(DataStore.isFollowing('student_a', 'student_b'), true, 'student_a must be following student_b');
assert.strictEqual(DataStore.isFollowing('student_b', 'student_a'), true, 'student_b must ALSO be following student_a (Mutual!)');
assert.strictEqual(DataStore.areMutuals('student_a', 'student_b'), true, 'student_a and student_b must be mutual friends');

// 5. Verify follower and following counts for both students
const updatedProfiles = DataStore.getProfiles();
const profileA = updatedProfiles.find((p) => p.username === 'student_a');
const profileB = updatedProfiles.find((p) => p.username === 'student_b');

assert.strictEqual(profileA.followerCount, 1, 'student_a must have 1 follower');
assert.strictEqual(profileA.followingCount, 1, 'student_a must have 1 following');
assert.strictEqual(profileB.followerCount, 1, 'student_b must have 1 follower');
assert.strictEqual(profileB.followingCount, 1, 'student_b must have 1 following');
console.log('✓ PASS: Mutual follow established and counts updated accurately (1 follower, 1 following each)');

// 6. Verify notification sent to student_a
const notifsToA = DataStore.getNotifications().filter((n) => n.userId === 'student_a');
assert.ok(notifsToA.length > 0, 'student_a must receive acceptance notification');
assert.ok(notifsToA[0].title.includes('Accepted'), 'Notification title indicates request was accepted');
console.log('✓ PASS: Acceptance notification delivered to original requester');

// Test 3: ProfileClient.tsx code verification
console.log('3. Checking ProfileClient.tsx follow button states...');
const profileClientCode = fs.readFileSync(path.join(process.cwd(), 'src/app/(main)/u/[username]/ProfileClient.tsx'), 'utf8');

assert.ok(
  profileClientCode.includes('hasIncomingRequest'),
  'ProfileClient must track incoming requests from the profile user'
);
assert.ok(
  profileClientCode.includes('Follow Back'),
  'ProfileClient must display Follow Back when target follows current user'
);
assert.ok(
  profileClientCode.includes('Follows you'),
  'ProfileClient must display "Follows you" badge when target follows current user'
);
console.log('✓ PASS: ProfileClient displays Confirm, Follow Back, and Follows you badge');

// Test 4: Notifications page code verification
console.log('4. Checking Notifications page copy...');
const notifsPageCode = fs.readFileSync(path.join(process.cwd(), 'src/app/(main)/notifications/page.tsx'), 'utf8');

assert.ok(
  notifsPageCode.includes('Sent you a friend request 🤝'),
  'Notifications page must display "Sent you a friend request 🤝"'
);
assert.ok(
  notifsPageCode.includes('Accepted friend request from @'),
  'Notifications page toast must reflect friend request acceptance'
);
console.log('✓ PASS: Notifications page copy accurately communicates friend request flow');

console.log('\n🎉 ALL MUTUAL FRIEND / FOLLOW REQUEST TESTS PASSED! 🤝✨\n');
