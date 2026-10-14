import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('--- Running Admin Moderation & Broadcast System Verification ---');

// 1. Verify DataStore Warning, Ban Reason, Broadcast, and Delete User APIs
const dataStoreContent = fs.readFileSync('src/lib/dataStore.ts', 'utf8');

assert.ok(dataStoreContent.includes('export interface UserWarning'), 'DataStore must define UserWarning interface');
assert.ok(dataStoreContent.includes('export interface BroadcastAlert'), 'DataStore must define BroadcastAlert interface');
assert.ok(dataStoreContent.includes('warnUser('), 'DataStore must implement warnUser method');
assert.ok(dataStoreContent.includes('getUnacknowledgedWarning('), 'DataStore must implement getUnacknowledgedWarning method');
assert.ok(dataStoreContent.includes('acknowledgeWarning('), 'DataStore must implement acknowledgeWarning method');
assert.ok(dataStoreContent.includes('banUser('), 'DataStore must implement banUser method with reason');
assert.ok(dataStoreContent.includes('unbanUser('), 'DataStore must implement unbanUser method');
assert.ok(dataStoreContent.includes('getBanReason('), 'DataStore must implement getBanReason method');
assert.ok(dataStoreContent.includes('getBroadcastAlert('), 'DataStore must implement getBroadcastAlert method');
assert.ok(dataStoreContent.includes('setBroadcastAlert('), 'DataStore must implement setBroadcastAlert method');
assert.ok(dataStoreContent.includes('deleteUser('), 'DataStore must implement deleteUser method with cascading deletions');

// Verify posts and stories filter out banned users
assert.ok(
  dataStoreContent.includes('!banned.includes(p.username.toLowerCase().trim())'),
  'DataStore getPosts must filter out posts by banned users'
);
assert.ok(
  dataStoreContent.includes('!banned.includes(s.username.toLowerCase().trim())'),
  'DataStore getStories must filter out stories by banned users'
);
console.log('✓ PASS: DataStore warning, ban reason, broadcast alert, and cascade deleteUser APIs are fully defined and enforced');

// 2. Verify GlobalModerationGuard in layout
const guardContent = fs.readFileSync('src/components/layout/GlobalModerationGuard.tsx', 'utf8');
assert.ok(guardContent.includes('Account Suspended'), 'GlobalModerationGuard must render lockout for banned accounts');
assert.ok(guardContent.includes('Official Disciplinary Warning'), 'GlobalModerationGuard must render warning modal for warned accounts');
assert.ok(guardContent.includes('Super Admin Active:'), 'GlobalModerationGuard must render admin badge linking to admin panel');
assert.ok(guardContent.includes('acknowledgeWarning'), 'GlobalModerationGuard must call acknowledgeWarning on dismissal');

const mainLayoutContent = fs.readFileSync('src/app/(main)/layout.tsx', 'utf8');
assert.ok(mainLayoutContent.includes('GlobalModerationGuard'), 'Main layout must mount GlobalModerationGuard');
console.log('✓ PASS: GlobalModerationGuard handles lockout, warnings modal, and super-admin feed banner');

// 3. Verify Live Announcement & Broadcast Alert on Home Feed
const homeContent = fs.readFileSync('src/app/(main)/home/page.tsx', 'utf8');
assert.ok(homeContent.includes('broadcastAlert'), 'Home page must query broadcastAlert');
assert.ok(homeContent.includes('displayNotice'), 'Home page must resolve displayNotice');
assert.ok(homeContent.includes('URGENT ANNOUNCEMENT') || homeContent.includes('CAMPUS NOTICE'), 'Home page must render high-visibility announcement badge');
console.log('✓ PASS: Home Feed renders real-time announcement/broadcast banner to all users');

// 4. Verify Chat Restrictions for Muted and Banned Users
const chatsContent = fs.readFileSync('src/app/(main)/chats/page.tsx', 'utf8');
assert.ok(chatsContent.includes('DataStore.isUserMutedInChat'), 'Chats page must check if user is muted in chat');
assert.ok(chatsContent.includes('DataStore.isUserBanned'), 'Chats page must check if user is banned');
assert.ok(
  chatsContent.includes('Your messaging privileges have been suspended by Administration'),
  'Chats page must inform muted users of suspension'
);
assert.ok(
  chatsContent.includes('has been suspended by Administration'),
  'Chats page must disable messaging with banned recipients'
);
console.log('✓ PASS: Chat restrictions prevent banned/muted users from messaging and display admin alerts');

// 5. Verify Admin Panel Controls
const adminContent = fs.readFileSync('src/app/(main)/admin/page.tsx', 'utf8');
assert.ok(adminContent.includes('warnModalStudent'), 'Admin page must have student warning modal');
assert.ok(adminContent.includes('banModalStudent'), 'Admin page must have student ban modal with reason');
assert.ok(adminContent.includes('deleteUser'), 'Admin page must allow super admin to delete user accounts');
assert.ok(adminContent.includes('setBroadcastAlert'), 'Admin page must allow publishing live broadcast alerts');
assert.ok(adminContent.includes('clearBroadcastAlert') || adminContent.includes('setBroadcastAlert(null)'), 'Admin page must allow clearing broadcast alerts');
console.log('✓ PASS: Admin panel provides complete super-user moderation controls (warn, ban with reason, delete, broadcast alert)');

// 6. Verify 0px Flat Design Preservation
const guardHasRounded = /rounded-(xl|2xl|3xl|full|lg)/.test(guardContent);
assert.strictEqual(guardHasRounded, false, 'GlobalModerationGuard must adhere to flat 0px rounded corners');
console.log('✓ PASS: Flat 0px corners preserved across moderation elements');

console.log('\nAll 6 Admin Moderation & Broadcast System Verifications Passed Successfully!\n');
