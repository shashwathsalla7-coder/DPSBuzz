import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('--- Running Admin Authentication & Capabilities Verification ---');

// 1. Admin password must NEVER be in client code; login goes through the server.
const loginPageContent = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');
assert.ok(loginPageContent.includes('/api/auth/login'), 'Login page must authenticate via /api/auth/login');
assert.ok(!/password === ['"]/.test(loginPageContent), 'Login page must not compare passwords in the browser');
const adminRoute = fs.readFileSync('src/app/api/admin/login/route.ts', 'utf8');
assert.ok(adminRoute.includes('process.env.ADMIN_PASSWORD'), 'Admin password must come from ADMIN_PASSWORD env');
assert.ok(!/ADMIN_PASSWORD \|\| ['"][^'"]/.test(adminRoute), 'Admin password must have no hardcoded fallback');
console.log('✓ PASS: Admin password is server-only (ADMIN_PASSWORD env) and checked by the server');

// 2. Verify DataStore Admin Account & Capabilities in src/lib/dataStore.ts
const dataStoreContent = fs.readFileSync('src/lib/dataStore.ts', 'utf8');
assert.ok(
  dataStoreContent.includes('SHASHWATH_ADMIN_ACCOUNT'),
  'DataStore must define SHASHWATH_ADMIN_ACCOUNT'
);
assert.ok(
  dataStoreContent.includes('toggleBanUser'),
  'DataStore must have toggleBanUser'
);
assert.ok(
  dataStoreContent.includes('toggleMuteUserInChat'),
  'DataStore must have toggleMuteUserInChat'
);
assert.ok(
  dataStoreContent.includes('addNotice'),
  'DataStore must have addNotice'
);
assert.ok(
  dataStoreContent.includes('addCalendarEvent'),
  'DataStore must have addCalendarEvent'
);
assert.ok(
  dataStoreContent.includes('deleteChatMessage'),
  'DataStore must have deleteChatMessage'
);
console.log('✓ PASS: DataStore has all admin methods: toggleBanUser, toggleMuteUserInChat, addNotice, addCalendarEvent, deleteChatMessage');

// 3. Verify Admin Page Tabs and Controls
const adminPageContent = fs.readFileSync('src/app/(main)/admin/page.tsx', 'utf8');
assert.ok(
  adminPageContent.includes('Users & Bans'),
  'Admin page must include Users & Bans tab'
);
assert.ok(
  adminPageContent.includes('Chats Oversight'),
  'Admin page must include Chats Oversight tab'
);
assert.ok(
  adminPageContent.includes('Notices'),
  'Admin page must include Notices tab'
);
assert.ok(
  adminPageContent.includes('Calendar'),
  'Admin page must include Calendar tab'
);
assert.ok(
  adminPageContent.includes('Reports'),
  'Admin page must include Reports tab'
);
assert.ok(
  adminPageContent.includes('System & Code'),
  'Admin page must include System tab'
);
console.log('✓ PASS: Admin page contains all 6 tabs: Users & Bans, Chats Oversight, Notices, Calendar, Reports, System');

// 4. Verify 0px flat corners in Admin Page (no rounded-lg, rounded-xl, rounded-2xl in cards)
const hasRoundedCorners = /rounded-(xl|2xl|3xl|full|lg)/.test(adminPageContent);
assert.strictEqual(
  hasRoundedCorners,
  false,
  'Admin page must strictly avoid rounded-xl, rounded-2xl, rounded-lg per user instructions'
);
console.log('✓ PASS: Admin page strictly conforms to flat 0px rounded corners (no rounded-xl, rounded-2xl, rounded-lg)');

// 5. Verify Student Feed link from Admin Page
assert.ok(
  adminPageContent.includes('Student View') || adminPageContent.includes('Enter Feed'),
  'Admin page must provide seamless navigation back to the student feed (/home)'
);
console.log('✓ PASS: Admin page provides direct navigation back to student feed');

console.log('\nAll 5 Admin Flow Verifications Passed Successfully!\n');
