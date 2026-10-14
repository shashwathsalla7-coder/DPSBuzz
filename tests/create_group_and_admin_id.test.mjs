import fs from 'node:fs';
import assert from 'node:assert';

console.log('--- Running Create Group & Admin ID Verification ---');

// 1. Verify Admin ID display and exclusivity in GlobalModerationGuard
const guardCode = fs.readFileSync('src/components/layout/GlobalModerationGuard.tsx', 'utf8');
assert(
  guardCode.includes('Admin ID:') && guardCode.includes('@{currentUser?.username}'),
  'GlobalModerationGuard must display "Admin ID: @{currentUser?.username}"'
);
assert(
  guardCode.includes("currentUser?.username?.toLowerCase() === 'shashwath71845'"),
  'Admin banner must be strictly restricted to username shashwath71845'
);
console.log('✓ PASS: Admin ID display and strict exclusivity to shashwath71845 verified in GlobalModerationGuard');

// 2. Verify Admin Panel lockout in admin/page.tsx
const adminPageCode = fs.readFileSync('src/app/(main)/admin/page.tsx', 'utf8');
assert(
  adminPageCode.includes("!currentUser || currentUser.username?.toLowerCase() !== 'shashwath71845'"),
  'Admin page must lock out any user who is not shashwath71845'
);
assert(
  adminPageCode.includes('The School Administration Panel is restricted strictly to Admin ID:'),
  'Admin page must display clear restricted notice citing Admin ID: @shashwath71845'
);
console.log('✓ PASS: Admin page lockout strictly enforces access only for shashwath71845');

// 3. Verify DesktopSidebar and TopBar hide Admin links for all other users
const sidebarCode = fs.readFileSync('src/components/layout/DesktopSidebar.tsx', 'utf8');
assert(
  sidebarCode.includes("cur?.username?.toLowerCase() === 'shashwath71845'"),
  'DesktopSidebar must only show Admin link to shashwath71845'
);
assert(
  !sidebarCode.includes("const bottomItems = [\n  { href: '/admin'"),
  'DesktopSidebar must NOT have static Admin link in bottomItems'
);

const topBarCode = fs.readFileSync('src/components/layout/TopBar.tsx', 'utf8');
assert(
  topBarCode.includes("user?.username?.toLowerCase() === 'shashwath71845'"),
  'TopBar must only set isAdmin to true for shashwath71845'
);
assert(
  topBarCode.includes("const menuItems = isAdmin"),
  'TopBar must only include Admin Center in menuItems if isAdmin is true'
);
console.log('✓ PASS: DesktopSidebar and TopBar strictly hide Admin panel links for all other accounts');

// 4. Verify Admin Console option in Settings is only shown to shashwath71845
const settingsCode = fs.readFileSync('src/app/(main)/settings/page.tsx', 'utf8');
assert(
  settingsCode.includes("currentUser?.username?.toLowerCase() === 'shashwath71845'"),
  'Settings page must only show Admin Console button to shashwath71845'
);
console.log('✓ PASS: Settings page Admin Console link strictly visible only to shashwath71845');

// 5. Verify Create Group functionality in chats/page.tsx and ChatsHeader
const chatsCode = fs.readFileSync('src/app/(main)/chats/page.tsx', 'utf8');
assert(
  chatsCode.includes('isCreateGroupOpen') && chatsCode.includes('setIsCreateGroupOpen'),
  'chats/page.tsx must manage isCreateGroupOpen state'
);
assert(
  chatsCode.includes('handleSelectAllFollowing'),
  'chats/page.tsx must provide handleSelectAllFollowing'
);
assert(
  chatsCode.includes('Add All Students I Follow'),
  'Create Group modal must provide "Add All Students I Follow" action'
);
assert(
  chatsCode.includes('+ Create Group'),
  'chats/page.tsx must display explicit + Create Group action'
);

const chatsHeaderCode = fs.readFileSync('src/components/chats/ChatsHeader.tsx', 'utf8');
assert(
  chatsHeaderCode.includes('+ Create Group'),
  'ChatsHeader must display explicit + Create Group button'
);
console.log('✓ PASS: ChatsHeader and chats/page.tsx prominent "+ Create Group" action verified');

// 6. Verify Create Group option in groups/page.tsx
const groupsCode = fs.readFileSync('src/app/(main)/groups/page.tsx', 'utf8');
assert(
  groupsCode.includes('+ Create Group'),
  'groups/page.tsx must render + Create Group button'
);
assert(
  groupsCode.includes('Create Study & Project Group 🐝'),
  'groups/page.tsx must render Create Study & Project Group banner'
);
assert(
  groupsCode.includes('Add All Students I Follow'),
  'groups/page.tsx must embed CreateGroupModal with Add All Students I Follow option'
);
console.log('✓ PASS: groups/page.tsx "+ Create Group" button and custom group creation modal verified');

console.log('\nAll Create Group & Strict Admin Exclusivity Verifications Passed Successfully!\n');
