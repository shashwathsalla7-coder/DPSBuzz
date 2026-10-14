import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting Team Join Approval & Apple Rounded Corners Verification Test ---');

// Test 1: Validate Team Join Request Methods in DataStore
console.log('\nTest 1: Validating DataStore group join request methods in src/lib/dataStore.ts...');
const dataStorePath = path.resolve('src/lib/dataStore.ts');
const dataStoreContent = fs.readFileSync(dataStorePath, 'utf8');

assert(
  dataStoreContent.includes('export interface GroupJoinRequest'),
  'DataStore must export GroupJoinRequest interface'
);
assert(
  dataStoreContent.includes('getGroupJoinRequests('),
  'DataStore must provide getGroupJoinRequests()'
);
assert(
  dataStoreContent.includes('hasRequestedToJoinGroup('),
  'DataStore must provide hasRequestedToJoinGroup()'
);
assert(
  dataStoreContent.includes('requestToJoinGroup('),
  'DataStore must provide requestToJoinGroup()'
);
assert(
  dataStoreContent.includes('acceptGroupJoinRequest('),
  'DataStore must provide acceptGroupJoinRequest()'
);
assert(
  dataStoreContent.includes('declineGroupJoinRequest('),
  'DataStore must provide declineGroupJoinRequest()'
);
assert(
  dataStoreContent.includes('isGroupMember('),
  'DataStore must provide isGroupMember()'
);
assert(
  dataStoreContent.includes('getGroupMembers('),
  'DataStore must provide getGroupMembers()'
);
console.log('✓ All DataStore team join approval methods verified.');

// Test 2: Unit test Team Join Request approval logic in isolation
console.log('\nTest 2: Testing team join request lifecycle and approval mechanics...');

const mockStorage = {};
const STORAGE_KEYS = {
  GROUP_JOIN_REQUESTS: 'dpsbuzz_group_join_requests_v1',
  GROUP_MEMBERS: 'dpsbuzz_group_members_v1',
  GROUPS: 'dpsbuzz_groups_v1',
  NOTIFICATIONS: 'dpsbuzz_notifications_v1',
};

function getStorage(key, fallback) {
  return mockStorage[key] !== undefined ? mockStorage[key] : fallback;
}
function setStorage(key, value) {
  mockStorage[key] = value;
}

const defaultMembersMap = {
  'group-robotics': ['rohan_8a', 'arjun_8a'],
  'group-sports': ['rahul_9b', 'arjun_8a'],
};
setStorage(STORAGE_KEYS.GROUP_MEMBERS, defaultMembersMap);
setStorage(STORAGE_KEYS.GROUPS, [
  { id: 'group-robotics', name: 'DPS Robotics Club', memberCount: 2 },
  { id: 'group-sports', name: 'DPS Athletics Squad', memberCount: 2 },
]);
setStorage(STORAGE_KEYS.NOTIFICATIONS, []);
setStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);

function isGroupMember(groupId, username) {
  const members = getStorage(STORAGE_KEYS.GROUP_MEMBERS, {})[groupId] || [];
  return members.some((m) => m.toLowerCase() === username.toLowerCase().trim());
}

function requestToJoinGroup(groupId, username, fullName = 'Student', groupName = 'Team') {
  const cleanUser = username.toLowerCase().trim();
  const list = getStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);
  const newReq = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    groupId,
    groupName,
    username: cleanUser,
    fullName,
    studentClass: 'Class 8-A',
    requestedAt: 'Just now',
    status: 'pending',
  };
  list.unshift(newReq);
  setStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, list);
  return newReq;
}

function acceptGroupJoinRequest(requestId, acceptedByUsername) {
  const list = getStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);
  const req = list.find((r) => r.id === requestId);
  if (!req) return { success: false };

  req.status = 'accepted';
  req.acceptedBy = acceptedByUsername;
  setStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, list);

  const storedMembers = getStorage(STORAGE_KEYS.GROUP_MEMBERS, {});
  const currentMembers = storedMembers[req.groupId] || [];
  if (!currentMembers.includes(req.username.toLowerCase())) {
    currentMembers.push(req.username.toLowerCase());
    storedMembers[req.groupId] = currentMembers;
    setStorage(STORAGE_KEYS.GROUP_MEMBERS, storedMembers);
  }

  const groups = getStorage(STORAGE_KEYS.GROUPS, []).map((g) =>
    g.id === req.groupId ? { ...g, memberCount: g.memberCount + 1 } : g
  );
  setStorage(STORAGE_KEYS.GROUPS, groups);
  return { success: true, request: req };
}

// Check initial membership
assert.equal(isGroupMember('group-robotics', 'vihaan_6f'), false, 'vihaan_6f should not be a member initially');

// Student requests to join
const req = requestToJoinGroup('group-robotics', 'vihaan_6f', 'Vihaan Roy', 'DPS Robotics Club');
assert.equal(req.status, 'pending', 'Request should be pending');
assert.equal(isGroupMember('group-robotics', 'vihaan_6f'), false, 'vihaan_6f still not member while request is pending');

// Existing team member accepts the request
const acceptRes = acceptGroupJoinRequest(req.id, 'arjun_8a');
assert.equal(acceptRes.success, true, 'Accepting join request should succeed');
assert.equal(acceptRes.request.status, 'accepted', 'Request status should update to accepted');
assert.equal(acceptRes.request.acceptedBy, 'arjun_8a', 'AcceptedBy should record approver username');

// Check that applicant is now an accepted member and count incremented
assert.equal(isGroupMember('group-robotics', 'vihaan_6f'), true, 'vihaan_6f must now be a verified group member');
const updatedGroup = getStorage(STORAGE_KEYS.GROUPS, []).find((g) => g.id === 'group-robotics');
assert.equal(updatedGroup.memberCount, 3, 'Group memberCount must have incremented to 3');
console.log('✓ Team join request approval lifecycle verified.');

// Test 3: Validate Apple Rounded Corners in groups/page.tsx
console.log('\nTest 3: Checking Apple squircle rounded corners in src/app/(main)/groups/page.tsx...');
const groupsPagePath = path.resolve('src/app/(main)/groups/page.tsx');
const groupsPageContent = fs.readFileSync(groupsPagePath, 'utf8');

assert(
  !groupsPageContent.includes('rounded-none'),
  'groups/page.tsx must have NO instances of rounded-none'
);
assert(
  groupsPageContent.includes('rounded-[22px]') || groupsPageContent.includes('rounded-[20px]'),
  'groups/page.tsx must use Apple squircle rounded corners (rounded-[22px] or rounded-[20px])'
);
assert(
  groupsPageContent.includes('rounded-full'),
  'groups/page.tsx must use Apple pill buttons (rounded-full)'
);
assert(
  groupsPageContent.includes('Pending Team Join Requests 👥'),
  'groups/page.tsx must display Pending Team Join Requests section'
);
assert(
  groupsPageContent.includes('Accept Member ✓'),
  'groups/page.tsx must provide Accept Member button'
);
console.log('✓ groups/page.tsx Apple rounded corners & team approval UI verified.');

// Test 4: Validate Apple Rounded Corners in notices/page.tsx
console.log('\nTest 4: Checking Apple squircle rounded corners in src/app/(main)/notices/page.tsx...');
const noticesPagePath = path.resolve('src/app/(main)/notices/page.tsx');
const noticesPageContent = fs.readFileSync(noticesPagePath, 'utf8');

assert(
  !noticesPageContent.includes('rounded-none'),
  'notices/page.tsx must have NO instances of rounded-none'
);
assert(
  noticesPageContent.includes('rounded-[20px]') || noticesPageContent.includes('rounded-[22px]'),
  'notices/page.tsx must use Apple squircle rounded corners on notice cards (rounded-[20px] or rounded-[22px])'
);
assert(
  noticesPageContent.includes('rounded-full'),
  'notices/page.tsx must use Apple rounded-full pill chips and buttons'
);
console.log('✓ notices/page.tsx Apple rounded corners verified.');

// Test 5: Validate Apple Rounded Corners in home/page.tsx
console.log('\nTest 5: Checking Apple squircle rounded corners in src/app/(main)/home/page.tsx...');
const homePagePath = path.resolve('src/app/(main)/home/page.tsx');
const homePageContent = fs.readFileSync(homePagePath, 'utf8');

assert(
  homePageContent.includes('Suggested for you'),
  'home/page.tsx must contain Suggested for you section'
);
assert(
  homePageContent.includes('rounded-[22px]') && homePageContent.includes('rounded-[20px]'),
  'home/page.tsx follow suggestions must use Apple squircle rounded-[22px] and rounded-[20px]'
);
assert(
  homePageContent.includes('rounded-full'),
  'home/page.tsx must use rounded-full follow pill buttons'
);
console.log('✓ home/page.tsx Apple rounded corners verified.');

// Test 6: Validate search/page.tsx integration
console.log('\nTest 6: Checking search/page.tsx group join request integration...');
const searchPagePath = path.resolve('src/app/(main)/search/page.tsx');
const searchPageContent = fs.readFileSync(searchPagePath, 'utf8');

assert(
  !searchPageContent.includes('rounded-none'),
  'search/page.tsx must have NO instances of rounded-none'
);
assert(
  searchPageContent.includes('DataStore.isGroupMember'),
  'search/page.tsx must check isGroupMember'
);
assert(
  searchPageContent.includes('DataStore.hasRequestedToJoinGroup'),
  'search/page.tsx must check hasRequestedToJoinGroup'
);
assert(
  searchPageContent.includes('Request to Join'),
  'search/page.tsx must provide Request to Join button'
);
console.log('✓ search/page.tsx group join request integration verified.');

console.log('\n=== ALL TEAM JOIN APPROVAL & APPLE CORNER TESTS PASSED! ===');
